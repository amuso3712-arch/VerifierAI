
export type CertificateType = 
  | 'IELTS' | 'TOEFL' | 'Cambridge' | 'PTE' | 'Duolingo' 
  | 'Goethe' | 'TestDaF' | 'DSH' | 'DELF' | 'DALF' 
  | 'TCF' | 'TORFL' | 'HSK' | 'HSKK' | 'JLPT' 
  | 'TOPIK' | 'DELE' | 'SIELE' | 'ITEP' | 'ITEP_CANADA' 
  | 'MILLIY_NEW' | 'MILLIY_OLD' | 'TYS' | 'UNKNOWN';

export interface ExtractedData {
  candidateName: string;
  identifier: string;
  testDate: string;
  organization: string;
  scores: Record<string, string>;
  overall: string;
  expiryDate?: string;
}

export interface VerificationResult {
  certificateType: CertificateType;
  extractedData: ExtractedData;
  riskScore: number;
  status: 'VALID' | 'REVIEW' | 'INVALID';
  forensicFlags: {
    formatCheck: boolean;
    nameMatch: boolean;
    expiryCheck: boolean;
    securityFeatures: boolean;
    imageIntegrity: boolean;
    pixelManipulation?: boolean;
    fontConsistency?: boolean;
    metadataAnomalies?: boolean;
  };
  deepForensicAnalysis?: {
    tamperEvidence: string;
    sourceVerification: string;
    technicalDetails: string;
  };
  analysisNotes: string[];
  warnings: string[];
  isVerified: boolean;
  isFromCache?: boolean; // Yangi maydon
}

export enum ProcessingStep {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  UPLOADING = 'UPLOADING',
  INITIAL_SCAN = 'INITIAL_SCAN',
  DEEP_ANALYSIS = 'DEEP_ANALYSIS',
  FINAL_VERIFICATION = 'FINAL_VERIFICATION',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessItem {
  id: string;
  file: File;
  previewUrl: string;
  step: ProcessingStep;
  result?: VerificationResult;
  error?: string;
  batchId?: string;
  isCached?: boolean;
}

export interface BatchReport {
  id: string;
  totalItems: number;
  validCount: number;
  invalidCount: number;
  avgRiskScore: number;
  summary: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  createdAt: string;
  provider: string;
  role: 'admin' | 'user';
  plan: 'free' | 'pro';
  usage: {
    count: number;
    lastReset: string;
  };
  hasSeenTutorial: boolean;
  language?: 'uz' | 'en';
}

export interface Certificate {
  id: string;
  name: string;
  organization: string;
  description: string;
  icon: string;
  auditRules: string;
}

export interface UserStats {
  xp: number;
  hearts: number;
  streak: number;
  level: number;
  lastActive: string;
  unlockedUnits: string[];
  history: { date: string; type: string; score: number }[];
  batchReports: BatchReport[];
  quotaSaved: number; // Tejalgan API so'rovlar soni
  isPro: boolean;
  plan: 'free' | 'pro';
  dailyUsage: number;
}
