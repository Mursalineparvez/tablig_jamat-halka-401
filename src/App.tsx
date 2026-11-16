/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import {
  AssignKargoojariToMosquePayload,
  AssignKargoojariToTakazaPayload,
  KargoojariView,
} from './components/KargoojariView';
import {
  MosqueFormValues,
  MosqueInfoModal,
  SathiModal,
} from './components/MemberModal';
import { MosquesView } from './components/MosquesView';
import { OverviewView } from './components/OverviewView';
import { PrintExportView } from './components/PrintExportView';
import { SathiDirectoryView } from './components/SathiDirectoryView';
import { TakazaView } from './components/TakazaView';
import { INITIAL_KARGOOJARIS, INITIAL_MOSQUES } from './data/halqaData';
import {
  ActiveTab,
  KargoojariEntry,
  KargoojariSathiItem,
  MosqueRecord,
  OfficialInfo,
  SathiCategory,
  SathiEntry,
  TakazaEntry,
  TakazaStatus,
} from './types/directory';
import { formatBdPhone, getCategoryMeta, toBn } from './utils/bengali';

const STORAGE_KEY = 'jatrabari_markaz_halqa_401_v1';
const GIRIDHARA_CHATRA_SEED_KEY = 'jatrabari_markaz_seed_m3_chatra_v1';
const TAKAZA_STORAGE_KEY = 'jatrabari_markaz_halqa_401_takaza_v1';
const KARGOOJARI_STORAGE_KEY = 'jatrabari_markaz_halqa_401_kargoojari_v1';
const KARGOOJARI_SEED_KEY = 'jatrabari_markaz_seed_karg_20261115_sathis_v1';

interface SathiModalState {
  mosqueId: number;
  category: SathiCategory;
  editingEntry: SathiEntry | null;
}

type MosqueModalState =
  | { mode: 'add' }
  | { mode: 'edit'; mosque: MosqueRecord }
  | null;

function createEmptyCategories(): Record<SathiCategory, SathiEntry[]> {
  return {
    [SathiCategory.SalwaliUlama]: [],
    [SathiCategory.ThreeChillaUlama]: [],
    [SathiCategory.OneChillaUlama]: [],
    [SathiCategory.Bidesh]: [],
    [SathiCategory.ThreeChillaSathi]: [],
    [SathiCategory.OneChillaSathi]: [],
    [SathiCategory.MasturatChilla]: [],
    [SathiCategory.MasturatTenFifteenDays]: [],
    [SathiCategory.MasturatThreeDays]: [],
    [SathiCategory.ChatraNowjowan]: [],
  };
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch {
    // Ignore storage read errors
  }
  return fallback;
}

function normalizeMosquesPhones(list: MosqueRecord[]): MosqueRecord[] {
  return list.map((m) => {
    const normalizedCategories = { ...m.categories };
    for (const key of Object.keys(normalizedCategories) as SathiCategory[]) {
      normalizedCategories[key] = (normalizedCategories[key] ?? []).map(
        (entry) => ({
          ...entry,
          phone: formatBdPhone(entry.phone),
        })
      );
    }
    return {
      ...m,
      khatib: { ...m.khatib, phone: formatBdPhone(m.khatib.phone) },
      imam: { ...m.imam, phone: formatBdPhone(m.imam.phone) },
      muazzin: { ...m.muazzin, phone: formatBdPhone(m.muazzin.phone) },
      categories: normalizedCategories,
    };
  });
}

function normalizeTakazasPhones(list: TakazaEntry[]): TakazaEntry[] {
  return list.map((t) => ({
    ...t,
    zimmadarPhone: formatBdPhone(t.zimmadarPhone),
    committedSathis: t.committedSathis?.map((cs) => ({
      ...cs,
      phone: formatBdPhone(cs.phone),
    })),
  }));
}

