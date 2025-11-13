export interface User {
  id?: number;
  email: string;
  password: string;
  nickname?: string;
  created_at?: Date;
}