import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowUpRight,
  BookOpen,
  Building2,
  ClipboardList,
  Flag,
  Plus,
  Printer,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { ActiveTab, MosqueRecord, SathiCategory } from '../types/directory';
import {
  getMosqueTotalSathi,
  SUMMARY_CATEGORIES,
  toBn,
} from '../utils/bengali';

interface OverviewViewProps {
  mosques: MosqueRecord[];
  canEdit: boolean;
  onOpenMosque: (mosqueId: number) => void;
  onOpenDirectory: (categoryFilter?: SathiCategory) => void;
  onAddMosque: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

type SortKey = 'id' | 'total' | 'threeChilla';

export const OverviewView: React.FC<OverviewViewProps> = ({
  mosques,
  canEdit,
  onOpenMosque,
  onOpenDirectory,
  onAddMosque,
  onNavigateTab,
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

  // Real data SVG sparkline points across all mosques for the featured hero card
  const sparkline = useMemo(() => {
    const counts = mosques.map((m) => getMosqueTotalSathi(m));
    if (counts.length === 0) return { path: '', lastX: 0, lastY: 20 };
    const maxVal = Math.max(1, ...counts);
    const width = 176;
    const height = 44;
    const padY = 6;
    const stepX = counts.length > 1 ? width / (counts.length - 1) : width;
    const coords = counts.map((val, idx) => ({
      x: Number((idx * stepX).toFixed(1)),
      y: Number(
        (height - padY - (val / maxVal) * (height - padY * 2)).toFixed(1)
      ),
    }));
    const d = coords
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
      .join(' ');
    const last = coords[coords.length - 1];
    return { path: d, lastX: last.x, lastY: last.y };
  }, [mosques]);

  // Real data Donut segments matching the reference "By Category" chart
  const donutSegments = useMemo(() => {
    const threeChilla = totals.byCategory[SathiCategory.ThreeChillaSathi] ?? 0;
    const oneChilla = totals.byCategory[SathiCategory.OneChillaSathi] ?? 0;
    const chatra = totals.byCategory[SathiCategory.ChatraNowjowan] ?? 0;
    const bidesh = totals.byCategory[SathiCategory.Bidesh] ?? 0;

    const groups = [
      {
        label: '৩ চিল্লার সাথী',
        count: threeChilla,
        color: '#0E6F66',
        category: SathiCategory.ThreeChillaSathi,
      },
      {
        label: '১ চিল্লার সাথী',
        count: oneChilla,
        color: '#2FB0A1',
        category: SathiCategory.OneChillaSathi,
      },
      {
        label: 'ওলামায়ে কেরাম',
        count: totals.totalUlama,
        color: '#E59A2E',
        category: SathiCategory.SalwaliUlama,
      },
      {
        label: 'মাস্তুরাত জামাত',
        count: totals.totalMasturat,
        color: '#4F7772',
        category: SathiCategory.MasturatChilla,
      },
      {
        label: 'ছাত্র নওজোয়ান',
        count: chatra,
        color: '#10B981',
        category: SathiCategory.ChatraNowjowan,
      },
      {
        label: 'বিদেশ সফরকারী',
        count: bidesh,
        color: '#95B5B0',
        category: SathiCategory.Bidesh,
      },
    ].filter((g) => g.count > 0);

    const total = Math.max(
      1,
      groups.reduce((acc, g) => acc + g.count, 0)
    );
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return groups.map((g) => {
      const fraction = g.count / total;
      const pct = Math.round(fraction * 100);
      const length = fraction * circumference;
      const offset = -cumulative;
      cumulative += length;
      return {
        ...g,
        pct,
        strokeDasharray: `${length.toFixed(2)} ${circumference.toFixed(2)}`,
        strokeDashoffset: offset.toFixed(2),
      };
    });
  }, [totals]);

  const phoneCoveragePct = Math.round(
    (totals.phoneCount / Math.max(1, totals.grandTotal)) * 100
  );

  return (
    <div className="space-y-7">
      {/* Airy Mint Header Section + Signature Deep Pine-Teal Gradient Card */}
      <section className="rounded-3xl border border-[#CFE4DF] bg-gradient-to-br from-[#E4F2EF] via-[#F2F8F7] to-white p-5 shadow-[0_4px_20px_rgba(14,111,102,0.05)] sm:p-7">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <p className="text-xs font-semibold tracking-wide text-[#0E6F66]">
              যাত্রাবাড়ী মারকাজ মসজিদ · তাবলীগি ও মসজিদ ভিত্তিক সাথী তালিকা
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#102A27] sm:text-3xl">
              ৪০১ নং হালকা — এক নজরে সামগ্রিক চিত্র
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#4F6B67]">
              হালকার অন্তর্ভুক্ত {toBn(mosques.length)}টি জামে ও মাদ্রাসা
              মসজিদের খতিব, ইমাম, মোয়াজ্জিন এবং বিভিন্ন মেয়াদের ওলামা ও
              সাথীগণের পূর্ণাঙ্গ ডিজিটাল হিসাব।
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium text-[#3E5C58] sm:text-sm">
              <span>মোট মসজিদ: {toBn(mosques.length)}টি</span>
              <span aria-hidden="true">·</span>
              <span>তালিকাভুক্ত সাথী: {toBn(totals.grandTotal)} জন</span>
              <span aria-hidden="true">·</span>
              <span>মোবাইল সংযুক্ত: {toBn(totals.phoneCount)} জন</span>
            </div>
          </div>

          {/* Featured Deep Pine-Teal Gradient Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B5A53] via-[#0E6F66] to-[#1D9488] p-5 text-white shadow-[0_10px_28px_rgba(14,111,102,0.28)] sm:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-2xl"
              />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                    <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-teal-100">
                      মোট তালিকাভুক্ত সাথী ও ওলামা
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-2.5">
                      <span className="font-mono text-3xl font-bold tracking-tight tabular-nums">
                        {toBn(totals.grandTotal)} জন
                      </span>
                      <span className="font-mono text-xs font-semibold text-teal-100">
                        {toBn(phoneCoveragePct)}% নম্বরযুক্ত
                      </span>
                    </div>
                  </div>
                </div>

                {sparkline.path && (
                  <svg
                    viewBox="0 0 180 48"
                    className="hidden h-12 w-28 shrink-0 sm:block"
                    aria-hidden="true"
                  >
                    <path
                      d={sparkline.path}
                      fill="none"
                      stroke="rgba(255,255,255,0.65)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx={sparkline.lastX}
                      cy={sparkline.lastY}
                      r="3.5"
                      fill="#FFFFFF"
                    />
                  </svg>
                )}
              </div>

              <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 text-xs text-teal-50">
                <span>অন্তর্ভুক্ত মসজিদ: {toBn(mosques.length)}টি</span>
                <button
                  type="button"
                  onClick={() => onOpenDirectory()}
                  className="inline-flex cursor-pointer items-center gap-1 font-semibold text-white transition-opacity hover:opacity-85"
                >
                  <span>সকল সাথী দেখুন</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Key Metric Cards with Circular Tinted Icon Badges */}
      <section aria-label="মূল পরিসংখ্যান">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#58726E]">সর্বমোট সাথী</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5F3F0] text-[#0E6F66]">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-[#102A27] tabular-nums">
              {toBn(totals.grandTotal)}
            </p>
            <p className="mt-1 text-xs text-[#58726E]">
              {toBn(mosques.length)}টি মসজিদ মিলিয়ে
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#58726E]">৩ চিল্লার সাথী</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F7F0] text-emerald-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-[#0E6F66] tabular-nums">
              {toBn(totals.byCategory[SathiCategory.ThreeChillaSathi] ?? 0)}
            </p>
            <p className="mt-1 text-xs text-[#58726E]">
              মোট সাথীর{' '}
              <span className="font-mono font-semibold text-emerald-700">
                {toBn(
                  Math.round(
                    ((totals.byCategory[SathiCategory.ThreeChillaSathi] ?? 0) /
                      Math.max(1, totals.grandTotal)) *
                      100
                  )
                )}
                %
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#58726E]">ওলামায়ে কেরাম</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5F3F0] text-[#0E6F66]">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-[#102A27] tabular-nums">
              {toBn(totals.totalUlama)}
            </p>
            <p className="mt-1 text-xs text-[#58726E]">
              সালওয়ালী {toBn(totals.byCategory[SathiCategory.SalwaliUlama] ?? 0)} · চিল্লা{' '}
              {toBn(
                (totals.byCategory[SathiCategory.ThreeChillaUlama] ?? 0) +
                  (totals.byCategory[SathiCategory.OneChillaUlama] ?? 0)
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#58726E]">মাস্তুরাত জামাত</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEF3E2] text-[#D97706]">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-[#102A27] tabular-nums">
              {toBn(totals.totalMasturat)}
            </p>
            <p className="mt-1 text-xs text-[#58726E]">
              চিল্লা {toBn(totals.byCategory[SathiCategory.MasturatChilla] ?? 0)} · ১০/১৫ ও ৩ দিন{' '}
              {toBn(
                (totals.byCategory[SathiCategory.MasturatTenFifteenDays] ?? 0) +
                  (totals.byCategory[SathiCategory.MasturatThreeDays] ?? 0)
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Strip (inspired by Reference Screen 1 Quick Actions) */}
      {onNavigateTab && (
        <section aria-label="দ্রুত প্রবেশ" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#102A27]">
              দ্রুত প্রবেশ
            </h2>
            <span className="text-xs text-[#58726E]">
              এক ক্লিকে প্রয়োজনীয় বিভাগে যান
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => onNavigateTab('mosques')}
              className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-[#D9EAE6] bg-white p-4 text-left shadow-[0_2px_12px_rgba(14,111,102,0.03)] transition-all duration-150 hover:border-[#0E6F66]/40 hover:bg-[#F7FBFA]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F3F0] text-[#0E6F66] transition-colors group-hover:bg-[#0E6F66] group-hover:text-white">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#102A27]">মসজিদসমূহ</p>
                <p className="text-xs text-[#58726E]">
                  {toBn(mosques.length)}টি মসজিদ তালিকা
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('directory')}
              className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-[#D9EAE6] bg-white p-4 text-left shadow-[0_2px_12px_rgba(14,111,102,0.03)] transition-all duration-150 hover:border-[#0E6F66]/40 hover:bg-[#F7FBFA]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F3F0] text-[#0E6F66] transition-colors group-hover:bg-[#0E6F66] group-hover:text-white">
                <Search className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#102A27]">সাথী ডিরেক্টরি</p>
                <p className="text-xs text-[#58726E]">নাম ও নম্বর খুঁজুন</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('takaja')}
              className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-[#D9EAE6] bg-white p-4 text-left shadow-[0_2px_12px_rgba(14,111,102,0.03)] transition-all duration-150 hover:border-[#0E6F66]/40 hover:bg-[#F7FBFA]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF3E2] text-[#D97706] transition-colors group-hover:bg-[#E59A2E] group-hover:text-white">
                <Flag className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#102A27]">চলমান তাকাজা</p>
                <p className="text-xs text-[#58726E]">তশকিল ও লক্ষ্যমাত্রা</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('kargoojari')}
              className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-[#D9EAE6] bg-white p-4 text-left shadow-[0_2px_12px_rgba(14,111,102,0.03)] transition-all duration-150 hover:border-[#0E6F66]/40 hover:bg-[#F7FBFA]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F0] text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#102A27]">দৈনিক কারগুজারি</p>
                <p className="text-xs text-[#58726E]">গাস্ত, তালিম ও রিপোর্ট</p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Main Matrix: Mosque-wise Sathi Count Table */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#102A27]">
              মসজিদ ভিত্তিক সাথীর সংখ্যা
            </h2>
            <p className="text-sm text-[#58726E]">
              যেকোনো মসজিদের নামের ওপর ক্লিক করে বিস্তারিত তালিকা ও মোবাইল নম্বর দেখুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B8682]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                placeholder="মসজিদের নাম দিয়ে খুঁজুন..."
                className="w-full rounded-xl border border-[#D5E7E2] bg-white py-2 pr-3 pl-9 text-sm text-[#102A27] placeholder:text-[#7D9793] focus:border-[#0E6F66] focus:ring-2 focus:ring-[#0E6F66]/10 focus:outline-none"
              />
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('report')}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#D5E7E2] bg-white px-3.5 py-2 text-xs font-semibold text-[#1D3F3B] transition-colors hover:bg-[#E5F3F0] hover:text-[#0E6F66]"
              >
                <Printer className="h-3.5 w-3.5 text-[#0E6F66]" />
                <span>প্রিন্ট / PDF</span>
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={onAddMosque}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#E5F3F0] px-3.5 py-2 text-xs font-semibold text-[#0E6F66] transition-colors hover:bg-[#D5ECE6]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>নতুন মসজিদ যুক্ত করুন</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#D9EAE6] bg-white shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9EAE6] bg-[#EBF4F2] text-[#1E3F3B]">
                <th className="w-12 px-3 py-3.5 text-center font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('id')}
                    className="inline-flex cursor-pointer items-center gap-1 hover:text-[#0E6F66]"
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
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-[#0E6F66]"
                      >
                        <span>{cat.shortLabel}</span>
                        <ArrowDownUp className="h-3 w-3 opacity-60" />
                      </button>
                    ) : (
                      cat.shortLabel
                    )}
                  </th>
                ))}
                <th className="bg-[#DFEFEA] px-4 py-3.5 text-center font-bold text-[#0B5A53]">
                  <button
                    type="button"
                    onClick={() => handleSort('total')}
                    className="inline-flex cursor-pointer items-center gap-1 hover:text-[#084741]"
                  >
                    <span>মোট</span>
                    <ArrowDownUp className="h-3 w-3 opacity-70" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF5F3]">
              {sortedMosques.map((mosque) => {
                const total = getMosqueTotalSathi(mosque);
                return (
                  <tr
                    key={mosque.id}
                    onClick={() => onOpenMosque(mosque.id)}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-[#F3FAF8]"
                  >
                    <td className="px-3 py-3 text-center font-mono text-[#7B9591] tabular-nums">
                      {toBn(mosque.id)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#102A27]">
                      <span className="inline-flex items-center gap-1.5 group-hover:text-[#0E6F66]">
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
                              ? 'font-medium text-[#1D3F3B]'
                              : 'text-[#C2D7D3]'
                          }`}
                        >
                          {count > 0 ? toBn(count) : '·'}
                        </td>
                      );
                    })}
                    <td className="bg-[#F4FAF8] px-4 py-3 text-center font-mono font-bold text-[#0E6F66] tabular-nums">
                      {toBn(total)}
                    </td>
                  </tr>
                );
              })}

              {sortedMosques.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-sm text-[#58726E]"
                  >
                    আপনার অনুসন্ধানের সাথে মিলে এমন কোনো মসজিদ পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#C7E0DA] bg-[#EBF4F2] font-bold text-[#102A27]">
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
                <td className="bg-[#0E6F66] px-4 py-3.5 text-center font-mono text-white tabular-nums">
                  {toBn(totals.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Category Distribution: Donut Summary Card + Interactive Section Bars */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#102A27]">
            বিভাগ ভিত্তিক সাথীর বণ্টন
          </h2>
          <p className="text-sm text-[#58726E]">
            যেকোনো বিভাগে ক্লিক করলে সরাসরি উক্ত বিভাগের সাথীদের তালিকা দেখতে পারবেন
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Reference Screen 2 "By Category" Donut Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#D9EAE6] bg-white p-6 shadow-[0_2px_14px_rgba(14,111,102,0.04)] lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102A27]">
                সারসংক্ষেপ অনুপাত
              </h3>
              <span className="font-mono text-xs font-semibold text-[#0E6F66]">
                {toBn(totals.grandTotal)} জন
              </span>
            </div>

            <div className="my-5 flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative h-36 w-36 shrink-0">
                <svg
                  viewBox="0 0 132 132"
                  className="h-full w-full -rotate-90"
                  aria-label="বিভাগ অনুযায়ী বণ্টন চার্ট"
                >
                  <circle
                    cx="66"
                    cy="66"
                    r="52"
                    fill="none"
                    stroke="#E8F3F0"
                    strokeWidth="16"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.label}
                      cx="66"
                      cy="66"
                      r="52"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="16"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-xl font-bold text-[#102A27] tabular-nums">
                    {toBn(totals.grandTotal)}
                  </span>
                  <span className="text-[11px] font-medium text-[#58726E]">
                    মোট সাথী
                  </span>
                </div>
              </div>

              <div className="w-full flex-1 space-y-2.5">
                {donutSegments.map((seg) => (
                  <button
                    key={seg.label}
                    type="button"
                    onClick={() => onOpenDirectory(seg.category)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-xs transition-colors hover:text-[#0E6F66]"
                  >
                    <span className="flex items-center gap-2 font-medium text-[#1D3F3B]">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span>{seg.label}</span>
                    </span>
                    <span className="font-mono font-bold text-[#102A27] tabular-nums">
                      {toBn(seg.pct)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="border-t border-[#EAF3F0] pt-3 text-xs text-[#58726E]">
              প্রতিটি গ্রুপে ক্লিক করে সরাসরি সেই বিভাগের সাথী তালিকা ও নম্বর দেখুন।
            </p>
          </div>

          {/* 10-Category Detailed Interactive Progress Grid */}
          <div className="grid gap-3 rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)] sm:grid-cols-2 lg:col-span-7">
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
                  className="group cursor-pointer rounded-xl border border-[#DFEFEA] bg-[#F6FBFA] p-3.5 text-left transition-all duration-150 hover:border-[#0E6F66]/45 hover:bg-[#EBF4F2]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1D3F3B] group-hover:text-[#0E6F66]">
                      {cat.shortLabel}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#102A27] tabular-nums">
                      {toBn(count)} জন
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#DCECE8]">
                    <div
                      className="h-full rounded-full bg-[#0E6F66] transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
