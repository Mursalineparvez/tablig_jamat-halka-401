/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { Lock } from 'lucide-react';
import { AccessControlModal } from './components/AccessControlModal';
import { Header } from './components/Header';
import {
  AssignKargoojariToMosquePayload,
  AssignKargoojariToTakazaPayload,
  KargoojariView,
} from './components/KargoojariView';
import {
  MosqueFormValues,
  MosqueInfoModal,
  SathiModal,
} from './components/MemberModal';
import { MosquesView } from './components/MosquesView';
import { OverviewView } from './components/OverviewView';
import { OfflineIndicator } from './components/PWAControls';
import { PrintExportView } from './components/PrintExportView';
import { SathiDirectoryView } from './components/SathiDirectoryView';
import {
  InspectedPersonInput,
  SathiProfileModal,
} from './components/SathiProfileModal';
import { TakazaView } from './components/TakazaView';
import {
  INITIAL_KARGOOJARIS,
  INITIAL_MOSQUES,
  INITIAL_TAKAZAS,
} from './data/halqaData';
import {
  auth,
  emailToDocId,
  googleProvider,
  isSuperAdminEmail,
  SUPER_ADMIN_EMAIL,
} from './firebase';
import {
  deleteAccessRequest,
  deleteKargoojariFromFirestore,
  deleteMosqueFromFirestore,
  deleteTakazaFromFirestore,
  grantEditorAccess,
  rejectAccessRequest,
  revokeEditorAccess,
  saveKargoojariToFirestore,
  saveMosqueToFirestore,
  saveTakazaToFirestore,
  seedInitialKargoojarisToFirestore,
  seedInitialMosquesToFirestore,
  seedInitialTakazasToFirestore,
  submitAccessRequest,
  subscribeAllAccessRequests,
  subscribeAllEditors,
  subscribeKargoojaris,
  subscribeMosques,
  subscribeMyAccessRequest,
  subscribeMyEditorStatus,
  subscribeTakazas,
  toggleEditorActive,
} from './services/firestoreService';
import {
  AccessRequestRecord,
  ActiveTab,
  EditorRecord,
  KargoojariEntry,
  KargoojariSathiItem,
  MosqueRecord,
  OfficialInfo,
  SathiCategory,
  SathiEntry,
  TakazaEntry,
  TakazaStatus,
} from './types/directory';
import {
  formatBdPhone,
  getCategoryMeta,
  normalizeMemberCoreName,
  toBn,
} from './utils/bengali';

const STORAGE_KEY = 'jatrabari_markaz_halqa_401_v1';
const GIRIDHARA_CHATRA_SEED_KEY = 'jatrabari_markaz_seed_m3_chatra_v1';
const TAKAZA_STORAGE_KEY = 'jatrabari_markaz_halqa_401_takaza_v1';
const KARGOOJARI_STORAGE_KEY = 'jatrabari_markaz_halqa_401_kargoojari_v1';
const KARGOOJARI_SEED_KEY = 'jatrabari_markaz_seed_karg_20261115_sathis_v1';
const KARGOOJARI_ALL_MENTIONED_SEED_KEY =
  'jatrabari_markaz_seed_karg_20261115_all_v2';
const KARGOOJARI_NOV15_V3_SEED_KEY =
  'jatrabari_markaz_seed_karg_20261115_v3';
const TAKAZA_NOV19_ABUBAKOR_SEED_KEY =
  'jatrabari_markaz_seed_takaza_20261119_abubakor_v1';
const TAKAZA_NOV19_ABUBAKOR_FS_KEY =
  'jatrabari_markaz_fs_takaza_20261119_abubakor_v1';

interface SathiModalState {
  mosqueId: number;
  category: SathiCategory;
  editingEntry: SathiEntry | null;
}

type MosqueModalState =
  | { mode: 'add' }
  | { mode: 'edit'; mosque: MosqueRecord }
  | null;

function createEmptyCategories(): Record<SathiCategory, SathiEntry[]> {
  return {
    [SathiCategory.SalwaliUlama]: [],
    [SathiCategory.ThreeChillaUlama]: [],
    [SathiCategory.OneChillaUlama]: [],
    [SathiCategory.Bidesh]: [],
    [SathiCategory.ThreeChillaSathi]: [],
    [SathiCategory.OneChillaSathi]: [],
    [SathiCategory.MasturatChilla]: [],
    [SathiCategory.MasturatTenFifteenDays]: [],
    [SathiCategory.MasturatThreeDays]: [],
    [SathiCategory.ChatraNowjowan]: [],
  };
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch {
    // Ignore storage read errors
  }
  return fallback;
}

function normalizeMosquesPhones(list: MosqueRecord[]): MosqueRecord[] {
  return list.map((m) => {
    const normalizedCategories = { ...createEmptyCategories(), ...m.categories };
    for (const key of Object.keys(normalizedCategories) as SathiCategory[]) {
      normalizedCategories[key] = (normalizedCategories[key] ?? []).map(
        (entry) => ({
          ...entry,
          phone: formatBdPhone(entry.phone),
        })
      );
    }
    return {
      ...m,
      khatib: {
        name: m.khatib?.name ?? '',
        phone: formatBdPhone(m.khatib?.phone ?? ''),
      },
      imam: {
        name: m.imam?.name ?? '',
        phone: formatBdPhone(m.imam?.phone ?? ''),
      },
      muazzin: {
        name: m.muazzin?.name ?? '',
        phone: formatBdPhone(m.muazzin?.phone ?? ''),
      },
      categories: normalizedCategories,
    };
  });
}

function normalizeTakazasPhones(list: TakazaEntry[]): TakazaEntry[] {
  return list.map((t) => ({
    ...t,
    zimmadarPhone: formatBdPhone(t.zimmadarPhone),
    committedSathis: t.committedSathis?.map((cs) => ({
      ...cs,
      phone: formatBdPhone(cs.phone),
    })),
  }));
}

function normalizeKargoojarisPhones(list: KargoojariEntry[]): KargoojariEntry[] {
  return list.map((k) => ({
    ...k,
    sathis: k.sathis?.map((s) => ({
      ...s,
      phone: formatBdPhone(s.phone),
    })),
  }));
}

function loadInitialMosques(): MosqueRecord[] {
  const loaded = loadFromStorage<MosqueRecord[]>(STORAGE_KEY, INITIAL_MOSQUES);
  const base = normalizeMosquesPhones(
    Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_MOSQUES
  );

  try {
    const alreadySeeded = localStorage.getItem(GIRIDHARA_CHATRA_SEED_KEY);
    if (!alreadySeeded) {
      const baselineGiridhara = INITIAL_MOSQUES.find((m) => m.id === 3);
      const seedEntries =
        baselineGiridhara?.categories[SathiCategory.ChatraNowjowan] ?? [];

      const merged = base.map((m) => {
        if (m.id !== 3) return m;
        const existing = m.categories?.[SathiCategory.ChatraNowjowan] ?? [];
        const existingKeys = new Set(
          existing.map((e) => `${e.name.trim()}|${formatBdPhone(e.phone)}`)
        );
        const missing = seedEntries.filter(
          (e) => !existingKeys.has(`${e.name.trim()}|${formatBdPhone(e.phone)}`)
        );
        if (missing.length === 0) return m;
        return {
          ...m,
          categories: {
            ...m.categories,
            [SathiCategory.ChatraNowjowan]: [...existing, ...missing],
          },
        };
      });

      localStorage.setItem(GIRIDHARA_CHATRA_SEED_KEY, '1');
      return merged;
    }
  } catch {
    // Ignore storage read/write errors
  }

  return base;
}

