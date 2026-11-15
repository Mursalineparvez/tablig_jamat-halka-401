import React from 'react';
import { Plus } from 'lucide-react';
import { ActiveTab } from '../types/directory';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onAddMember: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'overview', label: 'এক নজরে' },
  { id: 'mosques', label: 'মসজিদসমূহ' },
  { id: 'directory', label: 'সাথী ডিরেক্টরি' },
  { id: 'report', label: 'প্রিন্ট ও রিপোর্ট' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onAddMember,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-stone-200 bg-[#F7F6F2]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="font-display shrink-0 cursor-pointer whitespace-nowrap text-left text-lg font-bold tracking-tight text-stone-900 transition-colors hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 sm:text-xl"
        >
          যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="প্রাথমিক নেভিগেশন"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative shrink-0 cursor-pointer whitespace-nowrap py-1 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 ${
                  isActive
                    ? 'text-emerald-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-emerald-800"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-900 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">নতুন সাথী যুক্ত করুন</span>
            <span className="sm:hidden">যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation strip (non-sticky extra row inside header only on small viewports) */}
      <nav
        aria-label="মোবাইল নেভিগেশন"
        className="flex items-center gap-5 overflow-x-auto border-t border-stone-200/80 px-4 py-2 md:hidden"
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
                  ? 'border-b-2 border-emerald-800 text-emerald-900'
                  : 'text-stone-600'
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
