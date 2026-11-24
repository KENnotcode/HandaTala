import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import { getErrorMessage } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLLECTION = 'menu_items';

export async function GET() {
  try {
    const snapshot = await firestore.collection(COLLECTION).get();
    const categoriesSet = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categoriesSet.add(data.category);
      }
    });

    const categories = Array.from(categoriesSet).map((name) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      displayName: name,
    }));

    return NextResponse.json({ success: true, data: categories, error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
