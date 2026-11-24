import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import path from 'node:path';

/**
 * Seed script — writes every item from the existing mockMenu data to Firestore.
 * Safe to re-run: uses set() (not create()), so existing documents are overwritten.
 *
 * Run with:  npx tsx --env-file=.env.local src/db/seed.ts
 */

// ── Load env vars from .env.local ─────────────────────────────────────
config({ path: path.resolve(process.cwd(), '.env.local') });

// ── Init Firebase Admin (standalone — not using the shared lib because
//    that file imports "server-only" which is a Next.js-only package) ───

function initFirebase() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyEnv) {
    throw new Error(
      'Missing Firebase env vars. Make sure .env.local has ' +
        'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
  }

  const privateKey = privateKeyEnv.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

// ── Import mock data ──────────────────────────────────────────────────
// We rely on tsx + tsconfig paths to resolve the @/ alias.
import { mockMenuItems } from '@/data/mockMenu';

// ── Seed ──────────────────────────────────────────────────────────────

async function seed() {
  const app = initFirebase();
  const db = getFirestore(app);
  const col = db.collection('menu_items');
  const now = FieldValue.serverTimestamp();

  console.log(`🌱 Seeding ${mockMenuItems.length} menu items to Firestore …`);

  // Firestore batched writes: max 500 ops per batch (we have 30, so one batch).
  const batch = db.batch();

  for (const item of mockMenuItems) {
    const docRef = col.doc(item.id);
    batch.set(docRef, {
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      costPrice: item.costPrice,
      image: item.image,
      stock: item.stock,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      preparationTime: item.preparationTime,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();

  // Verify count
  const snapshot = await col.get();
  console.log(
    `✅ Done — ${snapshot.size} documents in menu_items (expected ${mockMenuItems.length})`,
  );
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
