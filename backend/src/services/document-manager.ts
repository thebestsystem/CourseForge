import { prisma } from '@/config/database'
import { logger } from '@/utils/logger'
import { aiEngine } from '@/services/ai-engine'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import pdf from 'pdf-parse'
import { createReadStream } from 'fs'

export interface DocumentProcessingOptions {
  extractText?: boolean
  generateSummary?: boolean
  extractKeywords?: boolean
  detectLanguage?: boolean
  generateThumbnail?: boolean
}

export interface DocumentUploadData {
  title: string
  description?: string
  filename: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  ownerId: string
  courseId?: string
  folderId?: string
}

export interface DocumentAnalysis {
  extractedText?: string
  summary?: string
  keywords?: string[]
  language?: string
  metadata?: Record<string, any>
  thumbnail?: string
}

export class DocumentManager {
  private readonly uploadDir: string
  private readonly maxFileSize: number
  private readonly allowedTypes: string[]

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads'
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB default
    this.allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,doc,txt,md,jpg,jpeg,png,gif,mp4,mp3,wav').split(',')
  }

  /**
   * Upload and process document
   */
  async uploadDocument(
    data: DocumentUploadData, 
    options: DocumentProcessingOptions = {}
  ) {
    const startTime = Date.now()

    try {
      // Validate file size
      if (data.fileSize > this.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`)
      }

      // Determine document type
      const documentType = this.getDocumentType(data.mimeType, data.filename)

      // Create document record
      const document = await prisma.document.create({
        data: {
          ...data,
          type: documentType,
          status: 'PROCESSING',
        },
      })

      logger.business('Document uploaded', { 
        documentId: document.id,
        type: documentType,
        size: data.fileSize 
      })

      // Process document in background
      this.processDocumentAsync(document.id, options)

      return document

    } catch (error) {
      logger.error('Document upload failed:', error)
      throw error
    }
  }

  /**
   * Process document (extract content, analyze, etc.)
   */
  private async processDocumentAsync(
    documentId: string, 
    options: DocumentProcessingOptions
  ) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      })

      if (!document) {
        throw new Error('Document not found')
      }

      const analysis = await this.analyzeDocument(document.filePath, document.type, options)

      // Update document with analysis results
      await prisma.document.update({
        where: { id: documentId },
        data: {
          extractedText: analysis.extractedText,
          summary: analysis.summary,
          keywords: analysis.keywords ? JSON.stringify(analysis.keywords) : null,
          language: analysis.language,
          metadata: analysis.metadata ? JSON.stringify(analysis.metadata) : null,
          status: 'READY',
        },
      })

      logger.business('Document processing completed', { 
        documentId,
        hasText: !!analysis.extractedText,
        hasSummary: !!analysis.summary,
        language: analysis.language
      })

    } catch (error) {
      logger.error('Document processing failed:', error)
      
      // Update document status to error
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'ERROR',
          processingError: error.message,
        },
      })
    }
  }

  /**
   * Analyze document content
   */
  private async analyzeDocument(
    filePath: string,
    documentType: string,
    options: DocumentProcessingOptions
  ): Promise<DocumentAnalysis> {
    const analysis: DocumentAnalysis = {}

    try {
      // Extract text based on document type
      if (options.extractText) {
        analysis.extractedText = await this.extractText(filePath, documentType)
      }

      // Generate AI-powered analysis if text was extracted
      if (analysis.extractedText && analysis.extractedText.length > 0) {
        if (options.generateSummary) {
          analysis.summary = await this.generateSummary(analysis.extractedText)
        }

        if (options.extractKeywords) {
          analysis.keywords = await this.extractKeywords(analysis.extractedText)
        }

        if (options.detectLanguage) {
          analysis.language = await this.detectLanguage(analysis.extractedText)
        }
      }

      // Generate metadata
      analysis.metadata = await this.extractMetadata(filePath, documentType)

      // Generate thumbnail for images
      if (options.generateThumbnail && this.isImageType(documentType)) {
        analysis.thumbnail = await this.generateThumbnail(filePath)
      }

    } catch (error) {
      logger.error('Document analysis failed:', error)
      throw error
    }

    return analysis
  }

  /**
   * Extract text from various document types
   */
  private async extractText(filePath: string, documentType: string): Promise<string> {
    try {
      switch (documentType.toLowerCase()) {
        case 'pdf':
          return await this.extractTextFromPDF(filePath)
        
        case 'txt':
        case 'md':
          return await this.extractTextFromPlainText(filePath)
        
        case 'docx':
        case 'doc':
          return await this.extractTextFromWord(filePath)
        
        default:
          logger.warn(`Text extraction not supported for type: ${documentType}`)
          return ''
      }
    } catch (error) {
      logger.error(`Text extraction failed for ${documentType}:`, error)
      return ''
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath)
      const data = await pdf(dataBuffer)
      return data.text
    } catch (error) {
      logger.error('PDF text extraction failed:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractTextFromPlainText(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      logger.error('Plain text extraction failed:', error)
      throw new Error('Failed to read text file')
    }
  }

  /**
   * Extract text from Word documents
   */
  private async extractTextFromWord(filePath: string): Promise<string> {
    // Note: This is a placeholder. In a real implementation, you would use
    // a library like 'mammoth' for DOCX or other tools for DOC files
    logger.warn('Word document text extraction not implemented yet')
    return ''
  }

  /**
   * Generate AI summary of document content
   */
  private async generateSummary(text: string): Promise<string> {
    try {
      const result = await aiEngine.executeAgent({
        agentType: 'WRITING',
        prompt: `Please provide a concise summary (2-3 paragraphs) of the following document content:\n\n${text.substring(0, 8000)}`,
        context: { 
          task: 'document_summarization',
          maxLength: '3 paragraphs' 
        },
        userId: 'system', // System-generated summary
      })

      return result.content
    } catch (error) {
      logger.error('AI summary generation failed:', error)
      return ''
    }
  }

  /**
   * Extract keywords using AI
   */
  private async extractKeywords(text: string): Promise<string[]> {
    try {
      const result = await aiEngine.executeAgent({
        agentType: 'RESEARCH',
        prompt: `Extract 10-15 relevant keywords and key phrases from the following text. Return them as a comma-separated list:\n\n${text.substring(0, 4000)}`,
        context: { 
          task: 'keyword_extraction',
          format: 'comma_separated' 
        },
        userId: 'system',
      })

      return result.content
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
        .slice(0, 15) // Limit to 15 keywords

    } catch (error) {
      logger.error('AI keyword extraction failed:', error)
      return []
    }
  }

  /**
   * Detect document language
   */
  private async detectLanguage(text: string): Promise<string> {
    try {
      // Simple language detection based on common words
      // In a real implementation, you might use a proper language detection library
      const sample = text.substring(0, 1000).toLowerCase()
      
      // Basic heuristics for common languages
      if (sample.includes(' the ') || sample.includes(' and ') || sample.includes(' is ')) {
        return 'en'
      }
      if (sample.includes(' de ') || sample.includes(' la ') || sample.includes(' el ')) {
        return 'es'
      }
      if (sample.includes(' le ') || sample.includes(' de ') || sample.includes(' et ')) {
        return 'fr'
      }
      
      return 'unknown'
    } catch (error) {
      logger.error('Language detection failed:', error)
      return 'unknown'
    }
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(filePath: string, documentType: string): Promise<Record<string, any>> {
    try {
      const stats = await fs.stat(filePath)
      const metadata: Record<string, any> = {
        fileSize: stats.size,
        createdTime: stats.birthtime,
        modifiedTime: stats.mtime,
        type: documentType,
      }

      // Add type-specific metadata
      if (this.isImageType(documentType)) {
        try {
          const imageMetadata = await sharp(filePath).metadata()
          metadata.width = imageMetadata.width
          metadata.height = imageMetadata.height
          metadata.format = imageMetadata.format
          metadata.density = imageMetadata.density
        } catch (error) {
          logger.warn('Failed to extract image metadata:', error)
        }
      }

      return metadata
    } catch (error) {
      logger.error('Metadata extraction failed:', error)
      return {}
    }
  }

  /**
   * Generate thumbnail for images
   */
  private async generateThumbnail(filePath: string): Promise<string> {
    try {
      const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1')
      
      await sharp(filePath)
        .resize(200, 200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath)

      return thumbnailPath
    } catch (error) {
      logger.error('Thumbnail generation failed:', error)
      return ''
    }
  }

  /**
   * Get documents for a user with filtering and pagination
   */
  async getDocuments(
    userId: string,
    options: {
      courseId?: string
      folderId?: string
      search?: string
      type?: string
      status?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    } = {}
  ) {
    const {
      courseId,
      folderId,
      search,
      type,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    const skip = (page - 1) * limit
    
    const where: any = { ownerId: userId }
    
    if (courseId) where.courseId = courseId
    if (folderId) where.folderId = folderId
    if (type) where.type = type
    if (status) where.status = status
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { filename: { contains: search } },
        { extractedText: { contains: search } },
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          course: {
            select: { title: true }
          },
          folder: {
            select: { name: true, color: true }
          },
          tags: {
            select: { name: true, color: true }
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ])

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Delete document and its associated files
   */
  async deleteDocument(documentId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: { 
        id: documentId, 
        ownerId: userId 
      }
    })

    if (!document) {
      throw new Error('Document not found or access denied')
    }

    try {
      // Delete physical files
      if (document.filePath) {
        await fs.unlink(document.filePath).catch(() => {
          logger.warn('Failed to delete file:', document.filePath)
        })
      }

      // Delete from database
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'DELETED' }
      })

      logger.business('Document deleted', { documentId, userId })

    } catch (error) {
      logger.error('Document deletion failed:', error)
      throw error
    }
  }

  /**
   * Helper methods
   */
  private getDocumentType(mimeType: string, filename: string): string {
    const ext = path.extname(filename).toLowerCase().substring(1)
    
    if (mimeType.startsWith('image/')) return 'IMAGE'
    if (mimeType.startsWith('video/')) return 'VIDEO'
    if (mimeType.startsWith('audio/')) return 'AUDIO'
    
    switch (ext) {
      case 'pdf': return 'PDF'
      case 'docx': case 'doc': return 'DOCX'
      case 'txt': return 'TXT'
      case 'md': return 'MD'
      default: return ext.toUpperCase() || 'UNKNOWN'
    }
  }

  private isImageType(documentType: string): boolean {
    return ['IMAGE', 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'].includes(documentType.toUpperCase())
  }
}

export const documentManager = new DocumentManager()