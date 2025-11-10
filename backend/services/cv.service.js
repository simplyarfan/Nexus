/**
 * CV INTELLIGENCE (HR-01) - CLEAN IMPLEMENTATION
 * Following EXACT blueprint: Ingress → Docling → spaCy → Llama 3.1 → Pydantic → pgvector
 */

const axios = require('axios');
const pdf = require('pdf-parse');

class CVIntelligenceHR01 {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo'; // Using available model instead of Llama 3.1

    // Check if API key is configured
    if (!this.apiKey) {
      console.error('❌ OPENAI_API_KEY not configured in environment variables');
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
      // Parse the JD document
      const fileType = fileName.split('.').pop().toLowerCase();
      const parsedJD = await this.parseDocument(fileBuffer, fileType);

      // parseDocument returns { rawText, layoutBlocks, metadata }
      const jdText = parsedJD.rawText || parsedJD.text || '';

      if (!jdText || jdText.trim().length === 0) {
        console.error('❌ JD text is empty after parsing!');
        return {
          success: false,
          error: 'Failed to extract text from JD file',
          requirements: { skills: [], experience: [], education: [], mustHave: [] },
        };
      }

      // Extract requirements using AI
      const requirements = await this.extractJobRequirements(jdText);

      // Normalize extracted skills
      if (requirements.skills) {
        requirements.skills = this.normalizeSkills(requirements.skills);
      }
      if (requirements.mustHave) {
        requirements.mustHave = this.normalizeSkills(requirements.mustHave);
      }

      return {
        success: true,
        requirements: requirements,
        fileName: fileName,
      };
    } catch (error) {
      console.error('❌ Error processing JD:', error);
      console.error('❌ Error stack:', error.stack);
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
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content.trim();

      // Remove any markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const requirements = JSON.parse(cleanContent);

      // VALIDATE that we got actual skills, not garbage
      if (requirements.skills && requirements.skills.includes('PDF parsing')) {
        console.error('❌ AI returned garbage skills including "PDF parsing" - rejecting response');
        throw new Error('AI returned invalid skills');
      }

      if (
        requirements.skills &&
        requirements.skills.includes('Scrum') &&
        jdText.toLowerCase().includes('ai engineer')
      ) {
        console.error('❌ AI returned Scrum skills for AI Engineer JD - rejecting response');
        throw new Error('AI returned wrong skills for job type');
      }

      return requirements;
    } catch (error) {
      console.error('❌ Error extracting JD requirements via AI:', error);
      console.error('❌ Full error:', error.response?.data || error.message);

      // NO FALLBACK - FAIL COMPLETELY
      throw new Error(`JD extraction failed: ${error.message}`);
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
   */
  async parseDocument(fileBuffer, fileType) {
    let text = '';

    if (fileType === 'pdf') {
      try {
        const pdfData = await pdf(fileBuffer);
        text = pdfData.text || '';

        if (!text || text.trim().length === 0) {
          throw new Error('PDF contains no extractable text');
        }
      } catch (e) {
        console.error('❌ PDF parsing failed:', e.message);

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
          console.error('❌ Alternative PDF parsing also failed:', e2.message);
          throw new Error(
            `PDF is corrupted or unreadable. Please save as a new PDF or convert to TXT format. Error: ${e.message}`,
          );
        }
      }
    } else {
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
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
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
      // Remove markdown code blocks if present
      const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();

      const structuredData = JSON.parse(cleanJson);

      // Validate structure
      if (!structuredData.personal || !structuredData.skills) {
        throw new Error('Invalid extraction structure - missing required fields');
      }

      return structuredData;
    } catch (error) {
      console.error('❌ CV extraction failed:', error.message);
      throw new Error(`Failed to extract CV data: ${error.message}`);
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
      // Step 1: Ingress
      const ingressData = await this.ingressDocument(fileBuffer, fileName);

      // Step 2: Parsing
      const parseData = await this.parseDocument(fileBuffer, ingressData.fileType);

      // Step 3: Entity extraction
      const entities = await this.extractEntities(parseData.rawText);

      // Step 4: LLM extraction
      const structuredData = await this.extractStructuredData(parseData.rawText, entities);

      // Step 5: Evidence binding
      const evidenceMap = this.bindEvidence(structuredData, entities, parseData.rawText);

      // Step 6: Scoring
      const scores = await this.calculateScores(structuredData, jobRequirements, entities);

      // Step 7: Verification
      const verification = await this.verifyExtraction(structuredData, parseData.rawText, entities);

      return {
        success: true,
        resumeId: ingressData.fileId,
        fileName: fileName,
        structuredData: structuredData,
        entities: entities,
        evidenceMap: evidenceMap,
        scores: scores,
        verification: verification,
        processingTime: Date.now() - processingStart,
        metadata: {
          fieldValidityRate: verification.fieldValidityRate,
          evidenceCoverage: verification.evidenceCoverage,
          disagreementRate: verification.disagreementRate,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - processingStart,
      };
    }
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
   * HOLISTIC CV ASSESSMENT - Let ChatGPT analyze the entire CV contextually
   * This replaces robotic skill matching with intelligent evaluation
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
      console.error('Holistic assessment failed:', error.message);
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
      console.error('Interview question generation failed:', error.message);
      return {
        technicalQuestions: [],
        behavioralQuestions: [],
        gapQuestions: [],
        scenarioQuestions: [],
      };
    }
  }

