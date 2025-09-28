import express from 'express'
import { asyncHandler } from '@/middleware/error-handler'
import { DocumentsController, upload } from '@/controllers/documents'

const router = express.Router()

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get documents with filtering and pagination
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by course ID
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by folder ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, filename, and content
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by document type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UPLOADING, PROCESSING, READY, ERROR]
 *         description: Filter by document status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of documents per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, fileSize, type]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *   post:
 *     summary: Upload new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Document title
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Document description
 *               courseId:
 *                 type: string
 *                 format: uuid
 *                 description: Associate with course
 *               folderId:
 *                 type: string
 *                 format: uuid
 *                 description: Place in folder
 *               extractText:
 *                 type: boolean
 *                 default: true
 *                 description: Extract text content
 *               generateSummary:
 *                 type: boolean
 *                 default: true
 *                 description: Generate AI summary
 *               extractKeywords:
 *                 type: boolean
 *                 default: true
 *                 description: Extract keywords
 *               detectLanguage:
 *                 type: boolean
 *                 default: true
 *                 description: Detect document language
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Validation error or file upload issue
 */
router.get('/', asyncHandler(DocumentsController.getDocuments))
router.post('/', upload.single('file'), asyncHandler(DocumentsController.uploadDocument))

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document details
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       404:
 *         description: Document not found
 *   put:
 *     summary: Update document metadata
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               folderId:
 *                 type: string
 *                 format: uuid
 *               courseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       404:
 *         description: Document not found
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
router.get('/:id', asyncHandler(DocumentsController.getDocument))
router.put('/:id', asyncHandler(DocumentsController.updateDocument))
router.delete('/:id', asyncHandler(DocumentsController.deleteDocument))

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download document file
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 */
router.get('/:id/download', asyncHandler(DocumentsController.downloadDocument))

/**
 * @swagger
 * /api/documents/folders:
 *   get:
 *     summary: Get document folders
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Folders retrieved successfully
 *   post:
 *     summary: Create document folder
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               color:
 *                 type: string
 *                 pattern: ^#[0-9A-F]{6}$
 *     responses:
 *       201:
 *         description: Folder created successfully
 */
router.get('/folders', asyncHandler(DocumentsController.getFolders))
router.post('/folders', asyncHandler(DocumentsController.createFolder))

/**
 * @swagger
 * /api/documents/tags:
 *   get:
 *     summary: Get document tags
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *   post:
 *     summary: Create document tag
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *               color:
 *                 type: string
 *                 pattern: ^#[0-9A-F]{6}$
 *     responses:
 *       201:
 *         description: Tag created successfully
 */
router.get('/tags', asyncHandler(DocumentsController.getTags))
router.post('/tags', asyncHandler(DocumentsController.createTag))

export default router