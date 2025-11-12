const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise AI Hub API',
      version: '1.0.1',
      description:
        'Production-ready backend API for Enterprise AI Hub with authentication, interview coordination, and advanced features',
      contact: {
        name: process.env.COMPANY_NAME || 'Your Company',
        email: process.env.SUPPORT_EMAIL || 'support@yourcompany.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL,
        description: 'API server (configure via BACKEND_URL environment variable)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Detailed error information',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user',
            },
            isVerified: {
              type: 'boolean',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login successful',
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        Interview: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            candidateName: {
              type: 'string',
              example: 'Jane Smith',
            },
            candidateEmail: {
              type: 'string',
              format: 'email',
              example: 'jane@example.com',
            },
            position: {
              type: 'string',
              example: 'Software Engineer',
            },
            interviewDateTime: {
              type: 'string',
              format: 'date-time',
            },
            duration: {
              type: 'integer',
              example: 60,
              description: 'Duration in minutes',
            },
            meetingLink: {
              type: 'string',
              example: 'https://meet.google.com/abc-defg-hij',
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
              example: 'scheduled',
            },
            notes: {
              type: 'string',
              example: 'Technical interview for backend position',
            },
            scheduledBy: {
              type: 'integer',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1,
            },
            pageSize: {
              type: 'integer',
              example: 20,
            },
            totalItems: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            hasPreviousPage: {
              type: 'boolean',
              example: false,
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            status: {
              type: 'string',
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            uptime: {
              type: 'string',
              example: '3600s',
            },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'healthy',
                    },
                    latency: {
                      type: 'number',
                      example: 45,
                    },
                  },
                },
              },
            },
            system: {
              type: 'object',
              properties: {
                node: {
                  type: 'string',
                  example: 'v18.0.0',
                },
                platform: {
                  type: 'string',
                  example: 'linux',
                },
                memory: {
                  type: 'object',
                  properties: {
                    used: {
                      type: 'string',
                      example: '128MB',
                    },
                    total: {
                      type: 'string',
                      example: '256MB',
                    },
                  },
                },
              },
            },
            responseTime: {
              type: 'string',
              example: '5ms',
            },
          },
        },
        Candidate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'candidate_123',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            location: {
              type: 'string',
              example: 'New York, NY',
            },
            rank: {
              type: 'integer',
              example: 1,
            },
            rankingReason: {
              type: 'string',
              example: 'Strong technical skills matching the job requirements',
            },
            recommendationLevel: {
              type: 'string',
              enum: ['Strong Yes', 'Yes', 'Maybe', 'No'],
              example: 'Strong Yes',
            },
            matchedSkills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['JavaScript', 'React', 'Node.js'],
            },
            missingSkills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Python', 'Docker'],
            },
            assessment: {
              type: 'object',
              properties: {
                overallFit: {
                  type: 'number',
                  example: 85,
                },
                recommendation: {
                  type: 'string',
                  example: 'Strong Yes',
                },
              },
            },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            user_id: {
              type: 'integer',
              example: 1,
            },
            subject: {
              type: 'string',
              example: 'Unable to upload CV files',
            },
            description: {
              type: 'string',
              example: 'I am getting an error when trying to upload PDF files',
            },
            status: {
              type: 'string',
              enum: ['open', 'in_progress', 'resolved', 'closed'],
              example: 'open',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'high',
            },
            category: {
              type: 'string',
              example: 'Technical Issue',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TicketComment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            ticket_id: {
              type: 'integer',
              example: 1,
            },
            user_id: {
              type: 'integer',
              example: 1,
            },
            comment: {
              type: 'string',
              example: 'I have the same issue with files larger than 5MB',
            },
            is_internal: {
              type: 'boolean',
              example: false,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            role: {
              type: 'string',
              example: 'user',
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required or invalid token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Forbidden: {
          description: 'Access forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        BadRequest: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'CV Intelligence',
        description: 'AI-powered CV analysis and candidate ranking endpoints',
      },
      {
        name: 'Interview Coordinator',
        description: 'Interview scheduling and management endpoints',
      },
      {
        name: 'Support Tickets',
        description: 'Support ticket management and communication endpoints',
      },
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
    ],
  },
  apis: ['./routes/*.js', './api/*.js', './controllers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