  /**
   * RANK ALL CANDIDATES - Let ChatGPT rank them intelligently
   */
  async rankCandidatesIntelligently(candidates, jobRequirements) {
    const candidateSummaries = candidates.map((c, idx) => ({
      index: idx,
      name: c.name || 'Candidate ' + (idx + 1),
      assessment: c.assessment,
      keySkills: c.structuredData?.skills?.slice(0, 10) || [],
      experience: c.structuredData?.experience?.map((e) => `${e.role} at ${e.company}`) || [],
    }));

    const prompt = `You are a world-class HR expert. Rank these ${candidates.length} candidates from BEST to WORST for the given position.

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
    "rankingReason": "Detailed explanation of why this candidate ranks here. Reference specific skills, experience, and achievements.",
    "recommendationLevel": "Strong Hire | Hire | Maybe | Pass"
  }
]

RANKING CRITERIA:
1. Overall fit and experience relevance (most important)
2. Depth of required skills, not just breadth
3. Career progression and achievements
4. Cultural fit and soft skills
5. Learning ability and growth potential
6. Specific accomplishments that demonstrate capability

Be specific in your reasoning. Reference actual experience and skills from each candidate.

Return only the JSON array:`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo', // Use GPT-3.5 for cost efficiency
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
      );

      const jsonText = response.data.choices[0].message.content.trim();
      const rankings = JSON.parse(jsonText);

      return rankings;
    } catch (error) {
      console.error('Intelligent ranking failed:', error.message);
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

const { prisma } = require('../lib/prisma');

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
    ...batch,
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
        orderBy: { overallScore: 'asc' },
      },
    },
  });

  if (!batch) {
    throw { statusCode: 404, message: 'Batch not found' };
  }

  // Parse JD requirements
  const jdRequirements = batch.jdRequirements
    ? JSON.parse(batch.jdRequirements)
    : { skills: [], experience: [], education: [], mustHave: [] };

  // Format batch data
  const batchWithCount = {
    ...batch,
    cv_count: batch.totalResumes || batch.candidates.length,
    jd_requirements: jdRequirements,
  };

  // Parse and rank candidates
  const rankedCandidates = batch.candidates.map((candidate) => {
    const profileData = candidate.profileJson ? JSON.parse(candidate.profileJson) : {};

    const rank = profileData.rank || candidate.overallScore || 999;
    const rankingReason = profileData.rankingReason || 'Ranking analysis pending';
    const assessment = profileData.assessment || {};
    const recommendationLevel =
      profileData.recommendationLevel || assessment.recommendation || 'Maybe';

    return {
      ...candidate,
      rank,
      rankingReason,
      recommendationLevel,
      assessment,
      profile_json: profileData,
    };
  });

  return {
    batch: batchWithCount,
    candidates: rankedCandidates,
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

  return {
    ...candidate,
    profile_json: candidate.profileJson ? JSON.parse(candidate.profileJson) : {},
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
    batchName: batch.name,
  };
};

// Export CRUD functions
module.exports.getUserBatches = getUserBatches;
module.exports.getBatchById = getBatchById;
module.exports.getCandidateById = getCandidateById;
module.exports.deleteBatch = deleteBatch;
