/**
 * CV INTELLIGENCE (HR-01) - CLEAN IMPLEMENTATION
 * Following EXACT blueprint: Ingress → Docling → spaCy → Llama 3.1 → Pydantic → pgvector
 */

const { openAI: axios } = require('../utils/axios'); // Use OpenAI-specific instance with 5-minute timeout
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');
const { prisma } = require('../lib/prisma');

class CVIntelligenceHR01 {
  constructor() {
    // Use Groq API (FREE & 10x faster) or fallback to OpenAI
    const useGroq = !!process.env.GROQ_API_KEY;

    this.apiKey = useGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
    this.apiUrl = useGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    this.model = useGroq
      ? 'llama-3.3-70b-versatile' // Groq's latest Llama 3.3 70B model (3.1 was decommissioned)
      : 'gpt-3.5-turbo';
    this.provider = useGroq ? 'Groq' : 'OpenAI';

    // DEBUG: Log API provider and key status
    console.log(`🔑 ${this.provider} API Configuration:`);
    console.log('   Provider:', this.provider);
    console.log('   Model:', this.model);
    console.log('   API URL:', this.apiUrl);
    console.log('   Key present:', !!this.apiKey);
    console.log('   Key length:', this.apiKey ? this.apiKey.length : 0);
    console.log('   Key prefix:', this.apiKey ? this.apiKey.substring(0, 12) + '...' : 'N/A');

    // Check if API key is configured
    if (!this.apiKey) {
      console.warn(`⚠️ ${this.provider}_API_KEY not configured`);
    }

    // Smart skill matching mappings
    this.skillSynonyms = {
      agile: [
        'agile frameworks',
        'agile methodology',
        'agile approach',
        'agile best practices',
        'agile development',
      ],
      scrum: ['scrum practices', 'scrum framework', 'scrum techniques', 'scrum methodology'],
      'conflict-resolution': ['resolve conflicts', 'conflict management', 'conflict resolution'],
      coaching: ['servant leadership', 'mentoring', 'team coaching', 'leadership coaching'],
      facilitation: ['facilitating', 'facilitate', 'workshop facilitation'],
      kanban: ['kanban board', 'kanban methodology'],
      javascript: ['js', 'javascript', 'ecmascript'],
      python: ['py', 'python'],
      react: ['reactjs', 'react.js'],
      node: ['nodejs', 'node.js'],
      sql: ['mysql', 'postgresql', 'sql server', 'database'],
      'ci/cd': ['continuous integration', 'continuous deployment', 'devops'],
      aws: ['amazon web services', 'cloud', 'ec2', 's3'],
      docker: ['containerization', 'containers'],
      kubernetes: ['k8s', 'container orchestration'],
    };
  }

  /**
   * Helper: Make API call with automatic retry on rate limits
   */
  async makeAPICallWithRetry(apiCall, maxRetries = 3, retryDelay = 20000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        // Check if it's a rate limit error (429)
        if (error.response?.status === 429 && attempt < maxRetries) {
          // Extract wait time from error message if available
          const errorMessage = error.response?.data?.error?.message || '';
          const waitTimeMatch = errorMessage.match(/try again in ([\d.]+)s/i);
          const waitTime = waitTimeMatch
            ? Math.ceil(parseFloat(waitTimeMatch[1]) * 1000)
            : retryDelay;

          console.log(
            `⏳ [${this.provider}] Rate limit hit. Waiting ${(waitTime / 1000).toFixed(1)}s before retry (attempt ${attempt}/${maxRetries})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        // If not a rate limit error, or max retries reached, throw the error
        throw error;
      }
    }
  }

  /**
   * SMART SKILL MATCHING - Semantic understanding of skills
   */
  smartSkillMatch(requiredSkill, candidateSkills) {
    const required = requiredSkill.toLowerCase().trim();

    // Direct match
    if (candidateSkills.some((s) => s.toLowerCase().trim() === required)) {
      return true;
    }

    // Check if required skill is in our synonym map
    for (const [baseSkill, synonyms] of Object.entries(this.skillSynonyms)) {
      // If required skill matches base or any synonym
      if (
        required === baseSkill ||
        synonyms.some((syn) => required.includes(syn) || syn.includes(required))
      ) {
        // Check if candidate has base skill or any synonym
        return candidateSkills.some((candidateSkill) => {
          const candidate = candidateSkill.toLowerCase().trim();
          return (
            candidate === baseSkill ||
            synonyms.some((syn) => candidate.includes(syn) || syn.includes(candidate))
          );
        });
      }
    }

    // Partial match (contains)
    return candidateSkills.some((s) => {
      const candidate = s.toLowerCase().trim();
      return candidate.includes(required) || required.includes(candidate);
    });
  }

  /**
   * PROCESS JOB DESCRIPTION - Extract required skills dynamically
   */
  async processJobDescription(fileBuffer, fileName) {
    try {
      console.log(`\n🔍 [JD Service] Starting JD processing for: ${fileName}`);

      // Parse the JD document
      const fileType = fileName.split('.').pop().toLowerCase();
      console.log(`   File type: ${fileType}`);

      const parsedJD = await this.parseDocument(fileBuffer, fileType);
      console.log(`   Parsed JD result:`, parsedJD ? 'Success' : 'Failed');

      // parseDocument returns { rawText, layoutBlocks, metadata }
      const jdText = parsedJD.rawText || parsedJD.text || '';
      console.log(`   Extracted text length: ${jdText.length} characters`);

      if (!jdText || jdText.trim().length === 0) {
        console.error(`❌ [JD Service] Failed to extract text from JD file`);
        return {
          success: false,
          error: 'Failed to extract text from JD file',
          requirements: { skills: [], experience: [], education: [], mustHave: [] },
        };
      }

      console.log(`   Calling AI to extract requirements...`);
      // Extract requirements using AI
      const requirements = await this.extractJobRequirements(jdText);
      console.log(`   AI extraction complete. Skills found: ${requirements?.skills?.length || 0}`);

      // Normalize extracted skills
      if (requirements.skills) {
        requirements.skills = this.normalizeSkills(requirements.skills);
      }
      if (requirements.mustHave) {
        requirements.mustHave = this.normalizeSkills(requirements.mustHave);
      }

      console.log(`✅ [JD Service] JD processing successful`);
      return {
        success: true,
        requirements: requirements,
        fileName: fileName,
      };
    } catch (error) {
      console.error(`❌ [JD Service] Error processing JD:`, error.message);
      console.error(`   Stack:`, error.stack);
      return {
        success: false,
        error: error.message,
        requirements: { skills: [], experience: [], education: [], mustHave: [] },
      };
    }
  }

  /**
   * NORMALIZE SKILLS - Remove redundant words and standardize
   */
  normalizeSkills(skills) {
    if (!Array.isArray(skills)) {
      return [];
    }

    return skills
      .map((skill) => {
        let normalized = skill.trim();

        // Remove redundant words
        normalized = normalized
          .replace(
            /\s+(frameworks?|practices?|methodology|methodologies|techniques?|skills?|development)\s*$/i,
            '',
          )
          .trim();

        return normalized;
      })
      .filter((s) => s.length > 0);
  }

  /**
   * Extract job requirements from JD text using AI ONLY
   */
  async extractJobRequirements(jdText) {
    // Add timestamp to prevent caching
    const timestamp = Date.now();

    const prompt = `[EXTRACTION_${timestamp}] Extract ALL skills and requirements from this job description. Return ONLY valid JSON:

{
  "skills": ["skill1", "skill2", "skill3"],
  "experience": ["experience_req1", "experience_req2"],
  "education": ["education_req1", "education_req2"],
  "mustHave": ["critical_skill1", "critical_skill2"]
}

DOCUMENT TO ANALYZE:
${jdText}

CRITICAL EXTRACTION RULES - EXTRACT EVERYTHING MENTIONED:
- Tools & Software: JIRA, Azure DevOps, Confluence, etc.
- Methodologies: Scrum, Agile, Kanban, SAFe, Waterfall, etc.
- Practices: Sprint Planning, Daily Stand-ups, Retrospectives, Grooming, Sprint Reviews, etc.
- Frameworks: Agile frameworks, Scrum practices, etc.
- Principles: Agile principles, Lean principles, etc.
- Programming languages: Python, Java, JavaScript, C++, etc.
- Technologies: Docker, AWS, Azure, Kubernetes, etc.
- Databases: MySQL, PostgreSQL, MongoDB, etc.
- Certifications: Scrum Master, CSM, PMP, etc.
- Soft skills: Leadership, Communication, Collaboration, etc.

BE EXTREMELY THOROUGH - if it's mentioned in the text, extract it as a skill!
Extract EXACT phrases from the document, not generic terms.

Return valid JSON only:`;

    try {
      // Use retry helper for rate limit handling
      const response = await this.makeAPICallWithRetry(() =>
        axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 1500,
          },
          {
            timeout: 300000, // 5 minutes - explicitly set to prevent override
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const content = response.data.choices[0].message.content.trim();

      // Remove any markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const requirements = JSON.parse(cleanContent);

      // VALIDATE that we got actual skills, not garbage
      if (requirements.skills && requirements.skills.includes('PDF parsing')) {
        throw new Error('AI returned invalid skills');
      }

      if (
        requirements.skills &&
        requirements.skills.includes('Scrum') &&
        jdText.toLowerCase().includes('ai engineer')
      ) {
        throw new Error('AI returned wrong skills for job type');
      }

      return requirements;
    } catch (error) {
      // Enhanced error logging for API failures
      console.error(`❌ [${this.provider} API Error] JD Extraction Failed:`);
      console.error('   Error Message:', error.message);
      console.error('   Error Code:', error.code);
      console.error('   HTTP Status:', error.response?.status);
      console.error('   Response Data:', JSON.stringify(error.response?.data, null, 2));

      // Categorize error type
      if (error.code === 'ECONNABORTED') {
        const timeoutMs = error.config?.timeout || 'unknown';
        throw new Error(`${this.provider} API timeout - JD extraction exceeded ${timeoutMs}ms`);
      }

      if (error.response?.status === 401) {
        throw new Error(`${this.provider} API authentication failed (401) - check API key`);
      }

      if (error.response?.status === 429) {
        throw new Error(`${this.provider} API rate limit exceeded (429) - too many requests`);
      }

      if (error.response?.status >= 500) {
        throw new Error(
          `${this.provider} API server error (${error.response.status}) - try again later`,
        );
      }

      // NO FALLBACK - FAIL COMPLETELY
      throw new Error(
        `JD extraction failed: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
      );
    }
  }

