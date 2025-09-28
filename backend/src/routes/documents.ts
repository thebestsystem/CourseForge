import { Router } from 'express';
import {
  getDocuments,
  getDocument,
  uploadDocument,
  deleteDocument,
  extractContent,
  analyzeDocument,
  bulkAnalyze,
  getDocumentStats,
  upload
} from '../controllers/documents.js';

const router = Router();

/**
 * @route GET /api/documents
 * @description Get all documents with pagination and filtering
 * @query {string} search - Search term for document name or content
 * @query {string} type - Filter by document type (pdf, docx, image, video, all)
 * @query {string} status - Filter by status (processing, completed, error, all)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 * @access Public
 */
router.get('/', getDocuments);

/**
 * @route GET /api/documents/stats
 * @description Get document statistics
 * @access Public
 */
router.get('/stats', getDocumentStats);

/**
 * @route GET /api/documents/:id
 * @description Get document by ID
 * @param {string} id - Document ID
 * @access Public
 */
router.get('/:id', getDocument);

/**
 * @route POST /api/documents/upload
 * @description Upload new document
 * @body {file} file - Document file (required)
 * @body {string} title - Custom document title (optional)
 * @body {boolean} autoExtract - Auto-extract content after upload
 * @body {boolean} aiAnalysis - Run AI analysis immediately
 * @body {boolean} createCourse - Generate course based on document
 * @access Public
 */
router.post('/upload', upload.single('file'), uploadDocument);

/**
 * @route POST /api/documents/:id/extract
 * @description Extract content from document
 * @param {string} id - Document ID
 * @access Public
 */
router.post('/:id/extract', extractContent);

/**
 * @route POST /api/documents/:id/analyze
 * @description Analyze document with AI
 * @param {string} id - Document ID
 * @body {string} analysisType - Type of analysis (general, educational, summary, etc.)
 * @access Public
 */
router.post('/:id/analyze', analyzeDocument);

/**
 * @route POST /api/documents/analyze/bulk
 * @description Bulk analyze multiple documents
 * @body {string[]} documentIds - Array of document IDs
 * @body {string} analysisType - Type of analysis (general, educational, summary, etc.)
 * @access Public
 */
router.post('/analyze/bulk', bulkAnalyze);

/**
 * @route DELETE /api/documents/:id
 * @description Delete document
 * @param {string} id - Document ID
 * @access Public
 */
router.delete('/:id', deleteDocument);

export default router;