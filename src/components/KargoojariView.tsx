import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
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
  findExistingMosqueMemberMatch,
  formatBdPhone,
  getCategoryMeta,
  TAKAZA_TYPE_LABELS,
  toBn,
} from '../utils/bengali';
import { PhoneActions } from './PhoneActions';
import { InspectedPersonInput } from './SathiProfileModal';

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
  canEdit: boolean;
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
  onOpenTashkeelInTakaza: (
    kargoojari: KargoojariEntry,
    sathi: KargoojariSathiItem
  ) => void;
  onCopyPhone: (phone: string) => void;
  onSelectPerson: (person: InspectedPersonInput) => void;
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
  canEdit,
  onSaveEntry,
  onDeleteEntry,
  onSaveKargoojariSathi,
  onDeleteKargoojariSathi,
  onAssignToMosque,
  onAssignToTakaza,
  onOpenTashkeelInTakaza,
  onCopyPhone,
  onSelectPerson,
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
  const [draftTashkeelStatus, setDraftTashkeelStatus] = useState<
    'tashkeel' | 'not_tashkeel'
  >('tashkeel');
  const [draftSathiError, setDraftSathiError] = useState('');
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
  const [modalTashkeelStatus, setModalTashkeelStatus] = useState<
    'tashkeel' | 'not_tashkeel'
  >('tashkeel');
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
    setDraftTashkeelStatus('tashkeel');
    setDraftSathiError('');
    setFormError('');
  };

  const handleAddDraftSathi = () => {
    const trimmedName = draftSathiName.trim();
    if (!trimmedName) return;

    const existingMatch = findExistingMosqueMemberMatch(trimmedName, mosques);
    if (existingMatch) {
      setDraftSathiError(
        `"${trimmedName}" নামটি আগে থেকেই "${existingMatch.mosqueName}"-এর তালিকায় (${existingMatch.memberName}) রয়েছে, তাই কারগুজারির নতুন তালিকায় যুক্ত করা হয়নি।`
      );
      return;
    }

    setFormSathis((prev) => [
      ...prev,
      {
        id: `ks-${Date.now()}-${prev.length + 1}`,
        name: trimmedName,
        phone: formatBdPhone(draftSathiPhone),
        notes: draftSathiNotes.trim(),
        tashkeelStatus: draftTashkeelStatus,
      },
    ]);
    setDraftSathiName('');
    setDraftSathiPhone('');
    setDraftSathiNotes('');
    setDraftTashkeelStatus('tashkeel');
    setDraftSathiError('');
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
    setDraftTashkeelStatus('tashkeel');
    setDraftSathiError('');
    setFormError('');
    setFormExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSathis = [...formSathis];
    if (draftSathiName.trim()) {
      const existingMatch = findExistingMosqueMemberMatch(
        draftSathiName.trim(),
        mosques
      );
      if (existingMatch) {
        setDraftSathiError(
          `"${draftSathiName.trim()}" নামটি আগে থেকেই "${existingMatch.mosqueName}"-এর তালিকায় রয়েছে, তাই কারগুজারির নতুন তালিকায় যুক্ত করা হয়নি।`
        );
        return;
      }
      finalSathis.push({
        id: `ks-${Date.now()}-${finalSathis.length + 1}`,
        name: draftSathiName.trim(),
        phone: formatBdPhone(draftSathiPhone),
        notes: draftSathiNotes.trim(),
        tashkeelStatus: draftTashkeelStatus,
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
        Number(tashkeelCount) ||
          finalSathis.filter((s) => s.tashkeelStatus !== 'not_tashkeel').length ||
          0
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
    setModalTashkeelStatus(editingSathi?.tashkeelStatus ?? 'tashkeel');
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
      <section className="no-print rounded-2xl border border-[#CFE4DF] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white p-6 shadow-[0_2px_12px_rgba(16,42,39,0.03)] sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#0E6F66]">
              যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[#102A27] sm:text-3xl">
              দৈনিক কারগুজারি
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4F6B67]">
              প্রতিদিনের গাস্ত, তালিম, মাশওয়ারা ও তাশকিলকৃত সাথীদের নাম মসজিদ
              ফরম্যাটে সংরক্ষণ করুন এবং সরাসরি যেকোনো মসজিদের যেকোনো বিভাগ বা
              চলমান তাকাজায় যুক্ত করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#D5E7E2] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1D3F3B] transition-colors hover:bg-[#EBF4F2]"
            >
              <Printer className="h-4 w-4 text-[#0E6F66]" />
              <span>রিপোর্ট প্রিন্ট</span>
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setFormExpanded((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] transition-colors hover:bg-[#0B5A53]"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {formExpanded
                    ? 'ফরম গুটিয়ে রাখুন'
                    : 'আজকের কারগুজারি যোগ করুন'}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Daily Summary Metrics */}
      <section className="no-print grid grid-cols-2 divide-x divide-y divide-[#D9EAE6] overflow-hidden rounded-2xl border border-[#D9EAE6] bg-white shadow-[0_2px_12px_rgba(16,42,39,0.03)] sm:grid-cols-4 sm:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">আজকের কারগুজারি</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-[#0E6F66] tabular-nums">
            {toBn(stats.todayCount)}
          </p>
          <p className="mt-1 text-xs text-[#7B9591]">
            {formatLongDateBn(todayISO)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">আজ উপস্থিত সাথী</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-[#102A27] tabular-nums">
            {toBn(stats.totalAttendedToday)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">আজ নগদ তশকিল</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-emerald-700 tabular-nums">
            {toBn(stats.totalTashkeelToday)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">মোট সংরক্ষিত দিন</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-[#102A27] tabular-nums">
            {toBn(stats.uniqueDays)}
          </p>
        </div>
      </section>

      {/* Daily Add / Edit Form */}
      {canEdit && formExpanded && (
        <section className="no-print rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_12px_rgba(16,42,39,0.03)] sm:p-6">
          <div className="flex items-center justify-between border-b border-[#EDF5F3] pb-3.5">
            <h2 className="font-display text-lg font-bold text-[#102A27]">
              {editingId
                ? 'কারগুজারি সম্পাদনা করুন'
                : 'আজকের / দৈনিক কারগুজারি লিপিবদ্ধ করুন'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="cursor-pointer text-xs font-semibold text-[#0E6F66] hover:underline"
              >
                নতুন এন্ট্রিতে ফিরে যান
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  তারিখ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  মসজিদ / হালকা
                </label>
                <select
                  value={mosqueId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMosqueId(v === 'halqa' ? 'halqa' : Number(v));
                  }}
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
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
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  রিপোর্টকারী সাথী
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="নাম লিখুন (ঐচ্ছিক)"
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] placeholder:text-[#7B9591] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3.5 py-2.5 sm:col-span-2">
                <span className="text-xs font-semibold text-[#4F6B67]">
                  দৈনিক আমল:
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1D3F3B] select-none">
                  <input
                    type="checkbox"
                    checked={gastDone}
                    onChange={(e) => setGastDone(e.target.checked)}
                    className="h-4 w-4 rounded border-[#B7DBD3] accent-[#0E6F66]"
                  />
                  <span>গাস্ত হয়েছে</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1D3F3B] select-none">
                  <input
                    type="checkbox"
                    checked={talimDone}
                    onChange={(e) => setTalimDone(e.target.checked)}
                    className="h-4 w-4 rounded border-[#B7DBD3] accent-[#0E6F66]"
                  />
                  <span>তালিম হয়েছে</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#1D3F3B] select-none">
                  <input
                    type="checkbox"
                    checked={mashwaraDone}
                    onChange={(e) => setMashwaraDone(e.target.checked)}
                    className="h-4 w-4 rounded border-[#B7DBD3] accent-[#0E6F66]"
                  />
                  <span>মাশওয়ারা হয়েছে</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    উপস্থিত সাথী
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sathiAttended}
                    onChange={(e) => setSathiAttended(e.target.value)}
                    placeholder="০"
                    className="mt-1 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-1.5 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    নগদ তশকিল
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tashkeelCount}
                    onChange={(e) => setTashkeelCount(e.target.value)}
                    placeholder="০"
                    className="mt-1 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-1.5 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Structured Sathis List inside Form (Mosque Table Format) */}
            <div className="overflow-hidden rounded-2xl border border-[#D5E7E2] bg-[#F4FAF8]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9EAE6] bg-[#EBF4F2] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#0E6F66]" />
                  <span className="text-xs font-bold text-[#102A27]">
                    তাশকিল ও দাওয়াতকৃত সাথীদের তালিকা (আগে থেকে থাকা সাথী বাদে)
                  </span>
                </div>
                <span className="font-mono text-xs text-[#58726E] tabular-nums">
                  {toBn(formSathis.length)} জন যুক্ত
                </span>
              </div>

              {formSathis.length > 0 && (
                <div className="overflow-x-auto bg-white">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#D9EAE6] text-[#58726E]">
                        <th className="w-10 px-3 py-2 text-center">ক্র</th>
                        <th className="px-3 py-2">নাম</th>
                        <th className="px-3 py-2">মোবাইল নম্বর</th>
                        <th className="px-3 py-2">মন্তব্য / তাকাজা</th>
                        <th className="w-14 px-3 py-2 text-right">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF5F3]">
                      {formSathis.map((s, idx) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2 text-center font-mono text-[#7B9591] tabular-nums">
                            {toBn(idx + 1)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#102A27]">
                            <p>{s.name}</p>
                            <p
                              className={`text-[11px] font-medium ${
                                s.tashkeelStatus === 'not_tashkeel'
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {s.tashkeelStatus === 'not_tashkeel'
                                ? 'তাশকিল হয়নি (দাওয়াত)'
                                : 'তাশকিল হয়েছেন'}
                            </p>
                          </td>
                          <td className="px-3 py-2 font-mono text-[#1D3F3B] tabular-nums whitespace-nowrap">
                            {formatBdPhone(s.phone) || '—'}
                          </td>
                          <td className="px-3 py-2 text-[#4F6B67]">
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
                              className="cursor-pointer rounded-lg p-1 text-[#7B9591] hover:bg-rose-50 hover:text-rose-600"
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

              <div className="space-y-2 p-3">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <input
                    type="text"
                    value={draftSathiName}
                    onChange={(e) => {
                      setDraftSathiName(e.target.value);
                      if (draftSathiError) setDraftSathiError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDraftSathi();
                      }
                    }}
                    placeholder="সাথীর নাম (যেমন: ভাই মোঃ নাঈম)"
                    className="rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-xs text-[#102A27] placeholder:text-[#7B9591] focus:border-[#0E6F66] focus:outline-none sm:col-span-3"
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
                    className="rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 font-mono text-xs text-[#102A27] placeholder:text-[#7B9591] focus:border-[#0E6F66] focus:outline-none sm:col-span-2"
                  />
                  <select
                    aria-label="তাশকিলের অবস্থা"
                    value={draftTashkeelStatus}
                    onChange={(e) =>
                      setDraftTashkeelStatus(
                        e.target.value as 'tashkeel' | 'not_tashkeel'
                      )
                    }
                    className="rounded-xl border border-[#D5E7E2] bg-white px-2.5 py-2 text-xs text-[#102A27] focus:border-[#0E6F66] focus:outline-none sm:col-span-2"
                  >
                    <option value="tashkeel">তাশকিল হয়েছেন</option>
                    <option value="not_tashkeel">তাশকিল হয়নি</option>
                  </select>
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
                    placeholder="মন্তব্য / যে তাকাজায় রাজি বা দাওয়াত"
                    className="rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-xs text-[#102A27] placeholder:text-[#7B9591] focus:border-[#0E6F66] focus:outline-none sm:col-span-3"
                  />
                  <button
                    type="button"
                    onClick={handleAddDraftSathi}
                    className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#B7DBD3] bg-[#E5F3F0] px-3 py-2 text-xs font-semibold text-[#0E6F66] transition-colors hover:bg-[#D5ECE6] sm:col-span-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>যোগ করুন</span>
                  </button>
                </div>
                {draftSathiError && (
                  <p className="text-xs font-medium text-amber-700">
                    {draftSathiError}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D3F3B]">
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
                className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] placeholder:text-[#7B9591] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
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
                  className="cursor-pointer rounded-xl border border-[#D5E7E2] bg-white px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
                >
                  বাতিল
                </button>
              )}
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] transition-colors hover:bg-[#0B5A53]"
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
      <section className="no-print flex flex-col justify-between gap-3 rounded-2xl border border-[#D9EAE6] bg-white p-4 shadow-[0_2px_12px_rgba(16,42,39,0.03)] lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EBF4F2] p-1">
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
              className={`cursor-pointer whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                dateScope === key
                  ? 'bg-[#0E6F66] text-white shadow-[0_2px_8px_rgba(14,111,102,0.2)]'
                  : 'text-[#4F6B67] hover:bg-white hover:text-[#102A27]'
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
              className="rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-1.5 font-mono text-xs text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
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
            className="rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
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
                <div className="flex items-center gap-2 border-b border-[#D9EAE6] pb-2">
                  <Calendar className="h-4 w-4 text-[#0E6F66]" />
                  <h3 className="font-display text-lg font-bold text-[#102A27]">
                    {formatLongDateBn(dateKey)}
                  </h3>
                  {dateBadge && (
                    <span className="text-xs font-semibold text-[#0E6F66]">
                      · {dateBadge}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs text-[#58726E] tabular-nums">
                    {toBn(dayEntries.length)}টি রিপোর্ট
                  </span>
                </div>

                <div className="space-y-4">
                  {dayEntries.map((item) => {
                    // Show both tashkeel and non-tashkeel sathis, excluding names already present in mosque directory (unless assigned from here)
                    const cardSathis = (item.sathis ?? []).filter(
                      (s) =>
                        Boolean(s.assignedMosqueId) ||
                        !findExistingMosqueMemberMatch(s.name, mosques)
                    );
                    const tashkeelListCount = cardSathis.filter(
                      (s) => s.tashkeelStatus !== 'not_tashkeel'
                    ).length;
                    const nonTashkeelListCount =
                      cardSathis.length - tashkeelListCount;
                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_12px_rgba(16,42,39,0.03)] transition-colors hover:border-[#B7DBD3] print:border-stone-400 print:shadow-none"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#58726E]">
                              <span className="font-semibold text-[#102A27]">
                                {getMosqueLabel(item.mosqueId)}
                              </span>
                              {item.reporterName && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    রিপোর্ট:{' '}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSelectPerson({
                                          name: item.reporterName,
                                          mosqueId:
                                            typeof item.mosqueId === 'number'
                                              ? item.mosqueId
                                              : undefined,
                                          roleOrCategory: 'কারগুজারি রিপোর্টকারী',
                                        })
                                      }
                                      className="cursor-pointer font-medium text-[#1D3F3B] underline-offset-2 transition-colors hover:text-[#0E6F66] hover:underline"
                                    >
                                      {item.reporterName}
                                    </button>
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#4F6B67]">
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
                                <strong className="font-mono text-[#102A27] tabular-nums">
                                  {toBn(item.sathiAttended)} জন
                                </strong>
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                নগদ তশকিল:{' '}
                                <strong className="font-mono text-[#0E6F66] tabular-nums">
                                  {toBn(item.tashkeelCount)} জন
                                </strong>
                              </span>
                            </div>
                          </div>

                          {canEdit && (
                            <div className="no-print flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openAddSathiModal(item.id, null)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#B7DBD3] bg-[#E5F3F0] px-2.5 py-1.5 text-xs font-semibold text-[#0E6F66] transition-colors hover:bg-[#D5ECE6]"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>সাথী যোগ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                title="কারগুজারি সম্পাদনা"
                                className="cursor-pointer rounded-xl border border-[#D9EAE6] p-1.5 text-[#58726E] transition-colors hover:bg-[#E5F3F0] hover:text-[#0E6F66]"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEntry(item.id)}
                                title="মুছে ফেলুন"
                                className="cursor-pointer rounded-xl border border-[#D9EAE6] p-1.5 text-[#58726E] transition-colors hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {item.summary && (
                          <p className="mt-3 whitespace-pre-line border-t border-[#EDF5F3] pt-3 text-sm leading-relaxed text-[#1D3F3B]">
                            {item.summary}
                          </p>
                        )}

                        {/* Structured Sathi Table in exact Mosque Directory Format */}
                        <div className="mt-4 overflow-hidden rounded-2xl border border-[#D9EAE6] bg-white">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9EAE6] bg-[#EBF4F2]/90 px-4 py-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#102A27]">
                                দাওয়াত ও তাশকিলকৃত সাথী তালিকা (
                                {toBn(cardSathis.length)} জন)
                              </span>
                              {cardSathis.length > 0 && (
                                <span className="text-[11px] font-medium text-[#58726E]">
                                  · তাশকিল {toBn(tashkeelListCount)} জন
                                  {nonTashkeelListCount > 0 &&
                                    ` · তাশকিল হয়নি ${toBn(
                                      nonTashkeelListCount
                                    )} জন`}
                                </span>
                              )}
                            </div>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openAddSathiModal(item.id, null)}
                                className="no-print inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#E5F3F0] px-2.5 py-1 text-xs font-semibold text-[#0E6F66] hover:bg-[#D5ECE6]"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>নতুন সাথী যুক্ত করুন</span>
                              </button>
                            )}
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                              <thead>
                                <tr className="border-b border-[#D9EAE6] text-xs font-semibold text-[#58726E]">
                                  <th className="w-12 px-4 py-2.5 text-center">
                                    ক্র
                                  </th>
                                  <th className="px-4 py-2.5">নাম</th>
                                  <th className="min-w-[230px] px-4 py-2.5">
                                    মোবাইল ও কল
                                  </th>
                                  <th className="px-4 py-2.5">মন্তব্য</th>
                                  {canEdit && (
                                    <th className="no-print min-w-[240px] px-4 py-2.5 text-right">
                                      মসজিদ ও তাকাজায় যুক্ত
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EDF5F3]">
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
                                      className="transition-colors hover:bg-[#F4FAF8]"
                                    >
                                      <td className="px-4 py-2.5 text-center font-mono text-xs text-[#7B9591] tabular-nums">
                                        {toBn(idx + 1)}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onSelectPerson({
                                                name: s.name,
                                                phone: s.phone,
                                                mosqueId: s.assignedMosqueId,
                                                roleOrCategory:
                                                  s.assignedCategory
                                                    ? getCategoryMeta(
                                                        s.assignedCategory
                                                      ).shortLabel
                                                    : `কারগুজারি · ${formatLongDateBn(
                                                        item.date
                                                      )}`,
                                                notes: s.notes,
                                              })
                                            }
                                            className="cursor-pointer text-left font-medium text-[#102A27] underline-offset-2 transition-colors hover:text-[#0E6F66] hover:underline"
                                          >
                                            {s.name}
                                          </button>

                                          {s.tashkeelStatus !== 'not_tashkeel' && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                onOpenTashkeelInTakaza(item, s)
                                              }
                                              title="চলমান তাকাজা পেজে যান"
                                              className="no-print inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#B7DBD3] bg-[#E5F3F0] px-2 py-0.5 text-[11px] font-semibold text-[#0E6F66] transition-colors hover:bg-[#0E6F66] hover:text-white"
                                            >
                                              <Flag className="h-3 w-3" />
                                              <span>
                                                {s.assignedTakazaId
                                                  ? 'চলমান তাকাজা'
                                                  : canEdit
                                                  ? 'তাকাজায় পাঠান'
                                                  : 'চলমান তাকাজা'}
                                              </span>
                                              <ArrowUpRight className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                        <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
                                          <span
                                            className={`font-medium ${
                                              s.tashkeelStatus ===
                                              'not_tashkeel'
                                                ? 'text-amber-700'
                                                : 'text-emerald-700'
                                            }`}
                                          >
                                            {s.tashkeelStatus === 'not_tashkeel'
                                              ? 'তাশকিল হয়নি (দাওয়াত ও মুজাকারা)'
                                              : 'তাশকিল হয়েছেন'}
                                          </span>
                                          {assignedMosqueText && (
                                            <span className="font-medium text-[#0E6F66]">
                                              মসজিদে যুক্ত: {assignedMosqueText}
                                            </span>
                                          )}
                                          {s.assignedTakazaTitle && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                onOpenTashkeelInTakaza(item, s)
                                              }
                                              className="w-fit cursor-pointer text-left font-medium text-emerald-700 underline-offset-2 hover:text-[#0E6F66] hover:underline"
                                            >
                                              তাকাজায় যুক্ত:{' '}
                                              {s.assignedTakazaTitle} →
                                            </button>
                                          )}
                                        </div>
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
                                          ) : canEdit ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openAddSathiModal(item.id, s)
                                              }
                                              className="no-print cursor-pointer text-xs text-[#7B9591] hover:text-[#0E6F66] hover:underline"
                                            >
                                              + নম্বর যোগ করুন
                                            </button>
                                          ) : (
                                            <span className="text-xs text-[#7B9591]">
                                              নম্বর নেই
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-[#4F6B67]">
                                          {s.notes.trim() || '—'}
                                        </td>
                                        {canEdit && (
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
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#B7DBD3] bg-[#E5F3F0] px-2 py-1 text-[11px] font-semibold text-[#0E6F66] transition-colors hover:bg-[#0E6F66] hover:text-white whitespace-nowrap"
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
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-[#E7F7F0] px-2 py-1 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-600 hover:text-white whitespace-nowrap"
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
                                                className="cursor-pointer rounded-lg p-1 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#0E6F66]"
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
                                                className="cursor-pointer rounded-lg p-1 text-[#7B9591] hover:bg-rose-50 hover:text-rose-600"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}

                                  {/* Quick blank row to add a new Sathi directly */}
                                  {canEdit && (
                                    <tr
                                      onClick={() =>
                                        openAddSathiModal(item.id, null)
                                      }
                                      className="no-print group cursor-pointer bg-[#F4FAF8]/60 transition-colors hover:bg-[#E5F3F0]/70"
                                    >
                                      <td className="px-4 py-2.5 text-center font-mono text-xs text-[#7B9591] tabular-nums">
                                        {toBn(cardSathis.length + 1)}
                                      </td>
                                      <td className="px-4 py-2.5 text-xs text-[#7B9591] group-hover:text-[#0E6F66]">
                                        <span className="inline-flex items-center gap-1 font-medium">
                                          <Plus className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                                          <span>নতুন সাথী যুক্ত করতে ক্লিক করুন</span>
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-xs text-[#A3BDB9]" />
                                      <td className="px-4 py-2.5 text-xs text-[#A3BDB9]" />
                                      <td className="px-4 py-2.5 text-xs text-[#A3BDB9]" />
                                    </tr>
                                  )}
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
        <section className="rounded-2xl border border-[#D9EAE6] bg-white px-6 py-12 text-center shadow-[0_2px_12px_rgba(16,42,39,0.03)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5F3F0] text-[#0E6F66]">
            <Calendar className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-3 text-lg font-bold text-[#102A27]">
            এই সময়ে কোনো কারগুজারি পাওয়া যায়নি
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#58726E]">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#D9EAE6] bg-white shadow-xl">
            <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white px-5 py-4">
              <h2
                id="karg-sathi-modal-title"
                className="font-display text-lg font-bold text-[#102A27]"
              >
                {sathiModal.editingSathi
                  ? 'সাথীর তথ্য সম্পাদনা'
                  : 'কারগুজারিতে নতুন সাথী যুক্ত করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setSathiModal(null)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-xl p-1.5 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#102A27]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmedName = modalSathiName.trim();
                if (!trimmedName) {
                  setModalSathiError('দয়া করে সাথীর নাম লিখুন।');
                  return;
                }
                if (!sathiModal.editingSathi?.assignedMosqueId) {
                  const existingMatch = findExistingMosqueMemberMatch(
                    trimmedName,
                    mosques
                  );
                  if (existingMatch) {
                    setModalSathiError(
                      `"${trimmedName}" নামটি আগে থেকেই "${existingMatch.mosqueName}"-এর তালিকায় (${existingMatch.memberName}) রয়েছে, তাই এখানে যুক্ত করা হবে না।`
                    );
                    return;
                  }
                }
                onSaveKargoojariSathi(sathiModal.kargoojariId, {
                  id: sathiModal.editingSathi?.id,
                  name: trimmedName,
                  phone: formatBdPhone(modalSathiPhone),
                  notes: modalSathiNotes.trim(),
                  tashkeelStatus: modalTashkeelStatus,
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
                <label className="block text-xs font-semibold text-[#1D3F3B]">
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
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                />
                {modalSathiError && (
                  <p className="mt-1 text-xs text-rose-600">
                    {modalSathiError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={modalSathiPhone}
                    onChange={(e) => setModalSathiPhone(e.target.value)}
                    onBlur={() =>
                      setModalSathiPhone((prev) => formatBdPhone(prev))
                    }
                    placeholder="যেমন: +880 1711-000 000"
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    অবস্থা
                  </label>
                  <select
                    value={modalTashkeelStatus}
                    onChange={(e) =>
                      setModalTashkeelStatus(
                        e.target.value as 'tashkeel' | 'not_tashkeel'
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  >
                    <option value="tashkeel">তাশকিল হয়েছেন</option>
                    <option value="not_tashkeel">তাশকিল হয়নি (দাওয়াত)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  মন্তব্য
                </label>
                <input
                  type="text"
                  value={modalSathiNotes}
                  onChange={(e) => setModalSathiNotes(e.target.value)}
                  placeholder="যেমন: ৩ দিনের জামাত (১৯, ২০, ২১ নভেম্বর)"
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#D9EAE6] pt-4">
                <button
                  type="button"
                  onClick={() => setSathiModal(null)}
                  className="cursor-pointer rounded-xl border border-[#D5E7E2] px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#D9EAE6] bg-white shadow-xl">
            <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white px-5 py-4">
              <h2
                id="assign-mosque-modal-title"
                className="font-display text-lg font-bold text-[#102A27]"
              >
                মসজিদ ও বিভাগে যুক্ত করুন
              </h2>
              <button
                type="button"
                onClick={() => setMosqueAssignModal(null)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-xl p-1.5 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#102A27]"
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
              <p className="rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3.5 py-2.5 text-xs text-[#4F6B67]">
                হালকার যেকোনো মসজিদের যেকোনো বিভাগে এই সাথীর নাম, মোবাইল নম্বর ও
                মন্তব্য সরাসরি যুক্ত হয়ে যাবে।
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    মসজিদ নির্বাচন করুন
                  </label>
                  <select
                    value={assignMosqueId}
                    onChange={(e) => setAssignMosqueId(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:outline-none"
                  >
                    {mosques.map((m) => (
                      <option key={m.id} value={m.id}>
                        {toBn(m.id)}. {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    বিভাগ (Section) নির্বাচন করুন
                  </label>
                  <select
                    value={assignCategory}
                    onChange={(e) =>
                      setAssignCategory(e.target.value as SathiCategory)
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:outline-none"
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
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  নাম
                </label>
                <input
                  type="text"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={assignPhone}
                    onChange={(e) => setAssignPhone(e.target.value)}
                    onBlur={() => setAssignPhone((prev) => formatBdPhone(prev))}
                    placeholder="+880 1711-000 000"
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    মন্তব্য
                  </label>
                  <input
                    type="text"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="মন্তব্য (ঐচ্ছিক)"
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#D9EAE6] pt-4">
                <button
                  type="button"
                  onClick={() => setMosqueAssignModal(null)}
                  className="cursor-pointer rounded-xl border border-[#D5E7E2] px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53]"
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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
        >
          <div className="my-auto w-full max-w-lg rounded-2xl border border-[#D9EAE6] bg-white shadow-xl">
            <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white px-5 py-4">
              <h2
                id="assign-takaza-modal-title"
                className="font-display text-lg font-bold text-[#102A27]"
              >
                তাকাজায় যুক্ত করুন — {takazaAssignModal.sathi.name}
              </h2>
              <button
                type="button"
                onClick={() => setTakazaAssignModal(null)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-xl p-1.5 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#102A27]"
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
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#EBF4F2] p-1">
                <button
                  type="button"
                  disabled={takazas.length === 0}
                  onClick={() => {
                    setTakazaMode('existing');
                    setTakazaAssignError('');
                  }}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    takazaMode === 'existing'
                      ? 'bg-[#0E6F66] text-white shadow-sm'
                      : 'text-[#4F6B67] hover:text-[#0E6F66]'
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
                      ? 'bg-[#0E6F66] text-white shadow-sm'
                      : 'text-[#4F6B67] hover:text-[#0E6F66]'
                  }`}
                >
                  নতুন তাকাজা তৈরি করে যুক্ত
                </button>
              </div>

              {takazaMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    যে তাকাজায় রাজি হয়েছেন তা নির্বাচন করুন
                  </label>
                  <select
                    value={selectedTakazaId}
                    onChange={(e) => {
                      setSelectedTakazaId(e.target.value);
                      if (takazaAssignError) setTakazaAssignError('');
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2.5 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
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
                    <label className="block text-xs font-semibold text-[#1D3F3B]">
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
                      className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D3F3B]">
                        তাকাজার ধরন
                      </label>
                      <select
                        value={newTakazaType}
                        onChange={(e) =>
                          setNewTakazaType(e.target.value as TakazaType)
                        }
                        className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
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
                      <label className="block text-xs font-semibold text-[#1D3F3B]">
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
                        className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
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
                      <label className="block text-xs font-semibold text-[#1D3F3B]">
                        লক্ষ্যমাত্রা (জন)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newTakazaTarget}
                        onChange={(e) => setNewTakazaTarget(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1D3F3B]">
                        সম্ভাব্য তারিখ
                      </label>
                      <input
                        type="date"
                        value={newTakazaDueDate}
                        onChange={(e) => setNewTakazaDueDate(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-xs text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {takazaAssignError && (
                <p className="text-xs text-rose-600">{takazaAssignError}</p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[#D9EAE6] pt-4">
                <button
                  type="button"
                  onClick={() => setTakazaAssignModal(null)}
                  className="cursor-pointer rounded-xl border border-[#D5E7E2] px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53]"
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
