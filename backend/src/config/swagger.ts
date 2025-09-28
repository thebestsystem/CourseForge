import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CourseForge API',
      version: '1.0.0',
      description: 'AI-Powered Course Creation SaaS Platform API',
      contact: {
        name: 'CourseForge Team',
        email: 'support@courseforge.ai',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['STUDENT', 'EDUCATOR', 'ADMIN', 'SUPER_ADMIN'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            thumbnail: { type: 'string', nullable: true },
            authorId: { type: 'string' },
            organizationId: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] },
            visibility: { type: 'string', enum: ['PRIVATE', 'INTERNAL', 'PUBLIC'] },
            settings: { type: 'object' },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AIAgent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['ARCHITECT', 'RESEARCH', 'WRITING', 'EDITING', 'DESIGN', 'QUALITY', 'MARKETING'] },
            name: { type: 'string' },
            description: { type: 'string' },
            capabilities: { type: 'array', items: { type: 'string' } },
            systemPrompt: { type: 'string' },
            model: { type: 'string' },
            temperature: { type: 'number', minimum: 0, maximum: 2 },
            maxTokens: { type: 'integer', minimum: 1 },
            isEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            originalName: { type: 'string' },
            type: { type: 'string', enum: ['PDF', 'DOCX', 'DOC', 'TXT', 'MD', 'IMAGE', 'VIDEO', 'AUDIO'] },
            size: { type: 'integer' },
            mimeType: { type: 'string' },
            url: { type: 'string' },
            thumbnailUrl: { type: 'string', nullable: true },
            ownerId: { type: 'string' },
            courseId: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['UPLOADING', 'PROCESSING', 'READY', 'ERROR'] },
            metadata: { type: 'object' },
            content: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Courses',
        description: 'Course management endpoints',
      },
      {
        name: 'Documents',
        description: 'Document management endpoints',
      },
      {
        name: 'AI Agents',
        description: 'AI agent management and execution endpoints',
      },
      {
        name: 'Content',
        description: 'Content generation and management endpoints',
      },
      {
        name: 'Presentations',
        description: 'Presentation generation endpoints',
      },
      {
        name: 'Video Studio',
        description: 'Video creation and management endpoints',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints',
      },
      {
        name: 'Billing',
        description: 'Subscription and billing endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
}

const specs = swaggerJsdoc(options)

export const swaggerSetup = (app: Express): void => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #667eea }
    `,
    customSiteTitle: 'CourseForge API Documentation',
  }))

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })
}