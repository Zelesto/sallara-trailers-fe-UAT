// src/services/documentService.js
import api from './api';
import { supabase, DRIVER_DOCUMENTS_BUCKET } from './supabase';

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
      const formData = new FormData();
      formData.append('driverId', driverId);
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('description', description);

      console.log(`📤 Uploading document for driver ${driverId}:`, {
        fileName: file.name,
        fileSize: file.size,
        documentType,
        bucket: DRIVER_DOCUMENTS_BUCKET,
      });

      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log(`✅ Document uploaded for driver ${driverId}:`, response);
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
      // Fallback: try direct Supabase
      try {
        console.log('🔄 Falling back to direct Supabase query...');
        const { data: files, error } = await supabase.storage
          .from(DRIVER_DOCUMENTS_BUCKET)
          .list(`drivers/${driverId}`, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (error) throw error;

        if (!files || files.length === 0) {
          return [];
        }

        return files.map(file => ({
          id: file.id || `file_${Date.now()}`,
          fileName: file.name,
          filePath: `drivers/${driverId}/${file.name}`,
          fileUrl: supabase.storage
            .from(DRIVER_DOCUMENTS_BUCKET)
            .getPublicUrl(`drivers/${driverId}/${file.name}`).data?.publicUrl,
          fileSize: file.metadata?.size || 0,
          uploadedAt: file.created_at || new Date().toISOString(),
          documentType: file.metadata?.documentType || 'OTHER',
          description: file.metadata?.description || '',
          bucket: DRIVER_DOCUMENTS_BUCKET,
        }));
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return [];
      }
    }
  },

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @param {number|string} driverId - Driver ID (for fallback)
   * @param {string} fileName - File name (for fallback)
   * @returns {Promise<Object>} Delete response
   */
  deleteDocument: async (documentId, driverId = null, fileName = null) => {
    try {
      console.log(`🗑️ Deleting document: ${documentId}`);
      const response = await api.delete(`/documents/${documentId}`);
      console.log(`✅ Document ${documentId} deleted successfully`);
      return response;
    } catch (error) {
      console.error(`❌ Error deleting document ${documentId}:`, error);
      
      // Fallback: try direct Supabase delete
      if (driverId && fileName) {
        try {
          console.log('🔄 Falling back to direct Supabase delete...');
          const filePath = `drivers/${driverId}/${fileName}`;
          const { error: deleteError } = await supabase.storage
            .from(DRIVER_DOCUMENTS_BUCKET)
            .remove([filePath]);

          if (deleteError) throw deleteError;
          console.log(`✅ Document ${fileName} deleted from Supabase`);
          return { success: true, message: 'Deleted from storage' };
        } catch (fallbackError) {
          console.error('❌ Fallback delete also failed:', fallbackError);
          throw fallbackError;
        }
      }
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
      
      // Try to get signed URL first
      try {
        const urlResponse = await api.get(`/documents/${documentId}/url`);
        if (urlResponse?.url) {
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
   * Upload a document directly to Supabase (bypassing backend)
   * @param {number|string} driverId - Driver ID
   * @param {File} file - Document file
   * @param {string} documentType - Document type
   * @param {string} description - Document description
   * @returns {Promise<Object>} Upload result
   */
  uploadDirect: async (driverId, file, documentType = 'OTHER', description = '') => {
    try {
      if (!file) throw new Error('No file selected');
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `drivers/${driverId}/${documentType}/${fileName}`;

      console.log(`📤 Direct upload to Supabase for driver ${driverId}:`, {
        fileName: file.name,
        filePath,
        bucket: DRIVER_DOCUMENTS_BUCKET,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      });

      const { data, error } = await supabase.storage
        .from(DRIVER_DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            documentType,
            description: description || '',
            driverId: String(driverId),
            originalName: file.name,
          },
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(DRIVER_DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);

      const documentRecord = {
        id: data?.id || `doc_${Date.now()}`,
        driverId: parseInt(driverId),
        fileName: file.name,
        filePath: filePath,
        fileUrl: urlData?.publicUrl,
        documentType,
        description: description || '',
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        bucket: DRIVER_DOCUMENTS_BUCKET,
      };

      console.log('✅ Document uploaded directly to Supabase');
      return documentRecord;
    } catch (error) {
      console.error('❌ Error in direct upload:', error);
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
