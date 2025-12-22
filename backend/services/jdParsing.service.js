const Groq = require('groq-sdk');
const pdf = require('pdf-parse');
const { extractText: extractTextUnpdf } = require('unpdf');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');
const fs = require('fs').promises;

/**
 * JD PARSING SERVICE
 * Extracts job details from Job Description documents (PDF/DOCX) using AI
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class JDParsingService {
  /**
   * Extract text from PDF file (supports both file path and buffer)
   * @param {string|Buffer} filePathOrBuffer - File path or buffer
   */
  async extractTextFromPDF(filePathOrBuffer) {
    try {
      let dataBuffer;

      // Check if input is a buffer or file path
      if (Buffer.isBuffer(filePathOrBuffer)) {
        dataBuffer = filePathOrBuffer;
        console.log(`  📄 Reading PDF from buffer (${dataBuffer.length} bytes)`);
      } else {
        console.log(`  📄 Reading PDF from: ${filePathOrBuffer}`);

        // Check if file exists
        const stats = await fs.stat(filePathOrBuffer);
        console.log(`  📊 File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

        if (stats.size === 0) {
          throw new Error('PDF file is empty (0 bytes)');
        }

        if (stats.size > 10 * 1024 * 1024) {
          throw new Error('PDF file is too large (maximum 10MB)');
        }

        // Read file buffer
        dataBuffer = await fs.readFile(filePathOrBuffer);
      }

      console.log(`  ✓ File buffer read successfully (${dataBuffer.length} bytes)`);

      if (dataBuffer.length === 0) {
        throw new Error('PDF file is empty (0 bytes)');
      }

      if (dataBuffer.length > 10 * 1024 * 1024) {
        throw new Error('PDF file is too large (maximum 10MB)');
      }

      // Parse PDF with error handling for corrupted files
      // Try pdf-parse first, fall back to unpdf if it fails
      let text;
      try {
        const data = await pdf(dataBuffer);
        text = data.text;
        console.log(
          `  ✓ PDF parsed (pdf-parse) - Pages: ${data.numpages}, Text length: ${text?.length || 0} chars`,
        );
      } catch (pdfError) {
        console.log('  ⚠️ pdf-parse failed, trying unpdf fallback...', pdfError.message);

        // Try unpdf as fallback (handles more PDF formats)
        try {
          const uint8Array = new Uint8Array(dataBuffer);
          const result = await extractTextUnpdf(uint8Array);
          // unpdf returns { text: string[] } - join array into single string
          text = Array.isArray(result.text) ? result.text.join('\n') : result.text;
          console.log(
            `  ✓ PDF parsed (unpdf fallback) - Pages: ${result.totalPages}, Text length: ${text?.length || 0} chars`,
          );
        } catch (unpdfError) {
          console.error('  ❌ Both PDF parsers failed');
          throw new Error(
            'PDF_CORRUPTED: This PDF file could not be parsed. Please try: (1) Re-saving the PDF from the original source, (2) Using a different PDF file, or (3) Converting to DOCX format.',
          );
        }
      }

      if (!text || text.trim().length === 0) {
        throw new Error(
          'PDF contains no extractable text. The PDF may be image-based or encrypted.',
        );
      }

      return text;
    } catch (error) {
      console.error('❌ Error extracting text from PDF:', error.message);
      console.error('   Stack:', error.stack);

      // Provide more specific error messages
      if (error.message.includes('ENOENT')) {
        throw new Error('PDF file not found at specified path');
      } else if (error.message.includes('0 bytes')) {
        throw new Error('PDF file is empty');
      } else if (error.message.includes('image-based')) {
        throw new Error('PDF appears to be image-based. Please use a PDF with selectable text.');
      } else if (error.message.includes('PDF_CORRUPTED')) {
        // Re-throw with user-friendly message (remove the prefix)
        throw new Error(error.message.replace('PDF_CORRUPTED: ', ''));
      } else {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from DOCX file (supports both file path and buffer)
   * @param {string|Buffer} filePathOrBuffer - File path or buffer
   */
  async extractTextFromDOCX(filePathOrBuffer) {
    try {
      let buffer;

      // Check if input is a buffer or file path
      if (Buffer.isBuffer(filePathOrBuffer)) {
        buffer = filePathOrBuffer;
        console.log(`  📄 Reading DOCX from buffer (${buffer.length} bytes)`);
      } else {
        console.log(`  📄 Reading DOCX from: ${filePathOrBuffer}`);

        // Check if file exists
        const stats = await fs.stat(filePathOrBuffer);
        console.log(`  📊 File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

        if (stats.size === 0) {
          throw new Error('DOCX file is empty (0 bytes)');
        }

        if (stats.size > 10 * 1024 * 1024) {
          throw new Error('DOCX file is too large (maximum 10MB)');
        }

        // Read file buffer
        buffer = await fs.readFile(filePathOrBuffer);
      }

      console.log(`  ✓ File buffer read successfully (${buffer.length} bytes)`);

      if (buffer.length === 0) {
        throw new Error('DOCX file is empty (0 bytes)');
      }

      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('DOCX file is too large (maximum 10MB)');
      }

      // Extract text using mammoth
      const result = await mammoth.extractRawText({ buffer });

      console.log(`  ✓ DOCX parsed - Text length: ${result.value?.length || 0} chars`);

      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX contains no extractable text');
      }

      return result.value;
    } catch (error) {
      console.error('❌ Error extracting text from DOCX:', error.message);
      console.error('   Stack:', error.stack);

      // Provide more specific error messages
      if (error.message.includes('ENOENT')) {
        throw new Error('DOCX file not found at specified path');
      } else if (error.message.includes('0 bytes')) {
        throw new Error('DOCX file is empty');
      } else {
        throw new Error(`Failed to extract text from DOCX: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from DOC file (older binary format)
   * Note: word-extractor requires a file path, so we write buffer to temp file if needed
   * @param {string|Buffer} filePathOrBuffer - File path or buffer
   */
  async extractTextFromDOC(filePathOrBuffer) {
    try {
      let filePath;
      let tempFile = false;

      // Check if input is a buffer or file path
      if (Buffer.isBuffer(filePathOrBuffer)) {
        // word-extractor doesn't support buffers directly, write to temp file
        const os = require('os');
        const path = require('path');
        filePath = path.join(os.tmpdir(), `temp_doc_${Date.now()}.doc`);
        await fs.writeFile(filePath, filePathOrBuffer);
        tempFile = true;
        console.log(`  📄 Reading DOC from buffer (written to temp: ${filePath})`);
      } else {
        filePath = filePathOrBuffer;
        console.log(`  📄 Reading DOC from: ${filePath}`);

        // Check if file exists
        const stats = await fs.stat(filePath);
        console.log(`  📊 File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

        if (stats.size === 0) {
          throw new Error('DOC file is empty (0 bytes)');
        }

        if (stats.size > 10 * 1024 * 1024) {
          throw new Error('DOC file is too large (maximum 10MB)');
        }
      }

      // Extract text using word-extractor
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(filePath);
      const text = extracted.getBody() || '';

      // Clean up temp file if created
      if (tempFile) {
        try {
          await fs.unlink(filePath);
        } catch (unlinkErr) {
          console.warn(`  ⚠️ Failed to delete temp file: ${filePath}`);
        }
      }

      console.log(`  ✓ DOC parsed - Text length: ${text?.length || 0} chars`);

      if (!text || text.trim().length === 0) {
        throw new Error('DOC contains no extractable text');
      }

      return text;
    } catch (error) {
      console.error('❌ Error extracting text from DOC:', error.message);
      console.error('   Stack:', error.stack);

      // Provide more specific error messages
      if (error.message.includes('ENOENT')) {
        throw new Error('DOC file not found at specified path');
      } else if (error.message.includes('0 bytes')) {
        throw new Error('DOC file is empty');
      } else {
        throw new Error(`Failed to extract text from DOC: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from TXT file (supports both file path and buffer)
   * @param {string|Buffer} filePathOrBuffer - File path or buffer
   */
  async extractTextFromTXT(filePathOrBuffer) {
    try {
      let text;

      // Check if input is a buffer or file path
      if (Buffer.isBuffer(filePathOrBuffer)) {
        text = filePathOrBuffer.toString('utf-8');
        console.log(`  📄 Reading TXT from buffer (${filePathOrBuffer.length} bytes)`);
      } else {
        console.log(`  📄 Reading TXT from: ${filePathOrBuffer}`);

        // Check if file exists
        const stats = await fs.stat(filePathOrBuffer);
        console.log(`  📊 File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

        if (stats.size === 0) {
          throw new Error('TXT file is empty (0 bytes)');
        }

        if (stats.size > 10 * 1024 * 1024) {
          throw new Error('TXT file is too large (maximum 10MB)');
        }

        // Read file
        text = await fs.readFile(filePathOrBuffer, 'utf-8');
      }

      console.log(`  ✓ TXT parsed - Text length: ${text?.length || 0} chars`);

      if (!text || text.trim().length === 0) {
        throw new Error('TXT file is empty or contains no readable text');
      }

      return text;
    } catch (error) {
      console.error('❌ Error extracting text from TXT:', error.message);

      if (error.message.includes('ENOENT')) {
        throw new Error('TXT file not found at specified path');
      } else if (error.message.includes('0 bytes')) {
        throw new Error('TXT file is empty');
      } else {
        throw new Error(`Failed to extract text from TXT: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from JD file based on file type (supports both file path and buffer)
   * @param {string|Buffer} filePathOrBuffer - File path or buffer
   * @param {string} mimeType - MIME type of the file
   */
  async extractTextFromJD(filePathOrBuffer, mimeType) {
    if (mimeType === 'application/pdf') {
      return await this.extractTextFromPDF(filePathOrBuffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // .docx files
      return await this.extractTextFromDOCX(filePathOrBuffer);
    } else if (mimeType === 'application/msword') {
      // .doc files (older binary format)
      return await this.extractTextFromDOC(filePathOrBuffer);
    } else if (mimeType === 'text/plain') {
      // .txt files
      return await this.extractTextFromTXT(filePathOrBuffer);
    } else {
      throw new Error('Unsupported file type. Only PDF, DOCX, DOC, and TXT are supported.');
    }
  }

  /**
   * Parse JD text using AI to extract structured job details
   */
  async parseJDWithAI(jdText) {
    const prompt = `You are an expert HR recruiter. Extract structured job details from this Job Description.

JOB DESCRIPTION:
${jdText}

Extract the following information and return ONLY a JSON object (no markdown, no code blocks):
{
  "title": "Job title",
  "department": "Department name (e.g., Engineering, Product, Design, Marketing, Sales, HR, Finance, Operations, Analytics)",
  "location": "Job location",
  "employment_type": "full-time | part-time | contract | internship",
  "experience_level": "entry | mid | senior | lead | executive",
  "remote_policy": "onsite | hybrid | remote",
  "salary_range_min": number (or null if not specified),
  "salary_range_max": number (or null if not specified),
  "currency": "USD | EUR | GBP | etc (or null)",
  "description": "Brief 2-3 sentence summary of the role",
  "requirements": ["requirement 1", "requirement 2", ...],
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "required_skills": ["skill 1", "skill 2", ...],
  "preferred_skills": ["skill 1", "skill 2", ...],
  "benefits": ["benefit 1", "benefit 2", ...],
  "openings_count": number (default to 1 if not specified)
}

CRITICAL GUIDELINES FOR SKILLS:
- Extract INDIVIDUAL SKILLS as clean, searchable keywords - NOT full sentences
- Break down compound skills into separate items
- Use concise skill names that can be matched across candidates
- DO NOT include phrases like "Strong understanding of", "Excellent", "Experience with", "Proven", "Deep knowledge"

Examples for SCRUM MASTER position:
  ❌ WRONG: "Strong understanding of Agile frameworks (Scrum, Kanban, SAFe)"
  ✅ CORRECT: ["Scrum", "Kanban", "SAFe", "Agile Methodologies"]

  ❌ WRONG: "Excellent facilitation, coaching, and conflict-resolution skills"
  ✅ CORRECT: ["Facilitation", "Coaching", "Conflict Resolution", "Team Leadership"]

  ❌ WRONG: "Experience with Agile tools such as Jira and Azure DevOps"
  ✅ CORRECT: ["Jira", "Azure DevOps", "Agile Tools"]

Examples for SOFTWARE ENGINEER position:
  ❌ WRONG: "Proficiency in React, Node.js, and modern JavaScript frameworks"
  ✅ CORRECT: ["React.js", "Node.js", "JavaScript", "ES6+", "Frontend Development"]

  ❌ WRONG: "Strong knowledge of RESTful APIs and microservices architecture"
  ✅ CORRECT: ["REST API", "Microservices", "API Design", "Backend Development"]

Examples for PRODUCT MANAGER position:
  ❌ WRONG: "Proven track record in product strategy and roadmap planning"
  ✅ CORRECT: ["Product Strategy", "Roadmap Planning", "Product Management", "Stakeholder Management"]

  ❌ WRONG: "Experience with data analysis tools like SQL and Tableau"
  ✅ CORRECT: ["SQL", "Tableau", "Data Analysis", "Business Intelligence"]

Examples for DATA SCIENTIST position:
  ❌ WRONG: "Deep expertise in machine learning and statistical modeling"
  ✅ CORRECT: ["Machine Learning", "Statistical Modeling", "Python", "Data Science"]

  ❌ WRONG: "Hands-on experience with TensorFlow, PyTorch, and scikit-learn"
  ✅ CORRECT: ["TensorFlow", "PyTorch", "scikit-learn", "Deep Learning"]

Other Guidelines:
- Extract exact information from the JD
- If salary is not specified, set both min/max to null
- Group requirements into clear, concise bullet points
- Separate must-have skills (required_skills) from nice-to-have (preferred_skills)
- If benefits are mentioned, extract them; otherwise return empty array
- Infer department, experience level, and employment type if not explicitly stated`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content || '{}';

      // Clean response (remove markdown code blocks if present)
      let cleanedResponse = response
        .replace(/```json\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanedResponse);

      // Validate required fields
      if (!parsedData.title || !parsedData.department) {
        throw new Error('Failed to extract required fields (title, department) from JD');
      }

      // Log extracted skills for debugging
      console.log(`  📊 Extracted Skills:`);
      console.log(
        `     Required Skills: ${parsedData.required_skills?.length || 0} skills -`,
        parsedData.required_skills,
      );
      console.log(
        `     Preferred Skills: ${parsedData.preferred_skills?.length || 0} skills -`,
        parsedData.preferred_skills,
      );

      return parsedData;
    } catch (error) {
      console.error('Error parsing JD with AI:', error);
      throw new Error('Failed to parse job description with AI: ' + error.message);
    }
  }

  /**
   * Main function: Parse JD file and return structured job details
   * Supports both disk storage (file.path) and memory storage (file.buffer)
   * @param {Object} file - Multer file object
   */
  async parseJDFile(file) {
    try {
      console.log(`\n📄 Parsing JD file: ${file.originalname}`);

      // Determine if we're using disk storage or memory storage
      // Memory storage provides file.buffer, disk storage provides file.path
      const fileSource = file.buffer || file.path;

      if (!fileSource) {
        throw new Error('No file data available. File must have either buffer or path.');
      }

      console.log(`  📦 File source: ${file.buffer ? 'memory (buffer)' : 'disk (path)'}`);
      console.log(`  📊 Size: ${file.buffer ? file.buffer.length : 'unknown'} bytes`);

      // Step 1: Extract text from file (now supports both buffer and path)
      const jdText = await this.extractTextFromJD(fileSource, file.mimetype);

      if (!jdText || jdText.trim().length < 100) {
        throw new Error('Insufficient text extracted from JD. File may be empty or corrupted.');
      }

      console.log(`  ✓ Extracted ${jdText.length} characters from JD`);

      // Step 2: Parse JD with AI
      const jobDetails = await this.parseJDWithAI(jdText);

      console.log(`  ✓ Successfully parsed job details for: ${jobDetails.title}`);

      return {
        success: true,
        jobDetails,
        extractedText: jdText.substring(0, 500), // Return first 500 chars for reference
      };
    } catch (error) {
      console.error('Error in parseJDFile:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse JD from buffer directly (for memory storage usage)
   * @param {Buffer} buffer - File buffer
   * @param {string} originalname - Original filename
   * @param {string} mimetype - MIME type
   */
  async parseJDFromBuffer(buffer, originalname, mimetype) {
    return await this.parseJDFile({
      buffer,
      originalname,
      mimetype,
    });
  }
}

module.exports = new JDParsingService();
