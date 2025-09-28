import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    
    try {
      await mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non supporté: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// In-memory document store (replace with database in production)
interface Document {
  id: string;
  name: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error';
  extracted: boolean;
  extractedText?: string;
  metadata?: any;
  userId?: string;
}

const documents: Document[] = [
  {
    id: 'doc1',
    name: 'Guide Marketing Digital.pdf',
    originalName: 'Guide Marketing Digital.pdf',
    filename: 'guide-marketing-1234567890.pdf',
    mimetype: 'application/pdf',
    size: 2200000, // 2.2MB
    uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'completed',
    extracted: true,
    extractedText: 'Contenu marketing digital extrait...',
    metadata: { pages: 45, language: 'fr' }
  },
  {
    id: 'doc2',
    name: 'Présentation Stratégie.pptx',
    originalName: 'Présentation Stratégie.pptx',
    filename: 'presentation-strategy-2345678901.pptx',
    mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 5400000, // 5.4MB
    uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    status: 'processing',
    extracted: false
  },
  {
    id: 'doc3',
    name: 'Infographie Données.png',
    originalName: 'Infographie Données.png',
    filename: 'infographie-donnees-3456789012.png',
    mimetype: 'image/png',
    size: 1200000, // 1.2MB
    uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'completed',
    extracted: true,
    extractedText: 'Données visuelles extraites de l\'infographie...',
    metadata: { width: 1920, height: 1080 }
  },
  {
    id: 'doc4',
    name: 'Tutoriel Formation.mp4',
    originalName: 'Tutoriel Formation.mp4',
    filename: 'tutoriel-formation-4567890123.mp4',
    mimetype: 'video/mp4',
    size: 47900000, // 47.9MB
    uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'error',
    extracted: false,
    metadata: { duration: 1200, resolution: '1080p' }
  }
];

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Aujourd\'hui';
  if (diffInDays === 1) return 'Hier';
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
  if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
  if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
  return `Il y a ${Math.floor(diffInDays / 365)} ans`;
}

// Get all documents
export async function getDocuments(req: Request, res: Response) {
  try {
    const { search, type, status, page = 1, limit = 20 } = req.query;
    
    let filteredDocs = [...documents];
    
    // Apply filters
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredDocs = filteredDocs.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.extractedText?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (type && type !== 'all') {
      filteredDocs = filteredDocs.filter(doc => {
        const docType = doc.mimetype.split('/')[1];
        return docType.includes(type as string);
      });
    }
    
    if (status && status !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.status === status);
    }
    
    // Sort by upload date (newest first)
    filteredDocs.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
    
    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedDocs = filteredDocs.slice(startIndex, endIndex);
    
    // Format response
    const formattedDocs = paginatedDocs.map(doc => ({
      ...doc,
      sizeFormatted: formatFileSize(doc.size),
      uploadDateFormatted: getRelativeTime(doc.uploadDate),
      typeLabel: getTypeLabel(doc.mimetype)
    }));
    
    // Calculate stats
    const stats = {
      total: documents.length,
      extracted: documents.filter(d => d.extracted).length,
      processing: documents.filter(d => d.status === 'processing').length,
      error: documents.filter(d => d.status === 'error').length,
      totalSize: documents.reduce((sum, doc) => sum + doc.size, 0)
    };
    
    res.json({
      success: true,
      data: {
        documents: formattedDocs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredDocs.length,
          pages: Math.ceil(filteredDocs.length / Number(limit))
        },
        stats
      }
    });
    
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des documents'
    });
  }
}

// Get document by ID
export async function getDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = documents.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document non trouvé'
      });
    }
    
    const formattedDoc = {
      ...document,
      sizeFormatted: formatFileSize(document.size),
      uploadDateFormatted: getRelativeTime(document.uploadDate),
      typeLabel: getTypeLabel(document.mimetype)
    };
    
    res.json({
      success: true,
      data: formattedDoc
    });
    
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du document'
    });
  }
}

// Upload new document
export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }
    
    const { title, autoExtract, aiAnalysis, createCourse } = req.body;
    
    // Create new document record
    const newDocument: Document = {
      id: 'doc' + (documents.length + 1),
      name: title || req.file.originalname,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date(),
      status: autoExtract === 'true' ? 'processing' : 'completed',
      extracted: false
    };
    
    documents.unshift(newDocument);
    
    // Simulate processing if auto-extract is enabled
    if (autoExtract === 'true') {
      setTimeout(() => {
        newDocument.status = 'completed';
        newDocument.extracted = true;
        newDocument.extractedText = `Contenu extrait de ${newDocument.name}...`;
        
        console.log(`Document ${newDocument.name} processed successfully`);
      }, 3000);
    }
    
    const formattedDoc = {
      ...newDocument,
      sizeFormatted: formatFileSize(newDocument.size),
      uploadDateFormatted: getRelativeTime(newDocument.uploadDate),
      typeLabel: getTypeLabel(newDocument.mimetype)
    };
    
    res.status(201).json({
      success: true,
      data: formattedDoc,
      message: 'Document uploadé avec succès'
    });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload du document'
    });
  }
}

// Delete document
export async function deleteDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const docIndex = documents.findIndex(doc => doc.id === id);
    
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document non trouvé'
      });
    }
    
    const document = documents[docIndex];
    
    // Delete physical file
    try {
      const filePath = path.join(__dirname, '../../uploads/documents', document.filename);
      await unlink(filePath);
    } catch (error) {
      console.warn('Could not delete physical file:', error);
    }
    
    // Remove from documents array
    documents.splice(docIndex, 1);
    
    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du document'
    });
  }
}

