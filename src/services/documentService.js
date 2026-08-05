// src/services/documentService.js
import api from './api';

// If you want to use direct Supabase from frontend
// import { supabase, DRIVER_DOCUMENTS_BUCKET } from './supabase';

const DOCUMENT_TYPES = {
  ID: 'ID Document',
  LICENSE: 'Driver License',
  MEDICAL: 'Medical Certificate',
  TRAINING: 'Training Certificate',
  CONTRACT: 'Employment Contract',
  INSURANCE: 'Insurance Document',
  OTHER: 'Other',
};

const documentService = {
  /**
   * Upload a document for a driver - Using Backend API
   */
  uploadDocument: async (driverId, file, documentType, description = '') => {
    try {
      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('driverId', driverId);
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('description', description || '');

      console.log(`📤 Uploading document for driver ${driverId}:`, {
        fileName: file.name,
        fileSize: file.size,
        documentType,
      });

      // Upload using your backend API
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Document uploaded successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  },

  /**
   * Get all documents for a driver - Using Backend API
   */
  getDriverDocuments: async (driverId) => {
    try {
      const response = await api.get(`/documents/driver/${driverId}`);
      return response || [];
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      return [];
    }
  },

  /**
   * Delete a document - Using Backend API
   */
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return response;
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw error;
    }
  },

  /**
   * Download a document - Using Backend API
   */
  downloadDocument: async (documentId, fileName) => {
    try {
      // Get signed URL or download directly
      const response = await api.get(`/documents/download/${documentId}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      throw error;
    }
  },

  /**
   * Get document types for dropdown
   */
  getDocumentTypes: () => {
    return Object.entries(DOCUMENT_TYPES).map(([value, label]) => ({
      value,
      label,
    }));
  },

  /**
   * Format file size
   */
  formatFileSize: (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  /**
   * Get file icon based on type
   */
  getFileIcon: (fileType, fileName) => {
    if (!fileType && !fileName) return '📄';
    const name = fileName?.toLowerCase() || '';
    const type = fileType?.toLowerCase() || '';
    
    if (type.includes('pdf') || name.endsWith('.pdf')) return '📕';
    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return '🖼️';
    if (type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return '📘';
    if (type.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.xls')) return '📗';
    if (type.includes('text') || name.endsWith('.txt')) return '📝';
    return '📄';
  },
};

export default documentService;
