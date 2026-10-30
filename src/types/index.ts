export type AppView = 
  | 'landing' 
  | 'dashboard' 
  | 'editor' 
  | 'tools' 
  | 'documents' 
  | 'settings';

export type ToolType = 
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'rotate' 
  | 'protect' 
  | 'watermark' 
  | 'sign' 
  | 'pdf-to-img' 
  | 'img-to-pdf'
  | 'organize'
  | 'ocr-mock';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tier: 'Free' | 'Pro' | 'Enterprise';
  storageUsedBytes: number;
  storageLimitBytes: number;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  sizeBytes: number;
  pageCount: number;
  updatedAt: string;
  createdAt: string;
  thumbnailUrl?: string;
  tags: string[];
  isStarred?: boolean;
  fileData?: ArrayBuffer | Uint8Array;
}

export interface Annotation {
  id: string;
  pageNumber: number;
  type: 'text' | 'signature' | 'draw' | 'highlight' | 'stamp' | 'rect';
  x: number; // percentage or px
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  fontSize?: number;
  points?: { x: number; y: number }[]; // for freehand draw
  opacity?: number;
}

export interface PDFPageInfo {
  pageNumber: number;
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
  aspectRatio: number;
  thumbnailDataUrl?: string;
}

export interface ToolDefinition {
  id: ToolType;
  title: string;
  description: string;
  category: 'edit' | 'convert' | 'organize' | 'security';
  icon: string;
  badge?: string;
  color: string;
  accentBg: string;
}

export interface IntegrationConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  cloudflareR2AccountId: string;
  cloudflareR2BucketName: string;
  cloudflareR2AccessKey: string;
  cloudflareR2SecretKey: string;
  isR2Enabled: boolean;
  isSupabaseEnabled: boolean;
}
