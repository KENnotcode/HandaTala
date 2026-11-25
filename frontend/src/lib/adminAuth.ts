import type { NextRequest } from 'next/server';
import { firebaseAuth, firestore } from '@/lib/firebaseAdmin';

export interface AuthenticatedUser {
  uid: string;
  role: string;
  name: string;
  email: string;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  let token;
  try {
    token = await firebaseAuth.verifyIdToken(authorization.slice(7));
  } catch {
    return null;
  }

  const userDocument = await firestore.collection('users').doc(token.uid).get();
  const userData = userDocument.data();
  if (!userData || typeof userData.role !== 'string') {
    return null;
  }

  const profileName = [userData.firstName, userData.middleName, userData.lastName]
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .join(' ');

  return {
    uid: token.uid,
    role: userData.role,
    name: profileName || (typeof userData.name === 'string' ? userData.name : '') || token.name || '',
    email: (typeof userData.email === 'string' ? userData.email : '') || token.email || '',
  };
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  return user?.role === 'admin';
}
