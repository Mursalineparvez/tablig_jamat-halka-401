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

export type ActiveTab = 'overview' | 'mosques' | 'directory' | 'report';
