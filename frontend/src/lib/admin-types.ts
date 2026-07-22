export type AdminUser = {
  id: string;
  fullName: string;
  school: string;
  grade: '10' | '11';
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  items: AdminUser[];
  total: number;
  generatedAt: string;
};
