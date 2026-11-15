import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Edit3,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import { KargoojariEntry, MosqueRecord } from '../types/directory';
import { toBn } from '../utils/bengali';

interface KargoojariViewProps {
  mosques: MosqueRecord[];
  entries: KargoojariEntry[];
  onSaveEntry: (
    entry: Omit<KargoojariEntry, 'id' | 'createdAt'> & { id?: string }
  ) => void;
  onDeleteEntry: (id: string) => void;
}

function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayISO(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

function formatLongDateBn(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const monthName = BN_MONTHS[m - 1] ?? '';
  return `${toBn(d)} ${monthName} ${toBn(y)}`;
}

export const KargoojariView: React.FC<KargoojariViewProps> = ({
  mosques,
  entries,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const todayISO = getTodayISO();
  const yesterdayISO = getYesterdayISO();

  // Daily entry form state (always ready on page for fast daily logging!)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO);
  const [mosqueId, setMosqueId] = useState<number | 'halqa'>('halqa');
  const [gastDone, setGastDone] = useState(false);
  const [talimDone, setTalimDone] = useState(true);
  const [mashwaraDone, setMashwaraDone] = useState(true);
  const [sathiAttended, setSathiAttended] = useState('');
  const [tashkeelCount, setTashkeelCount] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [summary, setSummary] = useState('');
  const [formError, setFormError] = useState('');
  const [formExpanded, setFormExpanded] = useState(true);

  // Filters
  const [dateScope, setDateScope] = useState<'today' | 'week' | 'custom' | 'all'>('all');
  const [customDate, setCustomDate] = useState<string>(todayISO);
  const [mosqueFilter, setMosqueFilter] = useState<number | 'all' | 'halqa'>('all');

  const resetForm = () => {
    setEditingId(null);
    setDate(todayISO);
    setMosqueId('halqa');
    setGastDone(false);
    setTalimDone(true);
    setMashwaraDone(true);
    setSathiAttended('');
    setTashkeelCount('');
    setReporterName('');
    setSummary('');
    setFormError('');
  };

  const handleEdit = (entry: KargoojariEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setMosqueId(entry.mosqueId);
    setGastDone(entry.gastDone);
    setTalimDone(entry.talimDone);
    setMashwaraDone(entry.mashwaraDone);
    setSathiAttended(entry.sathiAttended ? String(entry.sathiAttended) : '');
    setTashkeelCount(entry.tashkeelCount ? String(entry.tashkeelCount) : '');
    setReporterName(entry.reporterName);
    setSummary(entry.summary);
    setFormError('');
    setFormExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() && !gastDone && !talimDone && !mashwaraDone) {
      setFormError('দয়া করে দৈনিক কারগুজারির বিবরণ লিখুন।');
      return;
    }
    onSaveEntry({
      id: editingId ?? undefined,
      date: date || todayISO,
      mosqueId,
      gastDone,
      talimDone,
      mashwaraDone,
      sathiAttended: Math.max(0, Number(sathiAttended) || 0),
      tashkeelCount: Math.max(0, Number(tashkeelCount) || 0),
      reporterName: reporterName.trim(),
      summary: summary.trim(),
    });
    resetForm();
  };

  const stats = useMemo(() => {
    const todayEntries = entries.filter((e) => e.date === todayISO);
    const totalAttendedToday = todayEntries.reduce(
      (acc, e) => acc + e.sathiAttended,
      0
    );
    const totalTashkeelToday = todayEntries.reduce(
      (acc, e) => acc + e.tashkeelCount,
      0
    );
    const uniqueDays = new Set(entries.map((e) => e.date)).size;
    return {
      todayCount: todayEntries.length,
      totalAttendedToday,
      totalTashkeelToday,
      uniqueDays,
    };
  }, [entries, todayISO]);

  const filteredEntries = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekStartISO = `${sevenDaysAgo.getFullYear()}-${String(
      sevenDaysAgo.getMonth() + 1
    ).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

    return entries
      .filter((e) => {
        if (mosqueFilter !== 'all' && e.mosqueId !== mosqueFilter) return false;
        if (dateScope === 'today' && e.date !== todayISO) return false;
        if (dateScope === 'week' && e.date < weekStartISO) return false;
        if (dateScope === 'custom' && e.date !== customDate) return false;
        return true;
      })
      .sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [entries, mosqueFilter, dateScope, todayISO, customDate]);

  // Group filtered entries by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, KargoojariEntry[]>();
    for (const item of filteredEntries) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return Array.from(map.entries());
  }, [filteredEntries]);

  const getMosqueLabel = (mId: number | 'halqa') => {
    if (mId === 'halqa') return 'সম্পূর্ণ ৪০১ নং হালকা';
    const m = mosques.find((item) => item.id === mId);
    return m ? `${toBn(m.id)}. ${m.name}` : 'অনির্ধারিত মসজিদ';
  };

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <section className="no-print rounded-2xl border border-[#DCE8F7] bg-gradient-to-r from-[#EBF4FF] via-[#F3F8FF] to-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#0066E6]">
              যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              দৈনিক কারগুজারি
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
              প্রতিদিনের গাস্ত, তালিম, মাশওয়ারা, সাথীদের অংশগ্রহণ ও নগদ তশকিলের
              দৈনিক কারগুজারি নিয়মিত এখানে সংরক্ষণ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#DCE8F7] bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#F1F6FC]"
            >
              <Printer className="h-4 w-4 text-[#0066E6]" />
              <span>রিপোর্ট প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={() => setFormExpanded((prev) => !prev)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0066E6] px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] transition-colors hover:bg-[#0052BD]"
            >
              <Plus className="h-4 w-4" />
              <span>{formExpanded ? 'ফরম গুটিয়ে রাখুন' : 'আজকের কারগুজারি যোগ করুন'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Daily Summary Metrics */}
      <section className="no-print grid grid-cols-2 divide-x divide-y divide-[#E2ECF7] overflow-hidden rounded-2xl border border-[#E2ECF7] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:grid-cols-4 sm:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">আজকের কারগুজারি</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-[#0066E6] tabular-nums">
            {toBn(stats.todayCount)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatLongDateBn(todayISO)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">আজ উপস্থিত সাথী</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {toBn(stats.totalAttendedToday)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">আজ নগদ তশকিল</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-emerald-600 tabular-nums">
            {toBn(stats.totalTashkeelToday)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">মোট সংরক্ষিত দিন</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {toBn(stats.uniqueDays)}
          </p>
        </div>
      </section>

      {/* Daily Add / Edit Form */}
      {formExpanded && (
        <section className="no-print rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:p-6">
          <div className="flex items-center justify-between border-b border-[#EEF4FB] pb-3.5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {editingId
                ? 'কারগুজারি সম্পাদনা করুন'
                : 'আজকের / দৈনিক কারগুজারি লিপিবদ্ধ করুন'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="cursor-pointer text-xs font-semibold text-[#0066E6] hover:underline"
              >
                নতুন এন্ট্রিতে ফিরে যান
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  তারিখ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  মসজিদ / হালকা
                </label>
                <select
                  value={mosqueId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMosqueId(v === 'halqa' ? 'halqa' : Number(v));
                  }}
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                >
                  <option value="halqa">সম্পূর্ণ ৪০১ নং হালকা</option>
                  {mosques.map((m) => (
                    <option key={m.id} value={m.id}>
                      {toBn(m.id)}. {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  রিপোর্টকারী সাথী
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="নাম লিখুন (ঐচ্ছিক)"
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3.5 py-2.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  দৈনিক আমল:
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={gastDone}
                    onChange={(e) => setGastDone(e.target.checked)}
                    className="h-4 w-4 rounded border-[#BFD9FA] accent-[#0066E6]"
                  />
                  <span>গাস্ত হয়েছে</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={talimDone}
                    onChange={(e) => setTalimDone(e.target.checked)}
                    className="h-4 w-4 rounded border-[#BFD9FA] accent-[#0066E6]"
                  />
                  <span>তালিম হয়েছে</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={mashwaraDone}
                    onChange={(e) => setMashwaraDone(e.target.checked)}
                    className="h-4 w-4 rounded border-[#BFD9FA] accent-[#0066E6]"
                  />
                  <span>মাশওয়ারা হয়েছে</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    উপস্থিত সাথী
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sathiAttended}
                    onChange={(e) => setSathiAttended(e.target.value)}
                    placeholder="০"
                    className="mt-1 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-1.5 font-mono text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    নগদ তশকিল
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tashkeelCount}
                    onChange={(e) => setTashkeelCount(e.target.value)}
                    placeholder="০"
                    className="mt-1 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-1.5 font-mono text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                দৈনিক কারগুজারির বিবরণ <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="আজকের গাস্ত, তাশকিল, জামাত রওয়ানা বা আগমন, হালকার মাশওয়ারার গুরুত্বপূর্ণ সিদ্ধান্তসমূহ লিখুন..."
                className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:bg-white focus:outline-none"
              />
              {formError && (
                <p className="mt-1 text-xs text-rose-600">{formError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer rounded-xl border border-[#DCE8F7] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#F1F6FC]"
                >
                  বাতিল
                </button>
              )}
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0066E6] px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] transition-colors hover:bg-[#0052BD]"
              >
                <Check className="h-4 w-4" />
                <span>
                  {editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'কারগুজারি সংরক্ষণ করুন'}
                </span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Bar */}
      <section className="no-print flex flex-col justify-between gap-3 rounded-2xl border border-[#E2ECF7] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['all', 'সকল তারিখ'],
              ['today', 'আজকের কারগুজারি'],
              ['week', 'গত ৭ দিন'],
              ['custom', 'নির্দিষ্ট তারিখ'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDateScope(key)}
              className={`cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-colors ${
                dateScope === key
                  ? 'bg-[#0066E6] text-white shadow-[0_2px_8px_rgba(0,102,230,0.2)]'
                  : 'bg-[#F1F6FC] text-slate-700 hover:bg-[#E2EEFC]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {dateScope === 'custom' && (
            <input
              type="date"
              aria-label="তারিখ নির্বাচন"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-1.5 font-mono text-xs text-slate-800 focus:border-[#0066E6] focus:bg-white focus:outline-none"
            />
          )}

          <select
            aria-label="মসজিদ অনুযায়ী কারগুজারি ফিল্টার"
            value={mosqueFilter}
            onChange={(e) => {
              const v = e.target.value;
              setMosqueFilter(
                v === 'all' ? 'all' : v === 'halqa' ? 'halqa' : Number(v)
              );
            }}
            className="rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-800 focus:border-[#0066E6] focus:bg-white focus:outline-none"
          >
            <option value="all">সকল মসজিদ ও হালকা</option>
            <option value="halqa">শুধু সম্পূর্ণ ৪০১ নং হালকা</option>
            {mosques.map((m) => (
              <option key={m.id} value={m.id}>
                {toBn(m.id)}. {m.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Date-grouped Daily Kargoojari Feed */}
      {groupedByDate.length > 0 ? (
        <div className="space-y-6">
          {groupedByDate.map(([dateKey, dayEntries]) => {
            const dateBadge =
              dateKey === todayISO
                ? 'আজ'
                : dateKey === yesterdayISO
                ? 'গতকাল'
                : null;
            return (
              <section key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E2ECF7] pb-2">
                  <Calendar className="h-4 w-4 text-[#0066E6]" />
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {formatLongDateBn(dateKey)}
                  </h3>
                  {dateBadge && (
                    <span className="text-xs font-semibold text-[#0066E6]">
                      · {dateBadge}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs text-slate-500 tabular-nums">
                    {toBn(dayEntries.length)}টি রিপোর্ট
                  </span>
                </div>

                <div className="space-y-3">
                  {dayEntries.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#E2ECF7] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-colors hover:border-[#BFD9FA] print:border-stone-400 print:shadow-none"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-800">
                              {getMosqueLabel(item.mosqueId)}
                            </span>
                            {item.reporterName && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>রিপোর্ট: {item.reporterName}</span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span>
                              গাস্ত: <strong>{item.gastDone ? 'হয়েছে' : 'হয়নি'}</strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              তালিম: <strong>{item.talimDone ? 'হয়েছে' : 'হয়নি'}</strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              মাশওয়ারা:{' '}
                              <strong>{item.mashwaraDone ? 'হয়েছে' : 'হয়নি'}</strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              উপস্থিত:{' '}
                              <strong className="font-mono text-slate-900 tabular-nums">
                                {toBn(item.sathiAttended)} জন
                              </strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              নগদ তশকিল:{' '}
                              <strong className="font-mono text-[#0066E6] tabular-nums">
                                {toBn(item.tashkeelCount)} জন
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="no-print flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            title="সম্পাদনা"
                            className="cursor-pointer rounded-xl border border-[#E2ECF7] p-1.5 text-slate-500 transition-colors hover:bg-[#EBF4FF] hover:text-[#0066E6]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(item.id)}
                            title="মুছে ফেলুন"
                            className="cursor-pointer rounded-xl border border-[#E2ECF7] p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.summary && (
                        <p className="mt-3 whitespace-pre-line border-t border-[#EEF4FB] pt-3 text-sm leading-relaxed text-slate-700">
                          {item.summary}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="rounded-2xl border border-[#E2ECF7] bg-white px-6 py-12 text-center shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF4FF] text-[#0066E6]">
            <Calendar className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-3 text-lg font-bold text-slate-900">
            এই সময়ে কোনো কারগুজারি পাওয়া যায়নি
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            উপরের ফরম থেকে আজকের তারিখ নির্বাচন করে গাস্ত, তালিম, মাশওয়ারা ও
            তশকিলের দৈনিক কারগুজারি সংরক্ষণ করুন।
          </p>
        </section>
      )}
    </div>
  );
};
