/**
 * API 类型定义
 *
 * 与后端 Rust 模型对应的 TypeScript 类型
 */

// ==================== 用户相关 ====================

/** 用户角色 */
export type UserRole = 'admin' | 'user';

/** 用户信息 */
export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/** 登录请求 */
export interface LoginRequest {
  username_or_email: string;
  password: string;
}

/** 登录响应 */
export interface LoginResponse {
  user: User;
  token: string;
}

/** 注册请求 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

// ==================== 标签相关 ====================

/** 标签 */
export interface Label {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** 创建标签请求 */
export interface CreateLabelRequest {
  name: string;
  slug: string;
  description?: string;
}

// ==================== 文章相关 ====================

/** 文章详情 */
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/** 文章详情（包含标签） */
export interface PostWithLabels extends Post {
  labels: string[];
}

/** 文章摘要（不含 content） */
export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/** 文章摘要（包含标签） */
export interface PostSummaryWithLabels extends PostSummary {
  labels: string[];
}

/** 创建文章请求 */
export interface CreatePostRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  published: boolean;
  author_id: string;
  labels?: string[];
}

// ==================== 评论相关 ====================

/** 评论 */
export interface Comment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

/** 创建评论请求 */
export interface CreateCommentRequest {
  content: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
}

// ==================== 通用响应 ====================

/** API 错误响应 */
export interface ApiError {
  message: string;
  error_type?: string;
}
