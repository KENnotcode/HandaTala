import type { NextRequest } from 'next/server';
import { firebaseAuth, firestore } from '@/lib/firebaseAdmin';

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return false;
  }

  let uid: string;
  try {
    const token = await firebaseAuth.verifyIdToken(authorization.slice(7));
    uid = token.uid;
  } catch {
    return false;
  }

  const userDocument = await firestore.collection('users').doc(uid).get();
  return userDocument.data()?.role === 'admin';
}
