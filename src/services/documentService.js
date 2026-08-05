// src/services/documentService.js
import api from './api';

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
   * @param {number|string} driverId - Driver ID
   * @param {File} file - Document file
   * @param {string} documentType - Document type
   * @param {string} description - Document description
   * @returns {Promise<Object>} Upload response
   */
  uploadDocument: async (driverId, file, documentType = 'OTHER', description = '') => {
  try {
    // Validate driverId
    const driverIdNum = parseInt(driverId, 10);
    if (isNaN(driverIdNum) || driverIdNum <= 0) {
      throw new Error('Invalid driver ID');
    }

    const formData = new FormData();
    formData.append('driverId', driverIdNum);
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('description', description || '');

    console.log(`📤 Uploading document for driver ${driverIdNum}:`, {
      fileName: file.name,
      fileSize: file.size,
      documentType,
    });

    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log(`✅ Document uploaded for driver ${driverIdNum}:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Error uploading document for driver ${driverId}:`, error);
    throw error;
  }
},
  /**
   * Get all documents for a driver
   * @param {number|string} driverId - Driver ID
   * @returns {Promise<Array>} List of documents
   */
  getDriverDocuments: async (driverId) => {
    try {
      console.log(`📥 Fetching documents for driver ${driverId}`);
      const response = await api.get(`/documents/driver/${driverId}`);
      console.log(`✅ Found ${response?.length || 0} documents for driver ${driverId}`);
      return response || [];
    } catch (error) {
      console.error(`❌ Error fetching documents for driver ${driverId}:`, error);
      return [];
    }
  },

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Delete response
   */
  deleteDocument: async (documentId) => {
    try {
      console.log(`🗑️ Deleting document: ${documentId}`);
      const response = await api.delete(`/documents/${documentId}`);
      console.log(`✅ Document ${documentId} deleted successfully`);
      return response;
    } catch (error) {
      console.error(`❌ Error deleting document ${documentId}:`, error);
      throw error;
    }
  },

  /**
   * Download a document
   * @param {string} documentId - Document ID
   * @param {string} fileName - File name for download
   * @returns {Promise<void>}
   */
  downloadDocument: async (documentId, fileName) => {
    try {
      console.log(`📥 Downloading document: ${documentId}`);
      
      // First try to get signed URL
      try {
        const urlResponse = await api.get(`/documents/${documentId}/url`);
        if (urlResponse?.url) {
          // Open in new tab for viewing/download
          window.open(urlResponse.url, '_blank');
          return;
        }
      } catch (urlError) {
        console.warn('Could not get signed URL, trying direct download:', urlError);
      }

      // Fallback: download directly
      const response = await api.get(`/documents/download/${documentId}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Document ${documentId} downloaded successfully`);
    } catch (error) {
      console.error(`❌ Error downloading document ${documentId}:`, error);
      throw error;
    }
  },

  /**
   * Get document types for dropdown
   * @returns {Array<{value: string, label: string}>}
   */
  getDocumentTypes: () => {
    return Object.entries(DOCUMENT_TYPES).map(([value, label]) => ({
      value,
      label,
    }));
  },

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize: (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  /**
   * Get file icon based on type
   * @param {string} fileType - File MIME type
   * @param {string} fileName - File name
   * @returns {string} Emoji icon
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
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return '📦';
    return '📄';
  },
};

export default documentService;
