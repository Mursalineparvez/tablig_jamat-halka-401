import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { emailToDocId, SUPER_ADMIN_EMAIL } from '../firebase';
import { AccessRequestRecord, EditorRecord } from '../types/directory';
import { toBn } from '../utils/bengali';

interface AccessControlModalProps {
  user: User | null;
  isSuperAdmin: boolean;
  canEdit: boolean;
  myRequest: AccessRequestRecord | null;
  editors: EditorRecord[];
  accessRequests: AccessRequestRecord[];
  authBusy: boolean;
  authError: string | null;
  onClose: () => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSubmitRequest: (note: string) => Promise<void>;
  onGrantEditor: (
    email: string,
    label: string,
    requestUid?: string
  ) => Promise<void>;
  onToggleEditor: (editorId: string, active: boolean) => Promise<void>;
  onRevokeEditor: (editorId: string) => Promise<void>;
  onRejectRequest: (requestUid: string) => Promise<void>;
  onDeleteRequest: (requestUid: string) => Promise<void>;
}

export const AccessControlModal: React.FC<AccessControlModalProps> = ({
  user,
  isSuperAdmin,
  canEdit,
  myRequest,
  editors,
  accessRequests,
  authBusy,
  authError,
  onClose,
  onSignIn,
  onSignOut,
  onSubmitRequest,
  onGrantEditor,
  onToggleEditor,
  onRevokeEditor,
  onRejectRequest,
  onDeleteRequest,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [requestNote, setRequestNote] = useState(myRequest?.note ?? '');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingRequests = accessRequests.filter((r) => r.status === 'pending');

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newEmail.trim().toLowerCase();
    if (!cleaned || !cleaned.includes('@') || !cleaned.includes('.')) {
      setFormError('দয়া করে সঠিক জিমেইল / ইমেইল ঠিকানা লিখুন।');
      return;
    }
    if (cleaned === SUPER_ADMIN_EMAIL) {
      setFormError('অ্যাডমিন ইমেইলের আগে থেকেই সম্পূর্ণ অ্যাক্সেস রয়েছে।');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await onGrantEditor(cleaned, newLabel.trim());
      setNewEmail('');
      setNewLabel('');
    } catch {
      setFormError('অ্যাক্সেস দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmitRequest(requestNote.trim());
    } catch {
      setFormError('অনুরোধ পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-2xl rounded-2xl border border-[#E2ECF7] bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#E2ECF7] bg-[#F8FBFF] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF4FF] text-[#0066E6]">
              {isSuperAdmin ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2
                id="access-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                {isSuperAdmin
                  ? 'অ্যাডমিন এডিট অ্যাক্সেস কন্ট্রোল'
                  : user
                  ? 'অ্যাকাউন্ট ও এডিট অনুমতি'
                  : 'এডিট করার জন্য সাইন ইন'}
              </h2>
              <p className="text-xs text-slate-500">
                যাত্রাবাড়ী মারকাজ · ৪০১ নং হালকা
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-[#EBF4FF] hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {authError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {authError}
            </div>
          )}

          {/* Case 1: Not Signed In */}
          {!user && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#DCE8F7] bg-[#F8FBFF] p-4 text-sm leading-relaxed text-slate-700">
                <p>
                  এই ওয়েবসাইটের সকল মসজিদ, সাথী ও দৈনিক কারগুজারি{' '}
                  <strong className="text-slate-900">সবার দেখার জন্য উন্মুক্ত</strong>।
                </p>
                <p className="mt-2">
                  তবে নতুন তথ্য যোগ, পরিবর্তন বা মুছে ফেলার জন্য Google অ্যাকাউন্ট দিয়ে{' '}
                  <strong className="text-[#0066E6]">সাইন ইন</strong> করতে হবে এবং{' '}
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {SUPER_ADMIN_EMAIL}
                  </span>{' '}
                  থেকে এডিট অ্যাক্সেস অনুমোদিত হতে হবে।
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer rounded-xl border border-[#DCE8F7] px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#F1F6FC]"
                >
                  শুধু দেখব (বাতিল)
                </button>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void onSignIn()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0066E6] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] transition-colors hover:bg-[#0052BD] disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  <span>
                    {authBusy
                      ? 'সাইন ইন হচ্ছে...'
                      : 'Google দিয়ে সাইন ইন করুন'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Case 2: Signed In User Header */}
          {user && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2ECF7] bg-[#F8FBFF] px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {user.displayName || 'ব্যবহারকারী'}
                </p>
                <p className="font-mono text-xs text-slate-600">{user.email}</p>
              </div>
              <div className="flex items-center gap-2.5">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#0066E6] px-2.5 py-1 text-xs font-semibold text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>সুপার অ্যাডমিন</span>
                  </span>
                ) : canEdit ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>অনুমোদিত এডিটর</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Clock className="h-3.5 w-3.5" />
                    <span>পাঠক (এডিট অ্যাক্সেস নেই)</span>
                  </span>
                )}
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void onSignOut()}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#DCE8F7] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>সাইন আউট</span>
                </button>
              </div>
            </div>
          )}

          {/* Case 3: Signed In Non-Editor -> Request Access */}
          {user && !isSuperAdmin && !canEdit && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {myRequest?.status === 'pending' ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900">
                  <p className="font-bold">
                    আপনার এডিট অ্যাক্সেসের অনুরোধ পাঠানো হয়েছে।
                  </p>
                  <p className="mt-1">
                    অ্যাডমিন (
                    <span className="font-mono font-semibold">
                      {SUPER_ADMIN_EMAIL}
                    </span>
                    ) অনুমোদন করলে সাথে সাথেই আপনার এডিট, যোগ ও মুছে ফেলার সুবিধা চালু হয়ে যাবে।
                  </p>
                </div>
              ) : myRequest?.status === 'rejected' ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  পূর্বে পাঠানো অনুরোধটি অনুমোদিত হয়নি। প্রয়োজনে নিচ থেকে পুনরায় অনুরোধ পাঠাতে পারেন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-slate-600">
                  তথ্য যোগ বা সম্পাদনা করার জন্য{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    {SUPER_ADMIN_EMAIL}
                  </span>
                  -এর অনুমোদন প্রয়োজন। নিচের ফরম থেকে এডিট অ্যাক্সেসের অনুরোধ পাঠান:
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  পরিচিতি / মসজিদের নাম (অ্যাডমিনের চেনার সুবিধার্থে)
                </label>
                <input
                  type="text"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="যেমন: মোরসালিন পারভেজ · গিরিধারা জামে মসজিদ"
                  className="mt-1.5 w-full rounded-xl border border-[#DCE8F7] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-900 focus:border-[#0066E6] focus:bg-white focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-600">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-2.5">
                {myRequest?.status === 'pending' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void onDeleteRequest(user.uid)}
                    className="cursor-pointer rounded-xl border border-[#DCE8F7] px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    অনুরোধ বাতিল করুন
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0066E6] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,102,230,0.22)] hover:bg-[#0052BD] disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>
                    {myRequest?.status === 'pending'
                      ? 'তথ্য আপডেট করুন'
                      : 'এডিট অ্যাক্সেসের অনুরোধ পাঠান'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Case 4: Approved Editor (non-admin) */}
          {user && !isSuperAdmin && canEdit && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
              আপনাকে অ্যাডমিন কর্তৃক এডিট অ্যাক্সেস দেওয়া হয়েছে। এখন আপনি মসজিদ, সাথী, চলমান তাকাজা এবং দৈনিক কারগুজারি যোগ, সম্পাদনা ও হালনাগাদ করতে পারবেন।
            </div>
          )}

          {/* Case 5: Super Admin Panel (mdmursalineparvez@gmail.com) */}
          {isSuperAdmin && (
            <div className="space-y-5">
              {/* Grant Direct Access by Email */}
              <form
                onSubmit={handleGrantSubmit}
                className="rounded-2xl border border-[#DCE8F7] bg-[#F8FBFF] p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#0066E6]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    সরাসরি জিমেইল দিয়ে এডিট অ্যাক্সেস দিন
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="example@gmail.com"
                    className="rounded-xl border border-[#DCE8F7] bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-[#0066E6] focus:outline-none sm:col-span-5"
                  />
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="নাম / মসজিদ (ঐচ্ছিক)"
                    className="rounded-xl border border-[#DCE8F7] bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0066E6] focus:outline-none sm:col-span-4"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cursor-pointer rounded-xl bg-[#0066E6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0052BD] disabled:opacity-60 sm:col-span-3"
                  >
                    অ্যাক্সেস দিন
                  </button>
                </div>
                {formError && (
                  <p className="text-xs text-rose-600">{formError}</p>
                )}
              </form>

              {/* Pending Access Requests */}
              {pendingRequests.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
                  <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900">
                    অ্যাক্সেসের অপেক্ষমাণ অনুরোধ ({toBn(pendingRequests.length)}টি)
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.uid}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {req.displayName || req.email}
                          </p>
                          <p className="font-mono text-xs text-slate-500">
                            {req.email}
                          </p>
                          {req.note && (
                            <p className="mt-0.5 text-xs text-slate-600">
                              পরিচিতি: {req.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void onGrantEditor(
                                req.email,
                                req.note || req.displayName,
                                req.uid
                              )
                            }
                            className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>অনুমোদন দিন</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void onRejectRequest(req.uid)}
                            className="cursor-pointer rounded-xl border border-[#DCE8F7] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            প্রত্যাখ্যান
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Editors List */}
              <div className="overflow-hidden rounded-2xl border border-[#E2ECF7] bg-white">
                <div className="flex items-center justify-between border-b border-[#E2ECF7] bg-[#F1F6FC] px-4 py-2.5">
                  <span className="text-xs font-bold text-slate-800">
                    অনুমোদিত এডিটর তালিকা ({toBn(editors.length)} জন)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    শুধু অনুমোদিত ইমেইলই এডিট করতে পারবে
                  </span>
                </div>

                {editors.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {editors.map((ed) => {
                      const docId = ed.id || emailToDocId(ed.email);
                      return (
                        <div
                          key={docId}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <p className="font-mono text-xs font-semibold text-slate-900">
                              {ed.email}
                            </p>
                            {ed.label && (
                              <p className="text-xs text-slate-500">
                                {ed.label}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void onToggleEditor(docId, !ed.active)
                              }
                              className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                                ed.active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {ed.active ? 'সক্রিয়' : 'স্থগিত'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void onRevokeEditor(docId)}
                              title="অ্যাক্সেস মুছে ফেলুন"
                              className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    এখনো অন্য কোনো ইমেইলকে এডিট অ্যাক্সেস দেওয়া হয়নি। উপরের ফরম থেকে যেকোনো জিমেইল যোগ করুন।
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
