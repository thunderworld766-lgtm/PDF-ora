import { DocumentItem, IntegrationConfig, UserProfile } from '../types';

const STORAGE_KEYS = {
  USER: 'pdfora_user_profile',
  DOCUMENTS: 'pdfora_documents_meta',
  INTEGRATIONS: 'pdfora_integrations_config',
  THEME: 'pdfora_theme_mode',
};

const DEFAULT_USER: UserProfile = {
  id: 'usr_pdfora_demo',
  name: 'Alex Morgan',
  email: 'alex.morgan@pdfora.io',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  tier: 'Pro',
  storageUsedBytes: 124 * 1024 * 1024, // 124 MB
  storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  createdAt: '2026-01-15T09:00:00Z',
};

const DEFAULT_INTEGRATION: IntegrationConfig = {
  supabaseUrl: 'https://xyzcompany.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  cloudflareR2AccountId: 'a1b2c3d4e5f6g7h8',
  cloudflareR2BucketName: 'pdfora-production-vault',
  cloudflareR2AccessKey: 'r2_acc_938172938172',
  cloudflareR2SecretKey: '••••••••••••••••••••••••••••••••',
  isR2Enabled: false,
  isSupabaseEnabled: false,
};

// Initial starter documents so the dashboard and file manager look vibrant out of the box
const STARTER_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_1',
    name: 'Executive_Q3_Strategic_Brief.pdf',
    sizeBytes: 2450000,
    pageCount: 14,
    updatedAt: '2026-10-28T14:32:00Z',
    createdAt: '2026-10-20T10:15:00Z',
    tags: ['Strategy', 'Executive', 'Confidential'],
    isStarred: true,
  },
  {
    id: 'doc_2',
    name: 'Master_Services_Agreement_Signed.pdf',
    sizeBytes: 1120000,
    pageCount: 6,
    updatedAt: '2026-10-29T19:10:00Z',
    createdAt: '2026-10-25T11:40:00Z',
    tags: ['Contracts', 'Legal', 'Signed'],
    isStarred: true,
  },
  {
    id: 'doc_3',
    name: 'Product_Design_Tokens_v2.4.pdf',
    sizeBytes: 3840000,
    pageCount: 22,
    updatedAt: '2026-10-24T08:20:00Z',
    createdAt: '2026-10-18T16:00:00Z',
    tags: ['Design', 'Specs'],
    isStarred: false,
  },
  {
    id: 'doc_4',
    name: 'Annual_Financial_Audit_Report.pdf',
    sizeBytes: 5200000,
    pageCount: 38,
    updatedAt: '2026-10-21T16:45:00Z',
    createdAt: '2026-10-12T09:30:00Z',
    tags: ['Finance', 'Tax'],
    isStarred: false,
  },
];

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
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
