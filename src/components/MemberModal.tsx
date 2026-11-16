import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  MosqueRecord,
  SathiCategory,
  SathiEntry,
} from '../types/directory';
import { CATEGORY_META, formatBdPhone, toBn } from '../utils/bengali';

interface SathiModalProps {
  mosques: MosqueRecord[];
  initialMosqueId: number;
  initialCategory: SathiCategory;
  editingEntry: SathiEntry | null;
  onClose: () => void;
  onSave: (
    mosqueId: number,
    category: SathiCategory,
    entry: Omit<SathiEntry, 'id'> & { id?: string }
  ) => void;
}

export const SathiModal: React.FC<SathiModalProps> = ({
  mosques,
  initialMosqueId,
  initialCategory,
  editingEntry,
  onClose,
  onSave,
}) => {
  const [mosqueId, setMosqueId] = useState<number>(initialMosqueId);
  const [category, setCategory] = useState<SathiCategory>(initialCategory);
  const [name, setName] = useState(editingEntry?.name ?? '');
  const [phone, setPhone] = useState(editingEntry?.phone ?? '');
  const [address, setAddress] = useState(editingEntry?.address ?? '');
  const [notes, setNotes] = useState(editingEntry?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('দয়া করে সাথী বা ওলামার নাম লিখুন।');
      return;
    }
    onSave(mosqueId, category, {
      id: editingEntry?.id,
      name: name.trim(),
      phone: formatBdPhone(phone),
      address: address.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sathi-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#D9EAE6] bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-[#F4FAF8] px-5 py-4">
          <h2
            id="sathi-modal-title"
            className="font-display text-lg font-bold text-[#102A27]"
          >
            {editingEntry ? 'সাথীর তথ্য সম্পাদনা' : 'নতুন সাথী যুক্ত করুন'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-lg p-1.5 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#102A27]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1D3F3B]">
                মসজিদ
              </label>
              <select
                value={mosqueId}
                disabled={Boolean(editingEntry)}
                onChange={(e) => setMosqueId(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:outline-none disabled:bg-[#EBF4F2]"
              >
                {mosques.map((m) => (
                  <option key={m.id} value={m.id}>
                    {toBn(m.id)}. {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D3F3B]">
                বিভাগ
              </label>
              <select
                value={category}
                disabled={Boolean(editingEntry)}
                onChange={(e) => setCategory(e.target.value as SathiCategory)}
                className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:outline-none disabled:bg-[#EBF4F2]"
              >
                {CATEGORY_META.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.shortLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D3F3B]">
              নাম <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="যেমন: ভাই মোঃ আব্দুর রহমান"
              className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] placeholder:text-[#7D9793] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D3F3B]">
              মোবাইল নম্বর
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhone((prev) => formatBdPhone(prev))}
              placeholder="যেমন: +880 1711-000 000"
              className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 font-mono text-sm text-[#102A27] placeholder:text-[#7D9793] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1D3F3B]">
                ঠিকানা
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="মহল্লা বা বাড়ি নং (ঐচ্ছিক)"
                className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] placeholder:text-[#7D9793] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D3F3B]">
                মন্তব্য
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="প্রয়োজনীয় নোট (ঐচ্ছিক)"
                className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] placeholder:text-[#7D9793] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#D9EAE6] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[#D5E7E2] px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53]"
            >
              {editingEntry ? 'পরিবর্তন সংরক্ষণ করুন' : 'তালিকায় যুক্ত করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface MosqueFormValues {
  name: string;
  address: string;
  khatibName: string;
  khatibPhone: string;
  imamName: string;
  imamPhone: string;
  muazzinName: string;
  muazzinPhone: string;
}

interface MosqueInfoModalProps {
  mosque: MosqueRecord | null;
  canDelete?: boolean;
  onClose: () => void;
  onSave: (values: MosqueFormValues, existingMosque?: MosqueRecord) => void;
  onDelete?: (mosqueId: number) => void;
}

export const MosqueInfoModal: React.FC<MosqueInfoModalProps> = ({
  mosque,
  canDelete = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const isNew = mosque === null;
  const [name, setName] = useState(mosque?.name ?? '');
  const [address, setAddress] = useState(mosque?.address ?? '');
  const [khatibName, setKhatibName] = useState(mosque?.khatib.name ?? '');
  const [khatibPhone, setKhatibPhone] = useState(mosque?.khatib.phone ?? '');
  const [imamName, setImamName] = useState(mosque?.imam.name ?? '');
  const [imamPhone, setImamPhone] = useState(mosque?.imam.phone ?? '');
  const [muazzinName, setMuazzinName] = useState(mosque?.muazzin.name ?? '');
  const [muazzinPhone, setMuazzinPhone] = useState(mosque?.muazzin.phone ?? '');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('দয়া করে মসজিদের নাম লিখুন।');
      return;
    }
    onSave(
      {
        name: name.trim(),
        address: address.trim(),
        khatibName: khatibName.trim(),
        khatibPhone: formatBdPhone(khatibPhone),
        imamName: imamName.trim(),
        imamPhone: formatBdPhone(imamPhone),
        muazzinName: muazzinName.trim(),
        muazzinPhone: formatBdPhone(muazzinPhone),
      },
      mosque ?? undefined
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mosque-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-lg rounded-2xl border border-[#D9EAE6] bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-[#F4FAF8] px-5 py-4">
          <h2
            id="mosque-modal-title"
            className="font-display text-lg font-bold text-[#102A27]"
          >
            {isNew ? 'নতুন মসজিদ যুক্ত করুন' : `${mosque.name} — তথ্য সম্পাদনা`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-lg p-1.5 text-[#7B9591] hover:bg-[#E5F3F0] hover:text-[#102A27]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {isNew && (
            <p className="rounded-xl border border-[#B7DBD3] bg-[#E5F3F0] px-3.5 py-2.5 text-xs leading-relaxed text-[#0B5A53]">
              নতুন মসজিদ যুক্ত করলে স্বয়ংক্রিয়ভাবে সালওয়ালী, ৩ চিল্লা, ১ চিল্লা,
              মাস্তুরাত ও ছাত্র নওজোয়ানসহ সকল বিভাগ ২টি করে খালি ঘরসহ তৈরি হয়ে
              যাবে।
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1D3F3B]">
              মসজিদের নাম <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="যেমন: বায়তুল নূর জামে মসজিদ"
              className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] placeholder:text-[#7D9793] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D3F3B]">
              মসজিদের ঠিকানা
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="মসজিদের পূর্ণ ঠিকানা লিখুন (ঐচ্ছিক)..."
              className="mt-1.5 w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-sm text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-3 border-t border-[#D9EAE6] pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  খতিব সাহেবের নাম
                </label>
                <input
                  type="text"
                  value={khatibName}
                  onChange={(e) => setKhatibName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D5E7E2] px-3 py-2 text-sm focus:border-[#0E6F66] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  খতিব মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={khatibPhone}
                  onChange={(e) => setKhatibPhone(e.target.value)}
                  onBlur={() => setKhatibPhone((prev) => formatBdPhone(prev))}
                  placeholder="+880 1711-000 000"
                  className="mt-1 w-full rounded-xl border border-[#D5E7E2] px-3 py-2 font-mono text-sm focus:border-[#0E6F66] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  ইমাম সাহেবের নাম
                </label>
                <input
                  type="text"
                  value={imamName}
                  onChange={(e) => setImamName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D5E7E2] px-3 py-2 text-sm focus:border-[#0E6F66] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  ইমাম মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={imamPhone}
                  onChange={(e) => setImamPhone(e.target.value)}
                  onBlur={() => setImamPhone((prev) => formatBdPhone(prev))}
                  placeholder="+880 1711-000 000"
                  className="mt-1 w-full rounded-xl border border-[#D5E7E2] px-3 py-2 font-mono text-sm focus:border-[#0E6F66] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  মোয়াজ্জিন সাহেবের নাম
                </label>
                <input
                  type="text"
                  value={muazzinName}
                  onChange={(e) => setMuazzinName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D5E7E2] px-3 py-2 text-sm focus:border-[#0E6F66] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1D3F3B]">
                  মোয়াজ্জিন মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={muazzinPhone}
                  onChange={(e) => setMuazzinPhone(e.target.value)}
                  onBlur={() => setMuazzinPhone((prev) => formatBdPhone(prev))}
                  placeholder="+880 1711-000 000"
                  className="mt-1 w-full rounded-xl border border-[#D5E7E2] px-3 py-2 font-mono text-sm focus:border-[#0E6F66] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9EAE6] pt-4">
            <div>
              {!isNew && canDelete && onDelete && (
                !confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    মসজিদ মুছে ফেলুন
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(mosque.id)}
                      className="cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                    >
                      নিশ্চিত মুছুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="cursor-pointer rounded-lg border border-[#D5E7E2] px-2.5 py-1.5 text-xs text-[#1D3F3B] hover:bg-[#EBF4F2]"
                    >
                      বাতিল
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-[#D5E7E2] px-4 py-2 text-sm font-medium text-[#1D3F3B] hover:bg-[#EBF4F2]"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-[#0E6F66] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53]"
              >
                {isNew ? 'মসজিদ যুক্ত করুন' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