function normalizeKargoojarisPhones(list: KargoojariEntry[]): KargoojariEntry[] {
  return list.map((k) => ({
    ...k,
    sathis: k.sathis?.map((s) => ({
      ...s,
      phone: formatBdPhone(s.phone),
    })),
  }));
}

function loadInitialMosques(): MosqueRecord[] {
  const loaded = loadFromStorage<MosqueRecord[]>(STORAGE_KEY, INITIAL_MOSQUES);
  const base = normalizeMosquesPhones(
    Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_MOSQUES
  );

  try {
    const alreadySeeded = localStorage.getItem(GIRIDHARA_CHATRA_SEED_KEY);
    if (!alreadySeeded) {
      const baselineGiridhara = INITIAL_MOSQUES.find((m) => m.id === 3);
      const seedEntries =
        baselineGiridhara?.categories[SathiCategory.ChatraNowjowan] ?? [];

      const merged = base.map((m) => {
        if (m.id !== 3) return m;
        const existing = m.categories?.[SathiCategory.ChatraNowjowan] ?? [];
        const existingKeys = new Set(
          existing.map((e) => `${e.name.trim()}|${formatBdPhone(e.phone)}`)
        );
        const missing = seedEntries.filter(
          (e) => !existingKeys.has(`${e.name.trim()}|${formatBdPhone(e.phone)}`)
        );
        if (missing.length === 0) return m;
        return {
          ...m,
          categories: {
            ...m.categories,
            [SathiCategory.ChatraNowjowan]: [...existing, ...missing],
          },
        };
      });

      localStorage.setItem(GIRIDHARA_CHATRA_SEED_KEY, '1');
      return merged;
    }
  } catch {
    // Ignore storage read/write errors
  }

  return base;
}

function loadInitialKargoojaris(): KargoojariEntry[] {
  const loaded = loadFromStorage<KargoojariEntry[]>(
    KARGOOJARI_STORAGE_KEY,
    INITIAL_KARGOOJARIS
  );
  const base = normalizeKargoojarisPhones(
    Array.isArray(loaded) ? loaded : INITIAL_KARGOOJARIS
  );

  try {
    const alreadySeeded = localStorage.getItem(KARGOOJARI_SEED_KEY);
    if (!alreadySeeded) {
      const seedById = new Map(INITIAL_KARGOOJARIS.map((k) => [k.id, k]));
      // Hydrate missing structured sathis onto existing seeded baseline entries
      const hydrated = base.map((entry) => {
        const seedMatch = seedById.get(entry.id);
        if (
          seedMatch &&
          (!entry.sathis || entry.sathis.length === 0) &&
          seedMatch.sathis &&
          seedMatch.sathis.length > 0
        ) {
          return { ...entry, sathis: seedMatch.sathis };
        }
        return entry;
      });
      const existingIds = new Set(hydrated.map((k) => k.id));
      const missing = INITIAL_KARGOOJARIS.filter((k) => !existingIds.has(k.id));
      localStorage.setItem(KARGOOJARI_SEED_KEY, '1');
      return [...missing, ...hydrated];
    }
  } catch {
    // Ignore storage read/write errors
  }

  return base;
}

