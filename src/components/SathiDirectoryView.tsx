import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Search,
  X,
} from 'lucide-react';
import { MosqueRecord, SathiCategory } from '../types/directory';
import {
  CATEGORY_META,
  getCategoryMeta,
  normalizeSearchText,
  toBn,
} from '../utils/bengali';
import { PhoneActions } from './PhoneActions';

interface SathiDirectoryViewProps {
  mosques: MosqueRecord[];
  initialCategory?: SathiCategory | 'all';
  onOpenMosque: (mosqueId: number) => void;
  onCopyPhone: (phone: string) => void;
}

interface FlatDirectoryItem {
  key: string;
  mosqueId: number;
  mosqueName: string;
  roleOrCategory: string;
  categoryKey?: SathiCategory;
  name: string;
  phone: string;
  address: string;
  notes: string;
  isOfficial: boolean;
}

export const SathiDirectoryView: React.FC<SathiDirectoryViewProps> = ({
  mosques,
  initialCategory = 'all',
  onOpenMosque,
  onCopyPhone,
}) => {
  const [query, setQuery] = useState('');
  const [mosqueFilter, setMosqueFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<
    SathiCategory | 'all' | 'officials'
  >(initialCategory);
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'has_phone' | 'no_phone'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const allItems = useMemo<FlatDirectoryItem[]>(() => {
    const list: FlatDirectoryItem[] = [];
    for (const m of mosques) {
      if (m.khatib.name.trim()) {
        list.push({
          key: `off-khatib-${m.id}`,
          mosqueId: m.id,
          mosqueName: m.name,
          roleOrCategory: 'খতিব সাহেব',
          name: m.khatib.name,
          phone: m.khatib.phone,
          address: m.address,
          notes: '',
          isOfficial: true,
        });
      }
      if (m.imam.name.trim()) {
        list.push({
          key: `off-imam-${m.id}`,
          mosqueId: m.id,
          mosqueName: m.name,
          roleOrCategory: 'ইমাম সাহেব',
          name: m.imam.name,
          phone: m.imam.phone,
          address: m.address,
          notes: '',
          isOfficial: true,
        });
      }
      if (m.muazzin.name.trim()) {
        list.push({
          key: `off-muazzin-${m.id}`,
          mosqueId: m.id,
          mosqueName: m.name,
          roleOrCategory: 'মোয়াজ্জিন সাহেব',
          name: m.muazzin.name,
          phone: m.muazzin.phone,
          address: m.address,
          notes: '',
          isOfficial: true,
        });
      }

      for (const cat of CATEGORY_META) {
        const entries = m.categories[cat.key] ?? [];
        for (const entry of entries) {
          list.push({
            key: `sathi-${m.id}-${cat.key}-${entry.id}`,
            mosqueId: m.id,
            mosqueName: m.name,
            roleOrCategory: getCategoryMeta(cat.key).shortLabel,
            categoryKey: cat.key,
            name: entry.name,
            phone: entry.phone,
            address: entry.address,
            notes: entry.notes,
            isOfficial: false,
          });
        }
      }
    }
    return list;
  }, [mosques]);

  const filteredItems = useMemo(() => {
    const qNorm = normalizeSearchText(query.trim());
    return allItems.filter((item) => {
      if (mosqueFilter !== 'all' && item.mosqueId !== mosqueFilter) return false;
      if (categoryFilter === 'officials' && !item.isOfficial) return false;
      if (
        categoryFilter !== 'all' &&
        categoryFilter !== 'officials' &&
        item.categoryKey !== categoryFilter
      ) {
        return false;
      }
      if (phoneFilter === 'has_phone' && !item.phone.trim()) return false;
      if (phoneFilter === 'no_phone' && item.phone.trim()) return false;

      if (!qNorm) return true;
      const hay = normalizeSearchText(
        `${item.name} ${item.phone} ${item.mosqueName} ${item.roleOrCategory} ${item.address}`
      );
      return hay.includes(qNorm);
    });
  }, [allItems, query, mosqueFilter, categoryFilter, phoneFilter]);

  const handleCopy = (key: string, phone: string) => {
    onCopyPhone(phone);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1600);
  };

  const hasActiveFilter =
    query.trim() !== '' ||
    mosqueFilter !== 'all' ||
    categoryFilter !== 'all' ||
    phoneFilter !== 'all';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#DCE8F7] bg-gradient-to-r from-[#EBF4FF] via-[#F3F8FF] to-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <p className="text-xs font-semibold text-[#0066E6]">
          সার্চ ও ডিরেক্টরি · ৪০১ নং হালকা
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          সমন্বিত সাথী ও ইমাম-খতিব ডিরেক্টরি
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          পুরো ৪০১ নং হালকার যেকোনো সাথী, ওলামা, খতিব, ইমাম বা মোয়াজ্জিনকে নাম
          অথবা মোবাইল নম্বর দিয়ে তাৎক্ষণিক খুঁজুন।
        </p>
      </section>

      {/* Search & Filter Controls */}
      <section className="rounded-2xl border border-[#E2ECF7] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="নাম বা মোবাইল নম্বর লিখুন (যেমন: 01718 বা মুফতী)..."
              className="w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] py-2.5 pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:bg-white focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="অনুসন্ধান মুছুন"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="মসজিদ অনুযায়ী ফিল্টার"
              value={mosqueFilter}
              onChange={(e) =>
                setMosqueFilter(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="w-full rounded-xl border border-[#DCE8F7] bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#0066E6] focus:outline-none"
            >
              <option value="all">সকল মসজিদ ({toBn(mosques.length)}টি)</option>
              {mosques.map((m) => (
                <option key={m.id} value={m.id}>
                  {toBn(m.id)}. {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="বিভাগ অনুযায়ী ফিল্টার"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value as SathiCategory | 'all' | 'officials'
                )
              }
              className="w-full rounded-xl border border-[#DCE8F7] bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#0066E6] focus:outline-none"
            >
              <option value="all">সকল বিভাগ</option>
              <option value="officials">খতিব / ইমাম / মোয়াজ্জিন</option>
              {CATEGORY_META.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.shortLabel}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="মোবাইল নম্বর অনুযায়ী ফিল্টার"
              value={phoneFilter}
              onChange={(e) =>
                setPhoneFilter(
                  e.target.value as 'all' | 'has_phone' | 'no_phone'
                )
              }
              className="w-full rounded-xl border border-[#DCE8F7] bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#0066E6] focus:outline-none"
            >
              <option value="all">সকল তথ্য</option>
              <option value="has_phone">মোবাইল নম্বর আছে</option>
              <option value="no_phone">মোবাইল নম্বর নেই</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            প্রদর্শিত ফলাফল:{' '}
            <strong className="font-mono text-[#0066E6] tabular-nums">
              {toBn(filteredItems.length)}
            </strong>{' '}
            টি এন্ট্রি
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setMosqueFilter('all');
                setCategoryFilter('all');
                setPhoneFilter('all');
              }}
              className="cursor-pointer font-semibold text-[#0066E6] hover:underline"
            >
              সকল ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </section>

      {/* Results Table */}
      <section className="overflow-hidden rounded-2xl border border-[#E2ECF7] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2ECF7] bg-[#F1F6FC] text-xs font-semibold text-slate-600">
                <th className="w-12 px-4 py-3.5 text-center">ক্রম</th>
                <th className="px-4 py-3.5">নাম</th>
                <th className="px-4 py-3.5">বিভাগ / দায়িত্ব</th>
                <th className="px-4 py-3.5">মসজিদ</th>
                <th className="min-w-[270px] px-4 py-3.5">মোবাইল ও কল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const hasPhone = Boolean(item.phone.trim());
                return (
                  <tr
                    key={item.key}
                    className="transition-colors hover:bg-[#F4F9FF]"
                  >
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-400 tabular-nums">
                      {toBn(idx + 1)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.roleOrCategory}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onOpenMosque(item.mosqueId)}
                        className="inline-flex cursor-pointer items-center gap-1 text-left text-sm text-slate-700 hover:text-[#0066E6] hover:underline"
                      >
                        <span>
                          {toBn(item.mosqueId)}. {item.mosqueName}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {hasPhone ? (
                        <PhoneActions
                          phone={item.phone}
                          copied={copiedKey === item.key}
                          onCopy={() => handleCopy(item.key, item.phone)}
                        />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    কোনো মিল খুঁজে পাওয়া যায়নি। অন্য কোনো নাম বা নম্বর দিয়ে চেষ্টা
                    করুন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
