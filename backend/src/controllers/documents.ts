import { Request, Response } from 'express'
import { documentManager } from '@/services/document-manager'
import { prisma } from '@/config/database'
import { logger } from '@/utils/logger'
import multer from 'multer'
import path from 'path'
import { z } from 'zod'
import fs from 'fs/promises'

// Validation schemas
const uploadDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  courseId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  extractText: z.boolean().optional().default(true),
  generateSummary: z.boolean().optional().default(true),
  extractKeywords: z.boolean().optional().default(true),
  detectLanguage: z.boolean().optional().default(true),
})

const getDocumentsSchema = z.object({
  courseId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  type: z.string().optional(),
  status: z.enum(['UPLOADING', 'PROCESSING', 'READY', 'ERROR']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional(),
  sortBy: z.enum(['createdAt', 'title', 'fileSize', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  parentId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
})

const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
})

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error, uploadDir)
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'pdf', 'docx', 'doc', 'txt', 'md', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav'
  ]
  
  const ext = path.extname(file.originalname).toLowerCase().substring(1)
  if (allowedTypes.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`File type .${ext} is not allowed`))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
  }
})

export class DocumentsController {
  /**
   * Upload new document
   */
  static async uploadDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        })
      }

      // Validate request body
      const validatedData = uploadDocumentSchema.parse(req.body)

      // Prepare document data
      const documentData = {
        title: validatedData.title,
        description: validatedData.description,
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        ownerId: userId,
        courseId: validatedData.courseId,
        folderId: validatedData.folderId,
      }

      // Processing options
      const processingOptions = {
        extractText: validatedData.extractText,
        generateSummary: validatedData.generateSummary,
        extractKeywords: validatedData.extractKeywords,
        detectLanguage: validatedData.detectLanguage,
        generateThumbnail: true,
      }

      // Upload and process document
      const document = await documentManager.uploadDocument(documentData, processingOptions)

      logger.api(req.originalUrl, userId, 'document_uploaded')

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document,
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Document upload failed:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get documents with filtering and pagination
   */
  static async getDocuments(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const validatedQuery = getDocumentsSchema.parse(req.query)

      const result = await documentManager.getDocuments(userId, validatedQuery)

      res.json({
        success: true,
        message: 'Documents retrieved successfully',
        data: result,
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error retrieving documents:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get specific document details
   */
  static async getDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { id } = req.params

      const document = await prisma.document.findFirst({
        where: {
          id,
          ownerId: userId,
        },
        include: {
          course: {
            select: { id: true, title: true }
          },
          folder: {
            select: { id: true, name: true, color: true }
          },
          tags: {
            select: { id: true, name: true, color: true }
          },
        },
      })

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        })
      }

      // Update last accessed time
      await prisma.document.update({
        where: { id },
        data: { lastAccessedAt: new Date() }
      })

      res.json({
        success: true,
        message: 'Document retrieved successfully',
        data: document,
      })

    } catch (error) {
      logger.error('Error retrieving document:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { id } = req.params
      const { title, description, folderId, courseId } = req.body

      const document = await prisma.document.findFirst({
        where: { 
          id, 
          ownerId: userId 
        }
      })

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        })
      }

      const updatedDocument = await prisma.document.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(folderId !== undefined && { folderId }),
          ...(courseId !== undefined && { courseId }),
        },
        include: {
          course: {
            select: { id: true, title: true }
          },
          folder: {
            select: { id: true, name: true, color: true }
          },
        },
      })

      logger.api(req.originalUrl, userId, 'document_updated')

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: updatedDocument,
      })

    } catch (error) {
      logger.error('Error updating document:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { id } = req.params

      await documentManager.deleteDocument(id, userId)

      logger.api(req.originalUrl, userId, 'document_deleted')

      res.json({
        success: true,
        message: 'Document deleted successfully',
      })

    } catch (error) {
      logger.error('Error deleting document:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Download document
   */
  static async downloadDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const { id } = req.params

      const document = await prisma.document.findFirst({
        where: {
          id,
          ownerId: userId,
          status: 'READY',
        }
      })

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or not ready',
        })
      }

      // Update download count
      await prisma.document.update({
        where: { id },
        data: { 
          downloadCount: { increment: 1 },
          lastAccessedAt: new Date()
        }
      })

      // Send file
      res.download(document.filePath, document.originalName)

      logger.api(req.originalUrl, userId, 'document_downloaded')

    } catch (error) {
      logger.error('Error downloading document:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Create document folder
   */
  static async createFolder(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const validatedData = createFolderSchema.parse(req.body)

      const folder = await prisma.documentFolder.create({
        data: {
          ...validatedData,
          ownerId: userId,
        }
      })

      logger.api(req.originalUrl, userId, 'folder_created')

      res.status(201).json({
        success: true,
        message: 'Folder created successfully',
        data: folder,
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error creating folder:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create folder',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get document folders
   */
  static async getFolders(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const folders = await prisma.documentFolder.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: { documents: true, children: true }
          }
        },
        orderBy: { name: 'asc' }
      })

      res.json({
        success: true,
        message: 'Folders retrieved successfully',
        data: folders,
      })

    } catch (error) {
      logger.error('Error retrieving folders:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve folders',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Create document tag
   */
  static async createTag(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const validatedData = createTagSchema.parse(req.body)

      const tag = await prisma.documentTag.create({
        data: {
          ...validatedData,
          ownerId: userId,
        }
      })

      logger.api(req.originalUrl, userId, 'tag_created')

      res.status(201).json({
        success: true,
        message: 'Tag created successfully',
        data: tag,
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      logger.error('Error creating tag:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create tag',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * Get document tags
   */
  static async getTags(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const tags = await prisma.documentTag.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: { documents: true }
          }
        },
        orderBy: { name: 'asc' }
      })

      res.json({
        success: true,
        message: 'Tags retrieved successfully',
        data: tags,
      })

    } catch (error) {
      logger.error('Error retrieving tags:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tags',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
}