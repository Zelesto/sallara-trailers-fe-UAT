// src/services/documentService.js
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

const getDocumentTypeLabel = (type) => {
  return DOCUMENT_TYPES[type] || type || 'Other';
};

const documentService = {
  /**
   * Upload a document for a driver
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

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `drivers/${driverId}/${documentType}/${fileName}`;

      console.log(`📤 Uploading document for driver ${driverId}:`, {
        fileName: file.name,
        fileSize: file.size,
        documentType,
        filePath,
      });

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DRIVER_DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(DRIVER_DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);

      const fileUrl = urlData?.publicUrl;

      // Create document record in your backend
      const documentRecord = {
        driverId,
        fileName: file.name,
        filePath,
        fileUrl,
        documentType,
        description: description || '',
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      };

      console.log('✅ Document uploaded successfully:', documentRecord);

      // Save to your backend API
      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentRecord),
        });

        if (!response.ok) {
          console.warn('Failed to save document record to backend, but file is uploaded');
        } else {
          const savedDoc = await response.json();
          return { ...documentRecord, ...savedDoc };
        }
      } catch (apiError) {
        console.warn('API save failed, but file is uploaded:', apiError);
      }

      return documentRecord;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  },

  /**
   * Get all documents for a driver
   */
  getDriverDocuments: async (driverId) => {
    try {
      // First try to get from your backend API
      try {
        const response = await fetch(`/api/documents/driver/${driverId}`);
        if (response.ok) {
          const documents = await response.json();
          return documents;
        }
      } catch (apiError) {
        console.warn('Could not fetch from API, falling back to Supabase');
      }

      // Fallback: List files from Supabase
      const { data: files, error } = await supabase.storage
        .from(DRIVER_DOCUMENTS_BUCKET)
        .list(`drivers/${driverId}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        throw error;
      }

      if (!files || files.length === 0) {
        return [];
      }

      // Map files to document objects
      const documents = files.map(file => ({
        id: file.id,
        fileName: file.name,
        filePath: `${driverId}/${file.name}`,
        fileUrl: supabase.storage
          .from(DRIVER_DOCUMENTS_BUCKET)
          .getPublicUrl(`drivers/${driverId}/${file.name}`).data?.publicUrl,
        fileSize: file.metadata?.size || 0,
        uploadedAt: file.created_at,
        documentType: file.metadata?.documentType || 'OTHER',
        description: file.metadata?.description || '',
      }));

      return documents;
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      return [];
    }
  },

  /**
   * Delete a document
   */
  deleteDocument: async (driverId, document) => {
    try {
      // Delete from Supabase Storage
      const filePath = document.filePath || `drivers/${driverId}/${document.fileName}`;
      const { error: deleteError } = await supabase.storage
        .from(DRIVER_DOCUMENTS_BUCKET)
        .remove([filePath]);

      if (deleteError) {
        throw deleteError;
      }

      // Delete from backend API
      try {
        await fetch(`/api/documents/${document.id}`, {
          method: 'DELETE',
        });
      } catch (apiError) {
        console.warn('Could not delete from API, but file is deleted from storage');
      }

      console.log('✅ Document deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw error;
    }
  },

  /**
   * Download a document
   */
  downloadDocument: async (document) => {
    try {
      const url = document.fileUrl;
      if (!url) {
        throw new Error('No file URL available');
      }

      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = document.fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

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
  getFileIcon: (fileType) => {
    if (!fileType) return '📄';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📕';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('doc')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📗';
    if (type.includes('text')) return '📝';
    return '📄';
  },
};

export default documentService;
