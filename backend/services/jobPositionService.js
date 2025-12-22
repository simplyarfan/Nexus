const { prisma } = require('../lib/prisma');
const axios = require('axios');
const intelligentMatching = require('./intelligentMatching.service');

/**
 * Job Position Service
 * Handles CRUD operations for job positions and AI-powered job description generation
 */

class JobPositionService {
  /**
   * Create a new job position (manual or AI-assisted)
   */
  async createJobPosition(data, userId, useAI = false) {
    try {
      // If AI-assisted, generate job description
      if (useAI && data.title && data.department) {
        const aiGeneratedData = await this.generateJobDescription({
          title: data.title,
          department: data.department,
          experienceLevel: data.experience_level,
          employmentType: data.employment_type,
        });

        // Merge AI-generated data with user input
        data = {
          ...data,
          description: aiGeneratedData.description,
          requirements: aiGeneratedData.requirements,
          responsibilities: aiGeneratedData.responsibilities,
          required_skills: aiGeneratedData.required_skills,
          preferred_skills: aiGeneratedData.preferred_skills,
          benefits: aiGeneratedData.benefits,
        };
      }

      // Log skills before saving
      console.log(`  💾 Saving to database:`);
      console.log(`     Required Skills:`, data.required_skills || []);
      console.log(`     Preferred Skills:`, data.preferred_skills || []);

      // Create job position
      const jobPosition = await prisma.job_positions.create({
        data: {
          title: data.title,
          department: data.department,
          location: data.location || null,
          employment_type: data.employment_type || 'full-time',
          experience_level: data.experience_level || null,
          salary_range_min: data.salary_range_min || null,
          salary_range_max: data.salary_range_max || null,
          currency: data.currency || 'USD',
          description: data.description || null,
          requirements: data.requirements || null,
          responsibilities: data.responsibilities || null,
          required_skills: data.required_skills || [],
          preferred_skills: data.preferred_skills || [],
          benefits: data.benefits || null,
          status: data.status || 'open',
          hiring_manager_id: data.hiring_manager_id || userId,
          openings_count: data.openings_count || 1,
          remote_policy: data.remote_policy || null,
          created_by: userId,
        },
      });

      console.log(`  ✅ Saved job position with:`);
      console.log(`     Required Skills:`, jobPosition.required_skills);
      console.log(`     Preferred Skills:`, jobPosition.preferred_skills);

      // Auto-match new job position to existing candidates (background task)
      this.autoMatchJobToCandidates(jobPosition.id).catch((err) => {
        console.error('Error in background auto-matching for job position:', err);
      });

      return {
        success: true,
        jobPosition,
        message: 'Job position created successfully',
      };
    } catch (error) {
      console.error('Error creating job position:', error);
      return {
        success: false,
        message: error.message || 'Failed to create job position',
      };
    }
  }

