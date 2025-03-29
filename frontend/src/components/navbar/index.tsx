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
import { UserCog } from "lucide-react";

export const Navbar = () => {
  const scroll = useScroll(() => document);
  const pathname = usePathname();
  const [previousScrollTop, setPreviousScrollTop] = React.useState(0);
  const throttledPreviousScrollTop = useThrottle(previousScrollTop, {
    wait: 500,
  });
  const [isHideHeader, setIsHideHeader] = React.useState(false);
  const throttledIsHideHeader = useThrottle(isHideHeader, { wait: 500 });

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
  return (
    <header
      className={cn(
        "w-full sticky top-0 backdrop-blur transition-all border-x-0  flex justify-center z-10",
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
            href={PATHS.AUTH_SIGN_IN}
            target="_blank"
            rel="nofollow"
            title="登录"
            aria-label={PATHS.AUTH_SIGN_IN}
          >
            <Button variant="outline" size={"icon"} aria-label="登录">
              <UserCog className="size-4" />
            </Button>
          </Link>
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
      label: PATHS_MAP[PATHS.SITE_SNIPPET],
      link: PATHS.SITE_SNIPPET,
    },
    {
      label: PATHS_MAP[PATHS.SITE_ABOUT],
      link: PATHS.SITE_ABOUT,
    },
  ];