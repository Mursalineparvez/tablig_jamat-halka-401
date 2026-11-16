import React, { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  Edit3,
  Flag,
  Plus,
  Printer,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  KargoojariEntry,
  KargoojariSathiItem,
  MosqueRecord,
  SathiCategory,
  TakazaEntry,
  TakazaType,
} from '../types/directory';
import {
  CATEGORY_META,
  formatBdPhone,
  getCategoryMeta,
  TAKAZA_TYPE_LABELS,
  toBn,
} from '../utils/bengali';
import { PhoneActions } from './PhoneActions';

export interface AssignKargoojariToMosquePayload {
  kargoojariId: string;
  kargSathiId: string;
  mosqueId: number;
  category: SathiCategory;
  name: string;
  phone: string;
  notes: string;
}

export interface AssignKargoojariToTakazaPayload {
  kargoojariId: string;
  kargSathiId: string;
  sathiName: string;
  sathiPhone: string;
  existingTakazaId?: string;
  newTakaza?: {
    title: string;
    mosqueId: number | 'halqa';
    type: TakazaType;
    targetCount: number;
    dueDate: string;
    notes: string;
  };
}

interface KargoojariViewProps {
  mosques: MosqueRecord[];
  takazas: TakazaEntry[];
  entries: KargoojariEntry[];
  onSaveEntry: (
    entry: Omit<KargoojariEntry, 'id' | 'createdAt'> & { id?: string }
  ) => void;
  onDeleteEntry: (id: string) => void;
  onSaveKargoojariSathi: (
    kargoojariId: string,
    sathi: Omit<KargoojariSathiItem, 'id'> & { id?: string }
  ) => void;
  onDeleteKargoojariSathi: (kargoojariId: string, sathiId: string) => void;
  onAssignToMosque: (payload: AssignKargoojariToMosquePayload) => void;
  onAssignToTakaza: (payload: AssignKargoojariToTakazaPayload) => void;
  onCopyPhone: (phone: string) => void;
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
  takazas,
  entries,
  onSaveEntry,
  onDeleteEntry,
  onSaveKargoojariSathi,
  onDeleteKargoojariSathi,
  onAssignToMosque,
  onAssignToTakaza,
  onCopyPhone,
}) => {
  const todayISO = getTodayISO();
  const yesterdayISO = getYesterdayISO();

  // Daily entry form state
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
  const [formSathis, setFormSathis] = useState<KargoojariSathiItem[]>([]);
  const [draftSathiName, setDraftSathiName] = useState('');
  const [draftSathiPhone, setDraftSathiPhone] = useState('');
  const [draftSathiNotes, setDraftSathiNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formExpanded, setFormExpanded] = useState(true);

  // Filters
  const [dateScope, setDateScope] = useState<
    'today' | 'week' | 'custom' | 'all'
  >('all');
  const [customDate, setCustomDate] = useState<string>(todayISO);
  const [mosqueFilter, setMosqueFilter] = useState<number | 'all' | 'halqa'>(
    'all'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick Add/Edit Sathi inside an existing Kargoojari card
  const [sathiModal, setSathiModal] = useState<{
    kargoojariId: string;
    editingSathi: KargoojariSathiItem | null;
  } | null>(null);
  const [modalSathiName, setModalSathiName] = useState('');
  const [modalSathiPhone, setModalSathiPhone] = useState('');
  const [modalSathiNotes, setModalSathiNotes] = useState('');
  const [modalSathiError, setModalSathiError] = useState('');

  // Assign Kargoojari Sathi -> Mosque Section Modal
  const [mosqueAssignModal, setMosqueAssignModal] = useState<{
    kargoojariId: string;
    defaultMosqueId: number;
    sathi: KargoojariSathiItem;
  } | null>(null);
  const [assignMosqueId, setAssignMosqueId] = useState<number>(
    mosques[0]?.id ?? 1
  );
  const [assignCategory, setAssignCategory] = useState<SathiCategory>(
    SathiCategory.ThreeChillaSathi
  );
  const [assignName, setAssignName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Assign Kargoojari Sathi -> Takaza Modal
  const [takazaAssignModal, setTakazaAssignModal] = useState<{
    kargoojariId: string;
    defaultMosqueId: number | 'halqa';
    sathi: KargoojariSathiItem;
  } | null>(null);
  const [takazaMode, setTakazaMode] = useState<'existing' | 'new'>('existing');
  const [selectedTakazaId, setSelectedTakazaId] = useState<string>('');
  const [newTakazaTitle, setNewTakazaTitle] = useState('');
  const [newTakazaType, setNewTakazaType] = useState<TakazaType>('three_days');
  const [newTakazaMosqueId, setNewTakazaMosqueId] = useState<number | 'halqa'>(
    'halqa'
  );
  const [newTakazaTarget, setNewTakazaTarget] = useState('10');
  const [newTakazaDueDate, setNewTakazaDueDate] = useState('');
  const [takazaAssignError, setTakazaAssignError] = useState('');

  const handleCopy = (key: string, phone: string) => {
    onCopyPhone(phone);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1800);
  };

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
    setFormSathis([]);
    setDraftSathiName('');
    setDraftSathiPhone('');
    setDraftSathiNotes('');
    setFormError('');
  };

  const handleAddDraftSathi = () => {
    if (!draftSathiName.trim()) return;
    setFormSathis((prev) => [
      ...prev,
      {
        id: `ks-${Date.now()}-${prev.length + 1}`,
        name: draftSathiName.trim(),
        phone: formatBdPhone(draftSathiPhone),
        notes: draftSathiNotes.trim(),
      },
    ]);
    setDraftSathiName('');
    setDraftSathiPhone('');
    setDraftSathiNotes('');
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
    setFormSathis(entry.sathis ?? []);
    setDraftSathiName('');
    setDraftSathiPhone('');
    setDraftSathiNotes('');
    setFormError('');
    setFormExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSathis = [...formSathis];
    if (draftSathiName.trim()) {
      finalSathis.push({
        id: `ks-${Date.now()}-${finalSathis.length + 1}`,
        name: draftSathiName.trim(),
        phone: formatBdPhone(draftSathiPhone),
        notes: draftSathiNotes.trim(),
      });
    }

    if (
      !summary.trim() &&
      finalSathis.length === 0 &&
      !gastDone &&
      !talimDone &&
      !mashwaraDone
    ) {
      setFormError('দয়া করে দৈনিক কারগুজারির বিবরণ বা সাথীর নাম লিখুন।');
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
      tashkeelCount: Math.max(
        0,
        Number(tashkeelCount) || finalSathis.length || 0
      ),
      reporterName: reporterName.trim(),
      summary: summary.trim(),
      sathis: finalSathis,
    });
    resetForm();
  };

  // Modal openers
  const openAddSathiModal = (
    kargoojariId: string,
    editingSathi: KargoojariSathiItem | null = null
  ) => {
    setSathiModal({ kargoojariId, editingSathi });
    setModalSathiName(editingSathi?.name ?? '');
    setModalSathiPhone(editingSathi?.phone ?? '');
    setModalSathiNotes(editingSathi?.notes ?? '');
    setModalSathiError('');
  };

  const openMosqueAssignModal = (
    kargoojariId: string,
    kargMosqueId: number | 'halqa',
    sathi: KargoojariSathiItem
  ) => {
    const fallbackMosqueId =
      sathi.assignedMosqueId ??
      (typeof kargMosqueId === 'number' ? kargMosqueId : mosques[0]?.id ?? 1);
    setMosqueAssignModal({
      kargoojariId,
      defaultMosqueId: fallbackMosqueId,
      sathi,
    });
    setAssignMosqueId(fallbackMosqueId);
    setAssignCategory(
      sathi.assignedCategory ?? SathiCategory.ChatraNowjowan
    );
    setAssignName(sathi.name);
    setAssignPhone(sathi.phone);
    setAssignNotes(sathi.notes);
  };

  const openTakazaAssignModal = (
    kargoojariId: string,
    kargMosqueId: number | 'halqa',
    sathi: KargoojariSathiItem
  ) => {
    const activeTakazas = takazas.filter((t) => t.status !== 'completed');
    const firstAvailable = activeTakazas[0] ?? takazas[0];
    setTakazaAssignModal({
      kargoojariId,
      defaultMosqueId: kargMosqueId,
      sathi,
    });
    if (firstAvailable) {
      setTakazaMode('existing');
      setSelectedTakazaId(sathi.assignedTakazaId ?? firstAvailable.id);
    } else {
      setTakazaMode('new');
      setSelectedTakazaId('');
    }
    setNewTakazaTitle(sathi.notes.trim() || '৩ দিনের জামাত তাশকিল');
    setNewTakazaType('three_days');
    setNewTakazaMosqueId(kargMosqueId);
    setNewTakazaTarget('10');
    setNewTakazaDueDate('');
    setTakazaAssignError('');
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

  const getAssignedMosqueShort = (mId?: number, cat?: SathiCategory) => {
    if (!mId || !cat) return null;
    const m = mosques.find((item) => item.id === mId);
    const c = getCategoryMeta(cat);
    if (!m) return c.shortLabel;
    return `${toBn(m.id)}. ${m.name} · ${c.shortLabel}`;
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
              প্রতিদিনের গাস্ত, তালিম, মাশওয়ারা ও তাশকিলকৃত সাথীদের নাম মসজিদ
              ফরম্যাটে সংরক্ষণ করুন এবং সরাসরি যেকোনো মসজিদের যেকোনো বিভাগ বা
              চলমান তাকাজায় যুক্ত করুন।
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
              <span>
                {formExpanded
                  ? 'ফরম গুটিয়ে রাখুন'
                  : 'আজকের কারগুজারি যোগ করুন'}
              </span>
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

            {/* Structured Sathis List inside Form (Mosque Table Format) */}
            <div className="overflow-hidden rounded-2xl border border-[#DCE8F7] bg-[#F8FBFF]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2ECF7] bg-[#F1F6FC] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#0066E6]" />
                  <span className="text-xs font-bold text-slate-800">
                    কারগুজারিতে যুক্ত / তাশকিলকৃত সাথীদের নাম (মসজিদ ফরম্যাটে)
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {toBn(formSathis.length)} জন যুক্ত
                </span>
              </div>

              {formSathis.length > 0 && (
                <div className="overflow-x-auto bg-white">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2ECF7] text-slate-500">
                        <th className="w-10 px-3 py-2 text-center">ক্র</th>
                        <th className="px-3 py-2">নাম</th>
                        <th className="px-3 py-2">মোবাইল নম্বর</th>
                        <th className="px-3 py-2">মন্তব্য / তাকাজা</th>
                        <th className="w-14 px-3 py-2 text-right">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formSathis.map((s, idx) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2 text-center font-mono text-slate-400 tabular-nums">
                            {toBn(idx + 1)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            {s.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                            {formatBdPhone(s.phone) || '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {s.notes || '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setFormSathis((prev) =>
                                  prev.filter((item) => item.id !== s.id)
                                )
                              }
                              title="সরিয়ে দিন"
                              className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-12">
                <input
                  type="text"
                  value={draftSathiName}
                  onChange={(e) => setDraftSathiName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDraftSathi();
                    }
                  }}
                  placeholder="সাথীর নাম (যেমন: ভাই মোঃ নাঈম)"
                  className="rounded-xl border border-[#DCE8F7] bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:outline-none sm:col-span-4"
                />
                <input
                  type="text"
                  value={draftSathiPhone}
                  onChange={(e) => setDraftSathiPhone(e.target.value)}
                  onBlur={() => setDraftSathiPhone((prev) => formatBdPhone(prev))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDraftSathi();
                    }
                  }}
                  placeholder="+880 1711-000 000"
                  className="rounded-xl border border-[#DCE8F7] bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:outline-none sm:col-span-3"
                />
                <input
                  type="text"
                  value={draftSathiNotes}
                  onChange={(e) => setDraftSathiNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDraftSathi();
                    }
                  }}
                  placeholder="মন্তব্য / যে তাকাজায় রাজি (যেমন: ৩ দিনের জামাত)"
                  className="rounded-xl border border-[#DCE8F7] bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066E6] focus:outline-none sm:col-span-3"
                />
                <button
                  type="button"
                  onClick={handleAddDraftSathi}
                  className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#BFD9FA] bg-[#EBF4FF] px-3 py-2 text-xs font-semibold text-[#0066E6] transition-colors hover:bg-[#DCEBFF] sm:col-span-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>যোগ করুন</span>
                </button>
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
                  {editingId
                    ? 'পরিবর্তন সংরক্ষণ করুন'
                    : 'কারগুজারি সংরক্ষণ করুন'}
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

                <div className="space-y-4">
                  {dayEntries.map((item) => {
                    const cardSathis = item.sathis ?? [];
                    return (
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
                                গাস্ত:{' '}
                                <strong>
                                  {item.gastDone ? 'হয়েছে' : 'হয়নি'}
                                </strong>
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                তালিম:{' '}
                                <strong>
                                  {item.talimDone ? 'হয়েছে' : 'হয়নি'}
                                </strong>
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                মাশওয়ারা:{' '}
                                <strong>
                                  {item.mashwaraDone ? 'হয়েছে' : 'হয়নি'}
                                </strong>
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
                              onClick={() => openAddSathiModal(item.id, null)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#BFD9FA] bg-[#EBF4FF] px-2.5 py-1.5 text-xs font-semibold text-[#0066E6] transition-colors hover:bg-[#DCEBFF]"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>সাথী যোগ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              title="কারগুজারি সম্পাদনা"
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

                        {/* Structured Sathi Table in exact Mosque Directory Format */}
                        <div className="mt-4 overflow-hidden rounded-2xl border border-[#E2ECF7] bg-white">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2ECF7] bg-[#F1F6FC]/90 px-4 py-2.5">
                            <span className="text-xs font-bold text-slate-800">
                              তাশকিল / যুক্তকৃত সাথী তালিকা ({toBn(cardSathis.length)}{' '}
                              জন)
                            </span>
                            <button
                              type="button"
                              onClick={() => openAddSathiModal(item.id, null)}
                              className="no-print inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#EBF4FF] px-2.5 py-1 text-xs font-semibold text-[#0066E6] hover:bg-[#DCEBFF]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>নতুন সাথী যুক্ত করুন</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                              <thead>
                                <tr className="border-b border-[#E2ECF7] text-xs font-semibold text-slate-500">
                                  <th className="w-12 px-4 py-2.5 text-center">
                                    ক্র
                                  </th>
                                  <th className="px-4 py-2.5">নাম</th>
                                  <th className="min-w-[230px] px-4 py-2.5">
                                    মোবাইল ও কল
                                  </th>
                                  <th className="px-4 py-2.5">মন্তব্য</th>
                                  <th className="no-print min-w-[240px] px-4 py-2.5 text-right">
                                    মসজিদ ও তাকাজায় যুক্ত
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {cardSathis.map((s, idx) => {
                                  const copyId = `karg-${item.id}-${s.id}`;
                                  const assignedMosqueText =
                                    getAssignedMosqueShort(
                                      s.assignedMosqueId,
                                      s.assignedCategory
                                    );
                                  return (
                                    <tr
                                      key={s.id}
                                      className="transition-colors hover:bg-[#F4F9FF]"
                                    >
                                      <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-400 tabular-nums">
                                        {toBn(idx + 1)}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <p className="font-medium text-slate-900">
                                          {s.name}
                                        </p>
                                        {(assignedMosqueText ||
                                          s.assignedTakazaTitle) && (
                                          <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
                                            {assignedMosqueText && (
                                              <span className="font-medium text-[#0066E6]">
                                                মসজিদে যুক্ত: {assignedMosqueText}
                                              </span>
                                            )}
                                            {s.assignedTakazaTitle && (
                                              <span className="font-medium text-emerald-700">
                                                তাকাজায় যুক্ত:{' '}
                                                {s.assignedTakazaTitle}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {s.phone.trim() ? (
                                          <PhoneActions
                                            phone={s.phone}
                                            copied={copiedKey === copyId}
                                            onCopy={() =>
                                              handleCopy(copyId, s.phone)
                                            }
                                          />
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openAddSathiModal(item.id, s)
                                            }
                                            className="no-print cursor-pointer text-xs text-slate-400 hover:text-[#0066E6] hover:underline"
                                          >
                                            + নম্বর যোগ করুন
                                          </button>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5 text-xs text-slate-600">
                                        {s.notes.trim() || '—'}
                                      </td>
                                      <td className="no-print px-4 py-2.5 text-right">
                                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openMosqueAssignModal(
                                                item.id,
                                                item.mosqueId,
                                                s
                                              )
                                            }
                                            title="যেকোনো মসজিদের যেকোনো বিভাগে যুক্ত করুন"
                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#BFD9FA] bg-[#EBF4FF] px-2 py-1 text-[11px] font-semibold text-[#0066E6] transition-colors hover:bg-[#0066E6] hover:text-white whitespace-nowrap"
                                          >
                                            <Building2 className="h-3 w-3" />
                                            <span>মসজিদে যুক্ত</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              openTakazaAssignModal(
                                                item.id,
                                                item.mosqueId,
                                                s
                                              )
                                            }
                                            title="যে তাকাজায় রাজি হয়েছেন তাতে যুক্ত করুন"
                                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white whitespace-nowrap"
                                          >
                                            <Flag className="h-3 w-3" />
                                            <span>তাকাজায় যুক্ত</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              openAddSathiModal(item.id, s)
                                            }
                                            title="তথ্য সম্পাদনা"
                                            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-[#EBF4FF] hover:text-[#0066E6]"
                                          >
                                            <Edit3 className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onDeleteKargoojariSathi(
                                                item.id,
                                                s.id
                                              )
                                            }
                                            title="তালিকা থেকে সরান"
                                            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Quick blank row to add a new Sathi directly */}
                                <tr
                                  onClick={() =>
                                    openAddSathiModal(item.id, null)
                                  }
                                  className="no-print group cursor-pointer bg-[#F8FBFF]/60 transition-colors hover:bg-[#EBF4FF]/70"
                                >
                                  <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-400 tabular-nums">
                                    {toBn(cardSathis.length + 1)}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-400 group-hover:text-[#0066E6]">
                                    <span className="inline-flex items-center gap-1 font-medium">
                                      <Plus className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                                      <span>নতুন সাথী যুক্ত করতে ক্লিক করুন</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-300" />
                                  <td className="px-4 py-2.5 text-xs text-slate-300" />
                                  <td className="px-4 py-2.5 text-xs text-slate-300" />
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </article>
                    );
                  })}
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

      {/* Modal: Add / Edit Sathi in Kargoojari Table */}
      {sathiModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="karg-sathi-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E2ECF7] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2ECF7] bg-[#F8FBFF] px-5 py-4 rounded-t-2xl">
              <h2
                id="karg-sathi-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                {sathiModal.editingSathi
                  ? 'সাথীর তথ্য সম্পাদনা'
                  : 'কারগুজারিতে নতুন সাথী যুক্ত করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setSathiModal(null)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-[#EBF4FF] hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!modalSathiName.trim()) {
                  setModalSathiError('দয়া করে সাথীর নাম লিখুন।');
                  return;
                }
                onSaveKargoojariSathi(sathiModal.kargoojariId, {
                  id: sathiModal.editingSathi?.id,
                  name: modalSathiName.trim(),
                  phone: formatBdPhone(modalSathiPhone),
                  notes: modalSathiNotes.trim(),
                  assignedMosqueId: sathiModal.editingSathi?.assignedMosqueId,
                  assignedCategory: sathiModal.editingSathi?.assignedCategory,
                  assignedTakazaId: sathiModal.editingSathi?.assignedTakazaId,
                  assignedTakazaTitle:
                    sathiModal.editingSathi?.assignedTakazaTitle,
                });
                setSathiModal(null);
              }}
              className="space-y-4 p-5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  নাম <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={modalSathiName}
                  onChange={(e) => {
                    setModalSathiName(e.target.value);
                    if (modalSathiError) setModalSathiError('');
                  }}
                  placeholder="যেমন: ভাই মোঃ নাঈম"
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                />
                {modalSathiError && (
                  <p className="mt-1 text-xs text-rose-600">
                    {modalSathiError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={modalSathiPhone}
                  onChange={(e) => setModalSathiPhone(e.target.value)}
                  onBlur={() => setModalSathiPhone((prev) => formatBdPhone(prev))}
                  placeholder="যেমন: +880 1711-000 000"
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  মন্তব্য
                </label>
                <input
                  type="text"
                  value={modalSathiNotes}
                  onChange={(e) => setModalSathiNotes(e.target.value)}
                  placeholder="যেমন: ৩ দিনের জামাত (১৯, ২০, ২১ নভেম্বর)"
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#E2ECF7] pt-4">
                <button
                  type="button"
                  onClick={() => setSathiModal(null)}
                  className="cursor-pointer rounded-xl border border-[#DCE8F7] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#F1F6FC]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#0066E6] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] hover:bg-[#0052BD]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Kargoojari Sathi to ANY Mosque & ANY Section */}
      {mosqueAssignModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-mosque-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E2ECF7] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2ECF7] bg-[#F8FBFF] px-5 py-4 rounded-t-2xl">
              <h2
                id="assign-mosque-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                মসজিদ ও বিভাগে যুক্ত করুন
              </h2>
              <button
                type="button"
                onClick={() => setMosqueAssignModal(null)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-[#EBF4FF] hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!assignName.trim()) return;
                onAssignToMosque({
                  kargoojariId: mosqueAssignModal.kargoojariId,
                  kargSathiId: mosqueAssignModal.sathi.id,
                  mosqueId: assignMosqueId,
                  category: assignCategory,
                  name: assignName.trim(),
                  phone: formatBdPhone(assignPhone),
                  notes: assignNotes.trim(),
                });
                setMosqueAssignModal(null);
              }}
              className="space-y-4 p-5"
            >
              <p className="rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-slate-600">
                হালকার যেকোনো মসজিদের যেকোনো বিভাগে এই সাথীর নাম, মোবাইল নম্বর ও
                মন্তব্য সরাসরি যুক্ত হয়ে যাবে।
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    মসজিদ নির্বাচন করুন
                  </label>
                  <select
                    value={assignMosqueId}
                    onChange={(e) => setAssignMosqueId(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:outline-none"
                  >
                    {mosques.map((m) => (
                      <option key={m.id} value={m.id}>
                        {toBn(m.id)}. {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    বিভাগ (Section) নির্বাচন করুন
                  </label>
                  <select
                    value={assignCategory}
                    onChange={(e) =>
                      setAssignCategory(e.target.value as SathiCategory)
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:outline-none"
                  >
                    {CATEGORY_META.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  নাম
                </label>
                <input
                  type="text"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={assignPhone}
                    onChange={(e) => setAssignPhone(e.target.value)}
                    onBlur={() => setAssignPhone((prev) => formatBdPhone(prev))}
                    placeholder="+880 1711-000 000"
                    className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    মন্তব্য
                  </label>
                  <input
                    type="text"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="মন্তব্য (ঐচ্ছিক)"
                    className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#E2ECF7] pt-4">
                <button
                  type="button"
                  onClick={() => setMosqueAssignModal(null)}
                  className="cursor-pointer rounded-xl border border-[#DCE8F7] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#F1F6FC]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#0066E6] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] hover:bg-[#0052BD]"
                >
                  মসজিদে যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Kargoojari Sathi to Committed Takaza */}
      {takazaAssignModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-takaza-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px]"
        >
          <div className="my-auto w-full max-w-lg rounded-2xl border border-[#E2ECF7] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2ECF7] bg-[#F8FBFF] px-5 py-4 rounded-t-2xl">
              <h2
                id="assign-takaza-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                তাকাজায় যুক্ত করুন — {takazaAssignModal.sathi.name}
              </h2>
              <button
                type="button"
                onClick={() => setTakazaAssignModal(null)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-[#EBF4FF] hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (takazaMode === 'existing') {
                  if (!selectedTakazaId) {
                    setTakazaAssignError('দয়া করে একটি তাকাজা নির্বাচন করুন।');
                    return;
                  }
                  onAssignToTakaza({
                    kargoojariId: takazaAssignModal.kargoojariId,
                    kargSathiId: takazaAssignModal.sathi.id,
                    sathiName: takazaAssignModal.sathi.name,
                    sathiPhone: takazaAssignModal.sathi.phone,
                    existingTakazaId: selectedTakazaId,
                  });
                } else {
                  if (!newTakazaTitle.trim()) {
                    setTakazaAssignError('দয়া করে নতুন তাকাজার শিরোনাম লিখুন।');
                    return;
                  }
                  onAssignToTakaza({
                    kargoojariId: takazaAssignModal.kargoojariId,
                    kargSathiId: takazaAssignModal.sathi.id,
                    sathiName: takazaAssignModal.sathi.name,
                    sathiPhone: takazaAssignModal.sathi.phone,
                    newTakaza: {
                      title: newTakazaTitle.trim(),
                      mosqueId: newTakazaMosqueId,
                      type: newTakazaType,
                      targetCount: Math.max(1, Number(newTakazaTarget) || 10),
                      dueDate: newTakazaDueDate,
                      notes: takazaAssignModal.sathi.notes.trim(),
                    },
                  });
                }
                setTakazaAssignModal(null);
              }}
              className="space-y-4 p-5"
            >
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F1F6FC] p-1">
                <button
                  type="button"
                  disabled={takazas.length === 0}
                  onClick={() => {
                    setTakazaMode('existing');
                    setTakazaAssignError('');
                  }}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    takazaMode === 'existing'
                      ? 'bg-[#0066E6] text-white shadow-sm'
                      : 'text-slate-700 hover:text-[#0066E6]'
                  }`}
                >
                  বিদ্যমান তাকাজায় যুক্ত ({toBn(takazas.length)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTakazaMode('new');
                    setTakazaAssignError('');
                  }}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    takazaMode === 'new'
                      ? 'bg-[#0066E6] text-white shadow-sm'
                      : 'text-slate-700 hover:text-[#0066E6]'
                  }`}
                >
                  নতুন তাকাজা তৈরি করে যুক্ত
                </button>
              </div>

              {takazaMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    যে তাকাজায় রাজি হয়েছেন তা নির্বাচন করুন
                  </label>
                  <select
                    value={selectedTakazaId}
                    onChange={(e) => {
                      setSelectedTakazaId(e.target.value);
                      if (takazaAssignError) setTakazaAssignError('');
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2.5 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                  >
                    {takazas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({TAKAZA_TYPE_LABELS[t.type]} ·{' '}
                        {toBn(t.completedCount)}/{toBn(t.targetCount)} জন)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      নতুন তাকাজার শিরোনাম <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTakazaTitle}
                      onChange={(e) => {
                        setNewTakazaTitle(e.target.value);
                        if (takazaAssignError) setTakazaAssignError('');
                      }}
                      placeholder="যেমন: ১৯-২১ নভেম্বর ৩ দিনের জামাত"
                      className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        তাকাজার ধরন
                      </label>
                      <select
                        value={newTakazaType}
                        onChange={(e) =>
                          setNewTakazaType(e.target.value as TakazaType)
                        }
                        className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                      >
                        {Object.entries(TAKAZA_TYPE_LABELS).map(
                          ([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        মসজিদ / হালকা
                      </label>
                      <select
                        value={newTakazaMosqueId}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewTakazaMosqueId(
                            v === 'halqa' ? 'halqa' : Number(v)
                          );
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        লক্ষ্যমাত্রা (জন)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newTakazaTarget}
                        onChange={(e) => setNewTakazaTarget(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        সম্ভাব্য তারিখ
                      </label>
                      <input
                        type="date"
                        value={newTakazaDueDate}
                        onChange={(e) => setNewTakazaDueDate(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 font-mono text-xs text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {takazaAssignError && (
                <p className="text-xs text-rose-600">{takazaAssignError}</p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[#E2ECF7] pt-4">
                <button
                  type="button"
                  onClick={() => setTakazaAssignModal(null)}
                  className="cursor-pointer rounded-xl border border-[#DCE8F7] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#F1F6FC]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  তাকাজায় যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
