/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MosqueInfoModal, SathiModal } from './components/MemberModal';
import { MosquesView } from './components/MosquesView';
import { OverviewView } from './components/OverviewView';
import { PrintExportView } from './components/PrintExportView';
import { SathiDirectoryView } from './components/SathiDirectoryView';
import { INITIAL_MOSQUES } from './data/halqaData';
import {
  ActiveTab,
  MosqueRecord,
  SathiCategory,
  SathiEntry,
} from './types/directory';

const STORAGE_KEY = 'jatrabari_markaz_halqa_401_v1';

interface SathiModalState {
  mosqueId: number;
  category: SathiCategory;
  editingEntry: SathiEntry | null;
}

export default function App() {
  const [mosques, setMosques] = useState<MosqueRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as MosqueRecord[];
        }
      }
    } catch {
      // Fallback to initial dataset if storage is unavailable
    }
    return INITIAL_MOSQUES;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedMosqueId, setSelectedMosqueId] = useState<number>(1);
  const [directoryCategory, setDirectoryCategory] = useState<
    SathiCategory | 'all'
  >('all');
  const [sathiModal, setSathiModal] = useState<SathiModalState | null>(null);
  const [editingMosque, setEditingMosque] = useState<MosqueRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mosques));
    } catch {
      // Ignore storage quota errors
    }
  }, [mosques]);

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

  const handleSaveMosqueInfo = (updated: MosqueRecord) => {
    setMosques((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
    setEditingMosque(null);
    showToast(`${updated.name}-এর তথ্য সংরক্ষণ করা হয়েছে।`);
  };

  const handleImportData = (imported: MosqueRecord[]) => {
    setMosques(imported);
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
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-stone-900">
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
            onEditMosqueInfo={(mosque) => setEditingMosque(mosque)}
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

        {activeTab === 'report' && (
          <PrintExportView
            mosques={mosques}
            onImportData={handleImportData}
            onResetToBaseline={handleResetToBaseline}
          />
        )}
      </main>

      <footer className="no-print border-t border-stone-200 bg-white/60">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>যাত্রাবাড়ী মারকাজ মসজিদ — ৪০১ নং হালকা</p>
          <p>
            ১৪টি মসজিদের সমন্বিত ডিজিটাল ডিরেক্টরি · স্থানীয়ভাবে ব্রাউজারে
            সংরক্ষিত ও প্রিন্টযোগ্য
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

      {editingMosque && (
        <MosqueInfoModal
          mosque={editingMosque}
          onClose={() => setEditingMosque(null)}
          onSave={handleSaveMosqueInfo}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed right-5 bottom-5 z-50 rounded-lg border border-emerald-800/20 bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
