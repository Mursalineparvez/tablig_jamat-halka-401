# Security Specification — Halqa 401 Directory & Daily Reporting

## 1. Data Invariants
1. **Public Read for Halqa Content Only**: Anyone can read `/mosques`, `/takazas`, and `/kargoojaris`, while `/editors` and `/accessRequests` (containing user emails/UIDs) are strictly isolated from blanket reads.
2. **Verified Super Admin Authority**: Only `mdmursalineparvez@gmail.com` with `request.auth.token.email_verified == true` can create, update, or delete `/editors/{editorId}`, list `/editors`, list `/accessRequests`, or approve/reject requests.
3. **Editor Write Gate**: Content collections (`/mosques`, `/takazas`, `/kargoojaris`) can ONLY be created, updated, or deleted if `isSuperAdmin()` or `isApprovedEditor()` (where an active doc exists at `/editors/$(emailDocId(request.auth.token.email))`).
4. **Immutable Ownership & Timestamps**: `updatedBy` must equal `request.auth.uid`, `updatedAt` must equal `request.time`, and immutable fields (`id`, `createdAt`, `uid`, `email`) cannot change on update.
5. **No Shadow Fields or Unbounded Strings**: Every collection validates `keys().hasAll(...)` and `keys().hasOnly(...)` with strict `.size()` caps on every string and array.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Write**: Anonymous client `setDoc` on `/mosques/1` (`auth == null`).
2. **Signed-in Non-Editor Write**: Google-signed-in user not listed in `/editors` attempts `create` on `/kargoojaris/karg-evil`.
3. **Self-Elevation to Editor**: Regular signed-in user attempts `setDoc` on `/editors/their_at_gmail_dot_com` with `{ active: true }`.
4. **Email Spoofing Attack**: User with `token.email == 'mdmursalineparvez@gmail.com'` and `token.email_verified == false` attempts to write `/editors/x`.
5. **Shadow Ghost Field Injection**: Approved editor sends `{ ...validMosque, isAdminOverride: true }` on `/mosques/1`.
6. **UID Spoofing on Write**: Approved editor sets `updatedBy: 'another-uid'` instead of `request.auth.uid`.
7. **Client Clock Timestamp Forgery**: Approved editor sets `updatedAt: Timestamp.fromMillis(0)` instead of `serverTimestamp()`.
8. **ID Poisoning**: Approved editor creates `/takazas/bad$id..with..chars` violating `^[a-zA-Z0-9_\\-]+$`.
9. **Resource Exhaustion / Denial of Wallet**: Approved editor sends a 50KB `summary` (>15000) on `/kargoojaris/k1`.
10. **PII Blanket Read**: Signed-in non-admin calls `getDocs(collection(db, 'editors'))` or `getDocs(collection(db, 'accessRequests'))`.
11. **Access Request Auto-Approve**: Regular user creates `/accessRequests/{uid}` with `status: 'approved'` instead of `'pending'`.
12. **Immutable ID Mutation**: Approved editor updates `/takazas/t1` and changes `id` or `createdAt`.
