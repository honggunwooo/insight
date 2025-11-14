export interface User {
  id?: number;
  email: string;
  password: string;
  nickname?: string;
  profile_image?: string | null;
  location?: string | null;
  bio?: string | null;
  interests?: string | null;
  created_at?: Date;
}
