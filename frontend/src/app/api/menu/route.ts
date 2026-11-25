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
  availableStock: number;
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

// Helper to convert Firestore timestamps & documents
function formatDoc(doc: DocumentSnapshot): FormattedMenuDocument | null {
  const data = doc.data() as (Partial<MenuItem> & {
    createdAt?: unknown;
    updatedAt?: unknown;
  }) | undefined;
  if (!data) return null;
  const stock = typeof data.stock === 'number' && Number.isFinite(data.stock) ? data.stock : 0;
  const publicData = { ...data };
  delete (publicData as { reservedStock?: unknown }).reservedStock;
  return {
    id: doc.id,
    ...publicData,
    availableStock: stock,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

// Zod schema for validation
const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be >= 0'),
  costPrice: z.number().min(0, 'Cost price must be >= 0'),
  image: z.string().optional().default('/images/placeholder.jpg'),
  stock: z.number().int().min(0, 'Stock must be integer >= 0').optional().default(50),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  isAvailable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  preparationTime: z.number().int().min(0).optional().default(10),
});

// GET /api/menu (all items, with optional ?category= and ?featured=true)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryQuery = searchParams.get('category');
    const featuredQuery = searchParams.get('featured');

    const snapshot = await firestore.collection(COLLECTION).get();
    let items = snapshot.docs.map(formatDoc);

    if (categoryQuery) {
      const lowerCat = categoryQuery.toLowerCase();
      items = items.filter(
        (item) => item && item.category && item.category.toLowerCase() === lowerCat
      );
    }

    if (featuredQuery === 'true') {
      items = items.filter((item) => item && item.isFeatured === true);
    }

    return NextResponse.json({ success: true, data: items, error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('GET /api/menu error:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// POST /api/menu (create item)
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = menuItemSchema.safeParse(body);

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

    const data = result.data;
    if (data.isFeatured) {
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

    const colRef = firestore.collection(COLLECTION);
    
    // Generate new id if none in body
    const customId = body.id || `food-${Date.now()}`;
    const docRef = colRef.doc(customId);

    const now = FieldValue.serverTimestamp();
    const newDoc = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newDoc);
    const saved = await docRef.get();

    return NextResponse.json({ success: true, data: formatDoc(saved), error: null }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/menu error:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'INTERNAL_ERROR', message: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
