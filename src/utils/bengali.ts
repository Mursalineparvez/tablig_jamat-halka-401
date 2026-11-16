import {
  CategoryMeta,
  MosqueRecord,
  SathiCategory,
  SathiEntry,
  TakazaType,
} from '../types/directory';

export const TAKAZA_TYPE_LABELS: Record<TakazaType, string> = {
  three_days: '৩ দিনের জামাত',
  ten_fifteen_days: '১০/১৫ দিনের জামাত',
  one_chilla: '১ চিল্লা',
  three_chilla: '৩ চিল্লা',
  sal: '১ সাল (সালওয়ালী)',
  masturat: 'মাস্তুরাত জামাত',
  other: 'অন্যান্য তাকাজা',
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function normalizeSearchText(text: string): string {
  const enMap: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  return text
    .toLowerCase()
    .replace(/[০-৯]/g, (ch) => enMap[ch] ?? ch)
    .replace(/[-\s]/g, '');
}

const BN_TO_EN: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function formatBdPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  const digits = trimmed
    .replace(/[০-৯]/g, (ch) => BN_TO_EN[ch] ?? ch)
    .replace(/\D/g, '');

  let localTen = '';
  if (digits.startsWith('00880') && digits.length === 15) {
    localTen = digits.slice(5);
  } else if (digits.startsWith('880') && digits.length === 13) {
    localTen = digits.slice(3);
  } else if (digits.startsWith('0') && digits.length === 11) {
    localTen = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith('1')) {
    localTen = digits;
  }

  if (localTen.length === 10) {
    return `+880 ${localTen.slice(0, 4)}-${localTen.slice(4, 7)} ${localTen.slice(7, 10)}`;
  }
  return trimmed;
}

export function getTelHref(phone: string): string {
  const formatted = formatBdPhone(phone);
  const ascii = formatted
    .replace(/[০-৯]/g, (ch) => BN_TO_EN[ch] ?? ch)
    .replace(/[^\d+]/g, '');
  return `tel:${ascii}`;
}

export function getWhatsAppHref(phone: string): string {
  const formatted = formatBdPhone(phone);
  const digits = formatted
    .replace(/[০-৯]/g, (ch) => BN_TO_EN[ch] ?? ch)
    .replace(/\D/g, '');
  if (!digits) return '';
  let waDigits = digits;
  if (digits.startsWith('01') && digits.length === 11) {
    waDigits = `88${digits}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    waDigits = `880${digits}`;
  }
  return `https://wa.me/${waDigits}`;
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    key: SathiCategory.SalwaliUlama,
    shortLabel: 'সালওয়ালী',
    fullLabel: 'সালওয়ালী ওলামা হযরত নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.ThreeChillaUlama,
    shortLabel: '৩ চিল্লা ওলামা',
    fullLabel: 'তিন চিল্লা ওলামা হযরত নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.OneChillaUlama,
    shortLabel: '১ চিল্লা ওলামা',
    fullLabel: 'এক চিল্লা ওলামা হযরত নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.Bidesh,
    shortLabel: 'বিদেশ',
    fullLabel: 'বিদেশ সফরকারী সাথী নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.ThreeChillaSathi,
    shortLabel: '৩ চিল্লা সাথী',
    fullLabel: 'তিন চিল্লার সাথীদের নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.OneChillaSathi,
    shortLabel: '১ চিল্লা সাথী',
    fullLabel: 'এক চিল্লার সাথীদের নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.MasturatChilla,
    shortLabel: 'মাস্তুরাত চিল্লা',
    fullLabel: 'মাস্তুরাতসহ চিল্লা জিম্মাদারওয়ালা সাথীদের নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.MasturatTenFifteenDays,
    shortLabel: '১০/১৫ দিন',
    fullLabel: 'মাস্তুরাতসহ ১০/১৫ দিন দেনেওয়ালা সাথীদের নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.MasturatThreeDays,
    shortLabel: '৩ দিন',
    fullLabel: 'মাস্তুরাতসহ ৩ দিন দেনেওয়ালা সাথীদের নাম ও মোবাইল নং',
    countsTowardsTotal: true,
    defaultBlankRows: 2,
  },
  {
    key: SathiCategory.ChatraNowjowan,
    shortLabel: 'ছাত্র নওজোয়ান',
    fullLabel: 'ছাত্র নওজোয়ান',
    countsTowardsTotal: true,
    defaultBlankRows: 10,
  },
];

export const SUMMARY_CATEGORIES = CATEGORY_META.filter(
  (c) => c.countsTowardsTotal
);

export function getMosqueTotalSathi(mosque: MosqueRecord): number {
  return SUMMARY_CATEGORIES.reduce(
    (sum, cat) => sum + (mosque.categories[cat.key]?.length ?? 0),
    0
  );
}

export function getCategoryMeta(key: SathiCategory): CategoryMeta {
  return (
    CATEGORY_META.find((c) => c.key === key) ?? CATEGORY_META[0]
  );
}

const HONORIFIC_PREFIX_RE =
  /^(?:ভাই\s*মোঃ|ভাই\s*মোহাম্মদ|ভাই|সাথী\s*মোঃ|সাথী|মাও(?:লানা)?[:.]?|মুফ[তথ][ীি]|হা(?:ফেজ)?[:.]?|ডাঃ|হাজী|জনাব\s*মোঃ|জনাব)\s+/g;

