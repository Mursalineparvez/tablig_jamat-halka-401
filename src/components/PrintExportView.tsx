import React, { useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { MosqueRecord } from '../types/directory';
import {
  CATEGORY_META,
  exportMosquesToCSV,
  getMosqueTotalSathi,
  SUMMARY_CATEGORIES,
  toBn,
} from '../utils/bengali';

interface PrintExportViewProps {
  mosques: MosqueRecord[];
  onImportData: (mosques: MosqueRecord[]) => void;
  onResetToBaseline: () => void;
}

type PrintScope = 'summary' | 'single' | 'all';

export const PrintExportView: React.FC<PrintExportViewProps> = ({
  mosques,
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
    const json = JSON.stringify(mosques, null, 2);
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
        if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].name) {
          setImportError('সঠিক হালকা JSON ব্যাকআপ ফাইল নির্বাচন করুন।');
          return;
        }
        onImportData(parsed as MosqueRecord[]);
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
        <section className="border-b border-stone-200 pb-6">
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
            প্রিন্ট, পিডিএফ ও ডেটা এক্সপোর্ট
          </h1>
          <p className="mt-1.5 text-sm text-stone-600">
            আসল ফরমের আদলে পরিচ্ছন্ন প্রিন্ট কপি তৈরি করুন, Excel-এর জন্য CSV
            ডাউনলোড করুন অথবা ব্যাকআপ সংরক্ষণ করুন।
          </p>
        </section>

        {/* Export Action Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5">
            <div>
              <FileSpreadsheet className="h-5 w-5 text-emerald-900" />
              <h2 className="mt-3 text-base font-bold text-stone-900">
                Excel / CSV এক্সপোর্ট
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                সকল ১৪টি মসজিদের ওলামা, সাথী, মোবাইল নম্বর, খতিব, ইমাম ও
                মোয়াজ্জিনের তালিকা Excel উপযোগী UTF-8 CSV ফরম্যাটে ডাউনলোড
                করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportMosquesToCSV(mosques)}
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              <span>CSV ডাউনলোড করুন</span>
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5">
            <div>
              <FileText className="h-5 w-5 text-stone-700" />
              <h2 className="mt-3 text-base font-bold text-stone-900">
                মূল পিডিএফ ও ব্যাকআপ
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                আপনার মূল ৪৪ পৃষ্ঠার পিডিএফ ফাইলটি ডাউনলোড করুন অথবা
                আপডেটকৃত তথ্যের JSON ব্যাকআপ সংরক্ষণ ও রিস্টোর করুন।
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <a
                href="/assets/aistudio/______________1__1641fcb7.pdf"
                download="jatrabari-markaz-halqa-401.pdf"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 transition-colors hover:bg-stone-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>মূল ৪৪ পৃষ্ঠার পিডিএফ</span>
              </a>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JSON ব্যাকআপ</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>রিস্টোর করুন</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </div>
              {importError && (
                <p className="text-xs text-red-700">{importError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5">
            <div>
              <Printer className="h-5 w-5 text-stone-700" />
              <h2 className="mt-3 text-base font-bold text-stone-900">
                প্রিন্ট ও রিসেট
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                নিচের প্রিভিউ থেকে প্রিন্টের অংশ নির্বাচন করে সরাসরি প্রিন্ট বা
                PDF সেভ করুন। চাইলে মূল পিডিএফের তথ্যে ফিরে যেতে পারেন।
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
              >
                <Printer className="h-4 w-4" />
                <span>এখনই প্রিন্ট / PDF করুন</span>
              </button>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
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
                    className="flex-1 cursor-pointer rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-800"
                  >
                    নিশ্চিত রিসেট
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="cursor-pointer rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-100"
                  >
                    বাতিল
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Print Preview Scope Selector */}
        <section className="flex flex-col justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPrintScope('summary')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                printScope === 'summary'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              এক নজরে সারসংক্ষেপ
            </button>
            <button
              type="button"
              onClick={() => setPrintScope('single')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                printScope === 'single'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              নির্বাচিত ১টি মসজিদ
            </button>
            <button
              type="button"
              onClick={() => setPrintScope('all')}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                printScope === 'all'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              সম্পূর্ণ হালকা (১৪ মসজিদ)
            </button>
          </div>

          {printScope === 'single' && (
            <select
              aria-label="প্রিন্টের জন্য মসজিদ নির্বাচন"
              value={selectedMosqueId}
              onChange={(e) => setSelectedMosqueId(Number(e.target.value))}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:border-emerald-800 focus:outline-none"
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
      <div className="space-y-8 rounded-xl border border-stone-300 bg-white p-6 sm:p-10 print:border-0 print:p-0">
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
                  {m.khatib.phone.trim() || ''}
                </p>
              </div>
              <div className="rounded border border-stone-800 p-2.5">
                <p className="font-semibold text-stone-600">ইমাম সাহেব</p>
                <p className="mt-1 font-bold text-stone-900">
                  {m.imam.name.trim() || '—'}
                </p>
                <p className="font-mono text-stone-700">
                  {m.imam.phone.trim() || ''}
                </p>
              </div>
              <div className="rounded border border-stone-800 p-2.5">
                <p className="font-semibold text-stone-600">মোয়াজ্জিন সাহেব</p>
                <p className="mt-1 font-bold text-stone-900">
                  {m.muazzin.name.trim() || '—'}
                </p>
                <p className="font-mono text-stone-700">
                  {m.muazzin.phone.trim() || ''}
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
                    <table className="w-full border-collapse border border-stone-800 text-xs">
                      <thead>
                        <tr className="bg-stone-100">
                          <th className="w-10 border border-stone-400 px-2 py-1 text-center">
                            ক্র
                          </th>
                          <th className="border border-stone-400 px-2.5 py-1 text-left">
                            নাম
                          </th>
                          <th className="w-36 border border-stone-400 px-2.5 py-1 text-left">
                            মোবাইল নম্বর
                          </th>
                          <th className="border border-stone-400 px-2.5 py-1 text-left">
                            ঠিকানা
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
                            <td className="border border-stone-300 px-2.5 py-1 font-mono tabular-nums">
                              {entry.phone}
                            </td>
                            <td className="border border-stone-300 px-2.5 py-1">
                              {entry.address}
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
