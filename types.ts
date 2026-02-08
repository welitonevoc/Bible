
export enum LessonStatus {
  COMPLETED = 'Concluído',
  IN_PROGRESS = 'Em Progresso',
  TODO = 'Para Estudar'
}

export interface DailyReading {
  day: string;
  reference: string;
  theme: string;
}

export interface BibleReference {
  bookName: string;
  chapter: number;
  verse: number;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  commentator: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  theme: string;
  studyDate: string;
  originalLink?: string;
  status: LessonStatus;
  content?: string;
  notes?: string;
  coverImage?: string;
  
  goldText?: string;
  practicalTruth?: string;
  dailyReading?: DailyReading[];
  biblicalText?: string;
  objectives?: string[];
  introduction?: string;
  conclusion?: string;
  questionnaire?: { question: string; answer?: string }[];
}

export interface FavoriteVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  timestamp: number;
}

export type MySwordModuleType = 'bbl' | 'cmt' | 'dct' | 'bok' | 'jor' | 'xref';

export interface MySwordModule {
  id: string;
  name: string;
  type: MySwordModuleType;
  db: any;
}

export interface BibleVerse {
  number: number;
  text: string;
  title?: string;
}

export interface AIKey {
  provider: string;
  key: string;
  label: string;
  model: string;
  status: 'valid' | 'invalid' | 'untested';
  color: string;
  badge: string;
}

export interface AIProfile {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}
