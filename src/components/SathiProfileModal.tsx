import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  MapPin,
  Phone,
  User,
  X,
} from 'lucide-react';
import { MosqueRecord } from '../types/directory';
import {
  findAllMosqueMemberMatches,
  formatBdPhone,
  MosqueMemberMatch,
  toBn,
} from '../utils/bengali';
import { PhoneActions } from './PhoneActions';

export interface InspectedPersonInput {
  name: string;
  phone?: string;
  mosqueId?: number;
  roleOrCategory?: string;
  notes?: string;
}

interface SathiProfileModalProps {
  person: InspectedPersonInput;
  mosques: MosqueRecord[];
  onOpenMosque: (mosqueId: number) => void;
  onCopyPhone: (phone: string) => void;
  onClose: () => void;
}

export const SathiProfileModal: React.FC<SathiProfileModalProps> = ({
  person,
  mosques,
  onOpenMosque,
  onCopyPhone,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const matches = useMemo<MosqueMemberMatch[]>(() => {
    const found = findAllMosqueMemberMatches(
      person.name,
      mosques,
      person.phone
    );

    // If clicked directly from a known mosque card/row, prioritize that exact match first
    if (person.mosqueId) {
      const explicitMosque = mosques.find((m) => m.id === person.mosqueId);
      if (explicitMosque) {
        const directMatch: MosqueMemberMatch = {
          mosqueId: explicitMosque.id,
          mosqueName: explicitMosque.name,
          mosqueAddress: explicitMosque.address,
          roleOrCategory: person.roleOrCategory || 'সাথী',
          memberName: person.name,
          phone: formatBdPhone(person.phone ?? ''),
          notes: person.notes ?? '',
        };
        const others = found.filter(
          (item) =>
            !(
              item.mosqueId === directMatch.mosqueId &&
              item.roleOrCategory === directMatch.roleOrCategory &&
              item.memberName === directMatch.memberName
            )
        );
        return [directMatch, ...others];
      }
    }

    return found;
  }, [person, mosques]);

  const primaryPhone = useMemo(() => {
    const direct = formatBdPhone(person.phone ?? '');
    if (direct) return direct;
    const matchedWithPhone = matches.find((m) => m.phone.trim());
    return matchedWithPhone?.phone ?? '';
  }, [person.phone, matches]);

  const combinedNotes = useMemo(() => {
    const notesList = [
      person.notes?.trim(),
      ...matches.map((m) => m.notes.trim()),
    ].filter((n): n is string => Boolean(n));
    return Array.from(new Set(notesList));
  }, [person.notes, matches]);

  const handleCopy = (key: string, phone: string) => {
    onCopyPhone(phone);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sathi-profile-title"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-lg rounded-2xl border border-[#E2ECF7] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 rounded-t-2xl border-b border-[#E2ECF7] bg-gradient-to-r from-[#EBF4FF] via-[#F4F9FF] to-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0066E6] text-white shadow-[0_2px_8px_rgba(0,102,230,0.25)]">
              <User className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#0066E6]">
                সাথী পরিচিতি · ৪০১ নং হালকা
              </p>
              <h2
                id="sathi-profile-title"
                className="font-display text-xl font-bold text-slate-900"
              >
                {person.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {/* Phone Number Section */}
          <div className="rounded-2xl border border-[#DCE8F7] bg-[#F8FBFF] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Phone className="h-3.5 w-3.5 text-[#0066E6]" />
              <span>মোবাইল নম্বর</span>
            </div>
            {primaryPhone ? (
              <div className="mt-2.5">
                <PhoneActions
                  phone={primaryPhone}
                  copied={copiedKey === 'primary-phone'}
                  onCopy={() => handleCopy('primary-phone', primaryPhone)}
                />
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-500">
                মোবাইল নম্বর সংরক্ষিত নেই
              </p>
            )}
          </div>

          {/* Mosque Affiliation(s) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-[#0066E6]" />
                <span>কোন মসজিদের সাথী / দায়িত্ব</span>
              </span>
              {matches.length > 1 && (
                <span className="text-[11px] font-medium text-slate-500">
                  {toBn(matches.length)}টি স্থানে যুক্ত
                </span>
              )}
            </div>

            {matches.length > 0 ? (
              <div className="space-y-2.5">
                {matches.map((m, idx) => (
                  <div
                    key={`${m.mosqueId}-${m.roleOrCategory}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2ECF7] bg-white p-3.5 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {toBn(m.mosqueId)}. {m.mosqueName}
                        </span>
                        <span className="rounded-lg bg-[#EBF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#0066E6]">
                          {m.roleOrCategory}
                        </span>
                      </div>
                      {m.mosqueAddress.trim() && (
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{m.mosqueAddress}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenMosque(m.mosqueId);
                        onClose();
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#BFD9FA] bg-[#F8FBFF] px-3 py-1.5 text-xs font-semibold text-[#0066E6] transition-colors hover:bg-[#0066E6] hover:text-white"
                    >
                      <span>মসজিদ দেখুন</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-900">
                {person.roleOrCategory ? (
                  <p>
                    কারগুজারি / তাকাজা উৎস: <strong>{person.roleOrCategory}</strong>
                    {' — '}এখনো কোনো নির্দিষ্ট মসজিদের স্থায়ী তালিকায় যুক্ত করা হয়নি।
                  </p>
                ) : (
                  <p>এখনো কোনো নির্দিষ্ট মসজিদের স্থায়ী তালিকায় যুক্ত করা হয়নি।</p>
                )}
              </div>
            )}
          </div>

          {/* Notes if present */}
          {combinedNotes.length > 0 && (
            <div className="rounded-2xl border border-[#E2ECF7] bg-[#F8FBFF] px-4 py-3 text-xs text-slate-700">
              <span className="font-semibold text-slate-500">মন্তব্য: </span>
              <span>{combinedNotes.join(' · ')}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[#E2ECF7] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
