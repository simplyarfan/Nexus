const CVIntelligenceHR01 = require('../../services/cvIntelligenceHR01');
const { createMockCVFile, createMockJDFile } = require('../helpers/testUtils');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 85,
                  assessment: 'Strong candidate with relevant experience',
                  strengths: ['Technical skills', 'Experience'],
                  gaps: ['Leadership experience'],
                }),
              },
            },
          ],
        }),
      },
    },
  }));
});

describe('CV Intelligence Service (HR-01)', () => {
  describe('Document Parsing', () => {
    it('should parse PDF document successfully', async () => {
      const mockBuffer = Buffer.from('Mock PDF content');
      const result = await CVIntelligenceHR01.parseDocument(mockBuffer, 'pdf');

      expect(result).toHaveProperty('rawText');
      expect(result).toHaveProperty('success');
    });

    it('should handle invalid file types', async () => {
      const mockBuffer = Buffer.from('Invalid content');
      const result = await CVIntelligenceHR01.parseDocument(mockBuffer, 'invalid');

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('Skill Matching', () => {
    it('should match skills using ChatGPT', async () => {
      const candidateData = {
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        experience: [{ title: 'Senior Developer', duration: '3 years' }],
      };

      const jdRequirements = {
        required_skills: ['JavaScript', 'React', 'TypeScript'],
        preferred_skills: ['Node.js', 'AWS'],
      };

      const result = await CVIntelligenceHR01.matchSkillsWithChatGPT(candidateData, jdRequirements);

      expect(result).toHaveProperty('matchedSkills');
      expect(result).toHaveProperty('missingSkills');
      expect(result).toHaveProperty('additionalSkills');
      expect(Array.isArray(result.matchedSkills)).toBe(true);
    });
  });

  describe('Role Assessment', () => {
    it('should assess candidate for role', async () => {
      const candidateData = {
        personal: { name: 'John Doe', email: 'john@example.com' },
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: [
          {
            title: 'Senior Developer',
            company: 'Tech Corp',
            duration: '3 years',
          },
        ],
      };

      const jdRequirements = {
        required_skills: ['JavaScript', 'React'],
        experience_required: '2+ years',
      };

      const result = await CVIntelligenceHR01.assessCandidateForRole(candidateData, jdRequirements);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('assessment');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('gaps');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Interview Questions Generation', () => {
    it('should generate interview questions based on CV', async () => {
      const cvText = 'Experienced software developer with 5 years in React and Node.js';
      const candidateData = {
        skills: ['React', 'Node.js'],
        experience: [{ title: 'Senior Developer' }],
      };
      const assessment = {
        score: 85,
        strengths: ['Technical skills'],
        gaps: ['Leadership'],
      };
      const jdRequirements = {
        required_skills: ['React', 'Node.js', 'Leadership'],
      };

      const result = await CVIntelligenceHR01.generateInterviewQuestions(
        cvText,
        candidateData,
        assessment,
        jdRequirements,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('question');
        expect(result[0]).toHaveProperty('category');
      }
    });
  });

  describe('Candidate Ranking', () => {
    it('should rank candidates intelligently', async () => {
      const candidates = [
        {
          id: '1',
          name: 'Candidate A',
          assessmentScore: 85,
          structuredData: { skills: ['React', 'Node.js'] },
        },
        {
          id: '2',
          name: 'Candidate B',
          assessmentScore: 75,
          structuredData: { skills: ['JavaScript'] },
        },
        {
          id: '3',
          name: 'Candidate C',
          assessmentScore: 95,
          structuredData: { skills: ['React', 'Node.js', 'TypeScript'] },
        },
      ];

      const jdRequirements = {
        required_skills: ['React', 'Node.js'],
      };

      const result = await CVIntelligenceHR01.rankCandidatesIntelligently(
        candidates,
        jdRequirements,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('rank');
      expect(result[0]).toHaveProperty('rankingReason');
      expect(result[0]).toHaveProperty('recommendationLevel');
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = CVIntelligenceHR01.generateId();
      const id2 = CVIntelligenceHR01.generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });
});
