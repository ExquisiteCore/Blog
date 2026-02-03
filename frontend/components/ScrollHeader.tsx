'use client';

import { useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';

interface ScrollHeaderProps {
  children: ReactNode;
}

export default function ScrollHeader({ children }: ScrollHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(
    typeof window !== 'undefined' ? window.scrollY : 0
  );
  const [isAtTop, setIsAtTop] = useState(true);
  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('theme') || 'light'
      : 'light'
  );

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    // Check if at top of page
    if (currentScrollY < 10) {
      setIsAtTop(true);
      setIsVisible(true);
    } else {
      // Update at-top state if needed
      setIsAtTop(false);

      // Check scroll direction
      const isScrollingUp = currentScrollY < lastScrollYRef.current;

      if (isScrollingUp) {
        // Scrolling up - show header
        setIsVisible(true);
      } else {
        // Scrolling down - hide header after scrolling past threshold
        if (currentScrollY > 100) {
          setIsVisible(false);
        }
      }
    }

    // Update last scroll position
    lastScrollYRef.current = currentScrollY;
  }, []);

  // Listen for theme changes in localStorage
  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (typeof localStorage !== 'undefined' && e.key === 'theme') {
      setTheme(e.newValue || 'light');
    }
  }, []);

  useEffect(() => {
    // Listen for theme changes from other components
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);

  useEffect(() => {
    // Throttle scroll events using requestAnimationFrame
    let isThrottled = false;

    const onScroll = () => {
      if (!isThrottled) {
        requestAnimationFrame(() => {
          handleScroll();
          isThrottled = false;
        });
        isThrottled = true;
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      // Remove scroll event listener
      window.removeEventListener('scroll', onScroll);
    };
  }, [handleScroll]);

  // Theme-based background color class
  const bgColorClass = useMemo(() => {
    return theme === 'dark'
      ? 'bg-base-100/80 backdrop-blur-sm shadow-md'
      : 'bg-base-100/95 backdrop-blur-sm shadow-md';
  }, [theme]);

  return (
    <header
      className={`fixed top-0 z-50 w-full transform transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${!isAtTop ? bgColorClass : 'bg-base-100'}`}
    >
      {children}
    </header>
  );
}