  /**
   * AI-powered job description generator using Groq
   */
  async generateJobDescription({ title, department, experienceLevel, employmentType }) {
    try {
      const expLevel = experienceLevel || 'mid-level';
      const empType = employmentType || 'full-time';

      const prompt = `You are an expert HR professional and job description writer. Generate a comprehensive, professional job description for the following position:

**Position:** ${title}
**Department:** ${department}
**Experience Level:** ${expLevel}
**Employment Type:** ${empType}

Please provide a detailed job description in the following JSON format:
{
  "description": "A compelling 2-3 paragraph overview of the role and company opportunity",
  "requirements": ["Requirement 1", "Requirement 2"],
  "responsibilities": ["Responsibility 1", "Responsibility 2"],
  "required_skills": ["Skill 1", "Skill 2"],
  "preferred_skills": ["Skill 1", "Skill 2"],
  "benefits": ["Benefit 1", "Benefit 2"]
}

Make it professional, engaging, and tailored to attract top talent for this ${expLevel} position in ${department}. Focus on clarity and industry best practices.`;

      // Use Groq API for AI-powered job description generation
      const apiKey = process.env.GROQ_API_KEY;
      const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      const model = 'llama-3.3-70b-versatile';

      const response = await axios.post(
        apiUrl,
        {
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert HR professional specializing in writing compelling job descriptions. Always respond with valid JSON only, no additional text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      // Parse AI response
      const aiData = JSON.parse(response.data.choices[0].message.content);

      return {
        description: aiData.description,
        requirements: aiData.requirements,
        responsibilities: aiData.responsibilities,
        required_skills: aiData.required_skills,
        preferred_skills: aiData.preferred_skills,
        benefits: aiData.benefits,
      };
    } catch (error) {
      console.error('Error generating job description:', error);
      // Return fallback structure if AI fails
      return {
        description: `We are seeking a talented ${title} to join our ${department} team.`,
        requirements: ['Bachelor degree or equivalent experience', 'Strong communication skills'],
        responsibilities: ['Contribute to team projects', 'Collaborate with colleagues'],
        required_skills: ['Professional communication', 'Team collaboration'],
        preferred_skills: ['Industry experience', 'Advanced degree'],
        benefits: ['Competitive salary', 'Health insurance', 'Professional development'],
      };
    }
  }

  /**
   * Extract skills intelligently from job description text using Groq AI
   * Similar to how CV intelligence extracts skills from resumes
   */
  async extractSkillsFromJD(jobDescriptionText) {
    try {
      const prompt = `You are an expert HR recruiter with deep knowledge of technical and soft skills across all industries. Analyze this job description and extract ALL relevant skills, categorizing them as required (must-have) or preferred (nice-to-have).

JOB DESCRIPTION:
${jobDescriptionText}

Extract skills and return ONLY a JSON object (no markdown, no code blocks):
{
  "required_skills": ["skill 1", "skill 2", ...],
  "preferred_skills": ["skill 1", "skill 2", ...]
}

CRITICAL GUIDELINES:
- Extract INDIVIDUAL SKILLS as clean, searchable keywords - NOT full sentences
- Break down compound skills into separate items
- DO NOT include phrases like "Strong understanding of", "Excellent", "Experience with", "Proven track record"
- Examples:
  ❌ WRONG: "Strong understanding of Agile frameworks (Scrum, Kanban, SAFe)"
  ✅ CORRECT: ["Scrum", "Kanban", "SAFe", "Agile"]

  ❌ WRONG: "Excellent facilitation, coaching, and conflict-resolution skills"
  ✅ CORRECT: ["Facilitation", "Coaching", "Conflict Resolution"]

- Extract SPECIFIC technical skills (e.g., "React.js", "AWS", "Python")
- Extract SPECIFIC soft skills (e.g., "Leadership", "Stakeholder Management")
- Extract tools/frameworks (e.g., "Jira", "Figma", "Docker")
- Extract methodologies (e.g., "CI/CD", "Scrum", "Kanban")
- Separate must-have (required) from nice-to-have (preferred) skills
- Use concise skill names (e.g., "JavaScript" not "knowledge of JavaScript")
- Return 5-15 required skills and 3-8 preferred skills
- Focus on ACTIONABLE, SEARCHABLE keywords for intelligent matching`;

      const apiKey = process.env.GROQ_API_KEY;
      const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      const model = 'llama-3.3-70b-versatile';

      const response = await axios.post(
        apiUrl,
        {
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert skill extraction AI. Extract skills from job descriptions with high accuracy. Always respond with valid JSON only, no additional text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent extraction
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      // Parse AI response
      let aiResponse = response.data.choices[0].message.content;

      // Clean response (remove markdown code blocks if present)
      aiResponse = aiResponse
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();

      const extractedSkills = JSON.parse(aiResponse);

      return {
        success: true,
        required_skills: extractedSkills.required_skills || [],
        preferred_skills: extractedSkills.preferred_skills || [],
      };
    } catch (error) {
      console.error('Error extracting skills from JD:', error);
      return {
        success: false,
        message: error.message || 'Failed to extract skills from job description',
        required_skills: [],
        preferred_skills: [],
      };
    }
  }

  /**
   * Get all job positions with filters
   */
  async getJobPositions(filters = {}) {
    try {
      const where = {};

      // Apply filters
      if (filters.status) where.status = filters.status;
      if (filters.department) where.department = filters.department;
      if (filters.hiring_manager_id) where.hiring_manager_id = parseInt(filters.hiring_manager_id);
      if (filters.employment_type) where.employment_type = filters.employment_type;
      if (filters.experience_level) where.experience_level = filters.experience_level;

      // Search filter
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { department: { contains: filters.search, mode: 'insensitive' } },
          { location: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const jobPositions = await prisma.job_positions.findMany({
        where,
        include: {
          _count: {
            select: {
              job_applications: true,
            },
          },
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Calculate days open for each position
      const positionsWithMetrics = jobPositions.map((position) => {
        const daysOpen = Math.floor(
          (new Date() - new Date(position.created_at)) / (1000 * 60 * 60 * 24),
        );

        return {
          ...position,
          daysOpen,
          candidateCount: position._count.job_applications,
          created_by_user: position.creator ? {
            id: position.creator.id,
            name: `${position.creator.first_name} ${position.creator.last_name}`,
            email: position.creator.email,
          } : null,
        };
      });

      return {
        success: true,
        jobPositions: positionsWithMetrics,
        total: positionsWithMetrics.length,
      };
    } catch (error) {
      console.error('Error fetching job positions:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch job positions',
      };
    }
  }

  /**
   * Get job position by ID
   */
  async getJobPositionById(id) {
    try {
      const jobPosition = await prisma.job_positions.findUnique({
        where: { id },
        include: {
          job_applications: {
            include: {
              candidate_profiles: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  location: true,
                  availability_status: true,
                },
              },
            },
            orderBy: {
              position_match_score: 'desc',
            },
          },
          _count: {
            select: {
              job_applications: true,
            },
          },
        },
      });

      if (!jobPosition) {
        return {
          success: false,
          message: 'Job position not found',
        };
      }

      const daysOpen = Math.floor(
        (new Date() - new Date(jobPosition.created_at)) / (1000 * 60 * 60 * 24),
      );

      return {
        success: true,
        jobPosition: {
          ...jobPosition,
          daysOpen,
          candidateCount: jobPosition._count.job_applications,
        },
      };
    } catch (error) {
      console.error('Error fetching job position:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch job position',
      };
    }
  }

  /**
   * Update job position
   */
  async updateJobPosition(id, data) {
    try {
      const jobPosition = await prisma.job_positions.update({
        where: { id },
        data: {
          title: data.title,
          department: data.department,
          location: data.location,
          employment_type: data.employment_type,
          experience_level: data.experience_level,
          salary_range_min: data.salary_range_min,
          salary_range_max: data.salary_range_max,
          currency: data.currency,
          description: data.description,
          requirements: data.requirements,
          responsibilities: data.responsibilities,
          required_skills: data.required_skills,
          preferred_skills: data.preferred_skills,
          benefits: data.benefits,
          status: data.status,
          hiring_manager_id: data.hiring_manager_id,
          openings_count: data.openings_count,
          remote_policy: data.remote_policy,
          filled_at: data.status === 'filled' ? new Date() : null,
        },
      });

      return {
        success: true,
        jobPosition,
        message: 'Job position updated successfully',
      };
    } catch (error) {
      console.error('Error updating job position:', error);
      return {
        success: false,
        message: error.message || 'Failed to update job position',
      };
    }
  }

  /**
   * Delete job position
   */
  async deleteJobPosition(id) {
    try {
      await prisma.job_positions.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Job position deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting job position:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete job position',
      };
    }
  }

  /**
   * Get job position statistics
   */
  async getJobPositionStats() {
    try {
      const totalPositions = await prisma.job_positions.count();
      const openPositions = await prisma.job_positions.count({ where: { status: 'open' } });
      const filledPositions = await prisma.job_positions.count({ where: { status: 'filled' } });
      const onHoldPositions = await prisma.job_positions.count({ where: { status: 'on_hold' } });

      // Department breakdown
      const departmentStats = await prisma.job_positions.groupBy({
        by: ['department'],
        _count: true,
        where: { status: 'open' },
      });

      return {
        success: true,
        stats: {
          total: totalPositions,
          open: openPositions,
          filled: filledPositions,
          onHold: onHoldPositions,
          byDepartment: departmentStats.map((d) => ({
            department: d.department,
            count: d._count,
          })),
        },
      };
    } catch (error) {
      console.error('Error fetching job position stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch statistics',
      };
    }
  }

  /**
   * Auto-match newly created job position to all existing candidates
   * Runs in background, stores matches in job_applications table
   */
  async autoMatchJobToCandidates(jobPositionId) {
    try {
      console.log(`\n🎯 Auto-matching job position ${jobPositionId} to existing candidates...`);

      const matchResult = await intelligentMatching.matchCandidatesForJob(jobPositionId, {
        minScore: 0,
        limit: 50,
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
                candidate_id: match.candidate_id,
                job_position_id: jobPositionId,
              },
            },
          });

          if (!existing) {
            const application = await prisma.job_applications.create({
              data: {
                candidate_id: match.candidate_id,
                job_position_id: jobPositionId,
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
          console.error(`  Error storing match for candidate ${match.candidate_id}:`, err.message);
        }
      }

      console.log(`  ✓ Stored ${applications.length} candidate matches`);
      return { success: true, matchCount: applications.length };
    } catch (error) {
      console.error('Error in autoMatchJobToCandidates:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new JobPositionService();
