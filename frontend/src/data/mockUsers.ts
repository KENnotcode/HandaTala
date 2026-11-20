import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: 'Admin User',
    email: 'admin@handatala.test',
    role: 'admin',
  },
  {
    id: 'user-002',
    name: 'Kitchen Staff',
    email: 'kitchen@handatala.test',
    role: 'kitchen',
  },
];

export const mockAdminCredentials = {
  email: 'admin@handatala.test',
  password: 'admin123',
};