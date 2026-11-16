import React, { useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RotateCcw,
  Upload,
} from 'lucide-react';
import {
  KargoojariEntry,
  MosqueRecord,
  TakazaEntry,
} from '../types/directory';
import {
  CATEGORY_META,
  exportMosquesToCSV,
  formatBdPhone,
  getMosqueTotalSathi,
  SUMMARY_CATEGORIES,
  toBn,
} from '../utils/bengali';

interface FullBackupPayload {
  mosques: MosqueRecord[];
  takazas?: TakazaEntry[];
  kargoojaris?: KargoojariEntry[];
}

interface PrintExportViewProps {
  mosques: MosqueRecord[];
  takazas: TakazaEntry[];
  kargoojaris: KargoojariEntry[];
  canEdit: boolean;
  onImportData: (payload: FullBackupPayload) => void;
  onResetToBaseline: () => void;
}

type PrintScope = 'summary' | 'single' | 'all';

export const PrintExportView: React.FC<PrintExportViewProps> = ({
  mosques,
  takazas,
  kargoojaris,
  canEdit,
  onImportData,
  onResetToBaseline,
}) => {
  const [printScope, setPrintScope] = useState<PrintScope>('summary');
  const [selectedMosqueId, setSelectedMosqueId] = useState<number>(
    mosques[0]?.id ?? 1
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportJSON = () => {
    const payload: FullBackupPayload = {
      mosques,
      takazas,
      kargoojaris,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'halqa-401-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
          onImportData({ mosques: parsed as MosqueRecord[] });
          return;
        }
        if (
          parsed &&
          typeof parsed === 'object' &&
          Array.isArray(parsed.mosques) &&
          parsed.mosques.length > 0
        ) {
          onImportData(parsed as FullBackupPayload);
          return;
        }
        setImportError('সঠিক হালকা JSON ব্যাকআপ ফাইল নির্বাচন করুন।');
      } catch {
        setImportError('ফাইলটি পড়া সম্ভব হয়নি। দয়া করে সঠিক JSON দিন।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const grandTotal = mosques.reduce(
    (acc, m) => acc + getMosqueTotalSathi(m),
    0
  );

  const mosquesToPrint =
    printScope === 'single'
      ? mosques.filter((m) => m.id === selectedMosqueId)
      : printScope === 'all'
      ? mosques
      : [];

  return (
    <div className="space-y-8">
      {/* Screen-only Controls */}
      <div className="no-print space-y-6">
        <section className="rounded-2xl border border-[#CFE4DF] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white p-6 shadow-[0_2px_14px_rgba(14,111,102,0.04)] sm:p-8">
          <p className="text-xs font-semibold tracking-wide text-[#0E6F66]">
            যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-[#102A27] sm:text-3xl">
            প্রিন্ট, পিডিএফ ও ডেটা এক্সপোর্ট
          </h1>
          <p className="mt-1.5 text-sm text-[#4F6B67]">
            আসল ফরমের আদলে পরিচ্ছন্ন প্রিন্ট কপি তৈরি করুন, Excel-এর জন্য CSV
            ডাউনলোড করুন অথবা ব্যাকআপ সংরক্ষণ করুন।
          </p>
        </section>

        {/* Export Action Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F3F0] text-[#0E6F66]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h2 className="mt-3.5 text-base font-bold text-[#102A27]">
                Excel / CSV এক্সপোর্ট
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#4F6B67]">
                সকল মসজিদের ওলামা, সাথী, মোবাইল নম্বর, খতিব, ইমাম ও
                মোয়াজ্জিনের তালিকা Excel উপযোগী UTF-8 CSV ফরম্যাটে ডাউনলোড
                করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportMosquesToCSV(mosques)}
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0E6F66] px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] transition-colors hover:bg-[#0B5A53]"
            >
              <Download className="h-4 w-4" />
              <span>CSV ডাউনলোড করুন</span>
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F7F0] text-emerald-700">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="mt-3.5 text-base font-bold text-[#102A27]">
                মূল পিডিএফ ও ব্যাকআপ
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#4F6B67]">
                আপনার মূল ৪৪ পৃষ্ঠার পিডিএফ ফাইলটি ডাউনলোড করুন অথবা
                আপডেটকৃত তথ্যের JSON ব্যাকআপ সংরক্ষণ ও রিস্টোর করুন।
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <a
                href="/assets/aistudio/______________1__1641fcb7.pdf"
                download="jatrabari-markaz-halqa-401.pdf"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-xs font-medium text-[#1D3F3B] transition-colors hover:bg-[#E5F3F0] hover:text-[#0E6F66]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>মূল ৪৪ পৃষ্ঠার পিডিএফ</span>
              </a>
              <div className={canEdit ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#D5E7E2] bg-white px-2.5 py-2 text-xs font-medium text-[#1D3F3B] transition-colors hover:bg-[#EBF4F2]"
                >
                  <Download className="h-3.5 w-3.5 text-[#0E6F66]" />
                  <span>JSON ব্যাকআপ</span>
                </button>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#D5E7E2] bg-white px-2.5 py-2 text-xs font-medium text-[#1D3F3B] transition-colors hover:bg-[#EBF4F2]"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#0E6F66]" />
                      <span>রিস্টোর করুন</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              {importError && (
                <p className="text-xs text-rose-600">{importError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#D9EAE6] bg-white p-5 shadow-[0_2px_14px_rgba(14,111,102,0.04)]">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3E2] text-[#D97706]">
                <Printer className="h-5 w-5" />
              </div>
              <h2 className="mt-3.5 text-base font-bold text-[#102A27]">
                প্রিন্ট ও রিসেট
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#4F6B67]">
                নিচের প্রিভিউ থেকে প্রিন্টের অংশ নির্বাচন করে সরাসরি প্রিন্ট বা
                PDF সেভ করুন। চাইলে মূল পিডিএফের তথ্যে ফিরে যেতে পারেন।
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B5A53] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#084741]"
              >
                <Printer className="h-4 w-4" />
                <span>এখনই প্রিন্ট / PDF করুন</span>
              </button>

              {canEdit &&
                (!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-1.5 text-xs font-medium text-[#4F6B67] transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>মূল পিডিএফ তথ্যে রিসেট</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetToBaseline();
                        setConfirmReset(false);
                      }}
                      className="flex-1 cursor-pointer rounded-xl bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                    >
                      নিশ্চিত রিসেট
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="cursor-pointer rounded-xl border border-[#D5E7E2] px-2.5 py-1.5 text-xs text-[#1D3F3B] hover:bg-[#EBF4F2]"
                    >
                      বাতিল
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Print Preview Scope Selector */}
        <section className="flex flex-col justify-between gap-3 rounded-2xl border border-[#D9EAE6] bg-white p-4 shadow-[0_2px_14px_rgba(14,111,102,0.04)] sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EBF4F2] p-1">
            <button
              type="button"
              onClick={() => setPrintScope('summary')}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                printScope === 'summary'
                  ? 'bg-[#0E6F66] text-white shadow-[0_2px_8px_rgba(14,111,102,0.22)]'
                  : 'text-[#284B47] hover:bg-white/80 hover:text-[#0E6F66]'
              }`}
            >
              এক নজরে সারসংক্ষেপ
            </button>
            <button
              type="button"
              onClick={() => setPrintScope('single')}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                printScope === 'single'
                  ? 'bg-[#0E6F66] text-white shadow-[0_2px_8px_rgba(14,111,102,0.22)]'
                  : 'text-[#284B47] hover:bg-white/80 hover:text-[#0E6F66]'
              }`}
            >
              নির্বাচিত ১টি মসজিদ
            </button>
            <button
              type="button"
              onClick={() => setPrintScope('all')}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                printScope === 'all'
                  ? 'bg-[#0E6F66] text-white shadow-[0_2px_8px_rgba(14,111,102,0.22)]'
                  : 'text-[#284B47] hover:bg-white/80 hover:text-[#0E6F66]'
              }`}
            >
              সম্পূর্ণ হালকা ({toBn(mosques.length)} মসজিদ)
            </button>
          </div>

          {printScope === 'single' && (
            <select
              aria-label="প্রিন্টের জন্য মসজিদ নির্বাচন"
              value={selectedMosqueId}
              onChange={(e) => setSelectedMosqueId(Number(e.target.value))}
              className="rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#1D3F3B] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
            >
              {mosques.map((m) => (
                <option key={m.id} value={m.id}>
                  {toBn(m.id)}. {m.name}
                </option>
              ))}
            </select>
          )}
        </section>
      </div>

      {/* Printable Official Document Sheet */}
      <div className="space-y-8 rounded-2xl border border-[#D9EAE6] bg-white p-6 shadow-[0_2px_14px_rgba(14,111,102,0.04)] sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {(printScope === 'summary' || printScope === 'all') && (
          <div className={printScope === 'all' ? 'print-break-after' : ''}>
            <div className="border-b-2 border-stone-900 pb-4">
              <p className="text-sm font-semibold text-stone-700">
                যাত্রাবাড়ী মারকাজ মসজিদ
              </p>
              <h2 className="font-display mt-1 text-3xl font-bold text-stone-900">
                ৪০১ নং হালকা — এক নজরে মসজিদ ভিত্তিক সাথীর সংখ্যা
              </h2>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse border border-stone-800 text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-900">
                    <th className="border border-stone-800 px-2 py-2 text-center">
                      ক্র
                    </th>
                    <th className="border border-stone-800 px-3 py-2 text-left">
                      মসজিদ
                    </th>
                    {SUMMARY_CATEGORIES.map((cat) => (
                      <th
                        key={cat.key}
                        className="border border-stone-800 px-1.5 py-2 text-center"
                      >
                        {cat.shortLabel}
                      </th>
                    ))}
                    <th className="border border-stone-800 px-2 py-2 text-center font-bold">
                      মোট
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mosques.map((m) => (
                    <tr key={m.id}>
                      <td className="border border-stone-300 px-2 py-1.5 text-center font-mono tabular-nums">
                        {toBn(m.id)}
                      </td>
                      <td className="border border-stone-300 px-3 py-1.5 font-medium">
                        {m.name}
                      </td>
                      {SUMMARY_CATEGORIES.map((cat) => {
                        const c = m.categories[cat.key]?.length ?? 0;
                        return (
                          <td
                            key={cat.key}
                            className="border border-stone-300 px-1.5 py-1.5 text-center font-mono tabular-nums"
                          >
                            {c > 0 ? toBn(c) : '·'}
                          </td>
                        );
                      })}
                      <td className="border border-stone-300 px-2 py-1.5 text-center font-mono font-bold tabular-nums">
                        {toBn(getMosqueTotalSathi(m))}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-stone-100 font-bold">
                    <td className="border border-stone-800 px-2 py-2" />
                    <td className="border border-stone-800 px-3 py-2">
                      সর্বমোট
                    </td>
                    {SUMMARY_CATEGORIES.map((cat) => {
                      const sum = mosques.reduce(
                        (acc, m) => acc + (m.categories[cat.key]?.length ?? 0),
                        0
                      );
                      return (
                        <td
                          key={cat.key}
                          className="border border-stone-800 px-1.5 py-2 text-center font-mono tabular-nums"
                        >
                          {toBn(sum)}
                        </td>
                      );
                    })}
                    <td className="border border-stone-800 px-2 py-2 text-center font-mono tabular-nums">
                      {toBn(grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mosquesToPrint.map((m, mIndex) => (
          <div
            key={m.id}
            className={
              mIndex < mosquesToPrint.length - 1 ? 'print-break-after' : ''
            }
          >
            <div className="flex items-start justify-between rounded-lg border-2 border-stone-900 p-4">
              <div>
                <p className="text-xs text-stone-600">
                  যাত্রাবাড়ী মারকাজ মসজিদ · ৪০১ নং হালকা · মসজিদ নং {toBn(m.id)}
                </p>
                <h3 className="font-display mt-0.5 text-2xl font-bold text-stone-900">
                  {m.name}
                </h3>
                <p className="mt-1 text-xs text-stone-600">
                  ঠিকানা: {m.address.trim() || '—'}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold tabular-nums">
                  {toBn(getMosqueTotalSathi(m))}
                </span>
                <span className="block text-xs text-stone-600">মোট সাথী</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded border border-stone-800 p-2.5">
                <p className="font-semibold text-stone-600">খতিব সাহেব</p>
                <p className="mt-1 font-bold text-stone-900">
                  {m.khatib.name.trim() || '—'}
                </p>
                <p className="font-mono text-stone-700">
                  {formatBdPhone(m.khatib.phone) || ''}
                </p>
              </div>
              <div className="rounded border border-stone-800 p-2.5">
                <p className="font-semibold text-stone-600">ইমাম সাহেব</p>
                <p className="mt-1 font-bold text-stone-900">
                  {m.imam.name.trim() || '—'}
                </p>
                <p className="font-mono text-stone-700">
                  {formatBdPhone(m.imam.phone) || ''}
                </p>
              </div>
              <div className="rounded border border-stone-800 p-2.5">
                <p className="font-semibold text-stone-600">মোয়াজ্জিন সাহেব</p>
                <p className="mt-1 font-bold text-stone-900">
                  {m.muazzin.name.trim() || '—'}
                </p>
                <p className="font-mono text-stone-700">
                  {formatBdPhone(m.muazzin.phone) || ''}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {CATEGORY_META.map((cat) => {
                const list = m.categories[cat.key] ?? [];
                return (
                  <div key={cat.key} className="print-avoid-break">
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-stone-900">
                      <span>◆ {cat.fullLabel}</span>
                      <span className="font-mono tabular-nums">
                        {toBn(list.length)} জন
                      </span>
                    </div>
                    <table className="w-full table-fixed border-collapse border border-stone-800 text-xs">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="w-12 border border-stone-400 px-2 py-1 text-center">
                            ক্র
                          </th>
                          <th className="w-[34%] border border-stone-400 px-2.5 py-1 text-left">
                            নাম
                          </th>
                          <th className="w-44 whitespace-nowrap border border-stone-400 px-2.5 py-1 text-left">
                            মোবাইল নম্বর
                          </th>
                          <th className="border border-stone-400 px-2.5 py-1 text-left">
                            মন্তব্য
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((entry, idx) => (
                          <tr key={entry.id}>
                            <td className="border border-stone-300 px-2 py-1 text-center font-mono tabular-nums">
                              {toBn(idx + 1)}
                            </td>
                            <td className="border border-stone-300 px-2.5 py-1">
                              {entry.name}
                            </td>
                            <td className="whitespace-nowrap border border-stone-300 px-2.5 py-1 font-mono tabular-nums">
                              {formatBdPhone(entry.phone)}
                            </td>
                            <td className="border border-stone-300 px-2.5 py-1">
                              {entry.notes}
                            </td>
                          </tr>
                        ))}
                        {[0, 1].map((blankOffset) => (
                          <tr key={`print-blank-${cat.key}-${blankOffset}`}>
                            <td className="border border-stone-300 px-2 py-2.5 text-center font-mono tabular-nums">
                              {toBn(list.length + blankOffset + 1)}
                            </td>
                            <td className="border border-stone-300 px-2.5 py-2.5" />
                            <td className="border border-stone-300 px-2.5 py-2.5" />
                            <td className="border border-stone-300 px-2.5 py-2.5" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