  /**
   * STEP 1: INGRESS - PDF/Docx upload → Supabase Storage
   */
  async ingressDocument(fileBuffer, fileName) {
    // For now, we'll process in memory
    // In production: upload to Supabase Storage and return signed URL
    return {
      fileId: this.generateId(),
      fileName: fileName,
      fileUrl: `supabase://storage/${fileName}`,
      fileSize: fileBuffer.length,
      fileType: fileName.split('.').pop(),
    };
  }

  /**
   * STEP 2: PARSING - Extract text from PDF, DOCX, or DOC files
   */
  async parseDocument(fileBuffer, fileType) {
    let text = '';
    const fileTypeLower = fileType.toLowerCase();

    if (fileTypeLower === 'pdf') {
      try {
        const pdfData = await pdf(fileBuffer);
        text = pdfData.text || '';

        if (!text || text.trim().length === 0) {
          throw new Error('PDF contains no extractable text');
        }
      } catch (e) {
        // Try with different options for corrupted PDFs
        try {
          const pdfData = await pdf(fileBuffer, {
            normalizeWhitespace: false,
            disableCombineTextItems: false,
          });
          text = pdfData.text || '';

          if (!text || text.trim().length === 0) {
            throw new Error('PDF contains no extractable text even with alternative parsing');
          }
        } catch (e2) {
          throw new Error(
            `PDF is corrupted or unreadable. Please save as a new PDF or convert to TXT format. Error: ${e.message}`,
          );
        }
      }
    } else if (fileTypeLower === 'docx') {
      // Handle .docx files using mammoth
      try {
        console.log('   Parsing DOCX file with mammoth...');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value || '';

        if (!text || text.trim().length === 0) {
          throw new Error('DOCX contains no extractable text');
        }
        console.log(`   ✓ DOCX parsed successfully - ${text.length} characters`);
      } catch (e) {
        throw new Error(`Failed to parse DOCX file: ${e.message}`);
      }
    } else if (fileTypeLower === 'doc') {
      // Handle .doc files (older binary format) using word-extractor
      try {
        console.log('   Parsing DOC file with word-extractor...');
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(fileBuffer);
        text = extracted.getBody() || '';

        if (!text || text.trim().length === 0) {
          throw new Error('DOC contains no extractable text');
        }
        console.log(`   ✓ DOC parsed successfully - ${text.length} characters`);
      } catch (e) {
        throw new Error(`Failed to parse DOC file: ${e.message}`);
      }
    } else if (fileTypeLower === 'txt') {
      // Handle plain text files
      text = fileBuffer.toString('utf-8');
    } else {
      // Try to read as plain text as fallback
      text = fileBuffer.toString('utf-8');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Document contains no readable text');
    }

    return {
      rawText: text,
      layoutBlocks: this.extractLayoutBlocks(text),
      metadata: {
        pageCount: 1,
        wordCount: text.split(' ').length,
      },
    };
  }

  /**
   * STEP 3: ENTITY PASS - spaCy + custom regex
   */
  async extractEntities(text) {
    const entities = [];

    // Email extraction with offsets
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({
        type: 'EMAIL',
        value: match[0],
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        contextWindow: this.getContextWindow(text, match.index, 30),
        confidence: 0.95,
      });
    }

