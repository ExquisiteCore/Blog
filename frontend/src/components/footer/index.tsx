import * as React from "react";

import { Wrapper } from "../wrapper";

export const Footer = () => {
  return (
    <footer className="px-6 py-12 bg-slate-50">
      <Wrapper className="flex flex-col items-center justify-center space-y-4 pt-24 text-sm text-muted-foreground">
        <div className="text-2xl font-semibold mb-4">This - 精致的芯的个人博客</div>
        <div>Email: xiaolongqq1y@163.com</div>
        <div>Copyright © 2022-{new Date().getFullYear()} ExquisiteCore All Rights Reserved</div>
      </Wrapper>
    </footer>
  );
};