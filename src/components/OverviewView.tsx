import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowUpRight,
  Building2,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { MosqueRecord, SathiCategory } from '../types/directory';
import {
  getMosqueTotalSathi,
  SUMMARY_CATEGORIES,
  toBn,
} from '../utils/bengali';

interface OverviewViewProps {
  mosques: MosqueRecord[];
  onOpenMosque: (mosqueId: number) => void;
  onOpenDirectory: (categoryFilter?: SathiCategory) => void;
  onAddMosque: () => void;
}

type SortKey = 'id' | 'total' | 'threeChilla';

export const OverviewView: React.FC<OverviewViewProps> = ({
  mosques,
  onOpenMosque,
  onOpenDirectory,
  onAddMosque,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [tableFilter, setTableFilter] = useState('');

  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const cat of SUMMARY_CATEGORIES) {
      byCategory[cat.key] = mosques.reduce(
        (acc, m) => acc + (m.categories[cat.key]?.length ?? 0),
        0
      );
    }
    const grandTotal = mosques.reduce(
      (acc, m) => acc + getMosqueTotalSathi(m),
      0
    );
    const totalUlama =
      (byCategory[SathiCategory.SalwaliUlama] ?? 0) +
      (byCategory[SathiCategory.ThreeChillaUlama] ?? 0) +
      (byCategory[SathiCategory.OneChillaUlama] ?? 0);

    const totalMasturat =
      (byCategory[SathiCategory.MasturatChilla] ?? 0) +
      (byCategory[SathiCategory.MasturatTenFifteenDays] ?? 0) +
      (byCategory[SathiCategory.MasturatThreeDays] ?? 0);

    const phoneCount = mosques.reduce((acc, m) => {
      let count = 0;
      for (const cat of SUMMARY_CATEGORIES) {
        for (const entry of m.categories[cat.key] ?? []) {
          if (entry.phone.trim()) count++;
        }
      }
      return acc + count;
    }, 0);

    return {
      byCategory,
      grandTotal,
      totalUlama,
      totalMasturat,
      phoneCount,
    };
  }, [mosques]);

  const sortedMosques = useMemo(() => {
    const filtered = mosques.filter((m) =>
      tableFilter.trim()
        ? m.name.toLowerCase().includes(tableFilter.trim().toLowerCase()) ||
          toBn(m.id).includes(tableFilter.trim())
        : true
    );

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'id') cmp = a.id - b.id;
      else if (sortKey === 'total')
        cmp = getMosqueTotalSathi(a) - getMosqueTotalSathi(b);
      else if (sortKey === 'threeChilla')
        cmp =
          a.categories[SathiCategory.ThreeChillaSathi].length -
          b.categories[SathiCategory.ThreeChillaSathi].length;
      return sortAsc ? cmp : -cmp;
    });
  }, [mosques, sortKey, sortAsc, tableFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(key === 'id');
    }
  };

  const maxCategoryCount = Math.max(
    1,
    ...SUMMARY_CATEGORIES.map((c) => totals.byCategory[c.key] ?? 0)
  );

  return (
    <div className="space-y-8">
      {/* Clean Sky-Blue Tinted Banner Card (inspired by reference header banner) */}
      <section className="rounded-2xl border border-[#DCE8F7] bg-gradient-to-r from-[#EBF4FF] via-[#F3F8FF] to-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0066E6] text-white shadow-[0_4px_12px_rgba(0,102,230,0.24)] sm:flex">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0066E6]">
                যাত্রাবাড়ী মারকাজ মসজিদ · তাবলীগি ও মসজিদ ভিত্তিক সাথী তালিকা
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                ৪০১ নং হালকা — এক নজরে সামগ্রিক চিত্র
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
                হালকার অন্তর্ভুক্ত {toBn(mosques.length)}টি জামে ও মাদ্রাসা
                মসজিদের খতিব, ইমাম, মোয়াজ্জিন এবং বিভিন্ন মেয়াদের ওলামা ও
                সাথীগণের পূর্ণাঙ্গ ডিজিটাল হিসাব।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 sm:text-sm">
            <span>মোট মসজিদ: {toBn(mosques.length)}টি</span>
            <span aria-hidden="true">·</span>
            <span>তালিকাভুক্ত সাথী: {toBn(totals.grandTotal)} জন</span>
            <span aria-hidden="true">·</span>
            <span>মোবাইল সংযুক্ত: {toBn(totals.phoneCount)} জন</span>
          </div>
        </div>
      </section>

      {/* 4-column Key Metrics Strip (Soft Blue Icon Tiles + Crisp White Cards) */}
      <section aria-label="মূল পরিসংখ্যান">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">সর্বমোট সাথী</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EBF4FF] text-[#0066E6]">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {toBn(totals.grandTotal)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {toBn(mosques.length)}টি মসজিদ মিলিয়ে
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">৩ চিল্লার সাথী</p>
              <span className="font-mono text-xs font-bold text-[#0066E6]">
                {toBn(
                  Math.round(
                    ((totals.byCategory[SathiCategory.ThreeChillaSathi] ?? 0) /
                      Math.max(1, totals.grandTotal)) *
                      100
                  )
                )}
                %
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-[#0066E6] tabular-nums">
              {toBn(totals.byCategory[SathiCategory.ThreeChillaSathi] ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">মোট সাথীর অংশ</p>
          </div>

          <div className="rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <p className="text-xs font-semibold text-slate-500">ওলামায়ে কেরাম</p>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {toBn(totals.totalUlama)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              সালওয়ালী {toBn(totals.byCategory[SathiCategory.SalwaliUlama] ?? 0)} · চিল্লা{' '}
              {toBn(
                (totals.byCategory[SathiCategory.ThreeChillaUlama] ?? 0) +
                  (totals.byCategory[SathiCategory.OneChillaUlama] ?? 0)
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <p className="text-xs font-semibold text-slate-500">মাস্তুরাত জামাত</p>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {toBn(totals.totalMasturat)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              চিল্লা {toBn(totals.byCategory[SathiCategory.MasturatChilla] ?? 0)} · ১০/১৫ ও ৩ দিন{' '}
              {toBn(
                (totals.byCategory[SathiCategory.MasturatTenFifteenDays] ?? 0) +
                  (totals.byCategory[SathiCategory.MasturatThreeDays] ?? 0)
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Main Matrix: Mosque-wise Sathi Count Table */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              মসজিদ ভিত্তিক সাথীর সংখ্যা
            </h2>
            <p className="text-sm text-slate-500">
              যেকোনো মসজিদের নামের ওপর ক্লিক করে বিস্তারিত তালিকা ও মোবাইল নম্বর দেখুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                placeholder="মসজিদের নাম দিয়ে খুঁজুন..."
                className="w-full rounded-xl border border-[#DCE8F7] bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:ring-2 focus:ring-[#0066E6]/10 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={onAddMosque}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#EBF4FF] px-3.5 py-2 text-xs font-semibold text-[#0066E6] transition-colors hover:bg-[#DCEBFF]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>নতুন মসজিদ যুক্ত করুন</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E2ECF7] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2ECF7] bg-[#F1F6FC] text-slate-700">
                <th className="w-12 px-3 py-3.5 text-center font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('id')}
                    className="inline-flex cursor-pointer items-center gap-1 hover:text-[#0066E6]"
                  >
                    <span>নং</span>
                    <ArrowDownUp className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th className="px-4 py-3.5 font-semibold">মসজিদের নাম</th>
                {SUMMARY_CATEGORIES.map((cat) => (
                  <th
                    key={cat.key}
                    className="px-2.5 py-3.5 text-center text-xs font-semibold whitespace-nowrap"
                  >
                    {cat.key === SathiCategory.ThreeChillaSathi ? (
                      <button
                        type="button"
                        onClick={() => handleSort('threeChilla')}
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-[#0066E6]"
                      >
                        <span>{cat.shortLabel}</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    ) : (
                      cat.shortLabel
                    )}
                  </th>
                ))}
                <th className="bg-[#EBF4FF] px-4 py-3.5 text-center font-bold text-[#0052BD]">
                  <button
                    type="button"
                    onClick={() => handleSort('total')}
                    className="inline-flex cursor-pointer items-center gap-1 hover:text-[#003D99]"
                  >
                    <span>মোট</span>
                    <ArrowDownUp className="h-3 w-3 opacity-70" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMosques.map((mosque) => {
                const total = getMosqueTotalSathi(mosque);
                return (
                  <tr
                    key={mosque.id}
                    onClick={() => onOpenMosque(mosque.id)}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-[#F4F9FF]"
                  >
                    <td className="px-3 py-3 text-center font-mono text-slate-400 tabular-nums">
                      {toBn(mosque.id)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <span className="inline-flex items-center gap-1.5 group-hover:text-[#0066E6]">
                        <span>{mosque.name}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </td>
                    {SUMMARY_CATEGORIES.map((cat) => {
                      const count = mosque.categories[cat.key]?.length ?? 0;
                      return (
                        <td
                          key={cat.key}
                          className={`px-2.5 py-3 text-center font-mono tabular-nums ${
                            count > 0
                              ? 'font-medium text-slate-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {count > 0 ? toBn(count) : '·'}
                        </td>
                      );
                    })}
                    <td className="bg-[#F8FBFF] px-4 py-3 text-center font-mono font-bold text-[#0066E6] tabular-nums">
                      {toBn(total)}
                    </td>
                  </tr>
                );
              })}

              {sortedMosques.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    আপনার অনুসন্ধানের সাথে মিলে এমন কোনো মসজিদ পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#D2E3F8] bg-[#F1F6FC] font-bold text-slate-900">
                <td className="px-3 py-3.5 text-center" />
                <td className="px-4 py-3.5">
                  সর্বমোট ({toBn(mosques.length)}টি মসজিদ)
                </td>
                {SUMMARY_CATEGORIES.map((cat) => (
                  <td
                    key={cat.key}
                    className="px-2.5 py-3.5 text-center font-mono tabular-nums"
                  >
                    {toBn(totals.byCategory[cat.key] ?? 0)}
                  </td>
                ))}
                <td className="bg-[#0066E6] px-4 py-3.5 text-center font-mono text-white tabular-nums">
                  {toBn(totals.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Category Distribution Breakdown */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            বিভাগ ভিত্তিক সাথীর বণ্টন
          </h2>
          <p className="text-sm text-slate-500">
            যেকোনো বিভাগে ক্লিক করলে সরাসরি উক্ত বিভাগের সাথীদের তালিকা দেখতে পারবেন
          </p>
        </div>

        <div className="grid gap-3.5 rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:p-6 md:grid-cols-2 lg:grid-cols-3">
          {SUMMARY_CATEGORIES.map((cat) => {
            const count = totals.byCategory[cat.key] ?? 0;
            const widthPct = Math.max(
              3,
              Math.round((count / maxCategoryCount) * 100)
            );
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onOpenDirectory(cat.key)}
                className="group cursor-pointer rounded-xl border border-[#E2ECF7] bg-[#F8FBFF]/60 p-4 text-left transition-all duration-150 hover:border-[#0066E6]/40 hover:bg-[#EBF4FF]/50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-[#0066E6]">
                    {cat.shortLabel}
                  </span>
                  <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    {toBn(count)} জন
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#E2ECF7]">
                  <div
                    className="h-full rounded-full bg-[#0066E6] transition-all duration-300"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
