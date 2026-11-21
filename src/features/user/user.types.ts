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


export type ChangePasswordData = {
  otherSessionsEnded: number;
};

export type ChangePasswordResponse = {
  status: boolean;
  code: string;
  message: string;
  data: ChangePasswordData;
};



