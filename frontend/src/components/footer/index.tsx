import * as React from "react";

import { Wrapper } from "../wrapper";

export const Footer = () => {
  return (
    <footer className="px-6 py-12">
      <Wrapper className="flex flex-col items-center justify-center space-y-1 pt-24 text-sm text-muted-foreground md:flex-row md:space-x-4 md:space-y-0">
        <div className="order-3">
          &copy; {new Date().getFullYear()} {"ExquisiteCore"}&nbsp;&nbsp;·&nbsp;&nbsp;
          {"精致的芯"}
        </div>
      </Wrapper>
    </footer>
  );
};
