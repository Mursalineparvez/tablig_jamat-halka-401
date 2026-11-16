import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  emailToDocId,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  AccessRequestRecord,
  EditorRecord,
  KargoojariEntry,
  MosqueRecord,
  SathiCategory,
  TakazaEntry,
} from '../types/directory';
import { formatBdPhone } from '../utils/bengali';

const clip = (val: string, max: number): string =>
  String(val ?? '').trim().slice(0, max);

const CATEGORY_KEYS: SathiCategory[] = [
  SathiCategory.SalwaliUlama,
  SathiCategory.ThreeChillaUlama,
  SathiCategory.OneChillaUlama,
  SathiCategory.Bidesh,
  SathiCategory.ThreeChillaSathi,
  SathiCategory.OneChillaSathi,
  SathiCategory.MasturatChilla,
  SathiCategory.MasturatTenFifteenDays,
  SathiCategory.MasturatThreeDays,
  SathiCategory.ChatraNowjowan,
];

function sanitizeMosquePayload(mosque: MosqueRecord, uid: string) {
  const categories = {} as Record<SathiCategory, MosqueRecord['categories'][SathiCategory]>;
  for (const key of CATEGORY_KEYS) {
    const list = mosque.categories[key] ?? [];
    categories[key] = list.slice(0, 300).map((entry) => ({
      id: clip(entry.id, 128),
      name: clip(entry.name, 150),
      phone: clip(formatBdPhone(entry.phone), 40),
      address: clip(entry.address, 300),
      notes: clip(entry.notes, 500),
    }));
  }

  return {
    id: Math.max(1, Math.min(10000, Math.trunc(mosque.id))),
    name: clip(mosque.name, 200) || 'মসজিদ',
    address: clip(mosque.address, 300),
    khatib: {
      name: clip(mosque.khatib?.name ?? '', 150),
      phone: clip(formatBdPhone(mosque.khatib?.phone ?? ''), 40),
    },
    imam: {
      name: clip(mosque.imam?.name ?? '', 150),
      phone: clip(formatBdPhone(mosque.imam?.phone ?? ''), 40),
    },
    muazzin: {
      name: clip(mosque.muazzin?.name ?? '', 150),
      phone: clip(formatBdPhone(mosque.muazzin?.phone ?? ''), 40),
    },
    categories,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

function sanitizeTakazaPayload(takaza: TakazaEntry, uid: string) {
  return {
    id: clip(takaza.id, 128),
    title: clip(takaza.title, 250) || 'তাকাজা',
    mosqueId:
      takaza.mosqueId === 'halqa'
        ? ('halqa' as const)
        : Math.max(1, Math.min(10000, Math.trunc(Number(takaza.mosqueId) || 1))),
    type: takaza.type,
    targetCount: Math.max(1, Math.min(10000, Math.trunc(takaza.targetCount || 1))),
    completedCount: Math.max(
      0,
      Math.min(10000, Math.trunc(takaza.completedCount || 0))
    ),
    dueDate: clip(takaza.dueDate, 32),
    zimmadarName: clip(takaza.zimmadarName, 150),
    zimmadarPhone: clip(formatBdPhone(takaza.zimmadarPhone), 40),
    status: takaza.status,
    notes: clip(takaza.notes, 2000),
    committedSathis: (takaza.committedSathis ?? []).slice(0, 300).map((cs) => ({
      id: clip(cs.id, 128),
      name: clip(cs.name, 150),
      phone: clip(formatBdPhone(cs.phone), 40),
    })),
    createdAt: clip(takaza.createdAt || new Date().toISOString(), 64),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

function sanitizeKargoojariPayload(entry: KargoojariEntry, uid: string) {
  return {
    id: clip(entry.id, 128),
    date: clip(entry.date, 32),
    mosqueId:
      entry.mosqueId === 'halqa'
        ? ('halqa' as const)
        : Math.max(1, Math.min(10000, Math.trunc(Number(entry.mosqueId) || 1))),
    gastDone: Boolean(entry.gastDone),
    talimDone: Boolean(entry.talimDone),
    mashwaraDone: Boolean(entry.mashwaraDone),
    sathiAttended: Math.max(
      0,
      Math.min(10000, Math.trunc(entry.sathiAttended || 0))
    ),
    tashkeelCount: Math.max(
      0,
      Math.min(10000, Math.trunc(entry.tashkeelCount || 0))
    ),
    reporterName: clip(entry.reporterName, 150),
    summary: clip(entry.summary, 15000),
    sathis: (entry.sathis ?? []).slice(0, 300).map((s) => ({
      id: clip(s.id, 128),
      name: clip(s.name, 150),
      phone: clip(formatBdPhone(s.phone), 40),
      notes: clip(s.notes, 500),
      ...(s.tashkeelStatus ? { tashkeelStatus: s.tashkeelStatus } : {}),
      ...(s.assignedMosqueId !== undefined
        ? { assignedMosqueId: s.assignedMosqueId }
        : {}),
      ...(s.assignedCategory ? { assignedCategory: s.assignedCategory } : {}),
      ...(s.assignedTakazaId ? { assignedTakazaId: s.assignedTakazaId } : {}),
      ...(s.assignedTakazaTitle
        ? { assignedTakazaTitle: clip(s.assignedTakazaTitle, 250) }
        : {}),
    })),
    createdAt: clip(entry.createdAt || new Date().toISOString(), 64),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

export function subscribeMosques(
  onData: (mosques: MosqueRecord[], isEmpty: boolean) => void
): Unsubscribe {
  const path = 'mosques';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData([], true);
        return;
      }
      const list = snapshot.docs
        .map((d) => d.data() as MosqueRecord)
        .sort((a, b) => a.id - b.id);
      onData(list, false);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeTakazas(
  onData: (takazas: TakazaEntry[], isEmpty: boolean) => void
): Unsubscribe {
  const path = 'takazas';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData([], true);
        return;
      }
      const list = snapshot.docs
        .map((d) => d.data() as TakazaEntry)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list, false);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeKargoojaris(
  onData: (entries: KargoojariEntry[], isEmpty: boolean) => void
): Unsubscribe {
  const path = 'kargoojaris';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData([], true);
        return;
      }
      const list = snapshot.docs
        .map((d) => d.data() as KargoojariEntry)
        .sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return b.createdAt.localeCompare(a.createdAt);
        });
      onData(list, false);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeMyEditorStatus(
  email: string,
  onStatus: (isActiveEditor: boolean) => void
): Unsubscribe {
  const editorId = emailToDocId(email);
  const path = `editors/${editorId}`;
  return onSnapshot(
    doc(db, 'editors', editorId),
    (snapshot) => {
      onStatus(snapshot.exists() && snapshot.data()?.active === true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeMyAccessRequest(
  uid: string,
  onRequest: (req: AccessRequestRecord | null) => void
): Unsubscribe {
  const path = `accessRequests/${uid}`;
  return onSnapshot(
    doc(db, 'accessRequests', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onRequest(null);
        return;
      }
      onRequest(snapshot.data() as AccessRequestRecord);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeAllEditors(
  onData: (editors: EditorRecord[]) => void
): Unsubscribe {
  const path = 'editors';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EditorRecord, 'id'>),
      }));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllAccessRequests(
  onData: (requests: AccessRequestRecord[]) => void
): Unsubscribe {
  const path = 'accessRequests';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list = snapshot.docs.map(
        (d) => d.data() as AccessRequestRecord
      );
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('অ্যাকশন সম্পন্ন করতে সাইন ইন করা প্রয়োজন।');
  return uid;
}

export async function seedInitialMosquesToFirestore(
  mosques: MosqueRecord[]
): Promise<void> {
  const uid = requireUid();
  const path = 'mosques';
  try {
    const batch = writeBatch(db);
    for (const m of mosques) {
      batch.set(doc(db, path, String(m.id)), sanitizeMosquePayload(m, uid));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedInitialKargoojarisToFirestore(
  entries: KargoojariEntry[]
): Promise<void> {
  const uid = requireUid();
  const path = 'kargoojaris';
  try {
    const batch = writeBatch(db);
    for (const entry of entries) {
      batch.set(
        doc(db, path, entry.id),
        sanitizeKargoojariPayload(entry, uid)
      );
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedInitialTakazasToFirestore(
  takazas: TakazaEntry[]
): Promise<void> {
  if (takazas.length === 0) return;
  const uid = requireUid();
  const path = 'takazas';
  try {
    const batch = writeBatch(db);
    for (const t of takazas) {
      batch.set(doc(db, path, t.id), sanitizeTakazaPayload(t, uid));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMosqueToFirestore(
  mosque: MosqueRecord
): Promise<void> {
  const uid = requireUid();
  const path = `mosques/${mosque.id}`;
  try {
    await setDoc(doc(db, 'mosques', String(mosque.id)), sanitizeMosquePayload(mosque, uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMosqueFromFirestore(
  mosqueId: number
): Promise<void> {
  requireUid();
  const path = `mosques/${mosqueId}`;
  try {
    await deleteDoc(doc(db, 'mosques', String(mosqueId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTakazaToFirestore(
  takaza: TakazaEntry
): Promise<void> {
  const uid = requireUid();
  const path = `takazas/${takaza.id}`;
  try {
    await setDoc(doc(db, 'takazas', takaza.id), sanitizeTakazaPayload(takaza, uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTakazaFromFirestore(
  takazaId: string
): Promise<void> {
  requireUid();
  const path = `takazas/${takazaId}`;
  try {
    await deleteDoc(doc(db, 'takazas', takazaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveKargoojariToFirestore(
  entry: KargoojariEntry
): Promise<void> {
  const uid = requireUid();
  const path = `kargoojaris/${entry.id}`;
  try {
    await setDoc(
      doc(db, 'kargoojaris', entry.id),
      sanitizeKargoojariPayload(entry, uid)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteKargoojariFromFirestore(
  kargoojariId: string
): Promise<void> {
  requireUid();
  const path = `kargoojaris/${kargoojariId}`;
  try {
    await deleteDoc(doc(db, 'kargoojaris', kargoojariId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function submitAccessRequest(
  user: User,
  note: string,
  hasExistingRequest: boolean
): Promise<void> {
  const path = `accessRequests/${user.uid}`;
  const docRef = doc(db, 'accessRequests', user.uid);
  try {
    if (hasExistingRequest) {
      await updateDoc(docRef, {
        displayName: clip(user.displayName ?? '', 150),
        note: clip(note, 300),
        status: 'pending',
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        uid: user.uid,
        email: clip(user.email ?? '', 200),
        displayName: clip(user.displayName ?? '', 150),
        note: clip(note, 300),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      hasExistingRequest ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function grantEditorAccess(
  email: string,
  label: string,
  alreadyExists: boolean,
  requestUid?: string
): Promise<void> {
  const adminEmail = auth.currentUser?.email ?? '';
  const cleanEmail = clip(email.toLowerCase(), 200);
  const editorId = emailToDocId(cleanEmail);
  const path = `editors/${editorId}`;

  try {
    const batch = writeBatch(db);
    const editorRef = doc(db, 'editors', editorId);
    if (alreadyExists) {
      batch.update(editorRef, {
        label: clip(label, 120),
        active: true,
        grantedBy: clip(adminEmail, 200),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(editorRef, {
        email: cleanEmail,
        label: clip(label, 120),
        active: true,
        grantedBy: clip(adminEmail, 200),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    if (requestUid) {
      batch.update(doc(db, 'accessRequests', requestUid), {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleEditorActive(
  editorId: string,
  active: boolean
): Promise<void> {
  const adminEmail = auth.currentUser?.email ?? '';
  const path = `editors/${editorId}`;
  try {
    await updateDoc(doc(db, 'editors', editorId), {
      active,
      grantedBy: clip(adminEmail, 200),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function revokeEditorAccess(editorId: string): Promise<void> {
  const path = `editors/${editorId}`;
  try {
    await deleteDoc(doc(db, 'editors', editorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function rejectAccessRequest(requestUid: string): Promise<void> {
  const path = `accessRequests/${requestUid}`;
  try {
    await updateDoc(doc(db, 'accessRequests', requestUid), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAccessRequest(requestUid: string): Promise<void> {
  const path = `accessRequests/${requestUid}`;
  try {
    await deleteDoc(doc(db, 'accessRequests', requestUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
