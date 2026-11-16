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
      className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-lg rounded-2xl border border-[#D9EAE6] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 rounded-t-2xl border-b border-[#D9EAE6] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0E6F66] text-white shadow-[0_2px_10px_rgba(14,111,102,0.25)]">
              <User className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#0E6F66]">
                সাথী পরিচিতি · ৪০১ নং হালকা
              </p>
              <h2
                id="sathi-profile-title"
                className="font-display text-xl font-bold text-[#102A27]"
              >
                {person.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-xl p-1.5 text-[#7B9591] hover:bg-white hover:text-[#102A27]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {/* Phone Number Section */}
          <div className="rounded-2xl border border-[#D5E7E2] bg-[#F4FAF8] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#58726E]">
              <Phone className="h-3.5 w-3.5 text-[#0E6F66]" />
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
              <p className="mt-1.5 text-sm text-[#58726E]">
                মোবাইল নম্বর সংরক্ষিত নেই
              </p>
            )}
          </div>

          {/* Mosque Affiliation(s) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#1D3F3B]">
                <Building2 className="h-3.5 w-3.5 text-[#0E6F66]" />
                <span>কোন মসজিদের সাথী / দায়িত্ব</span>
              </span>
              {matches.length > 1 && (
                <span className="text-[11px] font-medium text-[#58726E]">
                  {toBn(matches.length)}টি স্থানে যুক্ত
                </span>
              )}
            </div>

            {matches.length > 0 ? (
              <div className="space-y-2.5">
                {matches.map((m, idx) => (
                  <div
                    key={`${m.mosqueId}-${m.roleOrCategory}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9EAE6] bg-white p-3.5 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#102A27]">
                          {toBn(m.mosqueId)}. {m.mosqueName}
                        </span>
                        <span className="rounded-lg bg-[#E5F3F0] px-2 py-0.5 text-[11px] font-semibold text-[#0E6F66]">
                          {m.roleOrCategory}
                        </span>
                      </div>
                      {m.mosqueAddress.trim() && (
                        <p className="flex items-center gap-1 text-xs text-[#58726E]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#7B9591]" />
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
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#B7DBD3] bg-[#F4FAF8] px-3 py-1.5 text-xs font-semibold text-[#0E6F66] transition-colors hover:bg-[#0E6F66] hover:text-white"
                    >
                      <span>মসজিদ দেখুন</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-[#FEF3E2]/70 px-4 py-3 text-xs leading-relaxed text-amber-900">
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
            <div className="rounded-2xl border border-[#D9EAE6] bg-[#F4FAF8] px-4 py-3 text-xs text-[#1D3F3B]">
              <span className="font-semibold text-[#58726E]">মন্তব্য: </span>
              <span>{combinedNotes.join(' · ')}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[#D9EAE6] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5A53]"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
