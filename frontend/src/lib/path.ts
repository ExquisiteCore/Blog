export const PATHS = {
  /** ************* SITE ****************** */
  SITE_HOME: "/",
  SITE_BLOG: "/blog",
  SITE_LABER: "/label",
  SITE_ABOUT: "/about",
  SITE_ECTOOLS: "/ectools",
  /** ************* AUTH ****************** */
  AUTH_SIGN_IN: "/auth",
  AUTH_REGISTER: "/register",
};

export const PATHS_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  [PATHS.SITE_BLOG]: "博客",
  [PATHS.SITE_LABER]: "标签",
  [PATHS.SITE_ABOUT]: "关于",
  [PATHS.SITE_ECTOOLS]: "工具箱",
  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
  [PATHS.AUTH_REGISTER]: "注册",
};

export const PATH_DESCRIPTION_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  [PATHS.SITE_BLOG]: "这里记录了我的想法、文章，希望和大家一起交流～",
  [PATHS.SITE_LABER]: "标签",
  [PATHS.SITE_ABOUT]: `叮～ 你有一份关于EC的简介，请查收～`,
  [PATHS.SITE_ECTOOLS]: "工具箱",
  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
  [PATHS.AUTH_REGISTER]: "注册",
};