export default function App() {
  const [mosques, setMosques] = useState<MosqueRecord[]>(loadInitialMosques);

  const [takazas, setTakazas] = useState<TakazaEntry[]>(() => {
    const loaded = loadFromStorage<TakazaEntry[]>(TAKAZA_STORAGE_KEY, []);
    return Array.isArray(loaded) ? normalizeTakazasPhones(loaded) : [];
  });

  const [kargoojaris, setKargoojaris] = useState<KargoojariEntry[]>(
    loadInitialKargoojaris
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedMosqueId, setSelectedMosqueId] = useState<number>(1);
  const [directoryCategory, setDirectoryCategory] = useState<
    SathiCategory | 'all'
  >('all');
  const [sathiModal, setSathiModal] = useState<SathiModalState | null>(null);
  const [mosqueModal, setMosqueModal] = useState<MosqueModalState>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mosques));
    } catch {
      // Ignore storage quota errors
    }
  }, [mosques]);

  useEffect(() => {
    try {
      localStorage.setItem(TAKAZA_STORAGE_KEY, JSON.stringify(takazas));
    } catch {
      // Ignore storage quota errors
    }
  }, [takazas]);

  useEffect(() => {
    try {
      localStorage.setItem(KARGOOJARI_STORAGE_KEY, JSON.stringify(kargoojaris));
    } catch {
      // Ignore storage quota errors
    }
  }, [kargoojaris]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const handleCopyPhone = (phone: string) => {
    const formatted = formatBdPhone(phone);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    showToast(`নম্বর কপি করা হয়েছে: ${formatted}`);
  };

  const handleOpenMosque = (mosqueId: number) => {
    setSelectedMosqueId(mosqueId);
    setActiveTab('mosques');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDirectory = (category?: SathiCategory) => {
    setDirectoryCategory(category ?? 'all');
    setActiveTab('directory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSathi = (
    mosqueId: number,
    category: SathiCategory,
    entryData: Omit<SathiEntry, 'id'> & { id?: string }
  ) => {
    const normalizedEntry = {
      ...entryData,
      phone: formatBdPhone(entryData.phone),
    };
    setMosques((prev) =>
      prev.map((m) => {
        if (m.id !== mosqueId) return m;
        const currentList = m.categories[category] ?? [];
        const updatedList = normalizedEntry.id
          ? currentList.map((item) =>
              item.id === normalizedEntry.id
                ? { ...item, ...normalizedEntry, id: item.id }
                : item
            )
          : [
              ...currentList,
              {
                ...normalizedEntry,
                id: `m${mosqueId}-${category}-${Date.now()}`,
              },
            ];
        return {
          ...m,
          categories: {
            ...m.categories,
            [category]: updatedList,
          },
        };
      })
    );

    setSathiModal(null);
    showToast(
      normalizedEntry.id
        ? 'সাথীর তথ্য হালনাগাদ করা হয়েছে।'
        : 'নতুন সাথী তালিকায় যুক্ত করা হয়েছে।'
    );
  };

  const handleDeleteSathi = (
    mosqueId: number,
    category: SathiCategory,
    entryId: string
  ) => {
    setMosques((prev) =>
      prev.map((m) => {
        if (m.id !== mosqueId) return m;
        return {
          ...m,
          categories: {
            ...m.categories,
            [category]: (m.categories[category] ?? []).filter(
              (item) => item.id !== entryId
            ),
          },
        };
      })
    );
    showToast('তালিকা থেকে এন্ট্রিটি সরানো হয়েছে।');
  };

  const handleSaveMosqueInfo = (
    values: MosqueFormValues,
    existingMosque?: MosqueRecord
  ) => {
    const khatibPhone = formatBdPhone(values.khatibPhone);
    const imamPhone = formatBdPhone(values.imamPhone);
    const muazzinPhone = formatBdPhone(values.muazzinPhone);

    if (existingMosque) {
      setMosques((prev) =>
        prev.map((m) =>
          m.id === existingMosque.id
            ? {
                ...m,
                name: values.name,
                address: values.address,
                khatib: { name: values.khatibName, phone: khatibPhone },
                imam: { name: values.imamName, phone: imamPhone },
                muazzin: {
                  name: values.muazzinName,
                  phone: muazzinPhone,
                },
              }
            : m
        )
      );
      setMosqueModal(null);
      showToast(`${values.name}-এর তথ্য সংরক্ষণ করা হয়েছে।`);
    } else {
      const nextId =
        mosques.reduce((maxId, m) => Math.max(maxId, m.id), 0) + 1;
      const newMosque: MosqueRecord = {
        id: nextId,
        name: values.name,
        address: values.address,
        khatib: { name: values.khatibName, phone: khatibPhone },
        imam: { name: values.imamName, phone: imamPhone },
        muazzin: { name: values.muazzinName, phone: muazzinPhone },
        categories: createEmptyCategories(),
      };
      setMosques((prev) => [...prev, newMosque]);
      setSelectedMosqueId(nextId);
      setActiveTab('mosques');
      setMosqueModal(null);
      showToast(
        `${values.name} যুক্ত করা হয়েছে এবং সকল বিভাগ স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteMosque = (mosqueId: number) => {
    const remaining = mosques.filter((m) => m.id !== mosqueId);
    if (remaining.length === 0) return;
    setMosques(remaining);
    if (selectedMosqueId === mosqueId) {
      setSelectedMosqueId(remaining[0].id);
    }
    setMosqueModal(null);
    showToast('মসজিদটি তালিকা থেকে সরানো হয়েছে।');
  };

  const handleUpdateOfficial = (
    mosqueId: number,
    role: 'khatib' | 'imam' | 'muazzin',
    official: OfficialInfo
  ) => {
    const normalizedOfficial: OfficialInfo = {
      name: official.name.trim(),
      phone: formatBdPhone(official.phone),
    };
    const roleLabels = {
      khatib: 'খতিব সাহেবের',
      imam: 'ইমাম সাহেবের',
      muazzin: 'মোয়াজ্জিন সাহেবের',
    };
    setMosques((prev) =>
      prev.map((m) =>
        m.id === mosqueId ? { ...m, [role]: normalizedOfficial } : m
      )
    );
    const isEmpty = !normalizedOfficial.name && !normalizedOfficial.phone;
    showToast(
      isEmpty
        ? `${roleLabels[role]} তথ্য মুছে ফেলা হয়েছে।`
        : `${roleLabels[role]} তথ্য সংরক্ষণ করা হয়েছে।`
    );
  };

  // Takaza handlers
  const handleSaveTakaza = (
    data: Omit<TakazaEntry, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const normalizedData = {
      ...data,
      zimmadarPhone: formatBdPhone(data.zimmadarPhone),
    };
    if (normalizedData.id) {
      setTakazas((prev) =>
        prev.map((t) =>
          t.id === normalizedData.id ? { ...t, ...normalizedData, id: t.id } : t
        )
      );
      showToast('তাকাজার তথ্য হালনাগাদ করা হয়েছে।');
    } else {
      const newEntry: TakazaEntry = {
        ...normalizedData,
        id: `takaza-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTakazas((prev) => [newEntry, ...prev]);
      showToast('নতুন চলমান তাকাজা যুক্ত করা হয়েছে।');
    }
  };

  const handleUpdateTakazaProgress = (id: string, delta: number) => {
    setTakazas((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextCount = Math.max(0, t.completedCount + delta);
        const nextStatus: TakazaStatus =
          nextCount >= t.targetCount
            ? 'completed'
            : t.status === 'completed'
            ? 'ongoing'
            : t.status;
        return { ...t, completedCount: nextCount, status: nextStatus };
      })
    );
  };

  const handleToggleTakazaStatus = (id: string, status: TakazaStatus) => {
    setTakazas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    showToast('তাকাজার অবস্থা পরিবর্তন করা হয়েছে।');
  };

  const handleDeleteTakaza = (id: string) => {
    setTakazas((prev) => prev.filter((t) => t.id !== id));
    showToast('তাকাজাটি সরানো হয়েছে।');
  };

  // Kargoojari handlers
  const handleSaveKargoojari = (
    data: Omit<KargoojariEntry, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const normalizedData = {
      ...data,
      sathis: data.sathis?.map((s) => ({
        ...s,
        phone: formatBdPhone(s.phone),
      })),
    };
    if (normalizedData.id) {
      setKargoojaris((prev) =>
        prev.map((k) =>
          k.id === normalizedData.id ? { ...k, ...normalizedData, id: k.id } : k
        )
      );
      showToast('দৈনিক কারগুজারি হালনাগাদ করা হয়েছে।');
    } else {
      const newEntry: KargoojariEntry = {
        ...normalizedData,
        id: `karg-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setKargoojaris((prev) => [newEntry, ...prev]);
      showToast('দৈনিক কারগুজারি সংরক্ষণ করা হয়েছে।');
    }
  };

  const handleDeleteKargoojari = (id: string) => {
    setKargoojaris((prev) => prev.filter((k) => k.id !== id));
    showToast('কারগুজারি এন্ট্রিটি মুছে ফেলা হয়েছে।');
  };

  const handleSaveKargoojariSathi = (
    kargoojariId: string,
    sathiData: Omit<KargoojariSathiItem, 'id'> & { id?: string }
  ) => {
    const normalizedSathi = {
      ...sathiData,
      phone: formatBdPhone(sathiData.phone),
    };
    setKargoojaris((prev) =>
      prev.map((k) => {
        if (k.id !== kargoojariId) return k;
        const current = k.sathis ?? [];
        const nextSathis = normalizedSathi.id
          ? current.map((s) =>
              s.id === normalizedSathi.id
                ? { ...s, ...normalizedSathi, id: s.id }
                : s
            )
          : [
              ...current,
              {
                ...normalizedSathi,
                id: `ks-${Date.now()}`,
              },
            ];
        return { ...k, sathis: nextSathis };
      })
    );
    showToast(
      normalizedSathi.id
        ? 'সাথীর তথ্য হালনাগাদ করা হয়েছে।'
        : 'কারগুজারিতে নতুন সাথী যুক্ত করা হয়েছে।'
    );
  };

  const handleDeleteKargoojariSathi = (
    kargoojariId: string,
    sathiId: string
  ) => {
    setKargoojaris((prev) =>
      prev.map((k) => {
        if (k.id !== kargoojariId) return k;
        return {
          ...k,
          sathis: (k.sathis ?? []).filter((s) => s.id !== sathiId),
        };
      })
    );
    showToast('কারগুজারির তালিকা থেকে সাথীকে সরানো হয়েছে।');
  };

  const handleAssignKargoojariSathiToMosque = (
    payload: AssignKargoojariToMosquePayload
  ) => {
    const formattedPhone = formatBdPhone(payload.phone);

    // Add entry to chosen mosque & category in Mosque directory format
    setMosques((prev) =>
      prev.map((m) => {
        if (m.id !== payload.mosqueId) return m;
        const existingList = m.categories[payload.category] ?? [];
        const newEntry: SathiEntry = {
          id: `m${payload.mosqueId}-${payload.category}-${Date.now()}`,
          name: payload.name,
          phone: formattedPhone,
          address: '',
          notes: payload.notes,
        };
        return {
          ...m,
          categories: {
            ...m.categories,
            [payload.category]: [...existingList, newEntry],
          },
        };
      })
    );

    // Record assignment status on the Kargoojari sathi row
    setKargoojaris((prev) =>
      prev.map((k) => {
        if (k.id !== payload.kargoojariId) return k;
        return {
          ...k,
          sathis: (k.sathis ?? []).map((s) =>
            s.id === payload.kargSathiId
              ? {
                  ...s,
                  name: payload.name,
                  phone: formattedPhone,
                  notes: payload.notes,
                  assignedMosqueId: payload.mosqueId,
                  assignedCategory: payload.category,
                }
              : s
          ),
        };
      })
    );

    const mosqueName =
      mosques.find((m) => m.id === payload.mosqueId)?.name ?? 'মসজিদ';
    const catLabel = getCategoryMeta(payload.category).shortLabel;
    showToast(`${payload.name}-কে ${mosqueName} (${catLabel})-এ যুক্ত করা হয়েছে।`);
  };

  const handleAssignKargoojariSathiToTakaza = (
    payload: AssignKargoojariToTakazaPayload
  ) => {
    const formattedPhone = formatBdPhone(payload.sathiPhone);
    let resolvedTakazaId = payload.existingTakazaId ?? '';
    let resolvedTakazaTitle = '';

    if (payload.existingTakazaId) {
      const targetTakaza = takazas.find(
        (t) => t.id === payload.existingTakazaId
      );
      resolvedTakazaTitle = targetTakaza?.title ?? 'চলমান তাকাজা';

      setTakazas((prev) =>
        prev.map((t) => {
          if (t.id !== payload.existingTakazaId) return t;
          const existingCommitted = t.committedSathis ?? [];
          const alreadyListed = existingCommitted.some(
            (cs) => cs.name.trim() === payload.sathiName.trim()
          );
          const nextCount = alreadyListed
            ? t.completedCount
            : t.completedCount + 1;
          const nextStatus: TakazaStatus =
            nextCount >= t.targetCount
              ? 'completed'
              : t.status === 'completed'
              ? 'ongoing'
              : t.status;
          const nextCommitted = alreadyListed
            ? existingCommitted
            : [
                ...existingCommitted,
                {
                  id: `tc-${Date.now()}`,
                  name: payload.sathiName,
                  phone: formattedPhone,
                },
              ];
          return {
            ...t,
            completedCount: nextCount,
            status: nextStatus,
            committedSathis: nextCommitted,
          };
        })
      );
    } else if (payload.newTakaza) {
      resolvedTakazaId = `takaza-${Date.now()}`;
      resolvedTakazaTitle = payload.newTakaza.title;
      const newTakaza: TakazaEntry = {
        id: resolvedTakazaId,
        title: payload.newTakaza.title,
        mosqueId: payload.newTakaza.mosqueId,
        type: payload.newTakaza.type,
        targetCount: payload.newTakaza.targetCount,
        completedCount: 1,
        dueDate: payload.newTakaza.dueDate,
        zimmadarName: '',
        zimmadarPhone: '',
        status: 1 >= payload.newTakaza.targetCount ? 'completed' : 'ongoing',
        notes: payload.newTakaza.notes,
        committedSathis: [
          {
            id: `tc-${Date.now()}`,
            name: payload.sathiName,
            phone: formattedPhone,
          },
        ],
        createdAt: new Date().toISOString(),
      };
      setTakazas((prev) => [newTakaza, ...prev]);
    }

    if (resolvedTakazaId) {
      setKargoojaris((prev) =>
        prev.map((k) => {
          if (k.id !== payload.kargoojariId) return k;
          return {
            ...k,
            sathis: (k.sathis ?? []).map((s) =>
              s.id === payload.kargSathiId
                ? {
                    ...s,
                    assignedTakazaId: resolvedTakazaId,
                    assignedTakazaTitle: resolvedTakazaTitle,
                  }
                : s
            ),
          };
        })
      );
      showToast(
        `${payload.sathiName}-কে "${resolvedTakazaTitle}" তাকাজায় যুক্ত করা হয়েছে।`
      );
    }
  };

  const handleImportData = (payload: {
    mosques: MosqueRecord[];
    takazas?: TakazaEntry[];
    kargoojaris?: KargoojariEntry[];
  }) => {
    setMosques(normalizeMosquesPhones(payload.mosques));
    if (Array.isArray(payload.takazas))
      setTakazas(normalizeTakazasPhones(payload.takazas));
    if (Array.isArray(payload.kargoojaris))
      setKargoojaris(normalizeKargoojarisPhones(payload.kargoojaris));
    showToast('ব্যাকআপ থেকে সকল তথ্য রিস্টোর করা হয়েছে।');
  };

  const handleResetToBaseline = () => {
    setMosques(INITIAL_MOSQUES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    showToast('মূল পিডিএফের ১৪টি মসজিদ ও ২৫৬ জন সাথীর তথ্যে রিসেট করা হয়েছে।');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FC] text-slate-900">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'directory') setDirectoryCategory('all');
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAddMember={() =>
          setSathiModal({
            mosqueId: activeTab === 'mosques' ? selectedMosqueId : 1,
            category: SathiCategory.ThreeChillaSathi,
            editingEntry: null,
          })
        }
      />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <OverviewView
            mosques={mosques}
            onOpenMosque={handleOpenMosque}
            onOpenDirectory={handleOpenDirectory}
            onAddMosque={() => setMosqueModal({ mode: 'add' })}
          />
        )}

        {activeTab === 'mosques' && (
          <MosquesView
            mosques={mosques}
            selectedMosqueId={selectedMosqueId}
            onSelectMosque={setSelectedMosqueId}
            onAddSathi={(mosqueId, category) =>
              setSathiModal({
                mosqueId,
                category: category ?? SathiCategory.ThreeChillaSathi,
                editingEntry: null,
              })
            }
            onEditSathi={(mosqueId, category, entry) =>
              setSathiModal({
                mosqueId,
                category,
                editingEntry: entry,
              })
            }
            onDeleteSathi={handleDeleteSathi}
            onEditMosqueInfo={(mosque) =>
              setMosqueModal({ mode: 'edit', mosque })
            }
            onUpdateOfficial={handleUpdateOfficial}
            onAddMosque={() => setMosqueModal({ mode: 'add' })}
            onCopyPhone={handleCopyPhone}
          />
        )}

        {activeTab === 'directory' && (
          <SathiDirectoryView
            key={directoryCategory}
            mosques={mosques}
            initialCategory={directoryCategory}
            onOpenMosque={handleOpenMosque}
            onCopyPhone={handleCopyPhone}
          />
        )}

        {activeTab === 'takaja' && (
          <TakazaView
            mosques={mosques}
            takazas={takazas}
            onSaveTakaza={handleSaveTakaza}
            onUpdateProgress={handleUpdateTakazaProgress}
            onToggleStatus={handleToggleTakazaStatus}
            onDeleteTakaza={handleDeleteTakaza}
          />
        )}

        {activeTab === 'kargoojari' && (
          <KargoojariView
            mosques={mosques}
            takazas={takazas}
            entries={kargoojaris}
            onSaveEntry={handleSaveKargoojari}
            onDeleteEntry={handleDeleteKargoojari}
            onSaveKargoojariSathi={handleSaveKargoojariSathi}
            onDeleteKargoojariSathi={handleDeleteKargoojariSathi}
            onAssignToMosque={handleAssignKargoojariSathiToMosque}
            onAssignToTakaza={handleAssignKargoojariSathiToTakaza}
            onCopyPhone={handleCopyPhone}
          />
        )}

        {activeTab === 'report' && (
          <PrintExportView
            mosques={mosques}
            takazas={takazas}
            kargoojaris={kargoojaris}
            onImportData={handleImportData}
            onResetToBaseline={handleResetToBaseline}
          />
        )}
      </main>

      <footer className="no-print border-t border-[#E2ECF7] bg-white">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="font-medium text-slate-700">
            যাত্রাবাড়ী মারকাজ মসজিদ — ৪০১ নং হালকা
          </p>
          <p>
            {toBn(mosques.length)}টি মসজিদের সমন্বিত ডিজিটাল ডিরেক্টরি ·
            স্থানীয়ভাবে ব্রাউজারে সংরক্ষিত ও প্রিন্টযোগ্য
          </p>
        </div>
      </footer>

      {sathiModal && (
        <SathiModal
          mosques={mosques}
          initialMosqueId={sathiModal.mosqueId}
          initialCategory={sathiModal.category}
          editingEntry={sathiModal.editingEntry}
          onClose={() => setSathiModal(null)}
          onSave={handleSaveSathi}
        />
      )}

      {mosqueModal && (
        <MosqueInfoModal
          mosque={mosqueModal.mode === 'edit' ? mosqueModal.mosque : null}
          canDelete={mosques.length > 1}
          onClose={() => setMosqueModal(null)}
          onSave={handleSaveMosqueInfo}
          onDelete={handleDeleteMosque}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed right-5 bottom-5 z-50 rounded-xl border border-[#0066E6]/20 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
