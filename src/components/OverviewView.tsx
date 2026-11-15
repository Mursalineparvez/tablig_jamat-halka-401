import React, { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowUpRight, Search } from 'lucide-react';
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
}

type SortKey = 'id' | 'total' | 'threeChilla';

export const OverviewView: React.FC<OverviewViewProps> = ({
  mosques,
  onOpenMosque,
  onOpenDirectory,
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
    <div className="space-y-10">
      {/* Institutional Hero Masthead */}
      <section className="border-b border-stone-200 pb-8 pt-2">
        <p className="text-sm font-medium text-emerald-900">
          যাত্রাবাড়ী মারকাজ মসজিদ · তাবলীগি ও মসজিদ ভিত্তিক সাথী তালিকা
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              ৪০১ নং হালকা — এক নজরে সামগ্রিক চিত্র
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-600">
              হালকার অন্তর্ভুক্ত {toBn(mosques.length)}টি জামে ও মাদ্রাসা
              মসজিদের খতিব, ইমাম, মোয়াজ্জিন এবং বিভিন্ন মেয়াদের ওলামা ও
              সাথীগণের পূর্ণাঙ্গ ডিজিটাল হিসাব।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <span>মোট মসজিদ: {toBn(mosques.length)}টি</span>
            <span aria-hidden="true">·</span>
            <span>মোট তালিকাভুক্ত সাথী: {toBn(totals.grandTotal)} জন</span>
            <span aria-hidden="true">·</span>
            <span>মোবাইল সংযুক্ত: {toBn(totals.phoneCount)} জন</span>
          </div>
        </div>
      </section>

      {/* 4-column Key Metrics Strip */}
      <section aria-label="মূল পরিসংখ্যান">
        <div className="grid grid-cols-2 divide-x divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white sm:grid-cols-4 sm:divide-y-0">
          <div className="p-5 sm:p-6">
            <p className="text-sm font-medium text-stone-500">সর্বমোট সাথী</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">
              {toBn(totals.grandTotal)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {toBn(mosques.length)}টি মসজিদ মিলিয়ে
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm font-medium text-stone-500">৩ চিল্লার সাথী</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-emerald-900 tabular-nums">
              {toBn(totals.byCategory[SathiCategory.ThreeChillaSathi] ?? 0)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              মোট সাথীর{' '}
              {toBn(
                Math.round(
                  ((totals.byCategory[SathiCategory.ThreeChillaSathi] ?? 0) /
                    Math.max(1, totals.grandTotal)) *
                    100
                )
              )}
              %
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm font-medium text-stone-500">ওলামায়ে কেরাম</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">
              {toBn(totals.totalUlama)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              সালওয়ালী {toBn(totals.byCategory[SathiCategory.SalwaliUlama] ?? 0)} · চিল্লা{' '}
              {toBn(
                (totals.byCategory[SathiCategory.ThreeChillaUlama] ?? 0) +
                  (totals.byCategory[SathiCategory.OneChillaUlama] ?? 0)
              )}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm font-medium text-stone-500">মাস্তুরাত জামাত</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">
              {toBn(totals.totalMasturat)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
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
            <h2 className="font-display text-2xl font-bold text-stone-900">
              মসজিদ ভিত্তিক সাথীর সংখ্যা
            </h2>
            <p className="text-sm text-stone-600">
              যেকোনো মসজিদের নামের ওপর ক্লিক করে বিস্তারিত তালিকা ও মোবাইল নম্বর দেখুন
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              placeholder="মসজিদের নাম দিয়ে খুঁজুন..."
              className="w-full rounded-lg border border-stone-300 bg-white py-2 pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/80 text-stone-700">
                <th className="w-12 px-3 py-3 text-center font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('id')}
                    className="inline-flex cursor-pointer items-center gap-1 hover:text-stone-950"
                  >
                    <span>নং</span>
                    <ArrowDownUp className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">মসজিদের নাম</th>
                {SUMMARY_CATEGORIES.map((cat) => (
                  <th
                    key={cat.key}
                    className="px-2.5 py-3 text-center text-xs font-semibold whitespace-nowrap"
                  >
                    {cat.key === SathiCategory.ThreeChillaSathi ? (
                      <button
                        type="button"
                        onClick={() => handleSort('threeChilla')}
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-stone-950"
                      >
                        <span>{cat.shortLabel}</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    ) : (
                      cat.shortLabel
                    )}
                  </th>
                ))}
                <th className="bg-stone-200/50 px-4 py-3 text-center font-bold text-stone-900">
                  <button
                    type="button"
                    onClick={() => handleSort('total')}
                    className="inline-flex cursor-pointer items-center gap-1 hover:text-emerald-900"
                  >
                    <span>মোট</span>
                    <ArrowDownUp className="h-3 w-3 opacity-60" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80">
              {sortedMosques.map((mosque) => {
                const total = getMosqueTotalSathi(mosque);
                return (
                  <tr
                    key={mosque.id}
                    onClick={() => onOpenMosque(mosque.id)}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-emerald-950/[0.03]"
                  >
                    <td className="px-3 py-3 text-center font-mono text-stone-500 tabular-nums">
                      {toBn(mosque.id)}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      <span className="inline-flex items-center gap-1.5 group-hover:text-emerald-900">
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
                              ? 'font-medium text-stone-800'
                              : 'text-stone-300'
                          }`}
                        >
                          {count > 0 ? toBn(count) : '·'}
                        </td>
                      );
                    })}
                    <td className="bg-stone-50 px-4 py-3 text-center font-mono font-bold text-emerald-900 tabular-nums">
                      {toBn(total)}
                    </td>
                  </tr>
                );
              })}

              {sortedMosques.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-sm text-stone-500"
                  >
                    আপনার অনুসন্ধানের সাথে মিলে এমন কোনো মসজিদ পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-300 bg-stone-100 font-bold text-stone-900">
                <td className="px-3 py-3.5 text-center" />
                <td className="px-4 py-3.5">সর্বমোট ({toBn(mosques.length)}টি মসজিদ)</td>
                {SUMMARY_CATEGORIES.map((cat) => (
                  <td
                    key={cat.key}
                    className="px-2.5 py-3.5 text-center font-mono tabular-nums"
                  >
                    {toBn(totals.byCategory[cat.key] ?? 0)}
                  </td>
                ))}
                <td className="bg-emerald-900 px-4 py-3.5 text-center font-mono text-white tabular-nums">
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
          <h2 className="font-display text-2xl font-bold text-stone-900">
            বিভাগ ভিত্তিক সাথীর বণ্টন
          </h2>
          <p className="text-sm text-stone-600">
            যেকোনো বিভাগে ক্লিক করলে সরাসরি উক্ত বিভাগের সাথীদের তালিকা দেখতে পারবেন
          </p>
        </div>

        <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 md:grid-cols-2 lg:grid-cols-3">
          {SUMMARY_CATEGORIES.map((cat) => {
            const count = totals.byCategory[cat.key] ?? 0;
            const widthPct = Math.max(3, Math.round((count / maxCategoryCount) * 100));
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onOpenDirectory(cat.key)}
                className="group cursor-pointer rounded-lg border border-stone-200/80 p-3.5 text-left transition-colors duration-150 hover:border-emerald-800/40 hover:bg-stone-50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-stone-800 group-hover:text-emerald-900">
                    {cat.shortLabel}
                  </span>
                  <span className="font-mono text-base font-bold text-stone-900 tabular-nums">
                    {toBn(count)} জন
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-emerald-800 transition-all duration-300"
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