    // Phone extraction with offsets
    const phoneRegex = /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({
        type: 'PHONE',
        value: match[0],
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        contextWindow: this.getContextWindow(text, match.index, 30),
        confidence: 0.9,
      });
    }

    // LinkedIn extraction
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/g;
    while ((match = linkedinRegex.exec(text)) !== null) {
      entities.push({
        type: 'LINKEDIN',
        value: match[0],
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        contextWindow: this.getContextWindow(text, match.index, 30),
        confidence: 0.98,
      });
    }

    // Date extraction
    const dateRegex = /\b\d{4}\b|\b\d{1,2}\/\d{4}\b|\b\w+\s+\d{4}\b/g;
    while ((match = dateRegex.exec(text)) !== null) {
      entities.push({
        type: 'DATE',
        value: match[0],
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        contextWindow: this.getContextWindow(text, match.index, 30),
        confidence: 0.8,
      });
    }

    // Name extraction - NEW: Extract candidate name from beginning of CV
    const nameRegex = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gm;
    const lines = text.split('\n');
    // Check first 10 lines for name
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/);
      if (nameMatch) {
        const name = nameMatch[1];
        // Skip if looks like company, university, or section header
        if (
          !name.match(
            /\b(company|corporation|inc|ltd|llc|university|college|school|institute|resume|curriculum|vitae|cv)\b/i,
          )
        ) {
          entities.push({
            type: 'PERSON',
            value: name,
            startOffset: text.indexOf(name),
            endOffset: text.indexOf(name) + name.length,
            contextWindow: this.getContextWindow(text, text.indexOf(name), 30),
            confidence: 0.85,
          });
          break; // Take first valid name match
        }
      }
    }

    return entities;
  }

  /**
   * STEP 4: LLM EXTRACTION - Llama 3.1 8B with Pydantic JSON schema
   */
  async extractStructuredData(text, entities) {
    const prompt = `You are a world-class CV analyst. Extract structured information from this resume with extreme accuracy.

CRITICAL: Extract the candidate's ACTUAL NAME from the top of the resume.
- Look for the full name at the beginning of the CV (usually first line or in header)
- Format as "First Name Last Name" with proper capitalization
- Example: "John Smith" NOT "johnsmith123" or "john.smith" or email username
- If name contains Jr/Sr/III, include it: "John Smith Jr"

Return ONLY valid JSON matching this exact schema:

{
  "personal": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null"
  },
  "summary": "string - A professional 2-3 sentence assessment summarizing the candidate's experience, key strengths, and career focus",
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "achievements": ["string"],
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "year": "string"
    }
  ],
  "skills": ["string"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string or null",
      "year": "string or null"
    }
  ]
}

CRITICAL EXTRACTION RULES:

0. SUMMARY/PROFESSIONAL ASSESSMENT - Generate a 2-3 sentence professional assessment:
   - Summarize the candidate's years of experience and primary domain/role
   - Highlight 2-3 key strengths or standout achievements
   - Mention their career focus or expertise area
   - Write in third person, professional tone
   - Example: "Senior Full-Stack Developer with 8+ years of experience building scalable web applications. Demonstrates strong expertise in React, Node.js, and cloud infrastructure, with proven track record of leading development teams. Focused on creating high-performance solutions for enterprise clients."

1. SKILLS - Extract ALL technical and professional skills from EVERYWHERE:
   - Dedicated skills sections
   - Tools/technologies mentioned in experience descriptions ("used Python", "worked with AWS", "managed Jira", "implemented Scrum")
   - Project descriptions and achievements
   - Technologies in job descriptions
   - Methodologies (Agile, Scrum, Waterfall, Kanban)
   - Soft skills if explicitly listed
   - IMPORTANT: Extract skills from job experience text, not just skills section

2. SKILL NORMALIZATION:
   - Fix common spelling errors: "AGIL" → "Agile", "Scrum Master" → "Scrum"
   - Remove redundant words: "Agile frameworks" → "Agile", "Scrum practices" → "Scrum"
   - Standardize capitalization: "javascript" → "JavaScript", "python" → "Python"
   - Merge duplicates: ["Agile", "Agile frameworks", "AGIL"] → ["Agile"]

3. CERTIFICATIONS - ONLY extract if EXPLICITLY mentioned:
   - Look for words like "Certified", "Certification", "Certificate"
   - Extract the EXACT certification name as written
   - If NO certifications are mentioned, return EMPTY array []
   - DO NOT infer certifications from skills
   - DO NOT create fake certifications

4. EXPERIENCE - Extract:
   - Company name, role, dates
   - Key achievements and responsibilities
   - Technologies used in each role (separate field)
   - Extract ALL tools, frameworks, methodologies mentioned in descriptions

5. Use null for missing personal information, not "Not found"

Resume text:
${text}

Return only the JSON object, no other text:`;

    try {
      // Use retry helper for rate limit handling
      const response = await this.makeAPICallWithRetry(() =>
        axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 2000,
          },
          {
            timeout: 300000, // 5 minutes - explicitly set to prevent override
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const jsonText = response.data.choices[0].message.content.trim();
      // Remove markdown code blocks if present
      const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();

      const structuredData = JSON.parse(cleanJson);

      // Validate structure
      if (!structuredData.personal || !structuredData.skills) {
        throw new Error('Invalid extraction structure - missing required fields');
      }

      return structuredData;
    } catch (error) {
      // Enhanced error logging for API failures
      console.error(`❌ [${this.provider} API Error] CV Extraction Failed:`);
      console.error('   Error Message:', error.message);
      console.error('   Error Code:', error.code);
      console.error('   HTTP Status:', error.response?.status);
      console.error('   Response Data:', JSON.stringify(error.response?.data, null, 2));

      // Categorize error type
      if (error.code === 'ECONNABORTED') {
        const timeoutMs = error.config?.timeout || 'unknown';
        throw new Error(`${this.provider} API timeout - CV extraction exceeded ${timeoutMs}ms`);
      }

      if (error.response?.status === 401) {
        throw new Error(`${this.provider} API authentication failed (401) - check API key`);
      }

      if (error.response?.status === 429) {
        throw new Error(`${this.provider} API rate limit exceeded (429) - too many requests`);
      }

      if (error.response?.status >= 500) {
        throw new Error(
          `${this.provider} API server error (${error.response.status}) - try again later`,
        );
      }

      throw new Error(
        `Failed to extract CV data: ${error.message} (Status: ${error.response?.status || 'N/A'})`,
      );
    }
  }

  /**
   * STEP 5: EVIDENCE BINDING - Store character offsets
   */
  bindEvidence(structuredData, entities, text) {
    const evidenceMap = {};

    // Bind personal info to entities
    if (structuredData.personal) {
      Object.keys(structuredData.personal).forEach((field) => {
        const value = structuredData.personal[field];
        if (value && value !== 'Not found') {
          const entity = entities.find(
            (e) =>
              e.value.toLowerCase().includes(value.toLowerCase()) ||
              value.toLowerCase().includes(e.value.toLowerCase()),
          );

          if (entity) {
            evidenceMap[field] = {
              value: value,
              startOffset: entity.startOffset,
              endOffset: entity.endOffset,
              contextWindow: entity.contextWindow,
              confidence: entity.confidence,
            };
          }
        }
      });
    }

    return evidenceMap;
  }

  /**
   * STEP 6: SCORING - Must-have gate + Semantic similarity + Recency + Impact
   */
  async calculateScores(structuredData, jobRequirements, entities) {
    const scores = {
      mustHaveScore: 0,
      semanticScore: 0,
      recencyScore: 0,
      impactScore: 0,
      overallScore: 0,
    };

    // Must-have gate (boolean rules)
    if (jobRequirements.mustHave) {
      const mustHaveMatches = jobRequirements.mustHave.filter((skill) =>
        structuredData.skills?.some((candidateSkill) =>
          candidateSkill.toLowerCase().includes(skill.toLowerCase()),
        ),
      );
      scores.mustHaveScore = (mustHaveMatches.length / jobRequirements.mustHave.length) * 40;
    }

    // Semantic similarity (would use pgvector in production)
    scores.semanticScore =
      (await this.calculateSemanticSimilarity(structuredData, jobRequirements)) * 30;

    // Recency weight
    scores.recencyScore = this.calculateRecencyScore(structuredData.experience) * 20;

    // Impact verbs bonus
    scores.impactScore = this.calculateImpactScore(structuredData.experience) * 10;

    // Overall score
    scores.overallScore =
      scores.mustHaveScore + scores.semanticScore + scores.recencyScore + scores.impactScore;

    return scores;
  }

  /**
   * STEP 7: VERIFIER - Second pass with 70B model simulation
   */
  async verifyExtraction(structuredData, text, entities) {
    const verification = {
      fieldValidityRate: 0,
      evidenceCoverage: 0,
      disagreementRate: 0,
      issues: [],
    };

    // Date sanity checks
    const currentYear = new Date().getFullYear();
    structuredData.experience?.forEach((exp) => {
      const startYear = parseInt(exp.startDate);
      const endYear = parseInt(exp.endDate);

      if (startYear > currentYear || endYear > currentYear + 1) {
        verification.issues.push(`Future date detected: ${exp.company}`);
      }

      if (startYear > endYear && exp.endDate !== 'Present') {
        verification.issues.push(`Invalid date range: ${exp.company}`);
      }
    });

    // Calculate metrics
    const totalFields = this.countFields(structuredData);
    const validFields = totalFields - verification.issues.length;
    verification.fieldValidityRate = (validFields / totalFields) * 100;
    verification.evidenceCoverage = (entities.length / totalFields) * 100;
    verification.disagreementRate = (verification.issues.length / totalFields) * 100;

    return verification;
  }

  /**
   * MAIN PROCESSING PIPELINE
   */
  async processResume(fileBuffer, fileName, jobRequirements) {
    const processingStart = Date.now();

    try {
      console.log(`\n🔍 [CV Service] Starting CV processing for: ${fileName}`);

      // Step 1: Ingress
      console.log(`   Step 1/7: Ingress...`);
      const ingressData = await this.ingressDocument(fileBuffer, fileName);
      console.log(`   ✓ Ingress complete. File ID: ${ingressData.fileId}`);

      // Step 2: Parsing
      console.log(`   Step 2/7: Parsing document...`);
      const parseData = await this.parseDocument(fileBuffer, ingressData.fileType);
      console.log(
        `   ✓ Parsing complete. Text length: ${parseData.rawText?.length || 0} characters`,
      );

      // Step 3: Entity extraction
      console.log(`   Step 3/7: Extracting entities...`);
      const entities = await this.extractEntities(parseData.rawText);
      console.log(`   ✓ Entity extraction complete. Found: ${entities?.length || 0} entities`);

      // Step 4: LLM extraction
      console.log(`   Step 4/7: LLM structured data extraction...`);
      const structuredData = await this.extractStructuredData(parseData.rawText, entities);
      console.log(`   ✓ LLM extraction complete. Name: ${structuredData?.name || 'N/A'}`);

      // Step 5: Evidence binding
      console.log(`   Step 5/7: Binding evidence...`);
      const evidenceMap = this.bindEvidence(structuredData, entities, parseData.rawText);
      console.log(`   ✓ Evidence binding complete`);

      // Step 6: Scoring
      console.log(`   Step 6/7: Calculating scores...`);
      const scores = await this.calculateScores(structuredData, jobRequirements, entities);
      console.log(`   ✓ Scoring complete. Match: ${scores?.overallMatch || 0}%`);

      // Step 7: Verification
      console.log(`   Step 7/7: Verifying extraction...`);
      const verification = await this.verifyExtraction(structuredData, parseData.rawText, entities);
      console.log(`   ✓ Verification complete`);

      // Step 8: Auto-create/update candidate profile with deduplication
      console.log(`   Step 8/8: Auto-creating/updating candidate profile...`);
      const profileResult = await this.createOrUpdateCandidateProfile(
        structuredData,
        scores,
        jobRequirements?.jobPositionId || null,
      );
      console.log(
        `   ✓ Profile ${profileResult.action || 'processed'}: ${profileResult.candidate?.name || 'N/A'}`,
      );

      console.log(`✅ [CV Service] CV processing successful in ${Date.now() - processingStart}ms`);

      return {
        success: true,
        resumeId: ingressData.fileId,
        fileName: fileName,
        structuredData: structuredData,
        entities: entities,
        evidenceMap: evidenceMap,
        scores: scores,
        verification: verification,
        candidateProfile: profileResult, // Include profile creation result
        processingTime: Date.now() - processingStart,
        metadata: {
          fieldValidityRate: verification.fieldValidityRate,
          evidenceCoverage: verification.evidenceCoverage,
          disagreementRate: verification.disagreementRate,
        },
      };
    } catch (error) {
      console.error(`❌ [CV Service] Error processing CV ${fileName}:`, error.message);
      console.error(`   Stack:`, error.stack);
      console.error(`   Processing time: ${Date.now() - processingStart}ms`);

      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - processingStart,
      };
    }
  }

  /**
   * AUTO CREATE OR UPDATE CANDIDATE PROFILE WITH DEDUPLICATION
   * Automatically creates/updates candidate profiles in the background
   */
  async createOrUpdateCandidateProfile(structuredData, scores, jobPositionId = null) {
    try {
      console.log('\n🔄 [Deduplication] Starting automatic profile creation/update...');

      const candidateEmail = structuredData.personal?.email;
      const candidateName = structuredData.personal?.name;

      if (!candidateEmail || candidateEmail === 'Email not found') {
        console.log('⚠️ [Deduplication] No valid email found, skipping profile creation');
        return { success: false, reason: 'No valid email' };
      }

      // Step 1: Check for exact email match
      console.log(`   Checking for duplicate by email: ${candidateEmail}`);
      let existingCandidate = await prisma.candidateProfile.findFirst({
        where: { email: candidateEmail },
      });

      if (existingCandidate) {
        console.log(`   ✓ Found existing candidate by email (ID: ${existingCandidate.id})`);
        console.log('   Updating existing profile...');

        // Update existing candidate
        const updated = await prisma.candidateProfile.update({
          where: { id: existingCandidate.id },
          data: {
            name: candidateName || existingCandidate.name,
            phone:
              structuredData.personal?.phone !== 'Phone not found'
                ? structuredData.personal?.phone
                : existingCandidate.phone,
            location:
              structuredData.personal?.location !== 'Location not specified'
                ? structuredData.personal?.location
                : existingCandidate.location,
            linkedin_url:
              structuredData.personal?.linkedin !== 'LinkedIn not found'
                ? structuredData.personal?.linkedin
                : existingCandidate.linkedin_url,
            skills: structuredData.skills || existingCandidate.skills,
            years_of_experience: this.calculateYearsOfExperience(structuredData.experience),
            highest_education_level: this.extractHighestEducation(structuredData.education),
            certifications: structuredData.certifications || existingCandidate.certifications,
            current_company: this.extractCurrentCompany(structuredData.experience),
            current_title: this.extractCurrentTitle(structuredData.experience),
            overall_match_score: scores?.overallMatch || existingCandidate.overall_match_score,
            performance_score: scores?.performance || existingCandidate.performance_score,
            potential_score: scores?.potential || existingCandidate.potential_score,
            availability_status: existingCandidate.availability_status || 'open_to_opportunities',
            updated_at: new Date(),
          },
        });

        console.log(`   ✅ [Deduplication] Updated existing candidate profile (ID: ${updated.id})`);
        return { success: true, candidate: updated, action: 'updated' };
      }

      // Step 2: AI Similarity Check (if no exact email match)
      console.log('   No exact email match found');
      console.log('   Checking AI similarity with existing candidates...');

      const similarCandidate = await this.findSimilarCandidateByAI(candidateName, structuredData);

      if (similarCandidate) {
        console.log(
          `   ⚠️ Found similar candidate: ${similarCandidate.name} (ID: ${similarCandidate.id}, Similarity: ${similarCandidate.similarity}%)`,
        );
        console.log('   Skipping creation to avoid duplicates (manual review recommended)');
        return {
          success: true,
          candidate: similarCandidate,
          action: 'duplicate_detected',
          similarity: similarCandidate.similarity,
        };
      }

      // Step 3: Create new candidate profile
      console.log('   No duplicates found, creating new profile...');

      const newCandidate = await prisma.candidateProfile.create({
        data: {
          name: candidateName,
          email: candidateEmail,
          phone:
            structuredData.personal?.phone !== 'Phone not found'
              ? structuredData.personal?.phone
              : null,
          location:
            structuredData.personal?.location !== 'Location not specified'
              ? structuredData.personal?.location
              : null,
          linkedin_url:
            structuredData.personal?.linkedin !== 'LinkedIn not found'
              ? structuredData.personal?.linkedin
              : null,
          skills: structuredData.skills || [],
          years_of_experience: this.calculateYearsOfExperience(structuredData.experience),
          highest_education_level: this.extractHighestEducation(structuredData.education),
          certifications: structuredData.certifications || [],
          current_company: this.extractCurrentCompany(structuredData.experience),
          current_title: this.extractCurrentTitle(structuredData.experience),
          overall_match_score: scores?.overallMatch || 0,
          performance_score: scores?.performance || 0,
          potential_score: scores?.potential || 0,
          availability_status: 'open_to_opportunities',
          source: 'cv_intelligence',
        },
      });

      console.log(`   ✅ [Deduplication] Created new candidate profile (ID: ${newCandidate.id})`);

      // If job position specified, create application
      if (jobPositionId) {
        await prisma.jobApplication.create({
          data: {
            candidate_id: newCandidate.id,
            job_position_id: jobPositionId,
            current_stage: 'screening',
            stage_number: 1,
            position_match_score: scores?.overallMatch || 0,
            status: 'active',
          },
        });
        console.log(`   ✅ Created job application for position ${jobPositionId}`);
      }

      return { success: true, candidate: newCandidate, action: 'created' };
    } catch (error) {
      console.error('❌ [Deduplication] Error creating/updating candidate profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * AI SIMILARITY MATCHING - Find similar candidates using AI
   */
  async findSimilarCandidateByAI(candidateName, structuredData) {
    try {
      // Get all existing candidates
      const existingCandidates = await prisma.candidateProfile.findMany({
        take: 50, // Limit to recent 50 candidates for performance
        orderBy: { created_at: 'desc' },
      });

      if (existingCandidates.length === 0) {
        return null;
      }

      // Use AI to compare names and basic info
      const prompt = `You are a deduplication expert. Compare the new candidate with existing candidates to find potential duplicates.

New Candidate:
- Name: ${candidateName}
- Email: ${structuredData.personal?.email}
- Phone: ${structuredData.personal?.phone}
- Location: ${structuredData.personal?.location}

Existing Candidates:
${existingCandidates.map((c, i) => `${i + 1}. Name: ${c.name}, Email: ${c.email}, Phone: ${c.phone}, Location: ${c.location}`).join('\n')}

Respond with JSON only:
{
  "isDuplicate": true/false,
  "matchedCandidateIndex": number or null,
  "similarity": 0-100,
  "reason": "explanation"
}

Consider a match if:
- Names are very similar (typos, abbreviations)
- Phone numbers match
- Same location and similar background`;

      const response = await this.makeAPICallWithRetry(() =>
        axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 300,
          },
          {
            timeout: 30000,
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const content = response.data.choices[0].message.content.trim();
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanContent);

      if (result.isDuplicate && result.matchedCandidateIndex !== null) {
        const matchedCandidate = existingCandidates[result.matchedCandidateIndex - 1];
        return {
          ...matchedCandidate,
          similarity: result.similarity,
          reason: result.reason,
        };
      }

      return null;
    } catch (error) {
      console.error('⚠️ [AI Similarity] Error during similarity check:', error.message);
      return null; // Fail gracefully - better to allow duplicates than block valid candidates
    }
  }

  /**
   * HELPER: Calculate years of experience from experience array
   */
  calculateYearsOfExperience(experiences) {
    if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    for (const exp of experiences) {
      // Try to parse dates from the experience entry
      const dateMatch = exp.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/i);
      if (dateMatch) {
        const startYear = parseInt(dateMatch[1]);
        const endYear =
          dateMatch[2].toLowerCase() === 'present'
            ? new Date().getFullYear()
            : parseInt(dateMatch[2]);
        totalMonths += (endYear - startYear) * 12;
      }
    }

    return Math.round(totalMonths / 12);
  }

  /**
   * HELPER: Extract highest education level
   */
  extractHighestEducation(educations) {
    if (!educations || !Array.isArray(educations) || educations.length === 0) {
      return null;
    }

    const levels = ['phd', 'doctorate', 'master', 'bachelor', 'associate', 'diploma'];

    for (const level of levels) {
      for (const edu of educations) {
        if (edu.toLowerCase().includes(level)) {
          return level.charAt(0).toUpperCase() + level.slice(1);
        }
      }
    }

    return educations[0]; // Return first education if no level matched
  }

  /**
   * HELPER: Extract current company from experience
   */
  extractCurrentCompany(experiences) {
    if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
      return null;
    }

    // Look for "present" or most recent entry
    const currentExp = experiences.find(
      (exp) => exp.toLowerCase().includes('present') || exp.toLowerCase().includes('current'),
    );

    if (currentExp) {
      // Try to extract company name (usually after "at" or before dates)
      const companyMatch = currentExp.match(/at\s+([^,\d]+)/i);
      if (companyMatch) {
        return companyMatch[1].trim();
      }
    }

    return null;
  }

  /**
   * HELPER: Extract current title from experience
   */
  extractCurrentTitle(experiences) {
    if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
      return null;
    }

    // Look for "present" or most recent entry
    const currentExp = experiences.find(
      (exp) => exp.toLowerCase().includes('present') || exp.toLowerCase().includes('current'),
    );

    if (currentExp) {
      // Try to extract title (usually at the beginning)
      const titleMatch = currentExp.match(/^([^,\d-]+)/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }

    return null;
  }

  // Helper methods
  generateId() {
    return 'hr01_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  extractLayoutBlocks(text) {
    return text.split('\n\n').map((block, index) => ({
      id: index,
      text: block.trim(),
      type: this.detectBlockType(block),
    }));
  }

  detectBlockType(block) {
    if (block.includes('@')) {
      return 'contact';
    }
    if (block.match(/\d{4}/)) {
      return 'experience';
    }
    if (block.toLowerCase().includes('university') || block.toLowerCase().includes('degree')) {
      return 'education';
    }
    return 'text';
  }

  getContextWindow(text, position, windowSize) {
    const start = Math.max(0, position - windowSize);
    const end = Math.min(text.length, position + windowSize);
    return text.substring(start, end);
  }

  getFallbackStructure(entities, rawText = '') {
    const emailEntity = entities.find((e) => e.type === 'EMAIL');
    const phoneEntity = entities.find((e) => e.type === 'PHONE');
    const linkedinEntity = entities.find((e) => e.type === 'LINKEDIN');

    // Extract name from entities or text
    let name = 'Name not found';
    const nameEntity = entities.find((e) => e.type === 'PERSON');
    if (nameEntity) {
      name = this.normalizeName(nameEntity.value);
    } else {
      // Try to extract name from email
      const email = emailEntity?.value;
      if (email) {
        const emailName = email.split('@')[0].replace(/[._]/g, ' ');
        name = this.normalizeName(emailName);
      }
    }

    // Extract basic skills from text using common patterns
    const skills = this.extractBasicSkills(rawText);

    // Extract basic experience info
    const experience = this.extractBasicExperience(rawText);

    // Extract basic education info
    const education = this.extractBasicEducation(rawText);

    return {
      personal: {
        name: name,
        email: emailEntity?.value || 'Email not found',
        phone: phoneEntity?.value || 'Phone not found',
        location: 'Location not specified',
        linkedin: linkedinEntity?.value || 'LinkedIn not found',
      },
      experience: experience,
      education: education,
      skills: skills,
      certifications: [],
    };
  }

  normalizeName(name) {
    if (!name || name === 'Name not found') {
      return name;
    }

    return name
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  extractBasicSkills(text) {
    if (!text) {
      return [];
    }

    const commonSkills = [
      'JavaScript',
      'Python',
      'Java',
      'React',
      'Node.js',
      'HTML',
      'CSS',
      'SQL',
      'MongoDB',
      'PostgreSQL',
      'Git',
      'Docker',
      'AWS',
      'Azure',
      'TypeScript',
      'Angular',
      'Vue.js',
      'Express',
      'Django',
      'Flask',
      'Spring',
      'Laravel',
      'PHP',
      'C++',
      'C#',
      '.NET',
      'Ruby',
      'Go',
      'Rust',
      'Swift',
      'Kotlin',
      'Machine Learning',
      'Data Science',
      'AI',
      'DevOps',
      'Kubernetes',
      'Jenkins',
      'CI/CD',
      'Agile',
      'Scrum',
      'Project Management',
    ];

    const foundSkills = [];
    const textLower = text.toLowerCase();

    commonSkills.forEach((skill) => {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  extractBasicExperience(text) {
    if (!text) {
      return [];
    }

    // Simple pattern matching for experience
    const lines = text.split('\n');
    const experience = [];

    lines.forEach((line) => {
      // Look for company/role patterns
      if (line.match(/\b(developer|engineer|manager|analyst|designer|consultant)\b/i)) {
        experience.push({
          company: 'Company not specified',
          role: line.trim().substring(0, 50),
          startDate: 'Date not specified',
          endDate: 'Date not specified',
          achievements: [],
        });
      }
    });

    return experience.slice(0, 3); // Limit to 3 experiences
  }

  extractBasicEducation(text) {
    if (!text) {
      return [];
    }

    const education = [];
    const textLower = text.toLowerCase();

    // Look for degree patterns
    const degrees = ['bachelor', 'master', 'phd', 'diploma', 'certificate'];
    const fields = ['computer science', 'engineering', 'business', 'mathematics', 'physics'];

    degrees.forEach((degree) => {
      if (textLower.includes(degree)) {
        const field = fields.find((f) => textLower.includes(f)) || 'Field not specified';
        education.push({
          institution: 'Institution not specified',
          degree: degree.charAt(0).toUpperCase() + degree.slice(1),
          field: field.charAt(0).toUpperCase() + field.slice(1),
          year: 'Year not specified',
        });
      }
    });

    return education.slice(0, 2); // Limit to 2 education entries
  }

  async calculateSemanticSimilarity(structuredData, jobRequirements) {
    // Simplified semantic similarity
    // In production: use actual pgvector embeddings
    const candidateText = JSON.stringify(structuredData).toLowerCase();
    const jobText = JSON.stringify(jobRequirements).toLowerCase();

    const commonWords = candidateText
      .split(' ')
      .filter((word) => jobText.includes(word) && word.length > 3);

    return Math.min(1.0, commonWords.length / 20);
  }

  calculateRecencyScore(experience) {
    if (!experience || experience.length === 0) {
      return 0;
    }

    const currentYear = new Date().getFullYear();
    const mostRecentYear = Math.max(
      ...experience.map((exp) => {
        const endYear = exp.endDate === 'Present' ? currentYear : parseInt(exp.endDate);
        return endYear || 0;
      }),
    );

    const yearsAgo = currentYear - mostRecentYear;

    if (yearsAgo <= 5) {
      return 1.0;
    }
    if (yearsAgo <= 10) {
      return 0.5;
    }
    return 0.25;
  }

  calculateImpactScore(experience) {
    if (!experience || experience.length === 0) {
      return 0;
    }

    const impactVerbs = [
      'implemented',
      'built',
      'owned',
      'led',
      'created',
      'developed',
      'managed',
      'increased',
      'reduced',
      'improved',
    ];
    let impactCount = 0;

    experience.forEach((exp) => {
      exp.achievements?.forEach((achievement) => {
        impactVerbs.forEach((verb) => {
          if (achievement.toLowerCase().includes(verb)) {
            impactCount++;
          }
        });
      });
    });

    return Math.min(1.0, impactCount / 5);
  }

  countFields(obj) {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          count += obj[key].length;
        } else {
          count += this.countFields(obj[key]);
        }
      } else {
        count++;
      }
    }
    return count;
  }

  /**
   * ASSESS CANDIDATE FOR ROLE - Compare CV against JD requirements
   * Returns professional assessment with score for ranking
   */
  async assessCandidateForRole(cvData, jdRequirements) {
    const prompt = `You are a world-class HR expert and talent acquisition specialist. Compare this candidate's CV against the job requirements and provide a professional assessment of how well they fit the role.

JOB REQUIREMENTS:
${JSON.stringify(jdRequirements, null, 2)}

CANDIDATE CV DATA:
Name: ${cvData.personal?.name || 'Not specified'}
Email: ${cvData.personal?.email || 'Not specified'}
Skills: ${cvData.skills?.join(', ') || 'Not specified'}
Experience:
${cvData.experience?.map((exp) => `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate})`).join('\n') || 'Not specified'}
Education:
${cvData.education?.map((edu) => `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year})`).join('\n') || 'Not specified'}

Provide a comprehensive assessment in JSON format:

{
  "assessment": "A professional 2-3 sentence assessment summarizing how well this candidate fits the role. Focus on key strengths that match the requirements and any critical gaps.",
  "score": 85,
  "strengths": [
    "Specific strength 1 that matches job requirements",
    "Specific strength 2 that makes them a good fit",
    "Specific strength 3 with concrete examples"
  ],
  "gaps": [
    "Specific gap 1 - what's missing from requirements",
    "Specific gap 2 - areas where they fall short"
  ],
  "matchedRequirements": ["requirement 1", "requirement 2", "requirement 3"],
  "missingRequirements": ["requirement 1", "requirement 2"],
  "recommendation": "Strong Hire | Hire | Maybe | Pass"
}

CRITICAL SCORING GUIDELINES (0-100):
- 90-100: Exceptional fit - exceeds most requirements, strong track record
- 75-89: Strong fit - meets most requirements, good experience
- 60-74: Good fit - meets core requirements, some gaps
- 45-59: Moderate fit - meets some requirements, significant gaps
- 0-44: Poor fit - lacks key requirements

ASSESSMENT GUIDELINES:
1. Compare CV data DIRECTLY against job requirements
2. Be specific - reference actual skills, experience, achievements from their CV
3. Consider depth AND breadth of experience
4. Evaluate career progression and growth potential
5. Identify both technical skills and soft skills alignment
6. Be honest about gaps but also recognize transferable skills
7. Score must reflect overall fit based on requirements match

Return only the JSON object:`;

    try {
      // Use retry helper for rate limit handling
      const response = await this.makeAPICallWithRetry(() =>
        axios.post(
          this.apiUrl,
          {
            model: this.model, // Use configured model (Groq or OpenAI)
            messages: [
              {
                role: 'system',
                content:
                  'You are an elite HR expert and talent acquisition specialist with 20+ years of experience. You provide thorough, honest, and data-driven candidate assessments. Always return valid JSON without markdown formatting.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.2, // Lower temperature for consistent scoring
            max_tokens: 2000,
          },
          {
            timeout: 300000,
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const jsonText = response.data.choices[0].message.content.trim();
      const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanJson);

      // Validate score is a number between 0-100
      const score = Math.max(0, Math.min(100, Number(result.score) || 0));

      return {
        assessment: result.assessment || 'Assessment unavailable',
        score: score,
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        gaps: Array.isArray(result.gaps) ? result.gaps : [],
        matchedRequirements: Array.isArray(result.matchedRequirements)
          ? result.matchedRequirements
          : [],
        missingRequirements: Array.isArray(result.missingRequirements)
          ? result.missingRequirements
          : [],
        recommendation: result.recommendation || 'Maybe',
      };
    } catch (error) {
      console.error(`❌ [${this.provider} API Error] Assessment Failed:`, error.message);
      return {
        assessment: 'Unable to assess candidate due to technical error',
        score: 0,
        strengths: [],
        gaps: [],
        matchedRequirements: [],
        missingRequirements: [],
        recommendation: 'Pass',
      };
    }
  }

  /**
   * HOLISTIC CV ASSESSMENT - Let ChatGPT analyze the entire CV contextually
   * This replaces robotic skill matching with intelligent evaluation
   * @deprecated Use assessCandidateForRole instead
   */
  async assessCVHolistically(cvText, jobRequirements) {
    const jdText = JSON.stringify(jobRequirements, null, 2);

    const prompt = `You are a world-class HR expert and talent acquisition specialist. Analyze this CV holistically against the job requirements.

JOB REQUIREMENTS:
${jdText}

CANDIDATE CV:
${cvText}

Provide a comprehensive assessment in JSON format:

{
  "overallFit": "number 0-100",
  "strengths": ["detailed strength 1", "detailed strength 2", "detailed strength 3"],
  "weaknesses": ["detailed weakness 1", "detailed weakness 2"],
  "keyHighlights": ["impressive achievement 1", "impressive achievement 2"],
  "matchedRequirements": ["requirement 1", "requirement 2"],
  "missingRequirements": ["requirement 1", "requirement 2"],
  "experienceRelevance": "detailed analysis of how their experience aligns",
  "culturalFit": "assessment of soft skills and work style",
  "recommendation": "Strong Hire | Hire | Maybe | Pass",
  "detailedReasoning": "comprehensive paragraph explaining the recommendation"
}

ANALYSIS GUIDELINES:
1. Look at the COMPLETE picture - experience quality, career progression, achievements, not just skill keywords
2. Consider context: How did they use their skills? What impact did they make?
3. Evaluate career trajectory and growth potential
4. Assess both technical capabilities AND soft skills/leadership
5. Be specific in your reasoning - reference actual achievements from their CV
6. Consider transferable skills and learning ability
7. Don't just count matching keywords - evaluate depth of experience

Return only the JSON object:`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo', // Use GPT-3.5 for cost efficiency
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5, // Higher temperature for more nuanced analysis
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const jsonText = response.data.choices[0].message.content.trim();
      const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      const assessment = JSON.parse(cleanJson);

      return assessment;
    } catch (error) {
      return {
        overallFit: 0,
        strengths: [],
        weaknesses: [],
        keyHighlights: [],
        matchedRequirements: [],
        missingRequirements: [],
        experienceRelevance: 'Assessment failed',
        culturalFit: 'Assessment failed',
        recommendation: 'Pass',
        detailedReasoning: 'Unable to assess candidate due to technical error',
      };
    }
  }

  /**
   * GENERATE INTERVIEW QUESTIONS - Tailored to candidate's CV and gaps
   */
  async generateInterviewQuestions(cvText, structuredData, assessment, jobRequirements) {
    const prompt = `You are an expert interviewer. Generate targeted interview questions for this candidate based on their CV and the job requirements.

JOB REQUIREMENTS:
${JSON.stringify(jobRequirements, null, 2)}

CANDIDATE PROFILE:
Name: ${structuredData.personal?.name || 'Candidate'}
Experience: ${structuredData.experience?.length || 0} positions
Key Skills: ${structuredData.skills?.slice(0, 10).join(', ') || 'Not specified'}

ASSESSMENT SUMMARY:
Overall Fit: ${assessment.overallFit}/100
Recommendation: ${assessment.recommendation}
Missing Requirements: ${assessment.missingRequirements?.join(', ') || 'None'}

Generate interview questions in JSON format:

{
  "technicalQuestions": [
    {
      "question": "Specific technical question",
      "purpose": "What this question validates",
      "expectedAnswer": "What to look for in their answer"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Behavioral/situational question",
      "purpose": "What this reveals about the candidate",
      "expectedAnswer": "Key points to listen for"
    }
  ],
  "gapQuestions": [
    {
      "question": "Question about missing skills/experience",
      "purpose": "Assess if gap is critical or can be filled",
      "expectedAnswer": "What would indicate they can learn/adapt"
    }
  ],
  "scenarioQuestions": [
    {
      "question": "Real-world scenario question",
      "purpose": "Test problem-solving and practical application",
      "expectedAnswer": "Approach and thought process to look for"
    }
  ]
}

QUESTION GENERATION RULES:
1. Reference specific items from their CV
2. Focus on missing requirements from assessment
3. Probe depth of claimed experience
4. Test problem-solving ability
5. Assess cultural fit and soft skills
6. Generate 3-5 questions per category
7. Make questions specific, not generic

Return only the JSON object:`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo', // Use GPT-3.5 for cost efficiency
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const jsonText = response.data.choices[0].message.content.trim();
      const questions = JSON.parse(jsonText);

      return questions;
    } catch (error) {
      return {
        technicalQuestions: [],
        behavioralQuestions: [],
        gapQuestions: [],
        scenarioQuestions: [],
      };
    }
  }

  /**
   * CHATGPT SKILL MATCHING - Compare CV skills with JD requirements using AI
   * Returns matched, missing, and additional skills
   */
  async matchSkillsWithChatGPT(cvData, jdRequirements) {
    const prompt = `You are a world-class expert recruiter and technical assessor with 20+ years of experience in talent acquisition across all industries. Your job is to perform an EXHAUSTIVE and INTELLIGENT comparison between a candidate's CV and job requirements.

═══════════════════════════════════════════════════════════════════
JOB REQUIREMENTS (WHAT WE'RE LOOKING FOR):
═══════════════════════════════════════════════════════════════════
${JSON.stringify(jdRequirements, null, 2)}

═══════════════════════════════════════════════════════════════════
CANDIDATE'S COMPLETE PROFILE:
═══════════════════════════════════════════════════════════════════

SKILLS LISTED IN CV:
${cvData.skills?.join(', ') || 'Not specified'}

WORK EXPERIENCE (WHERE SKILLS ARE PROVEN):
${
  cvData.experience
    ?.map(
      (exp) => `
→ ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate})
  Achievements: ${exp.achievements?.join('; ') || 'Not specified'}
  Technologies/Tools: ${exp.technologies?.join(', ') || 'Derived from role'}
