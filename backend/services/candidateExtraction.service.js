const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const intelligentMatching = require('./intelligentMatching.service');

/**
 * CANDIDATE EXTRACTION SERVICE
 * Extracts candidate information from CV/Resume PDFs
 * Creates or updates CandidateProfile records
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class CandidateExtractionService {
  /**
   * Extract text from PDF file
   */
  async extractPdfText(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Use AI to extract structured candidate data from CV text
   */
  async extractCandidateData(cvText) {
    const prompt = `You are an expert HR assistant specialized in analyzing resumes/CVs. Extract the following information from the CV text and return it as a JSON object.

CV Text:
${cvText}

Extract and return ONLY a JSON object (no markdown, no code blocks) with this exact structure:
{
  "name": "Full name of candidate",
  "email": "Email address",
  "phone": "Phone number",
  "location": "Current location/city",
  "linkedin_url": "LinkedIn profile URL if mentioned",
  "portfolio_url": "Portfolio/website URL if mentioned",
  "current_company": "Current employer name",
  "current_title": "Current job title",
  "years_of_experience": total years of professional experience as a number,
  "education_level": "highest degree: high_school, bachelors, masters, or phd",
  "primary_skills": ["skill1", "skill2", "skill3"],
  "certifications": ["cert1", "cert2"],
  "languages": ["language1", "language2"],
  "experience_timeline": [
    {
      "company": "Company name",
      "role": "Job title",
      "period": "Date range",
      "achievements": ["achievement1", "achievement2"]
    }
  ],
  "strengths": ["strength1", "strength2"],
  "summary": "Brief professional summary in 2-3 sentences"
}

Rules:
- Use null for missing information
- For years_of_experience, calculate total from all positions
- For education_level, pick the highest: high_school, bachelors, masters, phd
- Extract only technical/professional skills for primary_skills (max 10)
- Languages should be natural languages spoken (e.g., English, Spanish)
- Return valid JSON only, no explanations`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content || '{}';

      // Clean response (remove markdown code blocks if present)
      let cleanedResponse = response
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error extracting candidate data with AI:', error);
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

  /**
   * Calculate performance and potential scores based on candidate data
   */
  calculateScores(candidateData) {
    let performanceScore = 50;
    let potentialScore = 50;

    // Performance Score Factors
    if (candidateData.years_of_experience) {
      performanceScore += Math.min(candidateData.years_of_experience * 3, 25);
    }

    if (candidateData.primary_skills && candidateData.primary_skills.length > 0) {
      performanceScore += Math.min(candidateData.primary_skills.length * 2, 15);
    }

    if (candidateData.certifications && candidateData.certifications.length > 0) {
      performanceScore += Math.min(candidateData.certifications.length * 3, 10);
    }

    // Potential Score Factors
    if (candidateData.education_level === 'phd') {
      potentialScore += 25;
    } else if (candidateData.education_level === 'masters') {
      potentialScore += 20;
    } else if (candidateData.education_level === 'bachelors') {
      potentialScore += 15;
    }

    if (candidateData.languages && candidateData.languages.length > 1) {
      potentialScore += Math.min((candidateData.languages.length - 1) * 5, 15);
    }

    if (candidateData.strengths && candidateData.strengths.length > 0) {
      potentialScore += Math.min(candidateData.strengths.length * 3, 10);
    }

    // Overall score (60% performance, 40% potential)
    const overallScore = Math.round(performanceScore * 0.6 + potentialScore * 0.4);

    return {
      performance_score: Math.min(performanceScore, 100),
      potential_score: Math.min(potentialScore, 100),
      overall_match_score: Math.min(overallScore, 100),
    };
  }

  /**
   * Check for existing candidate by email (deduplication)
   */
  async findExistingCandidate(email) {
    if (!email) return null;

    try {
      const existing = await prisma.candidateProfile.findUnique({
        where: { email: email.toLowerCase() },
      });
      return existing;
    } catch (error) {
      console.error('Error checking for existing candidate:', error);
      return null;
    }
  }

  /**
   * Create or update candidate profile
   */
  async createOrUpdateCandidate(candidateData, cvFilePath = null) {
    try {
      const email = candidateData.email?.toLowerCase();

      if (!email) {
        throw new Error('Email is required to create candidate profile');
      }

      // Check for existing candidate
      const existingCandidate = await this.findExistingCandidate(email);

      // Calculate scores
      const scores = this.calculateScores(candidateData);

      const profileData = {
        name: candidateData.name || 'Unknown',
        email: email,
        phone: candidateData.phone,
        location: candidateData.location,
        linkedin_url: candidateData.linkedin_url,
        portfolio_url: candidateData.portfolio_url,
        current_company: candidateData.current_company,
        current_title: candidateData.current_title,
        years_of_experience: candidateData.years_of_experience,
        education_level: candidateData.education_level,
        primary_skills: candidateData.primary_skills || [],
        certifications: candidateData.certifications || [],
        languages: candidateData.languages || [],
        experience_timeline: candidateData.experience_timeline || [],
        strengths: candidateData.strengths || [],
        performance_score: scores.performance_score,
        potential_score: scores.potential_score,
        overall_match_score: scores.overall_match_score,
        latest_cv_url: cvFilePath,
        cv_last_updated: new Date(),
        updated_at: new Date(),
      };

      if (existingCandidate) {
        // Update existing candidate
        console.log(`✓ Updating existing candidate: ${candidateData.name} (${email})`);

        const updated = await prisma.candidateProfile.update({
          where: { id: existingCandidate.id },
          data: profileData,
        });

        return {
          success: true,
          action: 'updated',
          candidate: updated,
          message: `Candidate profile updated: ${updated.name}`,
        };
      } else {
        // Create new candidate
        console.log(`✓ Creating new candidate: ${candidateData.name} (${email})`);

        const created = await prisma.candidateProfile.create({
          data: {
            ...profileData,
            availability_status: 'available',
            source_cv_batches: [],
            merged_candidate_ids: [],
          },
        });

        // Auto-match new candidate to open positions (background task)
        this.autoMatchCandidateToJobs(created.id).catch((err) => {
          console.error('Error in background auto-matching:', err);
        });

        return {
          success: true,
          action: 'created',
          candidate: created,
          message: `Candidate profile created: ${created.name}`,
        };
      }
    } catch (error) {
      console.error('Error creating/updating candidate:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create/update candidate profile',
      };
    }
  }

  /**
   * Process a single CV file (main entry point)
   */
  async processCv(filePath, fileName) {
    try {
      console.log(`\n📄 Processing CV: ${fileName}`);

      // Step 1: Extract text from PDF
      console.log('  Step 1/3: Extracting text from PDF...');
      const cvText = await this.extractPdfText(filePath);

      if (!cvText || cvText.length < 50) {
        throw new Error('Could not extract meaningful text from CV');
      }

      // Step 2: Extract structured data with AI
      console.log('  Step 2/3: Analyzing with AI...');
      const candidateData = await this.extractCandidateData(cvText);

      // Step 3: Create or update candidate profile
      console.log('  Step 3/3: Creating/updating candidate profile...');
      const result = await this.createOrUpdateCandidate(candidateData, fileName);

      console.log(`✅ CV processed successfully: ${result.action}`);

      return result;
    } catch (error) {
      console.error(`❌ Error processing CV ${fileName}:`, error);
      return {
        success: false,
        error: error.message,
        message: `Failed to process CV: ${fileName}`,
      };
    }
  }

  /**
   * Process multiple CV files (bulk upload)
   */
  async processBulkCvs(files) {
    const results = [];

    for (const file of files) {
      const result = await this.processCv(file.path, file.filename);
      results.push({
        fileName: file.filename,
        ...result,
      });
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: true,
      total: files.length,
      successful,
      failed,
      results,
      message: `Processed ${successful}/${files.length} CVs successfully`,
    };
  }

  /**
   * Auto-match newly created candidate to all open job positions
   * Runs in background, stores matches in job_applications table
   */
  async autoMatchCandidateToJobs(candidateId) {
    try {
      console.log(`\n🎯 Auto-matching candidate ${candidateId} to open positions...`);

      const matchResult = await intelligentMatching.matchJobsForCandidate(candidateId, {
        minScore: 60,
        limit: 20,
      });

      if (!matchResult.success || matchResult.matches.length === 0) {
        console.log(`  No suitable matches found (>= 60%)`);
        return;
      }

      // Store matches in job_applications table
      const applications = [];
      for (const match of matchResult.matches) {
        try {
          // Check if application already exists
          const existing = await prisma.job_applications.findUnique({
            where: {
              candidate_id_job_position_id: {
                candidate_id: candidateId,
                job_position_id: match.job_position_id,
              },
            },
          });

          if (!existing) {
            const application = await prisma.job_applications.create({
              data: {
                candidate_id: candidateId,
                job_position_id: match.job_position_id,
                status: 'matched',
                position_match_score: match.position_match_score,
                skills_match_score: match.skills_match_score,
                experience_match_score: match.experience_match_score,
                location_match_score: match.location_match_score,
                salary_match_score: match.salary_match_score,
                context_match_score: match.context_match_score,
                match_reasoning: match.match_reasoning,
                match_strengths: match.match_strengths,
                match_concerns: match.match_concerns,
                match_category: match.match_category,
                auto_matched: true,
              },
            });
            applications.push(application);
          }
        } catch (err) {
          console.error(`  Error storing match for position ${match.job_position_id}:`, err.message);
        }
      }

      console.log(`  ✓ Stored ${applications.length} job matches`);
      return { success: true, matchCount: applications.length };
    } catch (error) {
      console.error('Error in autoMatchCandidateToJobs:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CandidateExtractionService();
