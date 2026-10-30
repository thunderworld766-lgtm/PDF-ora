import { DocumentItem, IntegrationConfig, UserProfile } from '../types';

const STORAGE_KEYS = {
  USER: 'pdfora_user_profile',
  DOCUMENTS: 'pdfora_documents_meta',
  INTEGRATIONS: 'pdfora_integrations_config',
  THEME: 'pdfora_theme_mode',
};

const DEFAULT_INTEGRATION: IntegrationConfig = {
  supabaseUrl: '',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  cloudflareR2AccountId: '',
  cloudflareR2BucketName: '',
  cloudflareR2AccessKey: '',
  cloudflareR2SecretKey: '',
  isR2Enabled: false,
  isSupabaseEnabled: false,
};

const STARTER_DOCUMENTS: DocumentItem[] = [];

export const storageService = {
  getUserProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
  },

  clearUserProfile(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getDocuments(): DocumentItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return stored ? JSON.parse(stored) : STARTER_DOCUMENTS;
    } catch {
      return STARTER_DOCUMENTS;
    }
  },

  saveDocuments(docs: DocumentItem[]): void {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  addDocument(doc: DocumentItem): void {
    const docs = this.getDocuments();
    const updated = [doc, ...docs.filter(d => d.id !== doc.id)];
    this.saveDocuments(updated);
  },

  deleteDocument(id: string): void {
    const docs = this.getDocuments();
    this.saveDocuments(docs.filter(d => d.id !== id));
  },

  toggleStarred(id: string): void {
    const docs = this.getDocuments();
    const updated = docs.map(d => (d.id === id ? { ...d, isStarred: !d.isStarred } : d));
    this.saveDocuments(updated);
  },

  getIntegrationConfig(): IntegrationConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
      return stored ? JSON.parse(stored) : DEFAULT_INTEGRATION;
    } catch {
      return DEFAULT_INTEGRATION;
    }
  },

  saveIntegrationConfig(config: IntegrationConfig): void {
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(config));
  },

  /**
   * Future Supabase & Cloudflare R2 Upload Hook
   * When enabled in Settings, uploads to R2 bucket using presigned URLs or Supabase Storage
   */
  async uploadToCloudStorage(file: File | Uint8Array, fileName: string): Promise<{ url: string; key: string }> {
    const config = this.getIntegrationConfig();
    if (config.isR2Enabled) {
      console.info(`[PDFora Cloudflare R2] Initiating direct S3 multipart sync to bucket: ${config.cloudflareR2BucketName}`);
      // Simulated cloud upload response with future-ready contract
      return {
        url: `https://${config.cloudflareR2BucketName}.r2.cloudflarestorage.com/${fileName}`,
        key: `vault/${Date.now()}_${fileName}`,
      };
    }

    if (config.isSupabaseEnabled) {
      console.info(`[PDFora Supabase] Syncing metadata and document record with ${config.supabaseUrl}`);
      return {
        url: `${config.supabaseUrl}/storage/v1/object/public/documents/${fileName}`,
        key: `supabase_${fileName}`,
      };
    }

    // Default client-side session storage URL
    return {
      url: URL.createObjectURL(new Blob([file as any], { type: 'application/pdf' })),
      key: `local_${fileName}`,
    };
  }
};