export function normalizeMemberCoreName(name: string): string {
  let cleaned = name
    .normalize('NFC')
    .replace(/য়/g, 'য়')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[—–\-.,:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (let i = 0; i < 3; i += 1) {
    const next = cleaned.replace(HONORIFIC_PREFIX_RE, '').trim();
    if (next === cleaned) break;
    cleaned = next;
  }

  return cleaned.replace(/সাহেব$/g, '').replace(/\s+/g, ' ').trim();
}

export function findExistingMosqueMemberMatch(
  candidateName: string,
  mosques: MosqueRecord[]
): { mosqueName: string; memberName: string } | null {
  const target = normalizeMemberCoreName(candidateName);
  if (!target) return null;

  for (const m of mosques) {
    const officialNames = [m.khatib.name, m.imam.name, m.muazzin.name];
    for (const offName of officialNames) {
      if (offName.trim() && normalizeMemberCoreName(offName) === target) {
        return { mosqueName: m.name, memberName: offName };
      }
    }
    for (const cat of CATEGORY_META) {
      const list = m.categories[cat.key] ?? [];
      for (const entry of list) {
        if (
          entry.name.trim() &&
          normalizeMemberCoreName(entry.name) === target
        ) {
          return { mosqueName: m.name, memberName: entry.name };
        }
      }
    }
  }

  return null;
}

export interface MosqueMemberMatch {
  mosqueId: number;
  mosqueName: string;
  mosqueAddress: string;
  roleOrCategory: string;
  memberName: string;
  phone: string;
  notes: string;
}

export function findAllMosqueMemberMatches(
  candidateName: string,
  mosques: MosqueRecord[],
  candidatePhone?: string
): MosqueMemberMatch[] {
  const target = normalizeMemberCoreName(candidateName);
  const formattedTargetPhone = candidatePhone ? formatBdPhone(candidatePhone) : '';
  if (!target && !formattedTargetPhone) return [];

  const matches: MosqueMemberMatch[] = [];
  const seenKeys = new Set<string>();

  for (const m of mosques) {
    const officials: Array<{ role: string; name: string; phone: string }> = [
      { role: 'খতিব সাহেব', name: m.khatib.name, phone: m.khatib.phone },
      { role: 'ইমাম সাহেব', name: m.imam.name, phone: m.imam.phone },
      { role: 'মোয়াজ্জিন সাহেব', name: m.muazzin.name, phone: m.muazzin.phone },
    ];

    for (const off of officials) {
      if (!off.name.trim()) continue;
      const nameMatch = Boolean(target && normalizeMemberCoreName(off.name) === target);
      const phoneMatch = Boolean(
        formattedTargetPhone && formatBdPhone(off.phone) === formattedTargetPhone
      );
      if (nameMatch || phoneMatch) {
        const key = `${m.id}-off-${off.role}-${off.name}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          matches.push({
            mosqueId: m.id,
            mosqueName: m.name,
            mosqueAddress: m.address,
            roleOrCategory: off.role,
            memberName: off.name,
            phone: formatBdPhone(off.phone),
            notes: '',
          });
        }
      }
    }

    for (const cat of CATEGORY_META) {
      const list = m.categories[cat.key] ?? [];
      for (const entry of list) {
        if (!entry.name.trim()) continue;
        const nameMatch = Boolean(
          target && normalizeMemberCoreName(entry.name) === target
        );
        const phoneMatch = Boolean(
          formattedTargetPhone && formatBdPhone(entry.phone) === formattedTargetPhone
        );
        if (nameMatch || phoneMatch) {
          const key = `${m.id}-${cat.key}-${entry.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            matches.push({
              mosqueId: m.id,
              mosqueName: m.name,
              mosqueAddress: m.address,
              roleOrCategory: cat.shortLabel,
              memberName: entry.name,
              phone: formatBdPhone(entry.phone),
              notes: entry.notes,
            });
          }
        }
      }
    }
  }

  return matches;
}

export function exportMosquesToCSV(mosques: MosqueRecord[]): void {
  const headers = [
    'মসজিদ নং',
    'মসজিদের নাম',
    'বিভাগ',
    'ক্রম',
    'নাম',
    'মোবাইল নম্বর',
    'ঠিকানা',
    'মন্তব্য',
    'খতিব সাহেব',
    'খতিব মোবাইল',
    'ইমাম সাহেব',
    'ইমাম মোবাইল',
    'মোয়াজ্জিন সাহেব',
    'মোয়াজ্জিন মোবাইল',
  ];

  const escapeCsv = (val: string) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [headers.map(escapeCsv).join(',')];

  for (const m of mosques) {
    for (const cat of CATEGORY_META) {
      const list = m.categories[cat.key] ?? [];
      list.forEach((entry: SathiEntry, index: number) => {
        rows.push(
          [
            toBn(m.id),
            m.name,
            cat.shortLabel,
            toBn(index + 1),
            entry.name,
            formatBdPhone(entry.phone),
            entry.address,
            entry.notes,
            m.khatib.name,
            formatBdPhone(m.khatib.phone),
            m.imam.name,
            formatBdPhone(m.imam.phone),
            m.muazzin.name,
            formatBdPhone(m.muazzin.phone),
          ]
            .map(escapeCsv)
            .join(',')
        );
      });
    }
  }

  const csvContent = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'halqa-401-jatrabari-markaz-directory.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
