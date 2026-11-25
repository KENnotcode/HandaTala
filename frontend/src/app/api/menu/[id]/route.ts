import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type DocumentSnapshot } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebaseAdmin';
import { isAdminRequest } from '@/lib/adminAuth';
import { getErrorMessage } from '@/lib/apiError';
import type { MenuItem } from '@/types';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLLECTION = 'menu_items';

interface FormattedMenuDocument extends Partial<MenuItem> {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function formatTimestamp(value: unknown): string | null {
  if (
    typeof value === 'object'
    && value !== null
    && 'toDate' in value
    && typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === 'string' ? value : null;
}

function formatDoc(doc: DocumentSnapshot): FormattedMenuDocument | null {
  const data = doc.data() as (Partial<MenuItem> & {
    createdAt?: unknown;
    updatedAt?: unknown;
  }) | undefined;
  if (!data) return null;
  return {
    id: doc.id,
    ...data,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  image: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  preparationTime: z.number().int().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/menu/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const docRef = firestore.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Menu item not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: formatDoc(doc), error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('GET /api/menu/[id] error:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// PUT /api/menu/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: result.error.issues.map((issue) => issue.message).join(', ') },
        },
        { status: 400 }
      );
    }

    const docRef = firestore.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Menu item not found' } },
        { status: 404 }
      );
    }

    if (result.data.isFeatured === true && doc.data()?.isFeatured !== true) {
      const featuredItems = await firestore.collection(COLLECTION)
        .where('isFeatured', '==', true)
        .get();
      if (featuredItems.size >= 4) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: { code: 'FEATURED_LIMIT', message: 'You can only display 4 featured items.' },
          },
          { status: 400 }
        );
      }
    }

    const updates = {
      ...result.data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(updates, { merge: true });
    const updatedDoc = await docRef.get();

    return NextResponse.json({ success: true, data: formatDoc(updatedDoc), error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('PUT /api/menu/[id] error:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const docRef = firestore.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Menu item not found' } },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true, data: { deleted: true }, error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('DELETE /api/menu/[id] error:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
