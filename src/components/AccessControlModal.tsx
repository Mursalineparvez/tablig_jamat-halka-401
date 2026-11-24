import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  LogOut,
  PauseCircle,
  PlayCircle,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../firebase';
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
  const [noteInput, setNoteInput] = useState(myRequest?.note ?? '');
  const [newEditorEmail, setNewEditorEmail] = useState('');
  const [newEditorLabel, setNewEditorLabel] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingRequests = accessRequests.filter((r) => r.status === 'pending');

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmitRequest(noteInput.trim());
    } catch {
      setFormError('অনুরোধ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEditorEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setFormError('সঠিক Gmail / ইমেইল ঠিকানা লিখুন।');
      return;
    }
    if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setFormError('সুপার অ্যাডমিনের আগে থেকেই পূর্ণ অনুমোদন রয়েছে।');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await onGrantEditor(email, newEditorLabel.trim());
      setNewEditorEmail('');
      setNewEditorLabel('');
    } catch {
      setFormError('এডিটর যুক্ত করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-control-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#09201D]/45 p-4 backdrop-blur-[2px]"
    >
      <div className="my-auto w-full max-w-xl rounded-2xl border border-[#D9EAE6] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#D9EAE6] bg-gradient-to-r from-[#E4F2EF] via-[#F2F8F7] to-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F3F0] text-[#0E6F66]">
              {isSuperAdmin ? (
                <ShieldCheck className="h-5 w-5" />
              ) : canEdit ? (
                <UserCheck className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2
                id="access-control-modal-title"
                className="font-display text-lg font-bold text-[#102A27]"
              >
                {isSuperAdmin
                  ? 'অ্যাডমিন প্যানেল ও অনুমোদন'
                  : canEdit
                  ? 'এডিটর অ্যাকাউন্ট'
                  : 'এডিট করার জন্য সাইন ইন'}
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

        {/* Body */}
        <div className="max-h-[78vh] space-y-4 overflow-y-auto p-5 sm:p-6">
          {(authError || formError) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-relaxed font-medium text-rose-700">
              {formError || authError}
            </div>
          )}

          {!user ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#D9EAE6] bg-[#F4FAF8] p-4 text-xs leading-relaxed text-[#4F6B67]">
                <p className="font-semibold text-[#102A27]">
                  তথ্য দেখার জন্য কোনো লগইনের প্রয়োজন নেই।
                </p>
                <p className="mt-1.5">
                  শুধুমাত্র সাথী, মসজিদ, তাকাজা বা কারগুজারি যুক্ত ও পরিবর্তন
                  করতে Google দিয়ে সাইন ইন করুন। অ্যাডমিন (
                  <span className="font-mono font-semibold text-[#0E6F66]">
                    {SUPER_ADMIN_EMAIL}
                  </span>
                  ) যাদের অনুমোদন দেবেন, তারাই এডিট করতে পারবেন।
                </p>
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
                  type="button"
                  disabled={authBusy}
                  onClick={() => void onSignIn()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0E6F66] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(14,111,102,0.24)] hover:bg-[#0B5A53] disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  <span>
                    {authBusy ? 'সাইন ইন হচ্ছে...' : 'Google দিয়ে সাইন ইন করুন'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Signed-in user summary card */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CFE3DF] bg-[#F4FAF8] px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-mono text-xs font-bold text-[#102A27]">
                      {user.email}
                    </p>
                    {isSuperAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#0E6F66] px-2 py-0.5 text-[11px] font-semibold text-white">
                        <ShieldCheck className="h-3 w-3" />
                        মূল অ্যাডমিন
                      </span>
                    ) : canEdit ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        অনুমোদিত এডিটর
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        <Lock className="h-3 w-3" />
                        শুধু দেখার অনুমতি
                      </span>
                    )}
                  </div>
                  {user.displayName && (
                    <p className="mt-0.5 text-xs text-[#58726E]">
                      {user.displayName}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void onSignOut()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#D5E7E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D3F3B] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>সাইন আউট</span>
                </button>
              </div>

              {/* Non-admin, non-approved user: Request edit access */}
              {!isSuperAdmin && !canEdit && (
                <div className="space-y-3 rounded-2xl border border-[#D9EAE6] bg-white p-4">
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0E6F66]" />
                    <div className="text-xs leading-relaxed text-[#4F6B67]">
                      {myRequest?.status === 'pending' ? (
                        <p>
                          আপনার এডিট অ্যাক্সেসের অনুরোধ অ্যাডমিনের (
                          <span className="font-mono font-semibold text-[#102A27]">
                            {SUPER_ADMIN_EMAIL}
                          </span>
                          ) অনুমোদনের অপেক্ষায় রয়েছে।
                        </p>
                      ) : myRequest?.status === 'rejected' ? (
                        <p className="text-rose-700">
                          পূর্বের অনুরোধটি অনুমোদিত হয়নি। প্রয়োজনে পরিচয় লিখে
                          আবার অনুরোধ পাঠাতে পারেন।
                        </p>
                      ) : (
                        <p>
                          তথ্য যোগ বা পরিবর্তন করতে অ্যাডমিনের কাছে অনুমোদনের
                          অনুরোধ পাঠান। অনুমোদন পেলে সাথে সাথে এডিট চালু হবে।
                        </p>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleRequestSubmit} className="space-y-2.5">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="আপনার নাম ও মসজিদ লিখুন (যেমন: মোঃ ইয়াসিন, গিরিধারা মসজিদ)"
                      className="w-full rounded-xl border border-[#D5E7E2] bg-[#F4FAF8] px-3 py-2 text-xs text-[#102A27] focus:border-[#0E6F66] focus:bg-white focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {myRequest && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void onDeleteRequest(user.uid)}
                          className="cursor-pointer rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          অনুরোধ বাতিল করুন
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5A53] disabled:opacity-60"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>
                          {submitting
                            ? 'পাঠানো হচ্ছে...'
                            : myRequest
                            ? 'অনুরোধ আপডেট করুন'
                            : 'অ্যাডমিনের কাছে অনুরোধ পাঠান'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Super Admin Panel: Direct Add Editor + Pending Requests + Active Editors */}
              {isSuperAdmin && (
                <>
                  {/* Direct add editor by Gmail */}
                  <form
                    onSubmit={handleAddEditorSubmit}
                    className="space-y-3 rounded-2xl border border-[#D9EAE6] bg-[#F4FAF8] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-[#0E6F66]" />
                      <h3 className="text-xs font-bold text-[#102A27]">
                        সরাসরি নতুন এডিটরকে অনুমোদন দিন (Gmail দিয়ে)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        type="email"
                        value={newEditorEmail}
                        onChange={(e) => {
                          setNewEditorEmail(e.target.value);
                          if (formError) setFormError('');
                        }}
                        placeholder="সাথীর Gmail (যেমন: sathi@gmail.com)"
                        className="rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-xs text-[#102A27] focus:border-[#0E6F66] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newEditorLabel}
                        onChange={(e) => setNewEditorLabel(e.target.value)}
                        placeholder="নাম / জিম্মাদারি (ঐচ্ছিক)"
                        className="rounded-xl border border-[#D5E7E2] bg-white px-3 py-2 text-xs text-[#102A27] focus:border-[#0E6F66] focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0E6F66] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5A53] disabled:opacity-60"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>এডিট পারমিশন দিন</span>
                      </button>
                    </div>
                  </form>

                  {/* Pending Access Requests */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-[#102A27]">
                      অপেক্ষমাণ অনুরোধ ({toBn(pendingRequests.length)})
                    </h3>
                    {pendingRequests.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[#D5E7E2] px-4 py-3 text-xs text-[#58726E]">
                        এই মুহূর্তে কোনো অপেক্ষমাণ অনুরোধ নেই।
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {pendingRequests.map((req) => (
                          <div
                            key={req.uid}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-mono text-xs font-semibold text-[#102A27]">
                                {req.email}
                              </p>
                              <p className="text-[11px] text-[#4F6B67]">
                                {req.displayName || 'নাম উল্লেখ নেই'}
                                {req.note ? ` · ${req.note}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  void onGrantEditor(
                                    req.email,
                                    req.note || req.displayName || '',
                                    req.uid
                                  )
                                }
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#0E6F66] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0B5A53]"
                              >
                                <Check className="h-3 w-3" />
                                <span>অনুমোদন দিন</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void onRejectRequest(req.uid)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>বাতিল</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Approved Editors List */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-[#102A27]">
                      অনুমোদিত এডিটর তালিকা ({toBn(editors.length)})
                    </h3>
                    {editors.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[#D5E7E2] px-4 py-3 text-xs text-[#58726E]">
                        এখনো অন্য কাউকে এডিট পারমিশন দেওয়া হয়নি।
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {editors.map((ed) => (
                          <div
                            key={ed.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D9EAE6] bg-white px-3.5 py-2.5"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-mono text-xs font-semibold text-[#102A27]">
                                  {ed.email}
                                </p>
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                    ed.active
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {ed.active ? 'সক্রিয়' : 'স্থগিত'}
                                </span>
                              </div>
                              {ed.label && (
                                <p className="text-[11px] text-[#58726E]">
                                  {ed.label}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  void onToggleEditor(ed.id, !ed.active)
                                }
                                title={
                                  ed.active
                                    ? 'অ্যাক্সেস সাময়িক স্থগিত করুন'
                                    : 'অ্যাক্সেস পুনরায় চালু করুন'
                                }
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#D5E7E2] bg-[#F4FAF8] px-2.5 py-1.5 text-[11px] font-semibold text-[#1D3F3B] hover:bg-[#E5F3F0]"
                              >
                                {ed.active ? (
                                  <>
                                    <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                                    <span>স্থগিত</span>
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="h-3.5 w-3.5 text-emerald-700" />
                                    <span>চালু করুন</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => void onRevokeEditor(ed.id)}
                                title="তালিকা থেকে মুছে ফেলুন"
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>সরান</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
