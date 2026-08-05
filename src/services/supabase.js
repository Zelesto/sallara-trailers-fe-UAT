// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

// Use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'sallara_dev_documents';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please check your environment variables.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const DRIVER_DOCUMENTS_BUCKET = supabaseBucket;

// Initialize bucket if needed
export const initializeStorage = async () => {
  try {
    console.log('🔧 Initializing Supabase Storage...');
    console.log(`📦 Bucket: ${DRIVER_DOCUMENTS_BUCKET}`);
    console.log(`🔗 URL: ${supabaseUrl}`);
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(b => b.name === DRIVER_DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log(`📦 Bucket "${DRIVER_DOCUMENTS_BUCKET}" not found, creating...`);
      const { error: createError } = await supabase.storage.createBucket(
        DRIVER_DOCUMENTS_BUCKET,
        {
          public: true, // Set to true for public access
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'image/*', 
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
          ],
        }
      );
      
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log(`✅ Bucket "${DRIVER_DOCUMENTS_BUCKET}" created successfully`);
      }
    } else {
      console.log(`✅ Bucket "${DRIVER_DOCUMENTS_BUCKET}" already exists`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export default supabase;