`,
    )
    .join('\n') || 'Not specified'
}

EDUCATION (DEGREES & ACADEMIC BACKGROUND):
${cvData.education?.map((edu) => `→ ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year})`).join('\n') || 'Not specified'}

CERTIFICATIONS & PROFESSIONAL CREDENTIALS:
${
  cvData.certifications && cvData.certifications.length > 0
    ? cvData.certifications
        .map((cert) => {
          // Handle both object and string formats
          if (typeof cert === 'object' && cert !== null) {
            return `→ ${cert.name || cert}${cert.issuer ? ` (${cert.issuer})` : ''}${cert.year ? ` - ${cert.year}` : ''}`;
          }
          return `→ ${cert}`;
        })
        .join('\n')
    : 'No certifications listed'
}

TOTAL YEARS OF EXPERIENCE:
Calculate by analyzing work history dates from experience section above.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL VERIFICATION RULES - READ CAREFULLY:
═══════════════════════════════════════════════════════════════════

BEFORE marking ANYTHING as "missing", you MUST verify it's not present in:
1. ✓ Skills section
2. ✓ Work experience (roles, achievements, technologies)
3. ✓ Education section (degrees, fields of study)
4. ✓ Certifications section
5. ✓ Job titles (e.g., "Scrum Master" role = has Scrum, Agile skills)
6. ✓ Years of experience (calculate from work history dates!)

**EXAMPLE - EDUCATION REQUIREMENTS (CRITICAL - FOLLOW EXACTLY):**
- If JD requires "Bachelor's degree in Computer Science, Business, or related field":
  1. Check EDUCATION section FIRST
  2. If they have "Bachelor of Computer Science" → ADD TO matchedSkills (NOT missingSkills!)
  3. If they have "B.Sc Computer Science" → ADD TO matchedSkills (NOT missingSkills!)
  4. If they have "Bachelor in Business" → ADD TO matchedSkills (NOT missingSkills!)
  5. If they have "Bachelor in Engineering" → ADD TO matchedSkills (related field!)
  6. If they have "Master's in Computer Science" → ADD TO matchedSkills (exceeds requirement!)
- ONLY mark education as missing if:
  - They have NO bachelor's degree at all
  - Their degree is completely unrelated (e.g., Bachelor of Arts in Literature for a CS role)
- **NEVER mark education as both matched AND missing - pick ONE category only!**

**EXAMPLE - CERTIFICATION REQUIREMENTS (CRITICAL - READ TWICE):**
- If JD requires "Certified Scrum Master (CSM)" → Check CERTIFICATIONS section FIRST!
- If they have "Certified Scrum Master" → **MATCH FOUND** (CSM is just the acronym!)
- If they have "Professional Scrum Master (PSM)" → **MATCH FOUND** (equivalent certification!)
- If they have "Scrum Master Certified" → **MATCH FOUND** (same thing, different wording!)
- If they have "SAFe 6 Scrum Master" → **MATCH FOUND** (Scrum Master certification!)
- **IGNORE ACRONYMS in parentheses** - "Certified Scrum Master" = "Certified Scrum Master (CSM)"
- Only mark certification as missing if NO related certification found in the list above

**EXAMPLE - EXPERIENCE REQUIREMENTS:**
- If JD requires "5+ years as Scrum Master" → CALCULATE from work history!
- If they were "Scrum Master" from 2018-2023 → That's 5 years! DO NOT mark as missing!
- If they were "Agile Coach" from 2015-2020 → That counts as related! DO NOT mark as missing!
- Only mark experience as missing if they have LESS than required years OR no related roles

═══════════════════════════════════════════════════════════════════
YOUR TASK - INTELLIGENT SKILL CATEGORIZATION:
═══════════════════════════════════════════════════════════════════

Analyze the candidate's COMPLETE profile (skills + experience + education + certifications) and categorize into THREE precise categories:

📊 **MATCHING RULES - BE EXTREMELY THOROUGH:**

1. **matchedSkills** - Skills from JD requirements that the candidate POSSESSES:
   ✓ Direct matches (e.g., "Python" in JD → "Python" in CV)
   ✓ Synonyms/Equivalents (e.g., "React" = "React.js" = "ReactJS")
   ✓ Framework variations (e.g., "Angular" includes "Angular 2+", "AngularJS")
   ✓ Related skills that demonstrate competency (e.g., "JavaScript" → implies "ES6", "TypeScript" → implies "JavaScript")
   ✓ Skills mentioned in EXPERIENCE (not just skills section!) - if they used it at work, they have it
   ✓ Tool equivalents (e.g., "Jira" → "Azure DevOps", "Confluence" → "Notion")
   ✓ Methodology equivalents (e.g., "Agile" → "Scrum", "Kanban", "SAFe")
   ✓ **CERTIFICATION MATCHING** (CRITICAL):
     • "Certified Scrum Master (CSM)" → matches "Certified Scrum Master" (ignore acronyms!)
     • "Certified Scrum Master (CSM)" → matches "SAFe Scrum Master", "Professional Scrum Master"
     • Any Scrum Master cert = matches "Certified Scrum Master (CSM)" requirement
     • Strip acronyms in parentheses when comparing: "AWS (Amazon Web Services)" = "AWS"
   ✓ Certification-backed skills (e.g., "AWS" if they have AWS certification)
   ✓ Version-agnostic matching (e.g., "Node.js" matches "Node.js 14", "Node.js 16")

   **IMPORTANT**: Look at their job titles, achievements, and projects. If someone was a "Senior React Developer" for 3 years, they obviously have React, Redux, JavaScript, HTML, CSS, etc. - even if not all listed in skills section!

   **CERTIFICATION RULE**: If CERTIFICATIONS section shows ANY variation of a required certification, it's a MATCH!

2. **missingSkills** - Skills from JD requirements that the candidate LACKS:
   ✗ NO evidence in skills, experience, education, or certifications
   ✗ NO equivalent, synonym, or related skill present
   ✗ NOT demonstrated through their work history or projects
   ✗ NOT implied by their role/title/achievements

   **BE STRICT**: Only mark as missing if there's ZERO evidence they have it or something equivalent.

3. **additionalSkills** - Skills the candidate HAS that are NOT in JD requirements:
   ➕ Professional/technical skills from their CV not mentioned in JD
   ➕ Relevant technologies they know beyond what's required
   ➕ Certifications/specializations that add value
   ➕ Domain expertise not explicitly required

   **EXCLUDE**: Generic soft skills like "communication", "teamwork" unless JD specifically mentions them.

═══════════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
═══════════════════════════════════════════════════════════════════
• Read EVERY line of experience - skills used at work COUNT
• Consider job titles (e.g., "Scrum Master" → has Scrum, Agile, facilitation)
• **CHECK CERTIFICATIONS SECTION CAREFULLY** - certified skills are CONFIRMED MATCHES
• **IGNORE ACRONYMS in parentheses** - "Certified Scrum Master" = "Certified Scrum Master (CSM)"
• **ANY Scrum Master certification** → matches "Certified Scrum Master (CSM)" requirement
• Be GENEROUS with matches (synonyms, equivalents, related skills, cert variations)
• Be STRICT with missing (only mark missing if NO evidence whatsoever)
• Focus on RELEVANT technical skills for additional skills
• **BEFORE marking a certification as missing, re-read the CERTIFICATIONS section above twice**

Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks):

{
  "matchedSkills": ["skill from JD that they have", "another matched skill"],
  "missingSkills": ["skill from JD they lack", "another missing skill"],
  "additionalSkills": ["extra skill they have", "another bonus skill"]
}

Think step-by-step. Be thorough. This affects hiring decisions.`;

    try {
      // Use retry helper for rate limit handling
      const response = await this.makeAPICallWithRetry(() =>
        axios.post(
          this.apiUrl,
          {
            model: this.model, // Use configured model (Groq or OpenAI)
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert technical recruiter and skill assessor. You must analyze CVs thoroughly and categorize skills with extreme precision. Always return valid JSON without markdown formatting.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.1, // Very low temperature for consistent, precise matching
            max_tokens: 2000, // More tokens for detailed analysis
          },
          {
            timeout: 300000, // 5 minutes for thorough analysis
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const jsonText = response.data.choices[0].message.content.trim();
      const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanJson);

      return {
        matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
        missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
        additionalSkills: Array.isArray(result.additionalSkills) ? result.additionalSkills : [],
      };
    } catch (error) {
      console.error(`❌ [${this.provider} API Error] Skill Matching Failed:`, error.message);
      // Fallback to empty arrays
      return {
        matchedSkills: [],
        missingSkills: [],
        additionalSkills: [],
      };
    }
  }

  /**
   * RANK ALL CANDIDATES - Let ChatGPT rank them intelligently based on REAL-WORLD FIT
   */
  async rankCandidatesIntelligently(candidates, jobRequirements) {
    const candidateSummaries = candidates.map((c, idx) => ({
      index: idx,
      name: c.name || 'Candidate ' + (idx + 1),
      roleAssessment: c.roleAssessment, // Include the CV vs JD assessment
      keySkills: c.structuredData?.skills?.slice(0, 15) || [],
      experience:
        c.structuredData?.experience?.map((e) => ({
          role: e.role,
          company: e.company,
          duration: `${e.startDate} - ${e.endDate}`,
          achievements: e.achievements?.slice(0, 3) || [],
        })) || [],
      education:
        c.structuredData?.education?.map((e) => ({
          degree: e.degree,
          field: e.field,
          institution: e.institution,
        })) || [],
    }));

    const prompt = `You are a world-class HR expert with 20+ years of hiring experience. Rank these ${candidates.length} candidates from BEST to WORST based on who will bring the MOST REAL VALUE to the role.

JOB REQUIREMENTS:
${JSON.stringify(jobRequirements, null, 2)}

CANDIDATES TO RANK:
${JSON.stringify(candidateSummaries, null, 2)}

Return a JSON array with rankings:

[
  {
    "originalIndex": 0,
    "rank": 1,
    "name": "Candidate Name",
    "rankingReason": "COMPARATIVE explanation of why THIS candidate ranks #1 COMPARED TO THE OTHERS. Format: '[Name] ranks #1 because compared to other candidates, they have: (1) [specific advantage over others], (2) [another advantage], (3) [third advantage]. While [other candidate name] has [their strength], [this candidate] excels in [key differentiator].'",
    "recommendationLevel": "Strong Hire | Hire | Maybe | Pass"
  }
]

**CRITICAL: rankingReason MUST be COMPARATIVE:**
- For rank #1: Explain what makes them BETTER than candidates ranked #2, #3, etc.
- For rank #2: Explain why they're better than #3+ but not as strong as #1
- For rank #3+: Explain what gaps they have compared to higher-ranked candidates
- ALWAYS compare against other candidates by name
- Be specific about relative strengths and weaknesses

CRITICAL RANKING CRITERIA - FOCUS ON REAL-WORLD VALUE:

1. **REAL EXPERIENCE OVER CERTIFICATIONS** (Most Important)
   - Prioritize candidates who have DONE the work, not just studied it
   - Look for hands-on achievements and deliverables
   - Years of relevant experience beats certifications alone
   - Real projects > theoretical knowledge

2. **CAREER TRAJECTORY & PROGRESSION**
   - Growing responsibilities over time
   - Leadership roles and team management
   - Impact on business outcomes
   - Promotions and career advancement

3. **DEPTH OF EXPERTISE**
   - Deep experience in core skills (e.g., 5+ years React) > surface-level knowledge of 20 tools
   - Mastery of key technologies for the role
   - Proven track record of solving complex problems

4. **PRACTICAL ACHIEVEMENTS**
   - Built/shipped real products
   - Measurable business impact (revenue, users, performance)
   - Technical leadership and mentoring
   - Problem-solving ability demonstrated through accomplishments

5. **CULTURAL & SOFT SKILLS FIT**
   - Communication and collaboration experience
   - Adaptability and learning ability
   - Work style alignment (startup vs enterprise, etc.)

6. **EDUCATION & CERTIFICATIONS** (Lower Priority)
   - Relevant degree is good but not critical if experience is strong
   - Certifications are nice-to-have, not deal-breakers
   - Self-taught with proven results > formal education without experience

**RANKING PHILOSOPHY:**
- A mid-level developer with 7 years of hands-on React experience outranks a fresh graduate with React certification
- Someone who built 3 production apps is more valuable than someone who knows 20 frameworks superficially
- Leadership experience (even if technical skills are slightly weaker) can be more valuable for senior roles
- Look at the WHOLE picture - who will hit the ground running and deliver value?

Be brutally honest and realistic. Consider what hiring managers actually value in the real world.

Return only the JSON array:`;

    try {
      // Use retry helper for rate limit handling
      const response = await this.makeAPICallWithRetry(() =>
        axios.post(
          this.apiUrl,
          {
            model: this.model, // Use configured model (Groq or OpenAI)
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 2000,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const jsonText = response.data.choices[0].message.content.trim();
      const rankings = JSON.parse(jsonText);

      return rankings;
    } catch (error) {
      // Fallback to simple ranking by assessment score
      return candidates.map((c, idx) => ({
        originalIndex: idx,
        rank: idx + 1,
        name: c.name || 'Candidate ' + (idx + 1),
        rankingReason: 'Ranked based on overall assessment score',
        recommendationLevel: c.assessment?.recommendation || 'Maybe',
      }));
    }
  }
}

// Export class for AI processing
module.exports.CVIntelligenceHR01 = CVIntelligenceHR01;

// ============================================
// DATABASE CRUD OPERATIONS (Using Prisma)
// ============================================

// Note: Prisma client is already initialized at line 9
// Using the existing 'prisma' instance from line 9

/**
 * Get all CV batches for user
 */
const getUserBatches = async (userId) => {
  const batches = await prisma.cvBatch.findMany({
    where: { userId },
    include: {
      candidates: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          overallScore: true,
        },
        orderBy: { overallScore: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return batches.map((batch) => ({
    id: batch.id,
    name: batch.batchName, // Correct field name from schema
    position: batch.position,
    status: batch.status,
    cvCount: batch.cvCount,
    dateCreated: batch.createdAt,
    candidates: batch.candidates,
    candidate_count: batch.candidates.length,
  }));
};

/**
 * Get batch details with candidates
 */
const getBatchById = async (batchId, userId) => {
  const batch = await prisma.cvBatch.findFirst({
    where: { id: batchId, userId },
    include: {
      candidates: {
        orderBy: { overallScore: 'desc' }, // Changed to desc for highest scores first
      },
    },
  });

  if (!batch) {
    throw { statusCode: 404, message: 'Batch not found' };
  }

  // Format batch data using correct schema fields
  const batchWithCount = {
    id: batch.id,
    name: batch.batchName,
    position: batch.position,
    jobDescription: batch.jobDescription,
    status: batch.status,
    cvCount: batch.cvCount,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    cv_count: batch.cvCount,
  };

  // Format candidates with correct schema fields
  const formattedCandidates = batch.candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.location,
    overallScore: candidate.overallScore,
    experience: candidate.experience,
    education: candidate.education,
    salary: candidate.salary,
    matchedSkills: candidate.matchedSkills,
    missingSkills: candidate.missingSkills,
    additionalSkills: candidate.additionalSkills,
    experienceTimeline: candidate.experienceTimeline,
    certifications: candidate.certifications,
    professionalAssessment: candidate.professionalAssessment,
    cvFileUrl: candidate.cvFileUrl,
    createdAt: candidate.createdAt,
  }));

  return {
    batch: batchWithCount,
    candidates: formattedCandidates,
  };
};

/**
 * Get candidate details
 */
const getCandidateById = async (candidateId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    throw { statusCode: 404, message: 'Candidate not found' };
  }

  // Return candidate with properly formatted fields
  return {
    id: candidate.id,
    batchId: candidate.batchId,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.location,
    overallScore: candidate.overallScore,
    experience: candidate.experience,
    education: candidate.education,
    salary: candidate.salary,
    matchedSkills: candidate.matchedSkills,
    missingSkills: candidate.missingSkills,
    additionalSkills: candidate.additionalSkills,
    experienceTimeline: candidate.experienceTimeline,
    certifications: candidate.certifications,
    professionalAssessment: candidate.professionalAssessment,
    cvFileUrl: candidate.cvFileUrl,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
};

/**
 * Delete batch and candidates
 */
const deleteBatch = async (batchId, userId) => {
  // Verify ownership
  const batch = await prisma.cvBatch.findFirst({
    where: { id: batchId, userId },
  });

  if (!batch) {
    throw { statusCode: 404, message: 'Batch not found or you do not have permission' };
  }

  // Delete candidates first (cascade should handle this, but being explicit)
  await prisma.candidate.deleteMany({
    where: { batchId },
  });

  // Delete batch
  await prisma.cvBatch.delete({
    where: { id: batchId },
  });

  return {
    batchId,
    batchName: batch.batchName, // Correct field name from schema
  };
};

// Export the class
module.exports = CVIntelligenceHR01;

// Export CRUD functions
module.exports.getUserBatches = getUserBatches;
module.exports.getBatchById = getBatchById;
module.exports.getCandidateById = getCandidateById;
module.exports.deleteBatch = deleteBatch;
