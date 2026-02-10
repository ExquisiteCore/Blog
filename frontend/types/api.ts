/**
 * API 类型定义
 *
 * 与后端 Rust 模型对应的 TypeScript 类型
 */

// ==================== 统一响应格式 ====================

/** 后端统一响应包装 */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  data?: T;
  message?: string;
}

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

/** 更新用户请求 */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
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

/** 更新标签请求 */
export interface UpdateLabelRequest {
  name?: string;
  slug?: string;
  description?: string;
}

// ==================== 文章相关 ====================

/** 文章摘要（列表用） */
export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_images: string[] | null;
  published: boolean;
  view_count: number;
  comment_count: number;
  like_count: number;
  author_id: string;
  labels: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 文章详情 */
export interface PostDetail {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  rendered_html: string | null;
  toc: TocItem[] | null;
  cover_images: string[] | null;
  published: boolean;
  view_count: number;
  comment_count: number;
  like_count: number;
  author_id: string;
  labels: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 目录项 */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** 创建文章请求 */
export interface CreatePostRequest {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  cover_images?: string[];
  published?: boolean;
  labels?: string[];
}

/** 更新文章请求 */
export interface UpdatePostRequest {
  title?: string;
  slug?: string;
  content?: string;
  summary?: string;
  cover_images?: string[];
  published?: boolean;
  labels?: string[];
}

/** 通用成功响应 */
export interface SuccessResponse {
  success: boolean;
}

// ==================== 评论相关 ====================

/** 评论 */
export interface Comment {
  id: string;
  content: string;
  parent_id: string | null;
  identity_id: string;
  is_deleted: boolean;
  created_at: string;
}

/** 创建评论请求 */
export interface CreateCommentRequest {
  content: string;
  parent_id?: string;
}

// ==================== 点赞相关 ====================

/** 点赞状态 */
export interface LikeStatus {
  liked: boolean;
  like_count: number;
}

// ==================== 身份相关 ====================

/** 当前身份信息 */
export interface MeResponse {
  authenticated: boolean;
  id?: string;
  username?: string;
  role?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  anonymous_id?: string;
}

// ==================== 通用 ====================

/** API 错误响应 */
export interface ApiError {
  statusCode: number;
  message?: string;
}

/** 图片上传响应 */
export interface ImageUploadResponse {
  status: boolean;
  data: {
    links: {
      markdown: string;
      html?: string;
      url?: string;
    };
  };
}
