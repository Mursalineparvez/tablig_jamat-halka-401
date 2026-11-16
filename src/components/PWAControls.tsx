import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  MoreVertical,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { canPromptInstall, isStandalone, isIOS, triggerInstall } =
    usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  // Suppress install CTA completely when already running as an installed standalone PWA
  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (canPromptInstall) {
      const result = await triggerInstall();
      if (result === 'accepted') {
        return;
      }
      if (result === 'unavailable') {
        setGuideOpen(true);
      }
      return;
    }
    setGuideOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        title="অফলাইন অ্যাপ হিসেবে ফোনে ইনস্টল করুন (এমবি ছাড়াও চলবে)"
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#B7DBD3] bg-[#F4FAF8] px-2.5 py-2 text-xs font-semibold text-[#0E6F66] transition-colors hover:bg-[#0E6F66] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6F66] sm:px-3"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">অফলাইন ইনস্টল</span>
        <span className="sm:hidden">ইনস্টল</span>
      </button>

      {guideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A27]/55 p-4 backdrop-blur-xs"
          onClick={() => setGuideOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            className="w-full max-w-md rounded-2xl border border-[#D9EAE6] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F3F0] text-[#0E6F66]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="pwa-install-title"
                    className="font-display text-base font-bold text-[#102A27]"
                  >
                    অফলাইন অ্যাপ ইনস্টল করুন
                  </h2>
                  <p className="text-xs text-[#526D69]">
                    এমবি ছাড়াও যেকোনো সময় সব তথ্য দেখুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="বন্ধ করুন"
                className="cursor-pointer rounded-lg p-1.5 text-[#526D69] transition-colors hover:bg-[#E5F3F0] hover:text-[#102A27]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#D9EAE6] bg-[#F4FAF8] p-3.5 text-xs leading-relaxed text-[#1D3F3B]">
              <p className="font-semibold text-[#0E6F66]">
                স্বয়ংক্রিয় অফলাইন সংরক্ষণ চালু আছে
              </p>
              <p className="mt-1 text-[#526D69]">
                আপনি একবার এই ওয়েবসাইটে ঢুকলেই সব মসজিদ, সাথী ডিরেক্টরি, চলমান
                তাকাজা ও কারগুজারির তথ্য ফোনে সেভ হয়ে থাকে। পরবর্তীতে এমবি না
                থাকলেও সহজেই খুলতে পারবেন।
              </p>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-[#102A27]">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#E5F3F0] font-mono text-xs font-semibold text-[#0E6F66]">
                    ১
                  </span>
                  <span>
                    Safari ব্রাউজারের নিচে{' '}
                    <span className="inline-flex items-center gap-1 rounded bg-[#E5F3F0] px-1.5 py-0.5 font-semibold text-[#0E6F66]">
                      <Share className="h-3.5 w-3.5" /> Share
                    </span>{' '}
                    বাটনে ট্যাপ করুন।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#E5F3F0] font-mono text-xs font-semibold text-[#0E6F66]">
                    ২
                  </span>
                  <span>
                    তালিকা থেকে <strong>“Add to Home Screen”</strong> সিলেক্ট
                    করে <strong>Add</strong> চাপুন।
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm text-[#102A27]">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#E5F3F0] font-mono text-xs font-semibold text-[#0E6F66]">
                    ১
                  </span>
                  <span>
                    ব্রাউজারের উপরের ডানদিকে{' '}
                    <span className="inline-flex items-center gap-0.5 rounded bg-[#E5F3F0] px-1.5 py-0.5 font-semibold text-[#0E6F66]">
                      <MoreVertical className="h-3.5 w-3.5" /> মেনু (⋮)
                    </span>{' '}
                    বাটনে ট্যাপ করুন।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#E5F3F0] font-mono text-xs font-semibold text-[#0E6F66]">
                    ২
                  </span>
                  <span>
                    <strong>“Install app”</strong> অথবা{' '}
                    <strong>“Add to Home screen”</strong> অপশনে ট্যাপ করলে
                    ফোনের হোম স্ক্রিনে অ্যাপ যুক্ত হয়ে যাবে।
                  </span>
                </li>
              </ol>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B5A53]"
              >
                বুঝেছি
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const { isOnline, offlineReady, dismissOfflineReady } = useOnlineStatus();

  useEffect(() => {
    if (!offlineReady) return;
    const timer = window.setTimeout(() => {
      dismissOfflineReady();
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [offlineReady, dismissOfflineReady]);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="no-print border-b border-amber-200 bg-[#FEF3E2] px-4 py-2 text-xs text-amber-900"
      >
        <div className="mx-auto flex max-w-[1320px] items-center justify-center gap-2 text-center font-medium sm:px-6 lg:px-8">
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
          <span>
            অফলাইন মোড চালু — এমবি/ইন্টারনেট ছাড়াই সংরক্ষিত সকল মসজিদ, সাথী,
            তাকাজা ও কারগুজারি দেখা যাচ্ছে।
          </span>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="no-print fixed bottom-5 left-5 z-40 flex max-w-sm items-center gap-2.5 rounded-xl border border-[#B7DBD3] bg-white px-4 py-2.5 text-xs font-medium text-[#102A27] shadow-lg"
      >
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-[#0E6F66]"
          aria-hidden="true"
        />
        <span>
          অফলাইন সংরক্ষণ সম্পন্ন! এখন থেকে এমবি ছাড়াও এই সাইট ও সব তথ্য দেখা
          যাবে।
        </span>
        <button
          type="button"
          onClick={dismissOfflineReady}
          aria-label="বন্ধ করুন"
          className="cursor-pointer rounded-md p-1 text-[#526D69] hover:bg-[#E5F3F0] hover:text-[#102A27]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