// Extract content from document
export async function extractContent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = documents.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document non trouvé'
      });
    }
    
    if (document.status === 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Document en cours de traitement'
      });
    }
    
    // Simulate content extraction
    document.status = 'processing';
    
    setTimeout(() => {
      document.status = 'completed';
      document.extracted = true;
      document.extractedText = generateMockExtractedText(document);
    }, 2000);
    
    res.json({
      success: true,
      message: 'Extraction du contenu en cours...'
    });
    
  } catch (error) {
    console.error('Error extracting content:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'extraction du contenu'
    });
  }
}

// Analyze document with AI
export async function analyzeDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { analysisType = 'general' } = req.body;
    
    const document = documents.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document non trouvé'
      });
    }
    
    if (!document.extracted) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu doit être extrait avant l\'analyse'
      });
    }
    
    // Simulate AI analysis
    const analysisResult = await simulateAIAnalysis(document, analysisType);
    
    res.json({
      success: true,
      data: analysisResult,
      message: 'Analyse IA terminée avec succès'
    });
    
  } catch (error) {
    console.error('Error analyzing document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse IA'
    });
  }
}

// Bulk analyze documents
export async function bulkAnalyze(req: Request, res: Response) {
  try {
    const { documentIds, analysisType = 'general' } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds)) {
      return res.status(400).json({
        success: false,
        error: 'Liste des IDs de documents requise'
      });
    }
    
    const availableDocs = documents.filter(doc => 
      documentIds.includes(doc.id) && 
      doc.extracted && 
      doc.status === 'completed'
    );
    
    if (availableDocs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun document disponible pour l\'analyse'
      });
    }
    
    // Simulate bulk analysis
    const results = [];
    for (const doc of availableDocs) {
      const analysis = await simulateAIAnalysis(doc, analysisType);
      results.push({
        documentId: doc.id,
        documentName: doc.name,
        analysis
      });
    }
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          totalAnalyzed: results.length,
          analysisType
        }
      },
      message: `Analyse groupée de ${results.length} documents terminée`
    });
    
  } catch (error) {
    console.error('Error in bulk analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse groupée'
    });
  }
}

// Get document stats
export async function getDocumentStats(req: Request, res: Response) {
  try {
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const extracted = documents.filter(d => d.extracted).length;
    const coursesGenerated = Math.floor(extracted * 0.4); // Simulate courses generated
    
    const stats = {
      totalDocuments: documents.length,
      extractedContent: extracted,
      totalSize: formatFileSize(totalSize),
      totalSizeBytes: totalSize,
      coursesGenerated,
      recentActivity: documents
        .filter(d => {
          const daysDiff = (new Date().getTime() - d.uploadDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        }).length,
      byStatus: {
        completed: documents.filter(d => d.status === 'completed').length,
        processing: documents.filter(d => d.status === 'processing').length,
        error: documents.filter(d => d.status === 'error').length
      },
      byType: documents.reduce((acc, doc) => {
        const type = getTypeLabel(doc.mimetype);
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting document stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
}

// Helper functions
function getTypeLabel(mimetype: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'text/plain': 'TXT',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'video/mp4': 'MP4',
    'video/quicktime': 'MOV',
    'video/x-msvideo': 'AVI'
  };
  
  return typeMap[mimetype] || mimetype.split('/')[1].toUpperCase();
}

function generateMockExtractedText(document: Document): string {
  const templates = {
    'pdf': `Contenu PDF extrait de "${document.name}": 
Ce document contient des informations détaillées sur le sujet traité. 
Le contenu a été analysé et structuré pour faciliter la création de cours.
Concepts clés identifiés, exemples pratiques inclus, et références pertinentes.`,
    
    'docx': `Document Word "${document.name}" analysé:
Structure claire avec sections bien définies. 
Contenu textuel riche avec formatage préservé.
Tableaux et listes organisées pour un apprentissage optimal.`,
    
    'image': `Analyse d'image "${document.name}":
Éléments visuels identifiés: graphiques, texte, diagrammes.
Données extraites et organisées pour support pédagogique.
Contenu visuel optimisé pour intégration dans cours.`,
    
    'video': `Transcription et analyse vidéo "${document.name}":
Audio transcrit avec horodatage.
Concepts clés identifiés par séquence.
Segments importants marqués pour création de modules.`
  };
  
  const type = document.mimetype.split('/')[0];
  return templates[type as keyof typeof templates] || templates.pdf;
}

async function simulateAIAnalysis(document: Document, analysisType: string) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    documentId: document.id,
    documentName: document.name,
    analysisType,
    summary: `Analyse ${analysisType} du document "${document.name}" terminée avec succès.`,
    keyPoints: [
      'Contenu structuré et bien organisé',
      'Informations pertinentes pour formation',
      'Exemples pratiques disponibles',
      'Adaptable pour différents niveaux'
    ],
    suggestions: [
      'Créer un module introductif',
      'Développer des exercices pratiques',
      'Ajouter des évaluations',
      'Inclure des ressources supplémentaires'
    ],
    confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
    processingTime: Math.floor(Math.random() * 2000) + 500 // 0.5-2.5s
  };
}