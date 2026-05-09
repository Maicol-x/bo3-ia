export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar: string;
  created_at: Date;
}

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  avatar: string;
}

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthPayload {
  id: number;
  username: string;
  email: string;
  avatar: string;
}
