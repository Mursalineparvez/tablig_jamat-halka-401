import React from 'react';
import { KeyRound, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { ActiveTab } from '../types/directory';
import { PWAInstallButton } from './PWAControls';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onAddMember: () => void;
  canEdit: boolean;
  sheetConnected: boolean;
  isSyncing: boolean;
  onOpenAuthModal: () => void;
  onManualSync: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'overview', label: 'এক নজরে' },
  { id: 'mosques', label: 'মসজিদসমূহ' },
  { id: 'directory', label: 'সাথী ডিরেক্টরি' },
  { id: 'takaja', label: 'চলমান তাকাজা' },
  { id: 'kargoojari', label: 'কারগুজারি' },
  { id: 'report', label: 'প্রিন্ট ও রিপোর্ট' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onAddMember,
  canEdit,
  sheetConnected,
  isSyncing,
  onOpenAuthModal,
  onManualSync,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#D9EAE6] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="font-display shrink-0 cursor-pointer whitespace-nowrap text-left text-lg font-bold tracking-tight text-[#102A27] transition-colors hover:text-[#0E6F66] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6F66]"
        >
          যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="প্রাথমিক নেভিগেশন"
          className="hidden items-center gap-5 lg:flex xl:gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative shrink-0 cursor-pointer whitespace-nowrap py-1 text-[14.5px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6F66] ${
                  isActive
                    ? 'font-semibold text-[#0E6F66]'
                    : 'text-[#526D69] hover:text-[#102A27]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2.5px] rounded-full bg-[#0E6F66]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: PWA Install, Live Sync, PIN Auth & Primary CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <PWAInstallButton />

          {sheetConnected && (
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              title="সর্বশেষ তথ্য সিঙ্ক করুন"
              aria-label="সর্বশেষ তথ্য সিঙ্ক করুন"
              className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] p-2 text-[#0E6F66] transition-colors hover:bg-[#E5F3F0] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAuthModal}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              canEdit
                ? 'border border-[#B7DBD3] bg-[#E5F3F0] text-[#0E6F66] hover:bg-[#D5ECE6]'
                : 'border border-[#B7DBD3] bg-[#E5F3F0] text-[#0E6F66] hover:bg-[#0E6F66] hover:text-white'
            }`}
          >
            {canEdit ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span className="hidden sm:inline">এডিটর সক্রিয়</span>
                <span className="sm:hidden">এডিটর</span>
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5" />
                <span>এডিট লগইন</span>
              </>
            )}
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onAddMember}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0E6F66] px-3.5 py-2 text-sm font-medium text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] transition-colors duration-150 hover:bg-[#0B5A53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6F66] sm:px-4"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">নতুন সাথী যুক্ত করুন</span>
              <span className="sm:hidden">যুক্ত করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Tablet & Mobile navigation strip */}
      <nav
        aria-label="মোবাইল নেভিগেশন"
        className="flex items-center gap-5 overflow-x-auto border-t border-[#D9EAE6] bg-white px-4 py-2 lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`shrink-0 whitespace-nowrap pb-0.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-[#0E6F66] font-semibold text-[#0E6F66]'
                  : 'text-[#526D69]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
