export enum AppStage {
  BRIEFING = 'BRIEFING',
  RESEARCH = 'RESEARCH',
  PROPOSAL = 'PROPOSAL',
  REFINEMENT = 'REFINEMENT',
  FINAL = 'FINAL'
}

export interface BriefingData {
  typology: string;
  location: string;
  contextDetails: string;
  prompt: string;
  inspirationImages: string[];
  massingImage?: string;
  builtUpArea?: string;
  floorCount?: string;
  preferredMaterials?: string;
  moodMatchIntensity?: number;
}

export interface ResearchData {
  summary: string;
  materials: string[];
  lighting: string;
  vernacular: string;
}

export interface GeneratedOption {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'LITERAL' | 'INSPIRED' | 'WILDCARD' | 'HYBRID';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
}

export interface ArchivedImage {
  id: string;
  url: string;
  stage: AppStage;
  timestamp: number;
  metadata?: string;
  type: string;
}

export interface Project {
  id: string;
  name: string;
  timestamp: number;
  brief: BriefingData;
  research?: ResearchData;
  images: ArchivedImage[];
  finalImage?: string;
}