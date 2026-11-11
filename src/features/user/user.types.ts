export type UpdateProfileDto = {
  firstName: string;
  lastName: string;
  phone?: string | null;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export type UserResponse = {
  status: boolean;
  message: string;
};