function loadInitialKargoojaris(): KargoojariEntry[] {
  const loaded = loadFromStorage<KargoojariEntry[]>(
    KARGOOJARI_STORAGE_KEY,
    INITIAL_KARGOOJARIS
  );
  const base = normalizeKargoojarisPhones(
    Array.isArray(loaded) ? loaded : INITIAL_KARGOOJARIS
  );

  try {
    const alreadySeeded = localStorage.getItem(KARGOOJARI_SEED_KEY);
    const allMentionedSeeded = localStorage.getItem(
      KARGOOJARI_ALL_MENTIONED_SEED_KEY
    );
    const nov15V3Seeded = localStorage.getItem(KARGOOJARI_NOV15_V3_SEED_KEY);
    if (!alreadySeeded || !allMentionedSeeded || !nov15V3Seeded) {
      const seedById = new Map(INITIAL_KARGOOJARIS.map((k) => [k.id, k]));
      const hydrated = base.map((entry) => {
        const seedMatch = seedById.get(entry.id);
        if (!seedMatch || !seedMatch.sathis?.length) return entry;

        const nextSummary =
          !nov15V3Seeded &&
          entry.id === 'karg-2026-11-15-giridhara-chatra-gast'
            ? seedMatch.summary
            : entry.summary;

        const existingSathis = entry.sathis ?? [];
        if (existingSathis.length === 0) {
          return { ...entry, summary: nextSummary, sathis: seedMatch.sathis };
        }

        const seedSathiById = new Map(
          seedMatch.sathis.map((s) => [s.id, s])
        );
        const updatedExisting = existingSathis.map((s) => {
          const match = seedSathiById.get(s.id);
          if (match && !s.tashkeelStatus && match.tashkeelStatus) {
            return { ...s, tashkeelStatus: match.tashkeelStatus };
          }
          return s;
        });

        const existingIds = new Set(updatedExisting.map((s) => s.id));
        const existingNames = new Set(
          updatedExisting.map((s) => normalizeMemberCoreName(s.name))
        );
        const missingSathis = seedMatch.sathis.filter(
          (s) =>
            !existingIds.has(s.id) &&
            !existingNames.has(normalizeMemberCoreName(s.name))
        );

        return {
          ...entry,
          summary: nextSummary,
          sathis: [...updatedExisting, ...missingSathis],
        };
      });
      const existingIds = new Set(hydrated.map((k) => k.id));
      const missing = INITIAL_KARGOOJARIS.filter((k) => !existingIds.has(k.id));
      localStorage.setItem(KARGOOJARI_SEED_KEY, '1');
      localStorage.setItem(KARGOOJARI_ALL_MENTIONED_SEED_KEY, '1');
      localStorage.setItem(KARGOOJARI_NOV15_V3_SEED_KEY, '1');
      return [...missing, ...hydrated];
    }
  } catch {
    // Ignore storage read/write errors
  }

  return base;
}

function loadInitialTakazas(): TakazaEntry[] {
  const loaded = loadFromStorage<TakazaEntry[]>(
    TAKAZA_STORAGE_KEY,
    INITIAL_TAKAZAS
  );
  const base = normalizeTakazasPhones(
    Array.isArray(loaded) ? loaded : INITIAL_TAKAZAS
  );

  try {
    const alreadySeeded = localStorage.getItem(TAKAZA_NOV19_ABUBAKOR_SEED_KEY);
    if (!alreadySeeded) {
      const existingIds = new Set(base.map((t) => t.id));
      const missing = INITIAL_TAKAZAS.filter((t) => !existingIds.has(t.id));
      localStorage.setItem(TAKAZA_NOV19_ABUBAKOR_SEED_KEY, '1');
      return [...missing, ...base];
    }
  } catch {
    // Ignore storage read/write errors
  }

  return base;
}

