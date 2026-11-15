import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  MosqueRecord,
  SathiCategory,
  SathiEntry,
} from '../types/directory';
import { CATEGORY_META, toBn } from '../utils/bengali';

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
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sathi-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2
            id="sathi-modal-title"
            className="font-display text-lg font-bold text-stone-900"
          >
            {editingEntry ? 'সাথীর তথ্য সম্পাদনা' : 'নতুন সাথী যুক্ত করুন'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700">
                মসজিদ
              </label>
              <select
                value={mosqueId}
                disabled={Boolean(editingEntry)}
                onChange={(e) => setMosqueId(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none disabled:bg-stone-100"
              >
                {mosques.map((m) => (
                  <option key={m.id} value={m.id}>
                    {toBn(m.id)}. {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">
                বিভাগ
              </label>
              <select
                value={category}
                disabled={Boolean(editingEntry)}
                onChange={(e) => setCategory(e.target.value as SathiCategory)}
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none disabled:bg-stone-100"
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
            <label className="block text-xs font-semibold text-stone-700">
              নাম <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="যেমন: ভাই মোঃ আব্দুর রহমান"
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">
              মোবাইল নম্বর
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="যেমন: 01711-000000"
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700">
                ঠিকানা
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="মহল্লা বা বাড়ি নং (ঐচ্ছিক)"
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">
                মন্তব্য
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="প্রয়োজনীয় নোট (ঐচ্ছিক)"
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              {editingEntry ? 'পরিবর্তন সংরক্ষণ করুন' : 'তালিকায় যুক্ত করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface MosqueInfoModalProps {
  mosque: MosqueRecord;
  onClose: () => void;
  onSave: (updated: MosqueRecord) => void;
}

export const MosqueInfoModal: React.FC<MosqueInfoModalProps> = ({
  mosque,
  onClose,
  onSave,
}) => {
  const [address, setAddress] = useState(mosque.address);
  const [khatibName, setKhatibName] = useState(mosque.khatib.name);
  const [khatibPhone, setKhatibPhone] = useState(mosque.khatib.phone);
  const [imamName, setImamName] = useState(mosque.imam.name);
  const [imamPhone, setImamPhone] = useState(mosque.imam.phone);
  const [muazzinName, setMuazzinName] = useState(mosque.muazzin.name);
  const [muazzinPhone, setMuazzinPhone] = useState(mosque.muazzin.phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...mosque,
      address: address.trim(),
      khatib: { name: khatibName.trim(), phone: khatibPhone.trim() },
      imam: { name: imamName.trim(), phone: imamPhone.trim() },
      muazzin: { name: muazzinName.trim(), phone: muazzinPhone.trim() },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mosque-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2
            id="mosque-modal-title"
            className="font-display text-lg font-bold text-stone-900"
          >
            {mosque.name} — তথ্য সম্পাদনা
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700">
              মসজিদের ঠিকানা
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="মসজিদের পূর্ণ ঠিকানা লিখুন..."
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
            />
          </div>

          <div className="space-y-3 border-t border-stone-200 pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  খতিব সাহেবের নাম
                </label>
                <input
                  type="text"
                  value={khatibName}
                  onChange={(e) => setKhatibName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  খতিব মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={khatibPhone}
                  onChange={(e) => setKhatibPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm focus:border-emerald-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  ইমাম সাহেবের নাম
                </label>
                <input
                  type="text"
                  value={imamName}
                  onChange={(e) => setImamName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  ইমাম মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={imamPhone}
                  onChange={(e) => setImamPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm focus:border-emerald-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  মোয়াজ্জিন সাহেবের নাম
                </label>
                <input
                  type="text"
                  value={muazzinName}
                  onChange={(e) => setMuazzinName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  মোয়াজ্জিন মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={muazzinPhone}
                  onChange={(e) => setMuazzinPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm focus:border-emerald-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
