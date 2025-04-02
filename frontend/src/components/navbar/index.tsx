"use client";

import { cn } from "@/lib/utils";
import { useScroll, useThrottle } from "ahooks";
import { NextLink } from "../next-link";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { PATHS, PATHS_MAP } from "@/lib/path"
import { ModeToggle } from "../mode-toggle"
import { Button } from "../ui/button";
import { IconBrandGithub } from "../icons/githubicon";
import { IconBrandBilibili } from "../icons/bilibiliicon";
import { UserCog, LogOut, PenLine } from "lucide-react";
import { AuthState } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = () => {
  const scroll = useScroll(() => document);
  const pathname = usePathname();
  const [previousScrollTop, setPreviousScrollTop] = React.useState(0);
  const throttledPreviousScrollTop = useThrottle(previousScrollTop, {
    wait: 500,
  });
  const [isHideHeader, setIsHideHeader] = React.useState(false);
  const throttledIsHideHeader = useThrottle(isHideHeader, { wait: 500 });
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [authState, setAuthState] = React.useState<AuthState | null>(null);

  // 处理退出登录
  const handleLogout = () => {
    // 清除localStorage中的auth数据
    localStorage.removeItem("auth");
    // 重置状态
    setIsLoggedIn(false);
    setAuthState(null);
  };

  // 检查用户是否已登录
  React.useEffect(() => {
    // 在客户端检查localStorage
    if (typeof window !== "undefined") {
      const authData = localStorage.getItem("auth");
      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData) as AuthState;
          setAuthState(parsedAuth);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Failed to parse auth data:", error);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    }
  }, []);

  React.useEffect(() => {
    const _top = scroll?.top ?? 0;

    if (_top - throttledPreviousScrollTop < 0) {
      // 向上滚动时，显示导航栏
      setIsHideHeader(false);
    } else {
      setIsHideHeader(true);
    }

    if (_top) {
      setPreviousScrollTop(_top);
    }
  }, [scroll?.top, throttledPreviousScrollTop]);
  // 判断是否为首页，只有首页使用fixed定位，其他页面使用sticky定位
  const isHomePage = pathname === PATHS.SITE_HOME;

  return (
    <header
      className={cn(
        "w-full backdrop-blur transition-all border-x-0 flex justify-center z-50",
        // 根据是否为首页应用不同的定位样式
        isHomePage ? "fixed top-0" : "sticky top-0",
        throttledPreviousScrollTop > 60 &&
        "bg-background/50 border-b border-border/50",
        {
          "-translate-y-20":
            throttledPreviousScrollTop > 300 ? throttledIsHideHeader : false,
        },
      )}>
      <div className="flex h-16 w-full items-center p-4 sm:p-8 md:max-w-screen-md 2xl:max-w-screen-xl">
        <NextLink
          href="/"
          className={cn("mr-4 hidden sm:flex")}
          aria-label="ExquisiteCore"
        >
          <span className="ml-2 text-base font-semibold text-primary">
            {"EC"}
          </span>
        </NextLink>
        <div className="mr-8 hidden h-16 flex-1 items-center justify-end text-base font-medium sm:flex">
          {navItems.map((el) => (
            <Link
              href={el.link}
              key={el.link}
              className={cn(
                "font-normal text-sm text-muted-foreground transition-colors px-4 py-2",
                "hover:font-semibold hover:text-primary ",
                pathname === el.link && "font-semibold text-primary",
              )}
            >
              {el.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">

          <ModeToggle />

          <Link
            href="https://github.com/ExquisiteCore"
            target="_blank"
            title="https://github.com/ExquisiteCore"
            aria-label="https://github.com/ExquisiteCore"
          >
            <Button variant="outline" size={"icon"} aria-label="Github Icon">
              <IconBrandGithub className="text-base" />
            </Button>
          </Link>

          <Link
            href="https://space.bilibili.com/453875890"
            target="_blank"
            title="https://space.bilibili.com/453875890"
            aria-label="https://space.bilibili.com/453875890"
          >
            <Button variant="outline" size={"icon"} aria-label="BiliBili Icon">
              <IconBrandBilibili className="text-base" />
            </Button>
          </Link>

          <Link
            href={PATHS.SITE_MARKDOWN}
            rel="nofollow"
            title="写作"
            aria-label={PATHS.SITE_MARKDOWN}
          >
            <Button variant="outline" size={"icon"} aria-label="写作">
              <PenLine className="size-4" />
            </Button>
          </Link>

          {isLoggedIn && authState?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size={"icon"}
                  aria-label="用户头像"
                  title={authState.user.username || "已登录"}
                  className="overflow-hidden p-0"
                >
                  {authState.user.avatar_url ? (
                    <img
                      src={authState.user.avatar_url}
                      alt="用户头像"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 头像加载失败时显示默认图标
                        e.currentTarget.style.display = "none";
                        const iconElement = document.createElement("span");
                        iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
                        iconElement.className = "flex items-center justify-center w-full h-full";
                        e.currentTarget.parentNode?.appendChild(iconElement);
                      }}
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full">
                      <UserCog className="size-4" />
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={PATHS.AUTH_SIGN_IN}
              rel="nofollow"
              title="登录"
              aria-label={PATHS.AUTH_SIGN_IN}
            >
              <Button variant="outline" size={"icon"} aria-label="登录">
                <UserCog className="size-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export const navItems: {
  label?: string;
  link: string;
  external?: boolean;
}[] = [
    {
      label: PATHS_MAP[PATHS.SITE_HOME],
      link: PATHS.SITE_HOME,
    },
    {
      label: PATHS_MAP[PATHS.SITE_BLOG],
      link: PATHS.SITE_BLOG,
    },
    {
      label: PATHS_MAP[PATHS.SITE_LABER],
      link: PATHS.SITE_LABER,
    },
    {
      label: PATHS_MAP[PATHS.SITE_ABOUT],
      link: PATHS.SITE_ABOUT,
    },
    {
      label: PATHS_MAP[PATHS.SITE_ECTOOLS],
      link: PATHS.SITE_ECTOOLS,
    }
  ];