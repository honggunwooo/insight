export interface User {
  id?: number;
  email: string;
  password: string;
  nickname?: string;
  profile_image?: string | null;
  created_at?: Date;
}
