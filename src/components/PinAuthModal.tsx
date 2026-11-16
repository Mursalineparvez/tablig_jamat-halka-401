import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  getEnvSheetSyncUrl,
  GOOGLE_APPS_SCRIPT_CODE,
  hasLocalPin,
} from '../services/sheetSyncService';
import { toBn } from '../utils/bengali';

interface PinAuthModalProps {
  canEdit: boolean;
  sheetUrl: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  authBusy: boolean;
  authError: string | null;
  onClose: () => void;
  onPinLogin: (pin: string) => Promise<void>;
  onCreateLocalPin: (pin: string) => Promise<void>;
  onChangeSheetPin: (newPin: string) => Promise<boolean>;
  onLogout: () => void;
  onConnectSheetUrl: (url: string) => Promise<boolean>;
  onDisconnectSheetUrl: () => void;
  onSyncNow: () => Promise<void>;
  onPushAllToSheet: () => Promise<void>;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  canEdit,
  sheetUrl,
  isSyncing,
  lastSyncedAt,
  authBusy,
  authError,
  onClose,
  onPinLogin,
  onCreateLocalPin,
  onChangeSheetPin,
  onLogout,
  onConnectSheetUrl,
  onDisconnectSheetUrl,
  onSyncNow,
  onPushAllToSheet,
}) => {
  const [activeSection, setActiveSection] = useState<'login' | 'sync'>('login');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [localError, setLocalError] = useState('');

  // Change PIN state (for Sheet mode)
  const [newPinInput, setNewPinInput] = useState('');
  const [changingPin, setChangingPin] = useState(false);
  const [pinChangedSuccess, setPinChangedSuccess] = useState(false);

  // Sheet setup state
  const [urlInput, setUrlInput] = useState(sheetUrl);
  const [copiedScript, setCopiedScript] = useState(false);
  const [testingUrl, setTestingUrl] = useState(false);
  const [urlError, setUrlError] = useState('');

  const envLocked = Boolean(getEnvSheetSyncUrl());
  const isSheetConnected = Boolean(sheetUrl);
  const isFirstLocalSetup = !isSheetConnected && !hasLocalPin();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pinInput.trim();
    if (cleaned.length < 4) {
      setLocalError('কমপক্ষে ৪ সংখ্যার পিন কোড লিখুন।');
      return;
    }
    setLocalError('');
    if (isFirstLocalSetup) {
      await onCreateLocalPin(cleaned);
    } else {
      await onPinLogin(cleaned);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newPinInput.trim();
    if (cleaned.length < 4) {
      setLocalError('নতুন পিন কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    setLocalError('');
    setChangingPin(true);
    setPinChangedSuccess(false);
    try {
      const ok = await onChangeSheetPin(cleaned);
      if (ok) {
        setNewPinInput('');
        setPinChangedSuccess(true);
      }
    } finally {
      setChangingPin(false);
    }
  };

  const handleCopyScript = () => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    }
    setCopiedScript(true);
    window.setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleConnectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = urlInput.trim();
    if (!cleaned.startsWith('https://script.google.com/')) {
      setUrlError(
        'সঠিক Google Apps Script Web App লিংক দিন (https://script.google.com/... দিয়ে শুরু হবে)।'
      );
      return;
    }
    setUrlError('');
    setTestingUrl(true);
    try {
      const ok = await onConnectSheetUrl(cleaned);
      if (ok) {
        setActiveSection('login');
      } else {
        setUrlError(
          'লিংকটিতে সংযোগ করা যায়নি। Deploy করার সময় "Who has access: Anyone" দেওয়া হয়েছে কিনা নিশ্চিত করুন।'
        );
      }
    } finally {
      setTestingUrl(false);
    }
  };

  const formattedLastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-lg rounded-2xl border border-[#D9EAE6] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F3F0] text-[#0E6F66]">
              {canEdit ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <KeyRound className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2
                id="pin-auth-modal-title"
                className="font-display text-lg font-bold text-[#102A27]"
              >
                {canEdit
                  ? 'এডিটর সক্রিয় ও লাইভ সিঙ্ক'
                  : 'এডিট করার জন্য পিন লগইন'}
              </h2>
              <p className="text-xs text-[#58726E]">
                যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-xl p-1.5 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#102A27]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="border-b border-[#EDF5F3] bg-[#F4FAF8] px-5 py-2.5">
          <div className="inline-flex rounded-xl bg-[#E5F3F0] p-1">
            <button
              type="button"
              onClick={() => setActiveSection('login')}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeSection === 'login'
                  ? 'bg-[#0E6F66] text-white shadow-xs'
                  : 'text-[#284B47] hover:text-[#0E6F66]'
              }`}
            >
              {canEdit ? 'অ্যাকাউন্ট ও পিন' : 'পিন লগইন'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('sync')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeSection === 'sync'
                  ? 'bg-[#0E6F66] text-white shadow-xs'
                  : 'text-[#284B47] hover:text-[#0E6F66]'
              }`}
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>
                লাইভ সিঙ্ক{' '}
                {isSheetConnected ? '(সংযুক্ত)' : '(Google Sheet সেটআপ)'}
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5 sm:p-6">
          {activeSection === 'login' && (
            <>
              {(authError || localError) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
                  {localError || authError}
                </div>
              )}

              {!canEdit ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="rounded-xl border border-[#D9EAE6] bg-[#F4FAF8] p-3.5 text-xs leading-relaxed text-[#4F6B67]">
                    {isSheetConnected ? (
                      <p>
                        Google Sheet-এর সাথে সংযুক্ত আছে। আপনার অ্যাডমিন পিন
                        কোড দিলে সাথে সাথে এডিট চালু হবে এবং সবার ফোনে আপডেট চলে
                        যাবে।
                      </p>
                    ) : isFirstLocalSetup ? (
                      <p>
                        নতুন পিন কোড সেট করে এখনই এডিট শুরু করুন। (সবার ফোনে
                        লাইভ সিঙ্ক চালু করতে পাশের{' '}
                        <button
                          type="button"
                          onClick={() => setActiveSection('sync')}
                          className="cursor-pointer font-semibold text-[#0E6F66] underline"
                        >
                          লাইভ সিঙ্ক
                        </button>{' '}
                        ট্যাবে Google Sheet যুক্ত করুন।)
                      </p>
                    ) : (
                      <p>
                        এডিট চালু করতে আপনার নির্ধারিত পিন কোড দিন।
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="admin-pin-input"
                      className="block text-xs font-semibold text-[#1D3F3B]"
                    >
                      {isFirstLocalSetup
                        ? 'নতুন পিন কোড সেট করুন (কমপক্ষে ৪ সংখ্যা)'
                        : 'পিন কোড'}
                    </label>
                    <div className="relative mt-1.5">
                      <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B8682]" />
                      <input
                        id="admin-pin-input"
                        type={showPin ? 'text' : 'password'}
                        inputMode="numeric"
                        autoFocus
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          if (localError) setLocalError('');
                        }}
                        placeholder="পিন কোড লিখুন"
                        className="w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] py-2.5 pr-10 pl-9 font-mono text-sm tracking-widest text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin((v) => !v)}
                        aria-label={showPin ? 'পিন লুকান' : 'পিন দেখুন'}
                        className="cursor-pointer absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-[#6B8682] hover:bg-[#E5F3F0] hover:text-[#102A27]"
                      >
                        {showPin ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer rounded-xl border border-[#D5E7E2] px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={authBusy}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-5 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53] disabled:opacity-60"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>
                        {authBusy
                          ? 'যাচাই হচ্ছে...'
                          : isFirstLocalSetup
                          ? 'পিন সেট ও লগইন করুন'
                          : 'লগইন করুন'}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#B7DBD3] bg-[#E7F7F0]/75 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                      <div>
                        <p className="text-sm font-bold text-[#102A27]">
                          এডিটর লগইন সক্রিয়
                        </p>
                        <p className="text-xs text-[#4F6B67]">
                          সব মসজিদ, সাথী, তাকাজা ও কারগুজারি এডিট করতে পারবেন
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#D5E7E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D3F3B] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>লগআউট</span>
                    </button>
                  </div>

                  {isSheetConnected ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D9EAE6] bg-[#F4FAF8] px-4 py-3 text-xs">
                        <div>
                          <p className="font-semibold text-[#0E6F66]">
                            Google Sheet লাইভ সিঙ্ক চালু আছে
                          </p>
                          <p className="text-[#58726E]">
                            {formattedLastSync
                              ? `সর্বশেষ সিঙ্ক: ${formattedLastSync}`
                              : 'অটো সিঙ্ক সক্রিয়'}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={() => void onPushAllToSheet()}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0B5A53] disabled:opacity-60"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>সব তথ্য Sheet-এ পাঠান</span>
                        </button>
                      </div>

                      <form
                        onSubmit={handleChangePinSubmit}
                        className="space-y-2.5 rounded-xl border border-[#D9EAE6] bg-white p-4"
                      >
                        <label className="block text-xs font-bold text-[#102A27]">
                          Google Sheet-এর অ্যাডমিন পিন পরিবর্তন করুন
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={newPinInput}
                            onChange={(e) => {
                              setNewPinInput(e.target.value);
                              setPinChangedSuccess(false);
                            }}
                            placeholder="নতুন পিন (যেমন: ৬ সংখ্যা)"
                            className="flex-1 rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-xs text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={changingPin}
                            className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5A53] disabled:opacity-60"
                          >
                            {changingPin ? 'আপডেট...' : 'পিন বদলান'}
                          </button>
                        </div>
                        {pinChangedSuccess && (
                          <p className="text-xs font-medium text-emerald-700">
                            পিন কোড সফলভাবে পরিবর্তন করা হয়েছে।
                          </p>
                        )}
                      </form>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-[#FEF3E2]/70 p-4 text-xs leading-relaxed text-amber-900">
                      <p className="font-bold">
                        এখন শুধু এই ডিভাইসেই পরিবর্তন সেভ হচ্ছে।
                      </p>
                      <p className="mt-1">
                        সবার ফোনে অটো লাইভ আপডেট পাঠাতে পাশের{' '}
                        <button
                          type="button"
                          onClick={() => setActiveSection('sync')}
                          className="cursor-pointer font-semibold text-[#0E6F66] underline"
                        >
                          লাইভ সিঙ্ক (Google Sheet)
                        </button>{' '}
                        সেটআপ করে নিন (মাত্র ২ মিনিট সময় লাগবে)।
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeSection === 'sync' && (
            <div className="space-y-4">
              {/* Sync Status Card */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D9EAE6] bg-[#F4FAF8] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {isSheetConnected ? (
                    <Cloud className="h-5 w-5 text-[#0E6F66]" />
                  ) : (
                    <CloudOff className="h-5 w-5 text-[#7B9591]" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-[#102A27]">
                      {isSheetConnected
                        ? 'Google Sheet লাইভ সিঙ্ক সংযুক্ত'
                        : 'Google Sheet এখনো সংযুক্ত নয়'}
                    </p>
                    <p className="text-[11px] text-[#58726E]">
                      {isSheetConnected
                        ? formattedLastSync
                          ? `সর্বশেষ সিঙ্ক: ${formattedLastSync}`
                          : 'সব তথ্য অটো সিঙ্ক হচ্ছে'
                        : 'নিচের ৩ ধাপ অনুসরণ করে ফ্রি Google Sheet যুক্ত করুন'}
                    </p>
                  </div>
                </div>
                {isSheetConnected && (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => void onSyncNow()}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#B7DBD3] bg-white px-3 py-1.5 text-xs font-semibold text-[#0E6F66] hover:bg-[#E5F3F0] disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isSyncing ? 'animate-spin' : ''
                      }`}
                    />
                    <span>সিঙ্ক করুন</span>
                  </button>
                )}
              </div>

              {/* 3-Step Guide */}
              <div className="space-y-2.5 rounded-xl border border-[#D9EAE6] bg-white p-4 text-xs leading-relaxed text-[#1D3F3B]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[#102A27]">
                    সহজ সেটআপ নির্দেশনা (মাত্র ২ মিনিট):
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#B7DBD3] bg-[#E5F3F0] px-2.5 py-1.5 text-[11px] font-semibold text-[#0E6F66] hover:bg-[#0E6F66] hover:text-white"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>কোড কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Apps Script কোড কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>

                <ol className="space-y-1.5 text-[#4F6B67]">
                  <li>
                    <strong className="text-[#102A27]">{toBn(1)}.</strong>{' '}
                    <span className="font-mono">sheets.google.com</span>-এ গিয়ে
                    একটি নতুন <strong>Google Sheet</strong> খুলুন।
                  </li>
                  <li>
                    <strong className="text-[#102A27]">{toBn(2)}.</strong>{' '}
                    উপরের মেনু থেকে{' '}
                    <strong>Extensions → Apps Script</strong>-এ যান, উপরের কপি
                    করা কোডটি পেস্ট করে <strong>Save</strong> করুন।
                  </li>
                  <li>
                    <strong className="text-[#102A27]">{toBn(3)}.</strong>{' '}
                    ডানদিকে <strong>Deploy → New deployment → Web app</strong>{' '}
                    সিলেক্ট করে <strong>Who has access: Anyone</strong> দিন এবং
                    Deploy করে পাওয়া <strong>Web app URL</strong> নিচে পেস্ট
                    করুন (ডিফল্ট পিন <span className="font-mono font-bold">401401</span>,
                    যা লগইনের পর বদলাতে পারবেন)।
                  </li>
                </ol>
              </div>

              {/* URL Input Form */}
              <form onSubmit={handleConnectUrl} className="space-y-2.5">
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="url"
                  disabled={envLocked}
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-xs text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none disabled:opacity-70"
                />
                {urlError && (
                  <p className="text-xs font-medium text-rose-600">
                    {urlError}
                  </p>
                )}

                {envLocked ? (
                  <p className="text-[11px] text-[#0E6F66]">
                    এই সাইটে পরিবেশ সেটিংস (`VITE_SHEET_SYNC_URL`) থেকে সবার
                    জন্য লাইভ সিঙ্ক লিংক সেট করা আছে।
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {isSheetConnected ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDisconnectSheetUrl();
                          setUrlInput('');
                        }}
                        className="cursor-pointer rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        লিংক সরান
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={testingUrl}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53] disabled:opacity-60"
                    >
                      <Cloud className="h-3.5 w-3.5" />
                      <span>
                        {testingUrl
                          ? 'সংযোগ যাচাই হচ্ছে...'
                          : 'সংযুক্ত ও টেস্ট করুন'}
                      </span>
                    </button>
                  </div>
                )}
              </form>

              {!envLocked && isSheetConnected && (
                <p className="rounded-xl border border-[#D9EAE6] bg-[#F4FAF8] p-3 text-[11px] leading-relaxed text-[#4F6B67]">
                  <strong className="text-[#102A27]">
                    সব সাথীর ফোনে অটো পেতে:
                  </strong>{' '}
                  এই Web App URL-টি Vercel-এর Environment Variables-এ{' '}
                  <span className="font-mono font-semibold text-[#0E6F66]">
                    VITE_SHEET_SYNC_URL
                  </span>{' '}
                  নামে যুক্ত করে Redeploy করুন (অথবা এই চ্যাটে দিলে আমি কোডে
                  সেট করে দেব)।
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
