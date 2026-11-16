import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  MosqueRecord,
  TakazaEntry,
  TakazaStatus,
  TakazaType,
} from '../types/directory';
import { formatBdPhone, TAKAZA_TYPE_LABELS, toBn } from '../utils/bengali';
import { PhoneActions } from './PhoneActions';
import { InspectedPersonInput } from './SathiProfileModal';

interface TakazaViewProps {
  mosques: MosqueRecord[];
  takazas: TakazaEntry[];
  canEdit: boolean;
  focusedTakazaId?: string | null;
  onClearFocusedTakaza?: () => void;
  onSaveTakaza: (entry: Omit<TakazaEntry, 'id' | 'createdAt'> & { id?: string }) => void;
  onUpdateProgress: (id: string, delta: number) => void;
  onToggleStatus: (id: string, status: TakazaStatus) => void;
  onDeleteTakaza: (id: string) => void;
  onRemoveCommittedSathi?: (takazaId: string, sathiId: string) => void;
  onSelectPerson: (person: InspectedPersonInput) => void;
}

const STATUS_LABELS: Record<TakazaStatus, string> = {
  ongoing: 'চলমান',
  urgent: 'জরুরি',
  completed: 'সম্পন্ন',
};

function formatDateBn(dateStr: string): string {
  if (!dateStr) return 'তারিখ নির্ধারিত নয়';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${toBn(d)}/${toBn(m)}/${toBn(y)}`;
}

export const TakazaView: React.FC<TakazaViewProps> = ({
  mosques,
  takazas,
  canEdit,
  focusedTakazaId,
  onClearFocusedTakaza,
  onSaveTakaza,
  onUpdateProgress,
  onToggleStatus,
  onDeleteTakaza,
  onRemoveCommittedSathi,
  onSelectPerson,
}) => {
  const [statusFilter, setStatusFilter] = useState<TakazaStatus | 'all'>('all');
  const [mosqueFilter, setMosqueFilter] = useState<number | 'all' | 'halqa'>('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TakazaEntry | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusedTakazaId) return;
    setStatusFilter('all');
    setMosqueFilter('all');
    setQuery('');
    setHighlightedId(focusedTakazaId);

    const scrollTimer = window.setTimeout(() => {
      const el = document.getElementById(`takaza-card-${focusedTakazaId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);

    const clearTimer = window.setTimeout(() => {
      setHighlightedId((curr) => (curr === focusedTakazaId ? null : curr));
      onClearFocusedTakaza?.();
    }, 3200);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [focusedTakazaId, onClearFocusedTakaza]);

  // Form state
  const [title, setTitle] = useState('');
  const [mosqueId, setMosqueId] = useState<number | 'halqa'>('halqa');
  const [type, setType] = useState<TakazaType>('three_days');
  const [targetCount, setTargetCount] = useState('10');
  const [completedCount, setCompletedCount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [zimmadarName, setZimmadarName] = useState('');
  const [zimmadarPhone, setZimmadarPhone] = useState('');
  const [status, setStatus] = useState<TakazaStatus>('ongoing');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditing(null);
    setTitle('');
    setMosqueId('halqa');
    setType('three_days');
    setTargetCount('10');
    setCompletedCount('0');
    setDueDate('');
    setZimmadarName('');
    setZimmadarPhone('');
    setStatus('ongoing');
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (entry: TakazaEntry) => {
    setEditing(entry);
    setTitle(entry.title);
    setMosqueId(entry.mosqueId);
    setType(entry.type);
    setTargetCount(String(entry.targetCount));
    setCompletedCount(String(entry.completedCount));
    setDueDate(entry.dueDate);
    setZimmadarName(entry.zimmadarName);
    setZimmadarPhone(entry.zimmadarPhone);
    setStatus(entry.status);
    setNotes(entry.notes);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('দয়া করে তাকাজার শিরোনাম বা বিবরণ লিখুন।');
      return;
    }
    const parsedTarget = Math.max(1, Number(targetCount) || 1);
    const parsedCompleted = Math.max(0, Number(completedCount) || 0);
    onSaveTakaza({
      id: editing?.id,
      title: title.trim(),
      mosqueId,
      type,
      targetCount: parsedTarget,
      completedCount: parsedCompleted,
      dueDate,
      zimmadarName: zimmadarName.trim(),
      zimmadarPhone: zimmadarPhone.trim(),
      status,
      notes: notes.trim(),
    });
    setModalOpen(false);
  };

  const counts = useMemo(() => {
    const ongoing = takazas.filter((t) => t.status === 'ongoing').length;
    const urgent = takazas.filter((t) => t.status === 'urgent').length;
    const completed = takazas.filter((t) => t.status === 'completed').length;
    const totalTarget = takazas
      .filter((t) => t.status !== 'completed')
      .reduce((acc, t) => acc + t.targetCount, 0);
    const totalDone = takazas
      .filter((t) => t.status !== 'completed')
      .reduce((acc, t) => acc + t.completedCount, 0);
    return { ongoing, urgent, completed, totalTarget, totalDone };
  }, [takazas]);

  const filteredTakazas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return takazas.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (mosqueFilter !== 'all' && t.mosqueId !== mosqueFilter) return false;
      if (!q) return true;
      const mName =
        t.mosqueId === 'halqa'
          ? 'সম্পূর্ণ হালকা'
          : mosques.find((m) => m.id === t.mosqueId)?.name ?? '';
      return `${t.title} ${t.zimmadarName} ${t.notes} ${mName}`
        .toLowerCase()
        .includes(q);
    });
  }, [takazas, statusFilter, mosqueFilter, query, mosques]);

  const getMosqueLabel = (mId: number | 'halqa') => {
    if (mId === 'halqa') return 'সম্পূর্ণ ৪০১ নং হালকা';
    const m = mosques.find((item) => item.id === mId);
    return m ? `${toBn(m.id)}. ${m.name}` : 'অনির্ধারিত মসজিদ';
  };

  return (
    <div className="space-y-8">
      {/* Masthead */}
      <section className="rounded-2xl border border-[#CFE4DF] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white p-6 shadow-[0_2px_14px_rgba(14,111,102,0.04)] sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#0E6F66]">
              যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[#102A27] sm:text-3xl">
              চলমান তাকাজা ও তশকিল ব্যবস্থাপনা
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4F6B67]">
              হালকা ও প্রতিটি মসজিদের ৩ দিন, ১০/১৫ দিন, ১ চিল্লা, ৩ চিল্লা ও
              মাস্তুরাত জামাতের চলমান তাকাজা, লক্ষ্যমাত্রা ও অগ্রগতি পরিচালনা করুন।
            </p>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0E6F66] px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] transition-colors hover:bg-[#0B5A53]"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন তাকাজা যোগ করুন</span>
            </button>
          )}
        </div>
      </section>

      {/* 4-column Summary Metrics */}
      <section className="grid grid-cols-2 divide-x divide-y divide-[#D9EAE6] overflow-hidden rounded-2xl border border-[#D9EAE6] bg-white shadow-[0_2px_14px_rgba(14,111,102,0.04)] sm:grid-cols-4 sm:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">চলমান তাকাজা</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-[#102A27] tabular-nums">
            {toBn(counts.ongoing)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">জরুরি তাকাজা</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-[#D97706] tabular-nums">
            {toBn(counts.urgent)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">সম্পন্ন হয়েছে</p>
          <p className="mt-1.5 font-mono text-3xl font-semibold text-emerald-600 tabular-nums">
            {toBn(counts.completed)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#58726E]">
            চলমান তশকিল অগ্রগতি
          </p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#0E6F66] tabular-nums">
            {toBn(counts.totalDone)} / {toBn(counts.totalTarget)} জন
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-[#D9EAE6] bg-white p-4 shadow-[0_2px_14px_rgba(14,111,102,0.04)] lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EBF4F2] p-1">
          {(
            [
              ['all', `সকল (${toBn(takazas.length)})`],
              ['ongoing', `চলমান (${toBn(counts.ongoing)})`],
              ['urgent', `জরুরি (${toBn(counts.urgent)})`],
              ['completed', `সম্পন্ন (${toBn(counts.completed)})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`cursor-pointer whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === key
                  ? 'bg-[#0E6F66] text-white shadow-[0_2px_8px_rgba(14,111,102,0.22)]'
                  : 'text-[#284B47] hover:bg-white/80 hover:text-[#0E6F66]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <select
            aria-label="মসজিদ অনুযায়ী ফিল্টার"
            value={mosqueFilter}
            onChange={(e) => {
              const v = e.target.value;
              setMosqueFilter(
                v === 'all' ? 'all' : v === 'halqa' ? 'halqa' : Number(v)
              );
            }}
            className="rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#1D3F3B] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
          >
            <option value="all">সকল মসজিদ ও হালকা</option>
            <option value="halqa">শুধু সম্পূর্ণ ৪০১ নং হালকা</option>
            {mosques.map((m) => (
              <option key={m.id} value={m.id}>
                {toBn(m.id)}. {m.name}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B8682]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="তাকাজা বা জিম্মাদার খুঁজুন..."
              className="w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] py-2 pr-3 pl-9 text-sm text-[#102A27] placeholder:text-[#7D9793] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Takaza List */}
      {filteredTakazas.length > 0 ? (
        <div className="space-y-4">
          {filteredTakazas.map((item) => {
            const pct = Math.min(
              100,
              Math.round((item.completedCount / Math.max(1, item.targetCount)) * 100)
            );
            const remaining = Math.max(0, item.targetCount - item.completedCount);
            return (
              <article
                id={`takaza-card-${item.id}`}
                key={item.id}
                className={`rounded-2xl border bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)] transition-all hover:border-[#B7DBD3] ${
                  highlightedId === item.id
                    ? 'border-[#0E6F66] ring-2 ring-[#0E6F66]/35'
                    : 'border-[#D9EAE6]'
                }`}
              >
                <div className="flex flex-col justify-between gap-4 border-b border-[#EAF3F0] pb-4 sm:flex-row sm:items-start">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#58726E]">
                      <span
                        className={`font-semibold ${
                          item.status === 'urgent'
                            ? 'text-[#D97706]'
                            : item.status === 'completed'
                            ? 'text-emerald-600'
                            : 'text-[#0E6F66]'
                        }`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{TAKAZA_TYPE_LABELS[item.type]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getMosqueLabel(item.mosqueId)}</span>
                      {item.dueDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>সম্ভাব্য তারিখ: {formatDateBn(item.dueDate)}</span>
                        </>
                      )}
                    </div>

                    <h2 className="font-display text-xl font-bold text-[#102A27]">
                      {item.title}
                    </h2>

                    {item.notes && (
                      <p className="text-sm leading-relaxed text-[#4F6B67]">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        aria-label="তাকাজার অবস্থা পরিবর্তন"
                        value={item.status}
                        onChange={(e) =>
                          onToggleStatus(item.id, e.target.value as TakazaStatus)
                        }
                        className="cursor-pointer rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-2.5 py-1.5 text-xs font-medium text-[#1D3F3B] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                      >
                        <option value="ongoing">চলমান</option>
                        <option value="urgent">জরুরি</option>
                        <option value="completed">সম্পন্ন</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title="সম্পাদনা"
                        className="cursor-pointer rounded-xl border border-[#D9EAE6] p-1.5 text-[#58726E] transition-colors hover:bg-[#E5F3F0] hover:text-[#0E6F66]"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTakaza(item.id)}
                        title="মুছে ফেলুন"
                        className="cursor-pointer rounded-xl border border-[#D9EAE6] p-1.5 text-[#58726E] transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress & Zimmadar Row */}
                <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1D3F3B]">
                        প্রস্তুত/তশকিল:{' '}
                        <strong className="font-mono text-[#102A27] tabular-nums">
                          {toBn(item.completedCount)} / {toBn(item.targetCount)} জন
                        </strong>
                      </span>
                      <span className="font-mono text-[#58726E] tabular-nums">
                        {remaining > 0
                          ? `বাকি ${toBn(remaining)} জন (${toBn(pct)}%)`
                          : 'লক্ষ্যমাত্রা পূর্ণ (১০০%)'}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#DCECE8]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.status === 'completed' || remaining === 0
                            ? 'bg-emerald-600'
                            : item.status === 'urgent'
                            ? 'bg-[#E59A2E]'
                            : 'bg-[#0E6F66]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                    {canEdit && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateProgress(item.id, -1)}
                          disabled={item.completedCount <= 0}
                          aria-label="সংখ্যা ১ কমান"
                          className="cursor-pointer rounded-xl border border-[#D5E7E2] bg-white p-1.5 text-[#1D3F3B] transition-colors hover:bg-[#EBF4F2] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateProgress(item.id, 1)}
                          aria-label="সংখ্যা ১ বাড়ান"
                          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#B7DBD3] bg-[#E5F3F0] px-3 py-1.5 text-xs font-semibold text-[#0E6F66] transition-colors hover:bg-[#D5ECE6]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>১ জন যুক্ত</span>
                        </button>
                      </div>
                    )}

                    {item.zimmadarName && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#4F6B67]">
                        <span>
                          <span className="text-[#7B9591]">জিম্মাদার: </span>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectPerson({
                                name: item.zimmadarName,
                                phone: item.zimmadarPhone,
                                mosqueId:
                                  typeof item.mosqueId === 'number'
                                    ? item.mosqueId
                                    : undefined,
                                roleOrCategory: `${item.title} · জিম্মাদার`,
                              })
                            }
                            className="cursor-pointer font-medium text-[#102A27] underline-offset-2 transition-colors hover:text-[#0E6F66] hover:underline"
                          >
                            {item.zimmadarName}
                          </button>
                        </span>
                        {item.zimmadarPhone && (
                          <PhoneActions phone={item.zimmadarPhone} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {item.committedSathis && item.committedSathis.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#D9EAE6] bg-[#F6FBFA]">
                    <div className="border-b border-[#D9EAE6] bg-[#EBF4F2] px-3.5 py-2 text-xs font-semibold text-[#1D3F3B]">
                      এই তাকাজায় রাজি / যুক্ত সাথীগণ ({toBn(item.committedSathis.length)} জন)
                    </div>
                    <div className="divide-y divide-[#E3EFEC]">
                      {item.committedSathis.map((s, idx) => (
                        <div
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#7B9591] tabular-nums">
                              {toBn(idx + 1)}.
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectPerson({
                                  name: s.name,
                                  phone: s.phone,
                                  mosqueId:
                                    typeof item.mosqueId === 'number'
                                      ? item.mosqueId
                                      : undefined,
                                  roleOrCategory: item.title,
                                })
                              }
                              className="cursor-pointer text-left font-semibold text-[#102A27] underline-offset-2 transition-colors hover:text-[#0E6F66] hover:underline"
                            >
                              {s.name}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.phone ? (
                              <PhoneActions phone={s.phone} compact />
                            ) : (
                              <span className="text-[#7B9591]">নম্বর নেই</span>
                            )}
                            {canEdit && onRemoveCommittedSathi && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveCommittedSathi(item.id, s.id)
                                }
                                title="তাকাজা তালিকা থেকে সরান"
                                aria-label="তাকাজা তালিকা থেকে সরান"
                                className="cursor-pointer rounded-lg p-1 text-[#7B9591] transition-colors hover:bg-rose-50 hover:text-rose-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <section className="rounded-2xl border border-[#D9EAE6] bg-white px-6 py-12 text-center shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5F3F0] text-[#0E6F66]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-3 text-lg font-bold text-[#102A27]">
            কোনো চলমান তাকাজা পাওয়া যায়নি
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#58726E]">
            হালকা বা যেকোনো মসজিদের আসন্ন জামাতের তাকাজা (যেমন ৩ দিন, ১ চিল্লা,
            ৩ চিল্লা বা মাস্তুরাত জামাত) যুক্ত করতে নিচের বাটনে ক্লিক করুন।
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-medium text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53]"
            >
              <Plus className="h-4 w-4" />
              <span>প্রথম তাকাজা যুক্ত করুন</span>
            </button>
          )}
        </section>
      )}

      {/* Add / Edit Takaza Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="takaza-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
        >
          <div className="my-auto w-full max-w-lg rounded-2xl border border-[#D9EAE6] bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-[#F4FAF8] px-5 py-4">
              <h2
                id="takaza-modal-title"
                className="font-display text-lg font-bold text-[#102A27]"
              >
                {editing ? 'তাকাজা সম্পাদনা' : 'নতুন চলমান তাকাজা যুক্ত করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-xl p-1.5 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#102A27]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  তাকাজার শিরোনাম <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="যেমন: আগামী শুক্রবার ৩ দিনের জামাত রওয়ানা"
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                />
                {formError && (
                  <p className="mt-1 text-xs text-rose-600">{formError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    তাকাজার ধরন
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TakazaType)}
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  >
                    {Object.entries(TAKAZA_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    লক্ষ্যমাত্রা (জন)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetCount}
                    onChange={(e) => setTargetCount(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    প্রস্তুত (জন)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={completedCount}
                    onChange={(e) => setCompletedCount(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    অবস্থা
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TakazaStatus)}
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-2.5 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  >
                    <option value="ongoing">চলমান</option>
                    <option value="urgent">জরুরি</option>
                    <option value="completed">সম্পন্ন</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    সম্ভাব্য তারিখ
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-2.5 py-2 font-mono text-xs text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    জিম্মাদার সাথী
                  </label>
                  <input
                    type="text"
                    value={zimmadarName}
                    onChange={(e) => setZimmadarName(e.target.value)}
                    placeholder="নাম (ঐচ্ছিক)"
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D3F3B]">
                    জিম্মাদার মোবাইল
                  </label>
                  <input
                    type="text"
                    value={zimmadarPhone}
                    onChange={(e) => setZimmadarPhone(e.target.value)}
                    onBlur={() => setZimmadarPhone((prev) => formatBdPhone(prev))}
                    placeholder="+880 1711-000 000"
                    className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  বিস্তারিত নোট / রোখ
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="জামাতের রোখ, প্রয়োজনীয় নির্দেশনা বা মন্তব্য..."
                  className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#D9EAE6] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-[#D5E7E2] bg-white px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-medium text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53]"
                >
                  {editing ? 'সংরক্ষণ করুন' : 'তাকাজা যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
