/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { KargoojariView } from './components/KargoojariView';
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
  MosqueRecord,
  OfficialInfo,
  SathiCategory,
  SathiEntry,
  TakazaEntry,
  TakazaStatus,
} from './types/directory';
import { toBn } from './utils/bengali';

const STORAGE_KEY = 'jatrabari_markaz_halqa_401_v1';
const GIRIDHARA_CHATRA_SEED_KEY = 'jatrabari_markaz_seed_m3_chatra_v1';
const TAKAZA_STORAGE_KEY = 'jatrabari_markaz_halqa_401_takaza_v1';
const KARGOOJARI_STORAGE_KEY = 'jatrabari_markaz_halqa_401_kargoojari_v1';
const KARGOOJARI_SEED_KEY = 'jatrabari_markaz_seed_karg_20261115_v1';

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

function loadInitialMosques(): MosqueRecord[] {
  const loaded = loadFromStorage<MosqueRecord[]>(STORAGE_KEY, INITIAL_MOSQUES);
  const base =
    Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_MOSQUES;

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
          existing.map((e) => `${e.name.trim()}|${e.phone.trim()}`)
        );
        const missing = seedEntries.filter(
          (e) => !existingKeys.has(`${e.name.trim()}|${e.phone.trim()}`)
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
  const base = Array.isArray(loaded) ? loaded : INITIAL_KARGOOJARIS;

  try {
    const alreadySeeded = localStorage.getItem(KARGOOJARI_SEED_KEY);
    if (!alreadySeeded) {
      const existingIds = new Set(base.map((k) => k.id));
      const missing = INITIAL_KARGOOJARIS.filter((k) => !existingIds.has(k.id));
      localStorage.setItem(KARGOOJARI_SEED_KEY, '1');
      if (missing.length > 0) {
        return [...missing, ...base];
      }
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
    return Array.isArray(loaded) ? loaded : [];
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
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(phone).catch(() => {});
    }
    showToast(`নম্বর কপি করা হয়েছে: ${phone}`);
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
    setMosques((prev) =>
      prev.map((m) => {
        if (m.id !== mosqueId) return m;
        const currentList = m.categories[category] ?? [];
        const updatedList = entryData.id
          ? currentList.map((item) =>
              item.id === entryData.id
                ? { ...item, ...entryData, id: item.id }
                : item
            )
          : [
              ...currentList,
              {
                ...entryData,
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
      entryData.id
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
    if (existingMosque) {
      setMosques((prev) =>
        prev.map((m) =>
          m.id === existingMosque.id
            ? {
                ...m,
                name: values.name,
                address: values.address,
                khatib: { name: values.khatibName, phone: values.khatibPhone },
                imam: { name: values.imamName, phone: values.imamPhone },
                muazzin: {
                  name: values.muazzinName,
                  phone: values.muazzinPhone,
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
        khatib: { name: values.khatibName, phone: values.khatibPhone },
        imam: { name: values.imamName, phone: values.imamPhone },
        muazzin: { name: values.muazzinName, phone: values.muazzinPhone },
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
    const roleLabels = {
      khatib: 'খতিব সাহেবের',
      imam: 'ইমাম সাহেবের',
      muazzin: 'মোয়াজ্জিন সাহেবের',
    };
    setMosques((prev) =>
      prev.map((m) => (m.id === mosqueId ? { ...m, [role]: official } : m))
    );
    const isEmpty = !official.name.trim() && !official.phone.trim();
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
    if (data.id) {
      setTakazas((prev) =>
        prev.map((t) => (t.id === data.id ? { ...t, ...data, id: t.id } : t))
      );
      showToast('তাকাজার তথ্য হালনাগাদ করা হয়েছে।');
    } else {
      const newEntry: TakazaEntry = {
        ...data,
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
    if (data.id) {
      setKargoojaris((prev) =>
        prev.map((k) => (k.id === data.id ? { ...k, ...data, id: k.id } : k))
      );
      showToast('দৈনিক কারগুজারি হালনাগাদ করা হয়েছে।');
    } else {
      const newEntry: KargoojariEntry = {
        ...data,
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

  const handleImportData = (payload: {
    mosques: MosqueRecord[];
    takazas?: TakazaEntry[];
    kargoojaris?: KargoojariEntry[];
  }) => {
    setMosques(payload.mosques);
    if (Array.isArray(payload.takazas)) setTakazas(payload.takazas);
    if (Array.isArray(payload.kargoojaris)) setKargoojaris(payload.kargoojaris);
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
            entries={kargoojaris}
            onSaveEntry={handleSaveKargoojari}
            onDeleteEntry={handleDeleteKargoojari}
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
