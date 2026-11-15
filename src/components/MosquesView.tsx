import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  MosqueRecord,
  SathiCategory,
  SathiEntry,
} from '../types/directory';
import {
  CATEGORY_META,
  getMosqueTotalSathi,
  toBn,
} from '../utils/bengali';

interface MosquesViewProps {
  mosques: MosqueRecord[];
  selectedMosqueId: number;
  onSelectMosque: (id: number) => void;
  onAddSathi: (mosqueId: number, category?: SathiCategory) => void;
  onEditSathi: (
    mosqueId: number,
    category: SathiCategory,
    entry: SathiEntry
  ) => void;
  onDeleteSathi: (
    mosqueId: number,
    category: SathiCategory,
    entryId: string
  ) => void;
  onEditMosqueInfo: (mosque: MosqueRecord) => void;
  onCopyPhone: (phone: string) => void;
}

export const MosquesView: React.FC<MosquesViewProps> = ({
  mosques,
  selectedMosqueId,
  onSelectMosque,
  onAddSathi,
  onEditSathi,
  onDeleteSathi,
  onEditMosqueInfo,
  onCopyPhone,
}) => {
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SathiCategory | 'all'>(
    'all'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedMosque = useMemo(
    () => mosques.find((m) => m.id === selectedMosqueId) ?? mosques[0],
    [mosques, selectedMosqueId]
  );

  const filteredMosques = useMemo(() => {
    const q = sidebarQuery.trim().toLowerCase();
    if (!q) return mosques;
    return mosques.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || toBn(m.id).includes(q)
    );
  }, [mosques, sidebarQuery]);

  const handleCopy = (key: string, phone: string) => {
    onCopyPhone(phone);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1600);
  };

  if (!selectedMosque) return null;

  const totalCount = getMosqueTotalSathi(selectedMosque);

  const visibleCategories = CATEGORY_META.filter((cat) => {
    if (activeCategory !== 'all' && cat.key !== activeCategory) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[290px_1fr]">
      {/* Left Mosque Selector Sidebar */}
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={sidebarQuery}
              onChange={(e) => setSidebarQuery(e.target.value)}
              placeholder="মসজিদ খুঁজুন..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="mt-3 max-h-[58vh] space-y-1 overflow-y-auto pr-0.5">
            {filteredMosques.map((m) => {
              const isSelected = m.id === selectedMosque.id;
              const mTotal = getMosqueTotalSathi(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectMosque(m.id);
                    setActiveCategory('all');
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-emerald-900 font-medium text-white'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isSelected ? 'text-emerald-200' : 'text-stone-400'
                      }`}
                    >
                      {toBn(m.id).padStart(2, '০')}
                    </span>
                    <span className="truncate">{m.name}</span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-xs tabular-nums ${
                      isSelected ? 'text-emerald-100' : 'text-stone-500'
                    }`}
                  >
                    {toBn(mTotal)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Right Mosque Detail Pane */}
      <div className="min-w-0 space-y-6">
        {/* Mosque Masthead */}
        <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-start">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-stone-500">
                মসজিদ ক্রম নং {toBn(selectedMosque.id)} · যাত্রাবাড়ী মারকাজ ৪০১ নং হালকা
              </p>
              <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
                {selectedMosque.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-stone-600">
                <MapPin className="h-4 w-4 text-stone-400" aria-hidden="true" />
                <span>
                  {selectedMosque.address.trim()
                    ? selectedMosque.address
                    : 'ঠিকানা সংযুক্ত করা হয়নি'}
                </span>
                <button
                  type="button"
                  onClick={() => onEditMosqueInfo(selectedMosque)}
                  className="ml-1 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>তথ্য সম্পাদনা</span>
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-end sm:gap-2">
              <div className="text-left sm:text-right">
                <span className="block text-xs text-stone-500">মোট সাথী</span>
                <span className="font-mono text-3xl font-bold text-emerald-900 tabular-nums">
                  {toBn(totalCount)} জন
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAddSathi(
                    selectedMosque.id,
                    activeCategory === 'all' ? undefined : activeCategory
                  )
                }
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-900/20 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>এই মসজিদে সাথী যোগ করুন</span>
              </button>
            </div>
          </div>

          {/* Khatib / Imam / Muazzin 3-column grid */}
          <div className="mt-5 grid grid-cols-1 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-stone-50/60 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              { role: 'খতিব সাহেব', data: selectedMosque.khatib, key: 'khatib' },
              { role: 'ইমাম সাহেব', data: selectedMosque.imam, key: 'imam' },
              {
                role: 'মোয়াজ্জিন সাহেব',
                data: selectedMosque.muazzin,
                key: 'muazzin',
              },
            ].map((item) => {
              const hasPhone = Boolean(item.data.phone.trim());
              const copyId = `official-${selectedMosque.id}-${item.key}`;
              return (
                <div key={item.key} className="p-4">
                  <p className="text-xs font-medium text-stone-500">
                    {item.role}
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-stone-900">
                    {item.data.name.trim() ? item.data.name : '—'}
                  </p>
                  {hasPhone ? (
                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href={`tel:${item.data.phone.replace(/[^\d+]/g, '')}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-emerald-900 hover:underline tabular-nums"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{item.data.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(copyId, item.data.phone)}
                        title="নম্বর কপি করুন"
                        className="inline-flex cursor-pointer items-center gap-1 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[11px] text-stone-600 hover:bg-stone-100"
                      >
                        {copiedKey === copyId ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-700" />
                            <span>কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-stone-400">নম্বর নেই</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
            }`}
          >
            সকল বিভাগ ({toBn(totalCount)})
          </button>
          {CATEGORY_META.map((cat) => {
            const count = selectedMosque.categories[cat.key]?.length ?? 0;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-emerald-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                {cat.shortLabel} ({toBn(count)})
              </button>
            );
          })}
        </div>

        {/* Category Tables */}
        <div className="space-y-6">
          {visibleCategories.map((cat) => {
            const list = selectedMosque.categories[cat.key] ?? [];
            return (
              <section
                key={cat.key}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/90 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-stone-900">
                      {cat.fullLabel}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-stone-600 tabular-nums">
                      {toBn(list.length)} জন
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddSathi(selectedMosque.id, cat.key)}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-emerald-900 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>যোগ করুন</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500">
                        <th className="w-12 px-4 py-2.5 text-center">ক্র</th>
                        <th className="px-4 py-2.5">নাম</th>
                        <th className="w-48 px-4 py-2.5">মোবাইল নম্বর</th>
                        <th className="px-4 py-2.5">ঠিকানা</th>
                        <th className="px-4 py-2.5">মন্তব্য</th>
                        <th className="w-24 px-4 py-2.5 text-right">সম্পাদনা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {list.map((entry, idx) => {
                        const hasPhone = Boolean(entry.phone.trim());
                        const copyId = `row-${entry.id}`;
                        return (
                          <tr
                            key={entry.id}
                            className="transition-colors hover:bg-stone-50"
                          >
                            <td className="px-4 py-2.5 text-center font-mono text-xs text-stone-500 tabular-nums">
                              {toBn(idx + 1)}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-stone-900">
                              {entry.name}
                            </td>
                            <td className="px-4 py-2.5">
                              {hasPhone ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${entry.phone.replace(
                                      /[^\d+]/g,
                                      ''
                                    )}`}
                                    className="font-mono text-xs font-medium text-emerald-900 hover:underline tabular-nums"
                                  >
                                    {entry.phone}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(copyId, entry.phone)
                                    }
                                    aria-label="মোবাইল নম্বর কপি করুন"
                                    className="cursor-pointer text-stone-400 hover:text-stone-700"
                                  >
                                    {copiedKey === copyId ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-stone-300">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-stone-600">
                              {entry.address.trim() || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-stone-600">
                              {entry.notes.trim() || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onEditSathi(
                                      selectedMosque.id,
                                      cat.key,
                                      entry
                                    )
                                  }
                                  title="সম্পাদনা"
                                  className="cursor-pointer rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onDeleteSathi(
                                      selectedMosque.id,
                                      cat.key,
                                      entry.id
                                    )
                                  }
                                  title="মুছে ফেলুন"
                                  className="cursor-pointer rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Always include 2 blank rows for adding new entries */}
                      {[0, 1].map((blankOffset) => (
                        <tr
                          key={`blank-${cat.key}-${blankOffset}`}
                          onClick={() => onAddSathi(selectedMosque.id, cat.key)}
                          className="group cursor-pointer bg-stone-50/40 transition-colors hover:bg-emerald-950/[0.03]"
                        >
                          <td className="px-4 py-2.5 text-center font-mono text-xs text-stone-400 tabular-nums">
                            {toBn(list.length + blankOffset + 1)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-stone-400 group-hover:text-emerald-900">
                            <span className="inline-flex items-center gap-1">
                              <Plus className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                              <span>নতুন নাম যুক্ত করতে ক্লিক করুন</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-stone-300" />
                          <td className="px-4 py-2.5 text-xs text-stone-300" />
                          <td className="px-4 py-2.5 text-xs text-stone-300" />
                          <td className="px-4 py-2.5 text-right text-xs text-stone-300" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
