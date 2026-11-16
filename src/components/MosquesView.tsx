import React, { useMemo, useState } from 'react';
import {
  Edit3,
  MapPin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  MosqueRecord,
  OfficialInfo,
  SathiCategory,
  SathiEntry,
} from '../types/directory';
import {
  CATEGORY_META,
  formatBdPhone,
  getMosqueTotalSathi,
  toBn,
} from '../utils/bengali';
import { PhoneActions } from './PhoneActions';

type OfficialRoleKey = 'khatib' | 'imam' | 'muazzin';

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
  onUpdateOfficial: (
    mosqueId: number,
    role: OfficialRoleKey,
    official: OfficialInfo
  ) => void;
  onAddMosque: () => void;
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
  onUpdateOfficial,
  onAddMosque,
  onCopyPhone,
}) => {
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SathiCategory | 'all'>(
    'all'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingOfficial, setEditingOfficial] = useState<{
    role: OfficialRoleKey;
    name: string;
    phone: string;
  } | null>(null);

  const selectedMosque = useMemo(
    () => mosques.find((m) => m.id === selectedMosqueId) ?? mosques[0],
    [mosques, selectedMosqueId]
  );

  const filteredMosques = useMemo(() => {
    const q = sidebarQuery.trim().toLowerCase();
    if (!q) return mosques;
    return mosques.filter(
      (m) => m.name.toLowerCase().includes(q) || toBn(m.id).includes(q)
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[295px_1fr]">
      {/* Left Mosque Selector Sidebar */}
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-[#E2ECF7] bg-white p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={sidebarQuery}
              onChange={(e) => setSidebarQuery(e.target.value)}
              placeholder="মসজিদ খুঁজুন..."
              className="w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:bg-white focus:outline-none"
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
                    setEditingOfficial(null);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[#0066E6] font-semibold text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)]'
                      : 'text-slate-700 hover:bg-[#F1F6FC]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {toBn(m.id).padStart(2, '০')}
                    </span>
                    <span className="truncate">{m.name}</span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-xs tabular-nums ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {toBn(mTotal)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-[#E2ECF7] pt-3">
            <button
              type="button"
              onClick={onAddMosque}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#EBF4FF] px-3 py-2.5 text-xs font-semibold text-[#0066E6] transition-colors hover:bg-[#DCEBFF]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>নতুন মসজিদ যুক্ত করুন</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Right Mosque Detail Pane */}
      <div className="min-w-0 space-y-6">
        {/* Mosque Masthead */}
        <section className="rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-[#E2ECF7] pb-5 sm:flex-row sm:items-start">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#0066E6]">
                মসজিদ ক্রম নং {toBn(selectedMosque.id)} · যাত্রাবাড়ী মারকাজ ৪০১ নং হালকা
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                {selectedMosque.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-[#0066E6]" aria-hidden="true" />
                <span>
                  {selectedMosque.address.trim()
                    ? selectedMosque.address
                    : 'ঠিকানা সংযুক্ত করা হয়নি'}
                </span>
                <button
                  type="button"
                  onClick={() => onEditMosqueInfo(selectedMosque)}
                  className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#EBF4FF] px-2.5 py-1 text-xs font-semibold text-[#0066E6] transition-colors hover:bg-[#DCEBFF]"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>তথ্য সম্পাদনা</span>
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-end sm:gap-2">
              <div className="text-left sm:text-right">
                <span className="block text-xs text-slate-500">মোট সাথী</span>
                <span className="font-mono text-3xl font-bold text-[#0066E6] tabular-nums">
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
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0066E6] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] transition-colors hover:bg-[#0052BD]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>এই মসজিদে সাথী যোগ করুন</span>
              </button>
            </div>
          </div>

          {/* Khatib / Imam / Muazzin 3-column grid */}
          <div className="mt-5 grid grid-cols-1 divide-y divide-[#E2ECF7] rounded-xl border border-[#E2ECF7] bg-[#F8FBFF] md:grid-cols-3 md:divide-x md:divide-y-0">
            {(
              [
                {
                  role: 'খতিব সাহেব',
                  data: selectedMosque.khatib,
                  key: 'khatib',
                },
                {
                  role: 'ইমাম সাহেব',
                  data: selectedMosque.imam,
                  key: 'imam',
                },
                {
                  role: 'মোয়াজ্জিন সাহেব',
                  data: selectedMosque.muazzin,
                  key: 'muazzin',
                },
              ] as const
            ).map((item) => {
              const hasName = Boolean(item.data.name.trim());
              const hasPhone = Boolean(item.data.phone.trim());
              const isFilled = hasName || hasPhone;
              const isEditingThis = editingOfficial?.role === item.key;
              const copyId = `official-${selectedMosque.id}-${item.key}`;

              if (isEditingThis && editingOfficial) {
                return (
                  <form
                    key={item.key}
                    onSubmit={(e) => {
                      e.preventDefault();
                      onUpdateOfficial(selectedMosque.id, item.key, {
                        name: editingOfficial.name.trim(),
                        phone: formatBdPhone(editingOfficial.phone),
                      });
                      setEditingOfficial(null);
                    }}
                    className="space-y-2.5 bg-white p-4"
                  >
                    <p className="text-xs font-semibold text-[#0066E6]">
                      {item.role}
                    </p>
                    <input
                      type="text"
                      value={editingOfficial.name}
                      onChange={(e) =>
                        setEditingOfficial({
                          ...editingOfficial,
                          name: e.target.value,
                        })
                      }
                      placeholder="নাম লিখুন..."
                      className="w-full rounded-lg border border-[#DCE8F7] px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editingOfficial.phone}
                      onChange={(e) =>
                        setEditingOfficial({
                          ...editingOfficial,
                          phone: e.target.value,
                        })
                      }
                      onBlur={() =>
                        setEditingOfficial((curr) =>
                          curr
                            ? { ...curr, phone: formatBdPhone(curr.phone) }
                            : null
                        )
                      }
                      placeholder="মোবাইল (+880 1711-000 000)"
                      className="w-full rounded-lg border border-[#DCE8F7] px-2.5 py-1.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setEditingOfficial(null)}
                        className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="cursor-pointer rounded-lg bg-[#0066E6] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0052BD]"
                      >
                        সংরক্ষণ
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div key={item.key} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500">
                      {item.role}
                    </p>
                    <div className="flex items-center gap-1">
                      {isFilled ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingOfficial({
                                role: item.key,
                                name: item.data.name,
                                phone: item.data.phone,
                              })
                            }
                            title={`${item.role} সম্পাদনা`}
                            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-[#EBF4FF] hover:text-[#0066E6]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateOfficial(selectedMosque.id, item.key, {
                                name: '',
                                phone: '',
                              })
                            }
                            title={`${item.role} মুছে ফেলুন`}
                            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingOfficial({
                              role: item.key,
                              name: '',
                              phone: '',
                            })
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#EBF4FF] px-2.5 py-1 text-[11px] font-semibold text-[#0066E6] transition-colors hover:bg-[#DCEBFF]"
                        >
                          <Plus className="h-3 w-3" />
                          <span>যুক্ত করুন</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-[15px] font-semibold text-slate-900">
                    {hasName ? item.data.name : '—'}
                  </p>
                  {hasPhone ? (
                    <div className="mt-2">
                      <PhoneActions
                        phone={item.data.phone}
                        copied={copiedKey === copyId}
                        onCopy={() => handleCopy(copyId, item.data.phone)}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">নম্বর নেই</p>
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
            className={`cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'border border-[#DCE8F7] bg-white text-slate-700 hover:bg-[#EBF4FF] hover:text-[#0066E6]'
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
                className={`cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-[#0066E6] text-white shadow-[0_2px_6px_rgba(0,102,230,0.2)]'
                    : 'border border-[#DCE8F7] bg-white text-slate-700 hover:bg-[#EBF4FF] hover:text-[#0066E6]'
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
                className="overflow-hidden rounded-2xl border border-[#E2ECF7] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2ECF7] bg-[#F1F6FC]/90 px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-slate-900">
                      {cat.fullLabel}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                      {toBn(list.length)} জন
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddSathi(selectedMosque.id, cat.key)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#EBF4FF] px-2.5 py-1 text-xs font-semibold text-[#0066E6] transition-colors hover:bg-[#DCEBFF]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>যোগ করুন</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E2ECF7] text-xs font-semibold text-slate-500">
                        <th className="w-12 px-4 py-2.5 text-center">ক্র</th>
                        <th className="px-4 py-2.5">নাম</th>
                        <th className="min-w-[260px] px-4 py-2.5">
                          মোবাইল ও কল
                        </th>
                        <th className="px-4 py-2.5">মন্তব্য</th>
                        <th className="w-24 px-4 py-2.5 text-right">সম্পাদনা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((entry, idx) => {
                        const hasPhone = Boolean(entry.phone.trim());
                        const copyId = `row-${entry.id}`;
                        return (
                          <tr
                            key={entry.id}
                            className="transition-colors hover:bg-[#F4F9FF]"
                          >
                            <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-400 tabular-nums">
                              {toBn(idx + 1)}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-900">
                              {entry.name}
                            </td>
                            <td className="px-4 py-2.5">
                              {hasPhone ? (
                                <PhoneActions
                                  phone={entry.phone}
                                  copied={copiedKey === copyId}
                                  onCopy={() => handleCopy(copyId, entry.phone)}
                                />
                              ) : (
                                <span className="text-xs text-slate-300">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {entry.notes.trim() || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
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
                                  className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-[#EBF4FF] hover:text-[#0066E6]"
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
                                  className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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
                          className="group cursor-pointer bg-[#F8FBFF]/50 transition-colors hover:bg-[#EBF4FF]/70"
                        >
                          <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-400 tabular-nums">
                            {toBn(list.length + blankOffset + 1)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-400 group-hover:text-[#0066E6]">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Plus className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                              <span>নতুন নাম যুক্ত করতে ক্লিক করুন</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-300" />
                          <td className="px-4 py-2.5 text-xs text-slate-300" />
                          <td className="px-4 py-2.5 text-right text-xs text-slate-300" />
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
