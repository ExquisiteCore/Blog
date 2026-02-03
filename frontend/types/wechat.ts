/**
 * 微信公众号 API 类型定义
 *
 * 根据后端 wechatapi.rs 定义的 TypeScript 类型
 */

// ==================== 粉丝相关 ====================

/** 微信用户信息 (对应后端 get_user_info / batch_get_user_info 响应) */
export interface WechatUser {
  subscribe?: number;
  openid: string;
  language?: string;
  subscribe_time?: number;
  unionid?: string;
  remark?: string;
  groupid?: number;
  tagid_list?: number[];
  subscribe_scene?: string;
  qr_scene?: number;
  qr_scene_str?: string;
  // 以下字段在 batch_get_user_info 时可能包含
  nickname?: string;
  sex?: number;
  city?: string;
  province?: string;
  country?: string;
  headimgurl?: string;
}

/** 粉丝列表响应 (对应后端 get_user_list) */
export interface UserListResponse {
  total: number;
  count: number;
  data: string[] | null;  // 后端返回 openid 数组
  next_openid: string | null;
}

/** 批量获取用户信息请求 */
export interface BatchGetUserInfoRequest {
  openids: string[];
  lang?: string;
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

/** 创建标签响应 (后端直接返回 { id, name }) */
export interface CreateTagResponse {
  id: number;
  name: string;
}

/** 更新标签请求 */
export interface UpdateTagRequest {
  id: number;  // 后端是 i32
  name: string;
}

/** 删除标签请求 */
export interface DeleteTagRequest {
  id: number;  // 后端是 i32
}

/** 获取标签下用户响应 */
export interface GetUsersByTagResponse {
  count: number;
  data: string[] | null;  // openid 数组
  next_openid: string | null;
}

/** 批量打标签请求 */
export interface BatchTagUsersRequest {
  openids: string[];
  tag_id: number;  // 后端是 i32
}

/** 获取用户标签响应 */
export interface GetUserTagsResponse {
  tagid_list: number[];
}

// ==================== 菜单相关 ====================

/** 菜单按钮 (对应后端 MenuButtonRequest) */
export interface MenuButton {
  type?: string;
  name: string;
  key?: string;
  url?: string;
  media_id?: string;
  article_id?: string;
  appid?: string;
  pagepath?: string;
  sub_button?: MenuButton[];
}

/** 菜单 */
export interface Menu {
  button: MenuButton[];
}

/** 个性化菜单匹配规则 */
export interface MatchRule {
  tag_id?: string;
  client_platform_type?: string;
}

/** 个性化菜单 */
export interface ConditionalMenu {
  button: MenuButton[];
  matchrule: MatchRule;
  menuid?: number;
}

/** 获取菜单响应 */
export interface GetMenuResponse {
  menu?: Menu;
  conditionalmenu?: ConditionalMenu[];
}

/** 创建菜单请求 (注意后端字段是 buttons 不是 button) */
export interface CreateMenuRequest {
  buttons: MenuButton[];
}

/** 创建个性化菜单请求 */
export interface CreateConditionalMenuRequest {
  buttons: MenuButton[];
  matchrule: MatchRule;
}

/** 创建个性化菜单响应 */
export interface CreateConditionalMenuResponse {
  menuid: number;
}

/** 删除个性化菜单请求 */
export interface DeleteConditionalMenuRequest {
  menuid: number;
}

/** 测试个性化菜单匹配请求 */
export interface TryMatchMenuRequest {
  user_id: string;
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
  primary_industry: IndustryClass;
  secondary_industry: IndustryClass;
}

/** 设置行业请求 */
export interface SetIndustryRequest {
  industry_id1: string;
  industry_id2: string;
}

/** 添加模板请求 */
export interface AddTemplateRequest {
  template_id_short: string;
}

/** 添加模板响应 */
export interface AddTemplateResponse {
  template_id: string;
}

/** 小程序跳转配置 */
export interface MiniProgram {
  appid: string;
  pagepath?: string;
}

/** 模板数据项 */
export interface TemplateDataItem {
  value: string;
  color?: string;
}

/** 发送模板消息请求 */
export interface SendTemplateRequest {
  touser: string;
  template_id: string;
  url?: string;
  miniprogram?: MiniProgram;
  data: Record<string, TemplateDataItem>;
  client_msg_id?: string;
}

/** 发送模板消息响应 */
export interface SendTemplateResponse {
  success: boolean;
  msgid: number;
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

/** 设置输入状态请求 */
export interface SetTypingRequest {
  touser: string;
  typing: boolean;
}

// ==================== 二维码相关 ====================

/** 二维码类型 */
export type QrCodeAction = 'temporary' | 'permanent' | 'temporary_str' | 'permanent_str';

/** 创建二维码请求 */
export interface CreateQrcodeRequest {
  scene_id?: number;
  scene_str?: string;
  action: QrCodeAction;
  expire_seconds?: number;
}

/** 创建二维码响应 */
export interface CreateQrcodeResponse {
  ticket: string;
  expire_seconds?: number;
  url: string;
  qrcode_url: string;
}

/** 长链接转短链接请求 */
export interface CreateShortUrlRequest {
  long_url: string;
}

/** 长链接转短链接响应 */
export interface CreateShortUrlResponse {
  short_url: string;
}

// ==================== 通用响应 ====================

/** 成功响应 */
export interface WechatSuccessResponse {
  success: boolean;
  message: string;
}
