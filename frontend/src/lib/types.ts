// 定义API响应的类型接口

import { UUID } from "crypto";

// 用户信息接口
export interface User {
  avatar_url: string;
  email: string;
  id: UUID;
  username: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: User;
}

// 认证状态接口，用于localStorage存储
export interface AuthState {
  token: string;
  user: User;
}

// 标签接口
export interface Label {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  created_at: number[];
  updated_at: number[];
}

export interface Post {
  id: UUID;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string;
  published: boolean;
  author_id: UUID;
  created_at: number[];
  updated_at: number[];
  published_at: number[];
}
