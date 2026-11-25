'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Camera, CheckCircle, Clock, Lock, Mail, Phone, ShoppingBag, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { formatDate, formatPrice } from '@/utils/format';
import { Order } from '@/types';

const NAME_PATTERN = /^[\p{L} .'-]+$/u;
const PHONE_PATTERN = /^(09\d{9}|\+639\d{9})$/;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function resizePhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error('Could not process the selected image.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(image.naturalWidth, image.naturalHeight);
        const startX = (image.naturalWidth - size) / 2;
        const startY = (image.naturalHeight - size) / 2;
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not prepare the image.'));
          return;
        }
        context.drawImage(image, startX, startY, size, size, 0, 0, 512, 512);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not compress the selected image.'));
        }, 'image/jpeg', 0.85);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<{ blob: Blob; preview: string } | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    const names = user.firstName && user.lastName ? user : splitName(user.name);
    // Populate editable fields when the authenticated profile becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFirstName(names.firstName || '');
    setMiddleName(names.middleName || '');
    setLastName(names.lastName || '');
    setPhone(user.phone || '');
    setPhotoURL(user.photoURL || '');
    setIsLoadingOrders(true);
    authService.getUserOrders()
      .then((result) => {
        if (result.success && result.data) setOrders(result.data);
      })
      .catch(() => setMessage({ type: 'error', text: 'Unable to load order history.' }))
      .finally(() => setIsLoadingOrders(false));
  }, [user]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" /></div>;
  }

  const currentPhoto = pendingPhoto?.preview || (removePhoto ? '' : photoURL);
  const initial = (firstName.charAt(0) || user.name.charAt(0) || user.email.charAt(0)).toUpperCase();
  const busy = isSaving || isChangingPassword;

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please choose a JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: 'Profile images must be 5 MB or smaller.' });
      return;
    }
    try {
      const blob = await resizePhoto(file);
      setPendingPhoto({ blob, preview: URL.createObjectURL(blob) });
      setRemovePhoto(false);
      setMessage(null);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not process the image.' });
    }
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const first = firstName.trim();
    const middle = middleName.trim();
    const last = lastName.trim();
    const contact = phone.trim();
    if (!first || !last) return setMessage({ type: 'error', text: 'First name and last name are required.' });
    if ([first, middle, last].some((value) => value.length > 50 || (value && !NAME_PATTERN.test(value)))) {
      return setMessage({ type: 'error', text: 'Names may contain letters, spaces, hyphens, apostrophes, and periods (max 50 characters).' });
    }
    if (!contact) {
      return setMessage({ type: 'error', text: 'Mobile number is required.' });
    }
    if (!PHONE_PATTERN.test(contact)) {
      return setMessage({ type: 'error', text: 'Use a Philippine mobile number such as 09171234567 or +639171234567.' });
    }

    setIsSaving(true);
    setMessage(null);
    let uploadedPhoto = '';
    try {
      if (pendingPhoto) {
        const upload = await authService.uploadProfilePhoto(pendingPhoto.blob, user.id, setPhotoProgress);
        if (!upload.success || !upload.data) throw new Error(upload.error?.message || 'Failed to upload profile photo.');
        uploadedPhoto = upload.data;
      }
      const nextPhoto = removePhoto ? '' : uploadedPhoto || photoURL;
      const result = await useAuthStore.getState().updateProfile({
        firstName: first,
        middleName: middle,
        lastName: last,
        name: [first, middle, last].filter(Boolean).join(' '),
        phone: contact,
        photoURL: nextPhoto,
      });
      if (!result.success) {
        if (uploadedPhoto) await authService.deleteProfilePhoto(uploadedPhoto);
        throw new Error(result.message);
      }
      if (removePhoto && photoURL) await authService.deleteProfilePhoto(photoURL);
      if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.preview);
      setPhotoURL(nextPhoto);
      setPendingPhoto(null);
      setRemovePhoto(false);
      setPhotoProgress(0);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return setMessage({ type: 'error', text: 'Complete all password fields.' });
    if (newPassword.length < 8) return setMessage({ type: 'error', text: 'The new password must be at least 8 characters.' });
    if (newPassword !== confirmPassword) return setMessage({ type: 'error', text: 'Password confirmation does not match.' });
    setIsChangingPassword(true);
    setMessage(null);
    const result = await useAuthStore.getState().changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);
    if (!result.success) {
      setMessage({ type: 'error', text: result.message });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Password changed successfully.' });
  };

  const handleSignOut = async () => {
    await useAuthStore.getState().logout();
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><ArrowLeft className="h-5 w-5" /><span>Back to Home</span></Link>
          <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account information.</p></div>
        {message && <div role="status" aria-live="polite" className={`flex items-center gap-2 rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>{message.type === 'success' && <CheckCircle className="h-4 w-4" />}{message.text}</div>}

        <form onSubmit={handleSaveProfile} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-amber-600 text-4xl font-bold uppercase text-white">
                {currentPhoto ? <Image src={currentPhoto} alt="Profile photo preview" width={112} height={112} unoptimized className="h-full w-full object-cover" /> : initial}
              </div>
              <button type="button" aria-label="Change profile photo" onClick={() => fileInputRef.current?.click()} disabled={busy} className="absolute bottom-0 right-0 rounded-full bg-amber-600 p-2 text-white shadow focus:outline-none focus:ring-2 focus:ring-amber-500"><Camera className="h-4 w-4" /></button>
            </div>
            <div className="text-center sm:text-left"><h2 className="font-semibold text-gray-900 dark:text-white">{user.name}</h2><p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG, or WebP up to 5 MB</p><div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start"><Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={busy}>Change photo</Button>{(currentPhoto || photoURL) && <Button type="button" variant="ghost" size="sm" onClick={() => { setRemovePhoto(true); setPendingPhoto(null); }} disabled={busy} leftIcon={<Trash2 className="h-4 w-4" />}>Remove photo</Button>}</div></div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" />
          </div>
          {isSaving && pendingPhoto && <p className="text-sm text-gray-600 dark:text-gray-400">Uploading photo: {Math.round(photoProgress)}%</p>}

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={50} required disabled={busy} />
            <Input label="Middle name (optional)" value={middleName} onChange={(event) => setMiddleName(event.target.value)} maxLength={50} disabled={busy} />
            <Input label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={50} required disabled={busy} />
          </div>
          <Input
            label="Mobile number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="09171234567"
            disabled={busy}
            required
            pattern="^(09\d{9}|\+639\d{9})$"
            leftIcon={<Phone className="h-4 w-4" />}
          />
          <Button type="submit" isLoading={isSaving}>Save profile</Button>
        </form>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Account details</h2>
          <div className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-gray-500">Email</p><p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white"><Mail className="h-4 w-4 text-gray-400" />{user.email}</p></div><div><p className="text-xs text-gray-500">Role</p><p className="mt-1 text-sm capitalize text-gray-900 dark:text-white">{user.role}</p></div><div><p className="text-xs text-gray-500">Created</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{user.createdAt ? formatDate(user.createdAt, 'full') : 'Not available'}</p></div></div>
        </section>

        <form onSubmit={handleChangePassword} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"><Lock className="h-5 w-5 text-amber-600" />Change password</h2>
          <div className="grid gap-4 sm:grid-cols-3"><Input label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={busy} autoComplete="current-password" required /><Input label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={busy} autoComplete="new-password" minLength={8} required /><Input label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={busy} autoComplete="new-password" minLength={8} required /></div>
          <Button type="submit" variant="outline" isLoading={isChangingPassword}>Change password</Button>
        </form>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"><ShoppingBag className="h-5 w-5 text-amber-600" />Order history</h2>
          {isLoadingOrders ? <p className="text-sm text-gray-500">Loading orders...</p> : orders.length === 0 ? <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600"><Clock className="mx-auto mb-2 h-8 w-8 text-gray-400" /><p className="text-sm text-gray-500 dark:text-gray-400">No orders found.</p></div> : <div className="space-y-3">{orders.map((order) => <Link href={`/order/${order.trackingId}`} key={order.id} className="block rounded-lg border border-gray-200 p-4 hover:border-amber-500 dark:border-gray-700"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium text-gray-900 dark:text-white">{formatDate(order.createdAt)}</span><span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{formatPrice(order.total)}</span></div><p className="mt-1 text-sm text-gray-500">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}</p><p className="mt-2 text-xs capitalize text-gray-500">{order.orderStatus}</p></Link>)}</div>}
        </section>
      </main>
    </div>
  );
}
