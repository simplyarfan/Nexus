const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');
const { prisma } = require('../lib/prisma');
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
   * Extract text from DOCX file (modern Word format)
   */
  async extractDocxText(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX contains no extractable text');
      }
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX text:', error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  /**
   * Extract text from DOC file (older binary Word format)
   */
  async extractDocText(filePath) {
    try {
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(filePath);
      const text = extracted.getBody() || '';
      if (!text || text.trim().length === 0) {
        throw new Error('DOC contains no extractable text');
      }
      return text;
    } catch (error) {
      console.error('Error extracting DOC text:', error);
      throw new Error(`Failed to extract text from DOC: ${error.message}`);
    }
  }

  /**
   * Extract text from CV file based on MIME type
   */
  async extractTextFromFile(filePath, mimeType) {
    if (mimeType === 'application/pdf') {
      return await this.extractPdfText(filePath);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await this.extractDocxText(filePath);
    } else if (mimeType === 'application/msword') {
      return await this.extractDocText(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Only PDF, DOCX, and DOC are supported.`);
    }
  }

  /**
   * Use AI to extract structured candidate data from CV text
   */
  async extractCandidateData(cvText) {
    const prompt = `You are an expert HR assistant specialized in analyzing resumes/CVs. Extract information carefully following the rules below.

CV Text:
${cvText}

Extract and return ONLY a JSON object (no markdown, no code blocks) with this exact structure:
{
  "name": "Full name of candidate",
  "email": "Email address",
  "phone": "Phone number",
  "location": "Current location/city",
  "linkedin_url": "LinkedIn profile URL with full https:// prefix (e.g., https://www.linkedin.com/in/username)",
  "portfolio_url": "Portfolio/website URL if mentioned",
  "current_company": "Current employer name",
  "current_title": "Current job title",
  "years_of_experience": total years of professional experience as a number,
  "education": [
    {
      "degree": "Degree name (e.g., PhD in Computer Science)",
      "institution": "University/College name",
      "field": "Field of study",
      "year": "Graduation year or period",
      "level": education level as number (5=PhD, 4=Masters, 3=Bachelors, 2=Associate/Diploma, 1=High School)
    }
  ],
  "primary_skills": ["skill1", "skill2", "skill3"],
  "certifications": ["cert1", "cert2"],
  "experience_timeline": [
    {
      "company": "Company name",
      "role": "Job title",
      "period": "Date range (e.g., Jan 2020 - Dec 2022)",
      "duration_months": calculate approximate duration in months as a number,
      "achievements": ["achievement1", "achievement2"]
    }
  ],
  "strengths": ["strength1", "strength2"],
  "summary": "Professional summary exactly as written in CV, or null if not present"
}

CRITICAL RULES FOR SKILL EXTRACTION (primary_skills):
1. NEVER extract standalone version numbers like "v9.0", "v10", "11", "12" as separate skills
2. ALWAYS keep product name + version together: "IBM ACE v11", "WebSphere Message Broker v9.0", "MQ v8"
3. Fix obvious typos and normalize spacing:
   - "Corejava" → "Core Java"
   - "IBM Ace vv11v12" → "IBM ACE v11/v12"
   - "RESTFUL" → "RESTful"
   - "Websphre" → "WebSphere"
4. Extract skills from ALL sections including:
   - Explicit skills/technical skills section
   - Project descriptions (tools/technologies used)
   - Work experience bullet points
   - Certifications (if skill-related)
5. Use proper capitalization and standard names:
   - "IBM WebSphere Message Broker" not "WMB" (but include "WMB" as separate entry for searchability)
   - "IBM Integration Bus (IIB)" to include both forms
   - "Java" not "java" or "JAVA"
6. EXCLUDE overly generic terms: "Development", "Coding", "Programming", "IT", "Software", "Technology"
7. Include both the acronym and full name when applicable for major technologies
8. Merge related versions: If CV mentions v9, v10, v11 of same product → "IBM ACE v9-v11" or list each fully: ["IBM ACE v9", "IBM ACE v10", "IBM ACE v11"]

OTHER RULES:
- achievements: Copy each bullet point/achievement EXACTLY as written in the CV. Include the full text.
- strengths: Extract strengths/highlights EXACTLY as mentioned. If not explicitly listed, use null.
- summary: If the CV has a summary/objective section, copy it EXACTLY. If not present, use null.
- Use null for missing information - do NOT make up or infer data
- For years_of_experience, calculate total from all positions
- For education array: extract ALL education entries, sorted from HIGHEST to LOWEST level
- For linkedin_url: MUST include full URL with https://www. prefix
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
        max_tokens: 4000, // Increased for complex CVs
      });

      const response = completion.choices[0]?.message?.content || '{}';

      // Clean response (remove markdown code blocks if present)
      let cleanedResponse = response
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();

      // Try to parse, if truncated try to repair
      try {
        return JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.log('  ⚠️ JSON parse failed, attempting repair...');
        const repaired = this.repairTruncatedJson(cleanedResponse);
        return JSON.parse(repaired);
      }
    } catch (error) {
      console.error('Error extracting candidate data with AI:', error);
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

  /**
   * Attempt to repair truncated JSON from AI response
   */
  repairTruncatedJson(jsonString) {
    let repaired = jsonString;

    // Count open brackets
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // If in the middle of a string, close it
    const lastQuote = repaired.lastIndexOf('"');
    const lastColon = repaired.lastIndexOf(':');
    const lastComma = repaired.lastIndexOf(',');

    // Check if we're in an unclosed string (odd number of quotes after last structural char)
    const afterLastStructural = Math.max(lastColon, lastComma);
    if (afterLastStructural > 0) {
      const afterPart = repaired.substring(afterLastStructural);
      const quotesAfter = (afterPart.match(/"/g) || []).length;
      if (quotesAfter % 2 === 1) {
        // Odd quotes means unclosed string - close it
        repaired += '"';
      }
    }

    // Remove trailing comma if present
    repaired = repaired.replace(/,\s*$/, '');

    // Close any unclosed arrays
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }

    // Close any unclosed objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }

    return repaired;
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

    // Potential Score Factors - Based on highest education level (education[0])
    if (candidateData.education && candidateData.education.length > 0) {
      const highestEducation = candidateData.education[0];
      if (highestEducation.level === 5) {
        // PhD
        potentialScore += 25;
      } else if (highestEducation.level === 4) {
        // Masters
        potentialScore += 20;
      } else if (highestEducation.level === 3) {
        // Bachelors
        potentialScore += 15;
      } else if (highestEducation.level === 2) {
        // Associate/Diploma
        potentialScore += 10;
      } else if (highestEducation.level === 1) {
        // High School
        potentialScore += 5;
      }
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
      const existing = await prisma.candidate_profiles.findUnique({
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
        current_company: candidateData.current_company,
        current_title: candidateData.current_title,
        years_of_experience: candidateData.years_of_experience,
        education: candidateData.education || [],
        primary_skills: candidateData.primary_skills || [],
        certifications: candidateData.certifications || [],
        experience_timeline: candidateData.experience_timeline || [],
        updated_at: new Date(),
      };

      if (existingCandidate) {
        // Update existing candidate
        console.log(`✓ Updating existing candidate: ${candidateData.name} (${email})`);

        const updated = await prisma.candidate_profiles.update({
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

        const created = await prisma.candidate_profiles.create({
          data: {
            ...profileData,
            availability_status: 'available',
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
  async processCv(filePath, fileName, mimeType = 'application/pdf') {
    try {
      console.log(`\n📄 Processing CV: ${fileName} (${mimeType})`);

      // Step 1: Extract text from file based on type
      const fileTypeLabel = mimeType === 'application/pdf' ? 'PDF' :
                           mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'DOCX' :
                           mimeType === 'application/msword' ? 'DOC' : 'file';
      console.log(`  Step 1/3: Extracting text from ${fileTypeLabel}...`);
      const cvText = await this.extractTextFromFile(filePath, mimeType);

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
      const result = await this.processCv(file.path, file.filename, file.mimetype);
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
        minScore: 0,
        limit: 20,
      });

      if (!matchResult.success || matchResult.matches.length === 0) {
        console.log(`  No suitable matches found`);
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
