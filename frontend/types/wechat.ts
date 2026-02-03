/**
 * 微信公众号 API 类型定义
 *
 * 与后端微信 API 对应的 TypeScript 类型
 */

// ==================== 粉丝相关 ====================

/** 微信用户信息 */
export interface WechatUser {
  openid: string;
  nickname?: string;
  sex?: number;
  city?: string;
  province?: string;
  country?: string;
  headimgurl?: string;
  subscribe_time?: number;
  remark?: string;
  tagid_list?: number[];
}

/** 粉丝列表响应 */
export interface UserListResponse {
  total: number;
  count: number;
  data: { openid: string[] };
  next_openid: string;
}

/** 批量获取用户信息响应 */
export interface BatchUserInfoResponse {
  user_info_list: WechatUser[];
}

/** 设置用户备注请求 */
export interface SetUserRemarkRequest {
  openid: string;
  remark: string;
}

// ==================== 粉丝标签相关 ====================

/** 微信标签 */
export interface WechatTag {
  id: number;
  name: string;
  count?: number;
}

/** 获取标签列表响应 */
export interface TagListResponse {
  tags: WechatTag[];
}

/** 创建标签请求 */
export interface CreateTagRequest {
  name: string;
}

/** 创建标签响应 */
export interface CreateTagResponse {
  tag: WechatTag;
}

/** 更新标签请求 */
export interface UpdateTagRequest {
  id: number;
  name: string;
}

/** 删除标签请求 */
export interface DeleteTagRequest {
  id: number;
}

/** 批量打标签请求 */
export interface BatchTagUsersRequest {
  openid_list: string[];
  tagid: number;
}

// ==================== 菜单相关 ====================

/** 菜单按钮 */
export interface MenuButton {
  type?: string;
  name: string;
  key?: string;
  url?: string;
  appid?: string;
  pagepath?: string;
  media_id?: string;
  sub_button?: MenuButton[];
}

/** 菜单 */
export interface Menu {
  button: MenuButton[];
}

/** 获取菜单响应 */
export interface GetMenuResponse {
  menu?: Menu;
}

// ==================== 模板消息相关 ====================

/** 模板 */
export interface Template {
  template_id: string;
  title: string;
  primary_industry?: string;
  deputy_industry?: string;
  content?: string;
  example?: string;
}

/** 获取模板列表响应 */
export interface TemplateListResponse {
  template_list: Template[];
}

/** 行业分类 */
export interface IndustryClass {
  first_class: string;
  second_class: string;
}

/** 行业信息 */
export interface Industry {
  primary_industry?: IndustryClass;
  secondary_industry?: IndustryClass;
}

/** 模板数据项 */
export interface TemplateDataItem {
  value: string;
  color?: string;
}

/** 发送模板消息请求 */
export interface SendTemplateRequest {
  template_id: string;
  touser: string;
  url?: string;
  miniprogram?: {
    appid: string;
    pagepath?: string;
  };
  data: Record<string, TemplateDataItem>;
}

/** 删除模板请求 */
export interface DeleteTemplateRequest {
  template_id: string;
}

// ==================== 客服消息相关 ====================

/** 发送文本消息请求 */
export interface SendTextRequest {
  touser: string;
  content: string;
}

/** 发送图片消息请求 */
export interface SendImageRequest {
  touser: string;
  media_id: string;
}

/** 发送语音消息请求 */
export interface SendVoiceRequest {
  touser: string;
  media_id: string;
}

/** 发送视频消息请求 */
export interface SendVideoRequest {
  touser: string;
  media_id: string;
  thumb_media_id: string;
  title?: string;
  description?: string;
}

/** 图文消息项 */
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  picurl: string;
}

/** 发送图文消息请求 */
export interface SendNewsRequest {
  touser: string;
  articles: NewsArticle[];
}

// ==================== 二维码相关 ====================

/** 创建二维码请求 */
export interface CreateQrcodeRequest {
  action_name: 'QR_SCENE' | 'QR_STR_SCENE' | 'QR_LIMIT_SCENE' | 'QR_LIMIT_STR_SCENE';
  expire_seconds?: number;
  action_info: {
    scene: {
      scene_id?: number;
      scene_str?: string;
    };
  };
}

/** 创建二维码响应 */
export interface CreateQrcodeResponse {
  ticket: string;
  expire_seconds?: number;
  url: string;
}
