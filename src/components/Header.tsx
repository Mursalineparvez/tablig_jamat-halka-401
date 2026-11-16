import React from 'react';
import { Lock, LogIn, Plus, ShieldCheck } from 'lucide-react';
import { ActiveTab } from '../types/directory';
import { toBn } from '../utils/bengali';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onAddMember: () => void;
  userEmail: string | null;
  canEdit: boolean;
  isSuperAdmin: boolean;
  pendingRequestCount: number;
  onOpenAccessModal: () => void;
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
  userEmail,
  canEdit,
  isSuperAdmin,
  pendingRequestCount,
  onOpenAccessModal,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#E2ECF7] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="font-display shrink-0 cursor-pointer whitespace-nowrap text-left text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-[#0066E6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066E6]"
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
                className={`relative shrink-0 cursor-pointer whitespace-nowrap py-1 text-[14.5px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066E6] ${
                  isActive
                    ? 'font-semibold text-[#0066E6]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2.5px] rounded-full bg-[#0066E6]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Auth & Primary CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenAccessModal}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              isSuperAdmin
                ? 'border border-[#BFD9FA] bg-[#EBF4FF] text-[#0066E6] hover:bg-[#DCEBFF]'
                : canEdit
                ? 'border border-[#DCE8F7] bg-[#F8FBFF] text-slate-700 hover:bg-[#EBF4FF] hover:text-[#0066E6]'
                : userEmail
                ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                : 'border border-[#BFD9FA] bg-[#EBF4FF] text-[#0066E6] hover:bg-[#0066E6] hover:text-white'
            }`}
          >
            {isSuperAdmin ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">অ্যাক্সেস কন্ট্রোল</span>
                <span className="sm:hidden">অ্যাক্সেস</span>
                {pendingRequestCount > 0 && (
                  <span className="ml-0.5 rounded-md bg-[#0066E6] px-1.5 py-0.5 font-mono text-[10px] text-white">
                    {toBn(pendingRequestCount)}
                  </span>
                )}
              </>
            ) : canEdit ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">এডিটর অ্যাকাউন্ট</span>
                <span className="sm:hidden">অ্যাকাউন্ট</span>
              </>
            ) : userEmail ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>অ্যাক্সেস অনুরোধ</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                <span>এডিট সাইন ইন</span>
              </>
            )}
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onAddMember}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0066E6] px-3.5 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] transition-colors duration-150 hover:bg-[#0052BD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066E6] sm:px-4"
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
        className="flex items-center gap-5 overflow-x-auto border-t border-[#E2ECF7] bg-white px-4 py-2 lg:hidden"
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
                  ? 'border-b-2 border-[#0066E6] font-semibold text-[#0066E6]'
                  : 'text-slate-600'
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
