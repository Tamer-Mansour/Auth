export interface UserDetail {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
    phoneNumber: string;
    towFactorEnabled: boolean;
    phoneNumberConfirmed: boolean;
    accessFailedCount: number;
  }