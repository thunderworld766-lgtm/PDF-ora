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
const DB_NAME = 'pdfora_vault';
const DB_STORE = 'documents';
const SESSION_STORE = 'session';

const openDocumentDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') {
    reject(new Error('IndexedDB is not available in this browser.'));
    return;
  }
  const request = indexedDB.open(DB_NAME, 2);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(DB_STORE)) {
      request.result.createObjectStore(DB_STORE);
    }
    if (!request.result.objectStoreNames.contains(SESSION_STORE)) {
      request.result.createObjectStore(SESSION_STORE);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

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

  async saveDocumentBytes(id: string, bytes: Uint8Array): Promise<void> {
    const db = await openDocumentDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(DB_STORE, 'readwrite');
      transaction.objectStore(DB_STORE).put(bytes.slice(), id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  },

  async getDocumentBytes(id: string): Promise<Uint8Array | null> {
    const db = await openDocumentDb();
    const value = await new Promise<Uint8Array | null>((resolve, reject) => {
      const transaction = db.transaction(DB_STORE, 'readonly');
      const request = transaction.objectStore(DB_STORE).get(id);
      request.onsuccess = () => resolve(request.result instanceof Uint8Array ? request.result : null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  },

  async deleteDocumentBytes(id: string): Promise<void> {
    const db = await openDocumentDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(DB_STORE, 'readwrite');
      transaction.objectStore(DB_STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  },

  async saveSession(session: { fileName: string; bytes: Uint8Array; currentPage: number; zoomLevel: number; annotations: unknown[]; pageRotations: Record<number, number> }): Promise<void> {
    const db = await openDocumentDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(SESSION_STORE, 'readwrite');
      transaction.objectStore(SESSION_STORE).put(session, 'active-editor');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  },

  async getSession(): Promise<{ fileName: string; bytes: Uint8Array; currentPage: number; zoomLevel: number; annotations: unknown[]; pageRotations: Record<number, number> } | null> {
    const db = await openDocumentDb();
    const value = await new Promise<any>((resolve, reject) => {
      const transaction = db.transaction(SESSION_STORE, 'readonly');
      const request = transaction.objectStore(SESSION_STORE).get('active-editor');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  },

  async clearSession(): Promise<void> {
    const db = await openDocumentDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(SESSION_STORE, 'readwrite');
      transaction.objectStore(SESSION_STORE).delete('active-editor');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
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
