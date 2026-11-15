export enum SathiCategory {
  SalwaliUlama = 'salwali_ulama',
  ThreeChillaUlama = 'three_chilla_ulama',
  OneChillaUlama = 'one_chilla_ulama',
  Bidesh = 'bidesh',
  ThreeChillaSathi = 'three_chilla_sathi',
  OneChillaSathi = 'one_chilla_sathi',
  MasturatChilla = 'masturat_chilla',
  MasturatTenFifteenDays = 'masturat_ten_fifteen',
  MasturatThreeDays = 'masturat_three_days',
  ChatraNowjowan = 'chatra_nowjowan',
}

export interface CategoryMeta {
  key: SathiCategory;
  shortLabel: string;
  fullLabel: string;
  countsTowardsTotal: boolean;
  defaultBlankRows: number;
}

export interface OfficialInfo {
  name: string;
  phone: string;
}

export interface SathiEntry {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export interface MosqueRecord {
  id: number;
  name: string;
  address: string;
  khatib: OfficialInfo;
  imam: OfficialInfo;
  muazzin: OfficialInfo;
  categories: Record<SathiCategory, SathiEntry[]>;
}

export type TakazaStatus = 'ongoing' | 'urgent' | 'completed';

export type TakazaType =
  | 'three_days'
  | 'ten_fifteen_days'
  | 'one_chilla'
  | 'three_chilla'
  | 'sal'
  | 'masturat'
  | 'other';

export interface TakazaEntry {
  id: string;
  title: string;
  mosqueId: number | 'halqa';
  type: TakazaType;
  targetCount: number;
  completedCount: number;
  dueDate: string;
  zimmadarName: string;
  zimmadarPhone: string;
  status: TakazaStatus;
  notes: string;
  createdAt: string;
}

export interface KargoojariEntry {
  id: string;
  date: string;
  mosqueId: number | 'halqa';
  gastDone: boolean;
  talimDone: boolean;
  mashwaraDone: boolean;
  sathiAttended: number;
  tashkeelCount: number;
  reporterName: string;
  summary: string;
  createdAt: string;
}

export type ActiveTab =
  | 'overview'
  | 'mosques'
  | 'directory'
  | 'takaja'
  | 'kargoojari'
  | 'report';