export default function App() {
  const [mosques, setMosques] = useState<MosqueRecord[]>(loadInitialMosques);

  const [takazas, setTakazas] = useState<TakazaEntry[]>(loadInitialTakazas);

  const [kargoojaris, setKargoojaris] = useState<KargoojariEntry[]>(
    loadInitialKargoojaris
  );

  // Firebase Auth & RBAC state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isApprovedEditor, setIsApprovedEditor] = useState(false);
  const [myRequest, setMyRequest] = useState<AccessRequestRecord | null>(null);
  const [editors, setEditors] = useState<EditorRecord[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestRecord[]>([]);
  const [accessModalOpen, setAccessModalOpen] = useState(false);

  // Firestore snapshot status for initial automatic seeding when authorized
  const [mosquesLoaded, setMosquesLoaded] = useState(false);
  const [mosquesEmptyInDb, setMosquesEmptyInDb] = useState(false);
  const [takazasLoaded, setTakazasLoaded] = useState(false);
  const [takazasEmptyInDb, setTakazasEmptyInDb] = useState(false);
  const [kargoojarisLoaded, setKargoojarisLoaded] = useState(false);
  const [kargoojarisEmptyInDb, setKargoojarisEmptyInDb] = useState(false);

  const seededMosquesRef = useRef(false);
  const seededTakazasRef = useRef(false);
  const seededKargoojarisRef = useRef(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedMosqueId, setSelectedMosqueId] = useState<number>(1);
  const [directoryCategory, setDirectoryCategory] = useState<
    SathiCategory | 'all'
  >('all');
  const [sathiModal, setSathiModal] = useState<SathiModalState | null>(null);
  const [mosqueModal, setMosqueModal] = useState<MosqueModalState>(null);
  const [inspectedPerson, setInspectedPerson] =
    useState<InspectedPersonInput | null>(null);
  const [focusedTakazaId, setFocusedTakazaId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isSuperAdmin = Boolean(
    user?.emailVerified && isSuperAdminEmail(user.email)
  );
  const canEdit = isSuperAdmin || (Boolean(user?.emailVerified) && isApprovedEditor);
  const pendingRequestCount = accessRequests.filter(
    (r) => r.status === 'pending'
  ).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Subscribe to Firebase Auth state and handle redirect sign-in results
  useEffect(() => {
    void getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          showToast('সাইন ইন সফল হয়েছে।');
        }
      })
      .catch(() => {
        // Ignore stale redirect errors on normal loads
      });

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Subscribe to Public-Read Firestore collections
  useEffect(() => {
    const unsubMosques = subscribeMosques((remoteMosques, isEmpty) => {
      setMosquesLoaded(true);
      setMosquesEmptyInDb(isEmpty);
      if (!isEmpty) {
        setMosques(normalizeMosquesPhones(remoteMosques));
      }
    });

    const unsubTakazas = subscribeTakazas((remoteTakazas, isEmpty) => {
      setTakazasLoaded(true);
      setTakazasEmptyInDb(isEmpty);
      if (!isEmpty) {
        const normalized = normalizeTakazasPhones(remoteTakazas);
        const remoteIds = new Set(normalized.map((t) => t.id));
        const seedItem = INITIAL_TAKAZAS[0];
        let fsSynced = false;
        try {
          fsSynced =
            localStorage.getItem(TAKAZA_NOV19_ABUBAKOR_FS_KEY) === '1';
        } catch {
          // Ignore storage read errors
        }

        if (seedItem && remoteIds.has(seedItem.id)) {
          try {
            localStorage.setItem(TAKAZA_NOV19_ABUBAKOR_FS_KEY, '1');
          } catch {
            // Ignore storage write errors
          }
          setTakazas(normalized);
        } else if (seedItem && !fsSynced) {
          setTakazas([seedItem, ...normalized]);
        } else {
          setTakazas(normalized);
        }
      }
    });

    const unsubKargoojaris = subscribeKargoojaris((remoteKargs, isEmpty) => {
      setKargoojarisLoaded(true);
      setKargoojarisEmptyInDb(isEmpty);
      if (!isEmpty) {
        setKargoojaris(normalizeKargoojarisPhones(remoteKargs));
      }
    });

    return () => {
      unsubMosques();
      unsubTakazas();
      unsubKargoojaris();
    };
  }, []);

  // Subscribe to user's own editor status & access request when signed in
  useEffect(() => {
    if (!user || !user.emailVerified || !user.email) {
      setIsApprovedEditor(false);
      setMyRequest(null);
      return;
    }

    if (isSuperAdminEmail(user.email)) {
      setIsApprovedEditor(true);
      setMyRequest(null);
      return;
    }

    const unsubEditor = subscribeMyEditorStatus(user.email, setIsApprovedEditor);
    const unsubRequest = subscribeMyAccessRequest(user.uid, setMyRequest);

    return () => {
      unsubEditor();
      unsubRequest();
    };
  }, [user]);

  // Subscribe to all editors & access requests strictly when Super Admin is signed in
  useEffect(() => {
    if (!isSuperAdmin) {
      setEditors([]);
      setAccessRequests([]);
      return;
    }

    const unsubEditors = subscribeAllEditors(setEditors);
    const unsubRequests = subscribeAllAccessRequests(setAccessRequests);

    return () => {
      unsubEditors();
      unsubRequests();
    };
  }, [isSuperAdmin]);

  // Auto-seed Firestore once when an authorized editor / super admin signs in and collections are empty
  useEffect(() => {
    if (!canEdit) return;

    if (mosquesLoaded && mosquesEmptyInDb && !seededMosquesRef.current) {
      seededMosquesRef.current = true;
      void seedInitialMosquesToFirestore(mosques).catch(() => {
        seededMosquesRef.current = false;
      });
    }

    if (
      kargoojarisLoaded &&
      kargoojarisEmptyInDb &&
      !seededKargoojarisRef.current
    ) {
      seededKargoojarisRef.current = true;
      void seedInitialKargoojarisToFirestore(kargoojaris).catch(() => {
        seededKargoojarisRef.current = false;
      });
    }

    if (
      takazasLoaded &&
      takazasEmptyInDb &&
      takazas.length > 0 &&
      !seededTakazasRef.current
    ) {
      seededTakazasRef.current = true;
      void seedInitialTakazasToFirestore(takazas)
        .then(() => {
          try {
            localStorage.setItem(TAKAZA_NOV19_ABUBAKOR_FS_KEY, '1');
          } catch {
            // Ignore storage write errors
          }
        })
        .catch(() => {
          seededTakazasRef.current = false;
        });
    } else if (takazasLoaded && !takazasEmptyInDb && !seededTakazasRef.current) {
      let fsSynced = false;
      try {
        fsSynced = localStorage.getItem(TAKAZA_NOV19_ABUBAKOR_FS_KEY) === '1';
      } catch {
        // Ignore storage read errors
      }
      const seedItem = INITIAL_TAKAZAS[0];
      if (seedItem && !fsSynced) {
        seededTakazasRef.current = true;
        void saveTakazaToFirestore(seedItem)
          .then(() => {
            try {
              localStorage.setItem(TAKAZA_NOV19_ABUBAKOR_FS_KEY, '1');
            } catch {
              // Ignore storage write errors
            }
          })
          .catch(() => {
            seededTakazasRef.current = false;
          });
      }
    }
  }, [
    canEdit,
    mosquesLoaded,
    mosquesEmptyInDb,
    kargoojarisLoaded,
    kargoojarisEmptyInDb,
    takazasLoaded,
    takazasEmptyInDb,
    mosques,
    kargoojaris,
    takazas,
  ]);

  // Keep localStorage mirrored as offline/print cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mosques));
    } catch {
      // Ignore storage quota errors
    }
  }, [mosques]);

  useEffect(() => {
    try {
      localStorage.setItem(TAKAZA_STORAGE_KEY, JSON.stringify(takazas));
    } catch {
      // Ignore storage quota errors
    }
  }, [takazas]);

  useEffect(() => {
    try {
      localStorage.setItem(KARGOOJARI_STORAGE_KEY, JSON.stringify(kargoojaris));
    } catch {
      // Ignore storage quota errors
    }
  }, [kargoojaris]);

  const requireEditAccess = (): boolean => {
    if (canEdit) return true;
    showToast(
      user
        ? 'আপনার এখনো এডিট অ্যাক্সেস নেই। অ্যাডমিনের অনুমোদনের জন্য অনুরোধ পাঠান।'
        : 'তথ্য যোগ বা এডিট করতে Google দিয়ে সাইন ইন করুন।'
    );
    setAccessModalOpen(true);
    return false;
  };

  // Auth & Access Control actions
  const handleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (isSuperAdminEmail(cred.user?.email)) {
        setAccessModalOpen(false);
      }
      showToast('সাইন ইন সফল হয়েছে।');
    } catch (error) {
      const errCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      const errMsg = error instanceof Error ? error.message : '';

      if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          setAuthError('Google সাইন ইন চালু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
          setAccessModalOpen(true);
        }
      } else if (
        errCode === 'auth/unauthorized-domain' ||
        errMsg.includes('unauthorized-domain')
      ) {
        const host =
          typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setAuthError(
          `এই ডোমেইন (${host}) এখনো Firebase Authorized Domains-এ যোগ করা নেই। শুধু একবার যোগ করলেই সাথে সাথে সাইন ইন হয়ে যাবে।`
        );
        setAccessModalOpen(true);
      } else if (
        errCode === 'auth/popup-closed-by-user' ||
        errMsg.includes('popup-closed')
      ) {
        setAuthError('সাইন ইন পপআপ বন্ধ করা হয়েছে। আবার চেষ্টা করুন।');
        setAccessModalOpen(true);
      } else {
        setAuthError(
          'Google সাইন ইন করতে সমস্যা হয়েছে। পপআপ ব্লকার বন্ধ রেখে আবার চেষ্টা করুন।'
        );
        setAccessModalOpen(true);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
      setSathiModal(null);
      setMosqueModal(null);
      showToast('সাইন আউট করা হয়েছে।');
    } catch {
      setAuthError('সাইন আউট করতে সমস্যা হয়েছে।');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSubmitAccessRequest = async (note: string) => {
    if (!user) return;
    await submitAccessRequest(user, note, Boolean(myRequest));
    showToast('অ্যাডমিনের কাছে এডিট অ্যাক্সেসের অনুরোধ পাঠানো হয়েছে।');
  };

  const handleGrantEditor = async (
    email: string,
    label: string,
    requestUid?: string
  ) => {
    if (!isSuperAdmin) return;
    const editorId = emailToDocId(email);
    const alreadyExists = editors.some((ed) => ed.id === editorId);
    await grantEditorAccess(email, label, alreadyExists, requestUid);
    showToast(`${email}-কে এডিট অ্যাক্সেস দেওয়া হয়েছে।`);
  };

  const handleToggleEditor = async (editorId: string, active: boolean) => {
    if (!isSuperAdmin) return;
    await toggleEditorActive(editorId, active);
    showToast(
      active ? 'এডিটর অ্যাক্সেস সক্রিয় করা হয়েছে।' : 'এডিটর অ্যাক্সেস স্থগিত করা হয়েছে।'
    );
  };

  const handleRevokeEditor = async (editorId: string) => {
    if (!isSuperAdmin) return;
    await revokeEditorAccess(editorId);
    showToast('এডিটর তালিকা থেকে অ্যাক্সেস মুছে ফেলা হয়েছে।');
  };

  const handleRejectRequest = async (requestUid: string) => {
    if (!isSuperAdmin) return;
    await rejectAccessRequest(requestUid);
    showToast('অনুরোধটি প্রত্যাখ্যান করা হয়েছে।');
  };

  const handleDeleteRequest = async (requestUid: string) => {
    await deleteAccessRequest(requestUid);
    showToast('অ্যাক্সেস অনুরোধ বাতিল করা হয়েছে।');
  };

  const handleCopyPhone = (phone: string) => {
    const formatted = formatBdPhone(phone);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    showToast(`নম্বর কপি করা হয়েছে: ${formatted}`);
  };

  const handleOpenMosque = (mosqueId: number) => {
    setSelectedMosqueId(mosqueId);
    setActiveTab('mosques');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDirectory = (category?: SathiCategory) => {
    setDirectoryCategory(category ?? 'all');
    setActiveTab('directory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSathi = (
    mosqueId: number,
    category: SathiCategory,
    entryData: Omit<SathiEntry, 'id'> & { id?: string }
  ) => {
    if (!requireEditAccess()) return;
    const targetMosque = mosques.find((m) => m.id === mosqueId);
    if (!targetMosque) return;

    const normalizedEntry = {
      ...entryData,
      phone: formatBdPhone(entryData.phone),
    };
    const currentList = targetMosque.categories[category] ?? [];
    const updatedList = normalizedEntry.id
      ? currentList.map((item) =>
          item.id === normalizedEntry.id
            ? { ...item, ...normalizedEntry, id: item.id }
            : item
        )
      : [
          ...currentList,
          {
            ...normalizedEntry,
            id: `m${mosqueId}-${category}-${Date.now()}`,
          },
        ];

    const updatedMosque: MosqueRecord = {
      ...targetMosque,
      categories: {
        ...targetMosque.categories,
        [category]: updatedList,
      },
    };

    setMosques((prev) =>
      prev.map((m) => (m.id === mosqueId ? updatedMosque : m))
    );
    setSathiModal(null);
    showToast(
      normalizedEntry.id
        ? 'সাথীর তথ্য হালনাগাদ করা হয়েছে।'
        : 'নতুন সাথী তালিকায় যুক্ত করা হয়েছে।'
    );

    void saveMosqueToFirestore(updatedMosque).catch(() => {
      showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
    });
  };

  const handleDeleteSathi = (
    mosqueId: number,
    category: SathiCategory,
    entryId: string
  ) => {
    if (!requireEditAccess()) return;
    const targetMosque = mosques.find((m) => m.id === mosqueId);
    if (!targetMosque) return;

    const updatedMosque: MosqueRecord = {
      ...targetMosque,
      categories: {
        ...targetMosque.categories,
        [category]: (targetMosque.categories[category] ?? []).filter(
          (item) => item.id !== entryId
        ),
      },
    };

    setMosques((prev) =>
      prev.map((m) => (m.id === mosqueId ? updatedMosque : m))
    );
    showToast('তালিকা থেকে এন্ট্রিটি সরানো হয়েছে।');

    void saveMosqueToFirestore(updatedMosque).catch(() => {
      showToast('ডাটাবেস আপডেট করতে সমস্যা হয়েছে।');
    });
  };

  const handleSaveMosqueInfo = (
    values: MosqueFormValues,
    existingMosque?: MosqueRecord
  ) => {
    if (!requireEditAccess()) return;
    const khatibPhone = formatBdPhone(values.khatibPhone);
    const imamPhone = formatBdPhone(values.imamPhone);
    const muazzinPhone = formatBdPhone(values.muazzinPhone);

    if (existingMosque) {
      const updatedMosque: MosqueRecord = {
        ...existingMosque,
        name: values.name,
        address: values.address,
        khatib: { name: values.khatibName, phone: khatibPhone },
        imam: { name: values.imamName, phone: imamPhone },
        muazzin: {
          name: values.muazzinName,
          phone: muazzinPhone,
        },
      };
      setMosques((prev) =>
        prev.map((m) => (m.id === existingMosque.id ? updatedMosque : m))
      );
      setMosqueModal(null);
      showToast(`${values.name}-এর তথ্য সংরক্ষণ করা হয়েছে।`);

      void saveMosqueToFirestore(updatedMosque).catch(() => {
        showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    } else {
      const nextId =
        mosques.reduce((maxId, m) => Math.max(maxId, m.id), 0) + 1;
      const newMosque: MosqueRecord = {
        id: nextId,
        name: values.name,
        address: values.address,
        khatib: { name: values.khatibName, phone: khatibPhone },
        imam: { name: values.imamName, phone: imamPhone },
        muazzin: { name: values.muazzinName, phone: muazzinPhone },
        categories: createEmptyCategories(),
      };
      setMosques((prev) => [...prev, newMosque]);
      setSelectedMosqueId(nextId);
      setActiveTab('mosques');
      setMosqueModal(null);
      showToast(
        `${values.name} যুক্ত করা হয়েছে এবং সকল বিভাগ স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });

      void saveMosqueToFirestore(newMosque).catch(() => {
        showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    }
  };

  const handleDeleteMosque = (mosqueId: number) => {
    if (!requireEditAccess()) return;
    const remaining = mosques.filter((m) => m.id !== mosqueId);
    if (remaining.length === 0) return;
    setMosques(remaining);
    if (selectedMosqueId === mosqueId) {
      setSelectedMosqueId(remaining[0].id);
    }
    setMosqueModal(null);
    showToast('মসজিদটি তালিকা থেকে সরানো হয়েছে।');

    void deleteMosqueFromFirestore(mosqueId).catch(() => {
      showToast('ডাটাবেস থেকে মুছতে সমস্যা হয়েছে।');
    });
  };

  const handleUpdateOfficial = (
    mosqueId: number,
    role: 'khatib' | 'imam' | 'muazzin',
    official: OfficialInfo
  ) => {
    if (!requireEditAccess()) return;
    const targetMosque = mosques.find((m) => m.id === mosqueId);
    if (!targetMosque) return;

    const normalizedOfficial: OfficialInfo = {
      name: official.name.trim(),
      phone: formatBdPhone(official.phone),
    };
    const roleLabels = {
      khatib: 'খতিব সাহেবের',
      imam: 'ইমাম সাহেবের',
      muazzin: 'মোয়াজ্জিন সাহেবের',
    };
    const updatedMosque: MosqueRecord = {
      ...targetMosque,
      [role]: normalizedOfficial,
    };

    setMosques((prev) =>
      prev.map((m) => (m.id === mosqueId ? updatedMosque : m))
    );
    const isEmpty = !normalizedOfficial.name && !normalizedOfficial.phone;
    showToast(
      isEmpty
        ? `${roleLabels[role]} তথ্য মুছে ফেলা হয়েছে।`
        : `${roleLabels[role]} তথ্য সংরক্ষণ করা হয়েছে।`
    );

    void saveMosqueToFirestore(updatedMosque).catch(() => {
      showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
    });
  };

  // Takaza handlers
  const handleSaveTakaza = (
    data: Omit<TakazaEntry, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (!requireEditAccess()) return;
    const normalizedData = {
      ...data,
      zimmadarPhone: formatBdPhone(data.zimmadarPhone),
    };
    if (normalizedData.id) {
      const existing = takazas.find((t) => t.id === normalizedData.id);
      if (!existing) return;
      const updated: TakazaEntry = {
        ...existing,
        ...normalizedData,
        id: existing.id,
      };
      setTakazas((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      showToast('তাকাজার তথ্য হালনাগাদ করা হয়েছে।');
      void saveTakazaToFirestore(updated).catch(() => {
        showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    } else {
      const newEntry: TakazaEntry = {
        ...normalizedData,
        id: `takaza-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTakazas((prev) => [newEntry, ...prev]);
      showToast('নতুন চলমান তাকাজা যুক্ত করা হয়েছে।');
      void saveTakazaToFirestore(newEntry).catch(() => {
        showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    }
  };

  const handleUpdateTakazaProgress = (id: string, delta: number) => {
    if (!requireEditAccess()) return;
    const existing = takazas.find((t) => t.id === id);
    if (!existing) return;

    const nextCount = Math.max(0, existing.completedCount + delta);
    const nextStatus: TakazaStatus =
      nextCount >= existing.targetCount
        ? 'completed'
        : existing.status === 'completed'
        ? 'ongoing'
        : existing.status;
    const updated: TakazaEntry = {
      ...existing,
      completedCount: nextCount,
      status: nextStatus,
    };

    setTakazas((prev) => prev.map((t) => (t.id === id ? updated : t)));
    void saveTakazaToFirestore(updated).catch(() => {
      showToast('ডাটাবেস আপডেট করতে সমস্যা হয়েছে।');
    });
  };

  const handleToggleTakazaStatus = (id: string, status: TakazaStatus) => {
    if (!requireEditAccess()) return;
    const existing = takazas.find((t) => t.id === id);
    if (!existing) return;

    const updated: TakazaEntry = { ...existing, status };
    setTakazas((prev) => prev.map((t) => (t.id === id ? updated : t)));
    showToast('তাকাজার অবস্থা পরিবর্তন করা হয়েছে।');
    void saveTakazaToFirestore(updated).catch(() => {
      showToast('ডাটাবেস আপডেট করতে সমস্যা হয়েছে।');
    });
  };

  const handleDeleteTakaza = (id: string) => {
    if (!requireEditAccess()) return;
    if (INITIAL_TAKAZAS.some((t) => t.id === id)) {
      try {
        localStorage.setItem(TAKAZA_NOV19_ABUBAKOR_FS_KEY, '1');
      } catch {
        // Ignore storage write errors
      }
    }
    setTakazas((prev) => prev.filter((t) => t.id !== id));
    showToast('তাকাজাটি সরানো হয়েছে।');
    void deleteTakazaFromFirestore(id).catch(() => {
      showToast('ডাটাবেস থেকে মুছতে সমস্যা হয়েছে।');
    });
  };

  // Kargoojari handlers
  const handleSaveKargoojari = (
    data: Omit<KargoojariEntry, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (!requireEditAccess()) return;
    const normalizedData = {
      ...data,
      sathis: data.sathis?.map((s) => ({
        ...s,
        phone: formatBdPhone(s.phone),
      })),
    };
    if (normalizedData.id) {
      const existing = kargoojaris.find((k) => k.id === normalizedData.id);
      if (!existing) return;
      const updated: KargoojariEntry = {
        ...existing,
        ...normalizedData,
        id: existing.id,
      };
      setKargoojaris((prev) =>
        prev.map((k) => (k.id === updated.id ? updated : k))
      );
      showToast('দৈনিক কারগুজারি হালনাগাদ করা হয়েছে।');
      void saveKargoojariToFirestore(updated).catch(() => {
        showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    } else {
      const newEntry: KargoojariEntry = {
        ...normalizedData,
        id: `karg-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setKargoojaris((prev) => [newEntry, ...prev]);
      showToast('দৈনিক কারগুজারি সংরক্ষণ করা হয়েছে।');
      void saveKargoojariToFirestore(newEntry).catch(() => {
        showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    }
  };

  const handleDeleteKargoojari = (id: string) => {
    if (!requireEditAccess()) return;
    setKargoojaris((prev) => prev.filter((k) => k.id !== id));
    showToast('কারগুজারি এন্ট্রিটি মুছে ফেলা হয়েছে।');
    void deleteKargoojariFromFirestore(id).catch(() => {
      showToast('ডাটাবেস থেকে মুছতে সমস্যা হয়েছে।');
    });
  };

  const handleSaveKargoojariSathi = (
    kargoojariId: string,
    sathiData: Omit<KargoojariSathiItem, 'id'> & { id?: string }
  ) => {
    if (!requireEditAccess()) return;
    const existingEntry = kargoojaris.find((k) => k.id === kargoojariId);
    if (!existingEntry) return;

    const normalizedSathi = {
      ...sathiData,
      phone: formatBdPhone(sathiData.phone),
    };
    const current = existingEntry.sathis ?? [];
    const nextSathis = normalizedSathi.id
      ? current.map((s) =>
          s.id === normalizedSathi.id
            ? { ...s, ...normalizedSathi, id: s.id }
            : s
        )
      : [
          ...current,
          {
            ...normalizedSathi,
            id: `ks-${Date.now()}`,
          },
        ];
    const updatedEntry: KargoojariEntry = {
      ...existingEntry,
      sathis: nextSathis,
    };

    setKargoojaris((prev) =>
      prev.map((k) => (k.id === kargoojariId ? updatedEntry : k))
    );
    showToast(
      normalizedSathi.id
        ? 'সাথীর তথ্য হালনাগাদ করা হয়েছে।'
        : 'কারগুজারিতে নতুন সাথী যুক্ত করা হয়েছে।'
    );

    void saveKargoojariToFirestore(updatedEntry).catch(() => {
      showToast('ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে।');
    });
  };

  const handleDeleteKargoojariSathi = (
    kargoojariId: string,
    sathiId: string
  ) => {
    if (!requireEditAccess()) return;
    const existingEntry = kargoojaris.find((k) => k.id === kargoojariId);
    if (!existingEntry) return;

    const updatedEntry: KargoojariEntry = {
      ...existingEntry,
      sathis: (existingEntry.sathis ?? []).filter((s) => s.id !== sathiId),
    };

    setKargoojaris((prev) =>
      prev.map((k) => (k.id === kargoojariId ? updatedEntry : k))
    );
    showToast('কারগুজারির তালিকা থেকে সাথীকে সরানো হয়েছে।');

    void saveKargoojariToFirestore(updatedEntry).catch(() => {
      showToast('ডাটাবেস আপডেট করতে সমস্যা হয়েছে।');
    });
  };

  const handleAssignKargoojariSathiToMosque = (
    payload: AssignKargoojariToMosquePayload
  ) => {
    if (!requireEditAccess()) return;
    const formattedPhone = formatBdPhone(payload.phone);

    const targetMosque = mosques.find((m) => m.id === payload.mosqueId);
    let updatedMosque: MosqueRecord | null = null;
    if (targetMosque) {
      const existingList = targetMosque.categories[payload.category] ?? [];
      const newEntry: SathiEntry = {
        id: `m${payload.mosqueId}-${payload.category}-${Date.now()}`,
        name: payload.name,
        phone: formattedPhone,
        address: '',
        notes: payload.notes,
      };
      updatedMosque = {
        ...targetMosque,
        categories: {
          ...targetMosque.categories,
          [payload.category]: [...existingList, newEntry],
        },
      };
      setMosques((prev) =>
        prev.map((m) => (m.id === payload.mosqueId ? updatedMosque! : m))
      );
    }

    const targetKarg = kargoojaris.find((k) => k.id === payload.kargoojariId);
    let updatedKarg: KargoojariEntry | null = null;
    if (targetKarg) {
      updatedKarg = {
        ...targetKarg,
        sathis: (targetKarg.sathis ?? []).map((s) =>
          s.id === payload.kargSathiId
            ? {
                ...s,
                name: payload.name,
                phone: formattedPhone,
                notes: payload.notes,
                assignedMosqueId: payload.mosqueId,
                assignedCategory: payload.category,
              }
            : s
        ),
      };
      setKargoojaris((prev) =>
        prev.map((k) => (k.id === payload.kargoojariId ? updatedKarg! : k))
      );
    }

    const mosqueName = targetMosque?.name ?? 'মসজিদ';
    const catLabel = getCategoryMeta(payload.category).shortLabel;
    showToast(`${payload.name}-কে ${mosqueName} (${catLabel})-এ যুক্ত করা হয়েছে।`);

    if (updatedMosque) {
      void saveMosqueToFirestore(updatedMosque).catch(() => {
        showToast('মসজিদের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    }
    if (updatedKarg) {
      void saveKargoojariToFirestore(updatedKarg).catch(() => {
        showToast('কারগুজারির তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
      });
    }
  };

  const handleAssignKargoojariSathiToTakaza = (
    payload: AssignKargoojariToTakazaPayload
  ) => {
    if (!requireEditAccess()) return;
    const formattedPhone = formatBdPhone(payload.sathiPhone);
    let resolvedTakazaId = payload.existingTakazaId ?? '';
    let resolvedTakazaTitle = '';
    let takazaToSave: TakazaEntry | null = null;

    if (payload.existingTakazaId) {
      const targetTakaza = takazas.find(
        (t) => t.id === payload.existingTakazaId
      );
      resolvedTakazaTitle = targetTakaza?.title ?? 'চলমান তাকাজা';

      if (targetTakaza) {
        const existingCommitted = targetTakaza.committedSathis ?? [];
        const alreadyListed = existingCommitted.some(
          (cs) => cs.name.trim() === payload.sathiName.trim()
        );
        const nextCount = alreadyListed
          ? targetTakaza.completedCount
          : targetTakaza.completedCount + 1;
        const nextStatus: TakazaStatus =
          nextCount >= targetTakaza.targetCount
            ? 'completed'
            : targetTakaza.status === 'completed'
            ? 'ongoing'
            : targetTakaza.status;
        const nextCommitted = alreadyListed
          ? existingCommitted
          : [
              ...existingCommitted,
              {
                id: `tc-${Date.now()}`,
                name: payload.sathiName,
                phone: formattedPhone,
              },
            ];
        takazaToSave = {
          ...targetTakaza,
          completedCount: nextCount,
          status: nextStatus,
          committedSathis: nextCommitted,
        };
        setTakazas((prev) =>
          prev.map((t) => (t.id === takazaToSave!.id ? takazaToSave! : t))
        );
      }
    } else if (payload.newTakaza) {
      resolvedTakazaId = `takaza-${Date.now()}`;
      resolvedTakazaTitle = payload.newTakaza.title;
      takazaToSave = {
        id: resolvedTakazaId,
        title: payload.newTakaza.title,
        mosqueId: payload.newTakaza.mosqueId,
        type: payload.newTakaza.type,
        targetCount: payload.newTakaza.targetCount,
        completedCount: 1,
        dueDate: payload.newTakaza.dueDate,
        zimmadarName: '',
        zimmadarPhone: '',
        status: 1 >= payload.newTakaza.targetCount ? 'completed' : 'ongoing',
        notes: payload.newTakaza.notes,
        committedSathis: [
          {
            id: `tc-${Date.now()}`,
            name: payload.sathiName,
            phone: formattedPhone,
          },
        ],
        createdAt: new Date().toISOString(),
      };
      setTakazas((prev) => [takazaToSave!, ...prev]);
    }

    if (resolvedTakazaId) {
      const targetKarg = kargoojaris.find((k) => k.id === payload.kargoojariId);
      let updatedKarg: KargoojariEntry | null = null;
      if (targetKarg) {
        updatedKarg = {
          ...targetKarg,
          sathis: (targetKarg.sathis ?? []).map((s) =>
            s.id === payload.kargSathiId
              ? {
                  ...s,
                  tashkeelStatus: 'tashkeel' as const,
                  assignedTakazaId: resolvedTakazaId,
                  assignedTakazaTitle: resolvedTakazaTitle,
                }
              : s
          ),
        };
        setKargoojaris((prev) =>
          prev.map((k) => (k.id === payload.kargoojariId ? updatedKarg! : k))
        );
      }

      showToast(
        `${payload.sathiName}-কে "${resolvedTakazaTitle}" তাকাজায় যুক্ত করা হয়েছে।`
      );

      if (takazaToSave) {
        void saveTakazaToFirestore(takazaToSave).catch(() => {
          showToast('তাকাজা সংরক্ষণ করতে সমস্যা হয়েছে।');
        });
      }
      if (updatedKarg) {
        void saveKargoojariToFirestore(updatedKarg).catch(() => {
          showToast('কারগুজারি সংরক্ষণ করতে সমস্যা হয়েছে।');
        });
      }
    }
  };

  const handleOpenTashkeelInTakaza = (
    kargoojari: KargoojariEntry,
    sathi: KargoojariSathiItem
  ) => {
    const cleanName = sathi.name.trim();
    const coreName = normalizeMemberCoreName(cleanName);
    const contextText = `${sathi.notes} ${kargoojari.summary}`.toLowerCase();

    const findMatchedTakaza = (): TakazaEntry | undefined => {
      if (sathi.assignedTakazaId) {
        const direct = takazas.find((t) => t.id === sathi.assignedTakazaId);
        if (direct) return direct;
      }

      const byCommitted = takazas.find((t) =>
        (t.committedSathis ?? []).some(
          (cs) =>
            cs.name.trim() === cleanName ||
            (coreName && normalizeMemberCoreName(cs.name) === coreName)
        )
      );
      if (byCommitted) return byCommitted;

      const activeList = takazas.filter((t) => t.status !== 'completed');
      const pool = activeList.length > 0 ? activeList : takazas;
      if (pool.length === 0) return undefined;

      const scored = pool
        .map((t) => {
          let score = 0;
          const titleLower = `${t.title} ${t.notes}`.toLowerCase();
          if (
            (contextText.includes('৩ দিন') || contextText.includes('তিন দিন')) &&
            (t.type === 'three_days' || titleLower.includes('৩ দিন'))
          ) {
            score += 5;
          }
          if (
            (contextText.includes('১৯') ||
              contextText.includes('২০') ||
              contextText.includes('২১')) &&
            (titleLower.includes('১৯') ||
              titleLower.includes('২০') ||
              titleLower.includes('২১'))
          ) {
            score += 5;
          }
          if (
            typeof kargoojari.mosqueId === 'number' &&
            t.mosqueId === kargoojari.mosqueId
          ) {
            score += 2;
          }
          if (t.status === 'urgent') score += 1;
          return { t, score };
        })
        .sort((a, b) => b.score - a.score);

      return scored[0]?.t;
    };

    const matchedTakaza = findMatchedTakaza();
    let targetId = matchedTakaza?.id ?? null;

    if (canEdit) {
      const formattedPhone = formatBdPhone(sathi.phone);
      if (matchedTakaza) {
        const existingCommitted = matchedTakaza.committedSathis ?? [];
        const alreadyListed = existingCommitted.some(
          (cs) =>
            cs.name.trim() === cleanName ||
            (coreName && normalizeMemberCoreName(cs.name) === coreName)
        );

        let takazaToSave: TakazaEntry | null = null;
        if (!alreadyListed) {
          const nextCount = matchedTakaza.completedCount + 1;
          const nextStatus: TakazaStatus =
            nextCount >= matchedTakaza.targetCount
              ? 'completed'
              : matchedTakaza.status === 'completed'
              ? 'ongoing'
              : matchedTakaza.status;
          takazaToSave = {
            ...matchedTakaza,
            completedCount: nextCount,
            status: nextStatus,
            committedSathis: [
              ...existingCommitted,
              {
                id: `tc-${Date.now()}`,
                name: cleanName,
                phone: formattedPhone,
              },
            ],
          };
          setTakazas((prev) =>
            prev.map((t) => (t.id === takazaToSave!.id ? takazaToSave! : t))
          );
          void saveTakazaToFirestore(takazaToSave).catch(() => {
            showToast('তাকাজা সংরক্ষণ করতে সমস্যা হয়েছে।');
          });
        }

        if (
          sathi.assignedTakazaId !== matchedTakaza.id ||
          sathi.assignedTakazaTitle !== matchedTakaza.title
        ) {
          const updatedKarg: KargoojariEntry = {
            ...kargoojari,
            sathis: (kargoojari.sathis ?? []).map((item) =>
              item.id === sathi.id
                ? {
                    ...item,
                    tashkeelStatus: 'tashkeel' as const,
                    assignedTakazaId: matchedTakaza.id,
                    assignedTakazaTitle: matchedTakaza.title,
                  }
                : item
            ),
          };
          setKargoojaris((prev) =>
            prev.map((k) => (k.id === kargoojari.id ? updatedKarg : k))
          );
          void saveKargoojariToFirestore(updatedKarg).catch(() => {
            showToast('কারগুজারি সংরক্ষণ করতে সমস্যা হয়েছে।');
          });
        }

        showToast(
          alreadyListed
            ? `চলমান তাকাজা: ${matchedTakaza.title}`
            : `${cleanName}-কে চলমান তাকাজায় যুক্ত করা হয়েছে।`
        );
      } else {
        const newId = `takaza-${Date.now()}`;
        const newTitle = sathi.notes.trim() || '৩ দিনের জামাত তশকিল';
        const newTakaza: TakazaEntry = {
          id: newId,
          title: newTitle,
          mosqueId: kargoojari.mosqueId,
          type: 'three_days',
          targetCount: 10,
          completedCount: 1,
          dueDate: '',
          zimmadarName: '',
          zimmadarPhone: '',
          status: 'ongoing',
          notes: sathi.notes.trim(),
          committedSathis: [
            {
              id: `tc-${Date.now()}`,
              name: cleanName,
              phone: formattedPhone,
            },
          ],
          createdAt: new Date().toISOString(),
        };
        targetId = newId;
        setTakazas((prev) => [newTakaza, ...prev]);
        void saveTakazaToFirestore(newTakaza).catch(() => {
          showToast('তাকাজা সংরক্ষণ করতে সমস্যা হয়েছে।');
        });

        const updatedKarg: KargoojariEntry = {
          ...kargoojari,
          sathis: (kargoojari.sathis ?? []).map((item) =>
            item.id === sathi.id
              ? {
                  ...item,
                  tashkeelStatus: 'tashkeel' as const,
                  assignedTakazaId: newId,
                  assignedTakazaTitle: newTitle,
                }
              : item
          ),
        };
        setKargoojaris((prev) =>
          prev.map((k) => (k.id === kargoojari.id ? updatedKarg : k))
        );
        void saveKargoojariToFirestore(updatedKarg).catch(() => {
          showToast('কারগুজারি সংরক্ষণ করতে সমস্যা হয়েছে।');
        });
        showToast(`${cleanName}-কে নতুন চলমান তাকাজায় যুক্ত করা হয়েছে।`);
      }
    }

    setFocusedTakazaId(targetId);
    setActiveTab('takaja');
    if (!targetId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRemoveCommittedSathi = (takazaId: string, sathiId: string) => {
    if (!requireEditAccess()) return;
    const existing = takazas.find((t) => t.id === takazaId);
    if (!existing) return;

    const removedItem = (existing.committedSathis ?? []).find(
      (cs) => cs.id === sathiId
    );
    const nextCommitted = (existing.committedSathis ?? []).filter(
      (cs) => cs.id !== sathiId
    );
    const nextCount = Math.max(0, existing.completedCount - 1);
    const nextStatus: TakazaStatus =
      existing.status === 'completed' && nextCount < existing.targetCount
        ? 'ongoing'
        : existing.status;

    const updatedTakaza: TakazaEntry = {
      ...existing,
      completedCount: nextCount,
      status: nextStatus,
      committedSathis: nextCommitted,
    };

    setTakazas((prev) =>
      prev.map((t) => (t.id === takazaId ? updatedTakaza : t))
    );
    void saveTakazaToFirestore(updatedTakaza).catch(() => {
      showToast('তাকাজা আপডেট করতে সমস্যা হয়েছে।');
    });

    if (removedItem) {
      const removedCore = normalizeMemberCoreName(removedItem.name);
      setKargoojaris((prev) =>
        prev.map((k) => {
          const hasMatch = (k.sathis ?? []).some(
            (s) =>
              s.assignedTakazaId === takazaId &&
              (s.name.trim() === removedItem.name.trim() ||
                (removedCore &&
                  normalizeMemberCoreName(s.name) === removedCore))
          );
          if (!hasMatch) return k;
          const updatedKarg: KargoojariEntry = {
            ...k,
            sathis: (k.sathis ?? []).map((s) =>
              s.assignedTakazaId === takazaId &&
              (s.name.trim() === removedItem.name.trim() ||
                (removedCore &&
                  normalizeMemberCoreName(s.name) === removedCore))
                ? {
                    ...s,
                    assignedTakazaId: undefined,
                    assignedTakazaTitle: undefined,
                  }
                : s
            ),
          };
          void saveKargoojariToFirestore(updatedKarg).catch(() => {});
          return updatedKarg;
        })
      );
    }

    showToast('তাকাজার তালিকা থেকে সাথীকে সরানো হয়েছে।');
  };

  const handleImportData = (payload: {
    mosques: MosqueRecord[];
    takazas?: TakazaEntry[];
    kargoojaris?: KargoojariEntry[];
  }) => {
    if (!requireEditAccess()) return;
    const normalizedMosques = normalizeMosquesPhones(payload.mosques);
    setMosques(normalizedMosques);
    void seedInitialMosquesToFirestore(normalizedMosques).catch(() => {
      showToast('মসজিদের ব্যাকআপ ডাটাবেসে রিস্টোর করতে সমস্যা হয়েছে।');
    });

    if (Array.isArray(payload.takazas)) {
      const normalizedTakazas = normalizeTakazasPhones(payload.takazas);
      setTakazas(normalizedTakazas);
      void seedInitialTakazasToFirestore(normalizedTakazas).catch(() => {
        showToast('তাকাজার ব্যাকআপ রিস্টোর করতে সমস্যা হয়েছে।');
      });
    }

    if (Array.isArray(payload.kargoojaris)) {
      const normalizedKargs = normalizeKargoojarisPhones(payload.kargoojaris);
      setKargoojaris(normalizedKargs);
      void seedInitialKargoojarisToFirestore(normalizedKargs).catch(() => {
        showToast('কারগুজারির ব্যাকআপ রিস্টোর করতে সমস্যা হয়েছে।');
      });
    }

    showToast('ব্যাকআপ থেকে সকল তথ্য রিস্টোর করা হয়েছে।');
  };

  const handleResetToBaseline = () => {
    if (!requireEditAccess()) return;
    setMosques(INITIAL_MOSQUES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    showToast('মূল পিডিএফের ১৪টি মসজিদ ও ২৫৬ জন সাথীর তথ্যে রিসেট করা হয়েছে।');
    void seedInitialMosquesToFirestore(INITIAL_MOSQUES).catch(() => {
      showToast('ডাটাবেস রিসেট করতে সমস্যা হয়েছে।');
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F7F6] text-[#102A27]">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'directory') setDirectoryCategory('all');
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAddMember={() => {
          if (!requireEditAccess()) return;
          setSathiModal({
            mosqueId: activeTab === 'mosques' ? selectedMosqueId : 1,
            category: SathiCategory.ThreeChillaSathi,
            editingEntry: null,
          });
        }}
        userEmail={user?.email ?? null}
        canEdit={canEdit}
        isSuperAdmin={isSuperAdmin}
        pendingRequestCount={pendingRequestCount}
        onOpenAccessModal={() => setAccessModalOpen(true)}
        onQuickSignIn={() => void handleSignIn()}
      />

      <OfflineIndicator />

      {authReady && user && !canEdit && (
        <div className="no-print border-b border-[#CFE3DF] bg-[#E8F4F1]">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-[#1D3F3B] sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#0E6F66]" />
              <span>
                সাইন ইন: <strong className="font-mono">{user.email}</strong> —
                তথ্য যোগ বা এডিট করতে অ্যাডমিনের অনুমোদন প্রয়োজন।
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAccessModalOpen(true)}
              className="cursor-pointer rounded-lg bg-white px-2.5 py-1 font-semibold text-[#0E6F66] shadow-xs ring-1 ring-[#B7DBD3] transition-colors hover:bg-[#0E6F66] hover:text-white"
            >
              অ্যাক্সেস অনুরোধ দেখুন
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <OverviewView
            mosques={mosques}
            canEdit={canEdit}
            onOpenMosque={handleOpenMosque}
            onOpenDirectory={handleOpenDirectory}
            onAddMosque={() => {
              if (!requireEditAccess()) return;
              setMosqueModal({ mode: 'add' });
            }}
            onNavigateTab={(tab) => {
              if (tab === 'directory') setDirectoryCategory('all');
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'mosques' && (
          <MosquesView
            mosques={mosques}
            selectedMosqueId={selectedMosqueId}
            canEdit={canEdit}
            onSelectMosque={setSelectedMosqueId}
            onAddSathi={(mosqueId, category) => {
              if (!requireEditAccess()) return;
              setSathiModal({
                mosqueId,
                category: category ?? SathiCategory.ThreeChillaSathi,
                editingEntry: null,
              });
            }}
            onEditSathi={(mosqueId, category, entry) => {
              if (!requireEditAccess()) return;
              setSathiModal({
                mosqueId,
                category,
                editingEntry: entry,
              });
            }}
            onDeleteSathi={handleDeleteSathi}
            onEditMosqueInfo={(mosque) => {
              if (!requireEditAccess()) return;
              setMosqueModal({ mode: 'edit', mosque });
            }}
            onUpdateOfficial={handleUpdateOfficial}
            onAddMosque={() => {
              if (!requireEditAccess()) return;
              setMosqueModal({ mode: 'add' });
            }}
            onCopyPhone={handleCopyPhone}
            onSelectPerson={setInspectedPerson}
          />
        )}

        {activeTab === 'directory' && (
          <SathiDirectoryView
            key={directoryCategory}
            mosques={mosques}
            initialCategory={directoryCategory}
            onOpenMosque={handleOpenMosque}
            onCopyPhone={handleCopyPhone}
            onSelectPerson={setInspectedPerson}
          />
        )}

        {activeTab === 'takaja' && (
          <TakazaView
            mosques={mosques}
            takazas={takazas}
            canEdit={canEdit}
            focusedTakazaId={focusedTakazaId}
            onClearFocusedTakaza={() => setFocusedTakazaId(null)}
            onSaveTakaza={handleSaveTakaza}
            onUpdateProgress={handleUpdateTakazaProgress}
            onToggleStatus={handleToggleTakazaStatus}
            onDeleteTakaza={handleDeleteTakaza}
            onRemoveCommittedSathi={handleRemoveCommittedSathi}
            onSelectPerson={setInspectedPerson}
          />
        )}

        {activeTab === 'kargoojari' && (
          <KargoojariView
            mosques={mosques}
            takazas={takazas}
            entries={kargoojaris}
            canEdit={canEdit}
            onSaveEntry={handleSaveKargoojari}
            onDeleteEntry={handleDeleteKargoojari}
            onSaveKargoojariSathi={handleSaveKargoojariSathi}
            onDeleteKargoojariSathi={handleDeleteKargoojariSathi}
            onAssignToMosque={handleAssignKargoojariSathiToMosque}
            onAssignToTakaza={handleAssignKargoojariSathiToTakaza}
            onOpenTashkeelInTakaza={handleOpenTashkeelInTakaza}
            onCopyPhone={handleCopyPhone}
            onSelectPerson={setInspectedPerson}
          />
        )}

        {activeTab === 'report' && (
          <PrintExportView
            mosques={mosques}
            takazas={takazas}
            kargoojaris={kargoojaris}
            canEdit={canEdit}
            onImportData={handleImportData}
            onResetToBaseline={handleResetToBaseline}
          />
        )}
      </main>

      <footer className="no-print border-t border-[#D9EAE6] bg-white">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-[#58726E] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="font-medium text-[#102A27]">
            যাত্রাবাড়ী মারকাজ মসজিদ — ৪০১ নং হালকা
          </p>
          <p>
            {toBn(mosques.length)}টি মসজিদের সমন্বিত ডিজিটাল ডিরেক্টরি ·
            অ্যাডমিন-নিয়ন্ত্রিত ক্লাউড ডাটাবেস ও প্রিন্টযোগ্য
          </p>
        </div>
      </footer>

      {canEdit && sathiModal && (
        <SathiModal
          mosques={mosques}
          initialMosqueId={sathiModal.mosqueId}
          initialCategory={sathiModal.category}
          editingEntry={sathiModal.editingEntry}
          onClose={() => setSathiModal(null)}
          onSave={handleSaveSathi}
        />
      )}

      {canEdit && mosqueModal && (
        <MosqueInfoModal
          mosque={mosqueModal.mode === 'edit' ? mosqueModal.mosque : null}
          canDelete={mosques.length > 1}
          onClose={() => setMosqueModal(null)}
          onSave={handleSaveMosqueInfo}
          onDelete={handleDeleteMosque}
        />
      )}

      {accessModalOpen && (
        <AccessControlModal
          user={user}
          isSuperAdmin={isSuperAdmin}
          canEdit={canEdit}
          myRequest={myRequest}
          editors={editors}
          accessRequests={accessRequests}
          authBusy={authBusy}
          authError={authError}
          onClose={() => setAccessModalOpen(false)}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onSubmitRequest={handleSubmitAccessRequest}
          onGrantEditor={handleGrantEditor}
          onToggleEditor={handleToggleEditor}
          onRevokeEditor={handleRevokeEditor}
          onRejectRequest={handleRejectRequest}
          onDeleteRequest={handleDeleteRequest}
        />
      )}

      {inspectedPerson && (
        <SathiProfileModal
          person={inspectedPerson}
          mosques={mosques}
          onOpenMosque={handleOpenMosque}
          onCopyPhone={handleCopyPhone}
          onClose={() => setInspectedPerson(null)}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed right-5 bottom-5 z-50 rounded-xl border border-[#1D9488]/30 bg-[#0B5A53] px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
