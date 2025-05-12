import { createSignal, createEffect, onCleanup, onMount } from "solid-js";

export default function ScrollHeader(props) {
  const [isVisible, setIsVisible] = createSignal(true);
  const [lastScrollY, setLastScrollY] = createSignal(0);
  const [isAtTop, setIsAtTop] = createSignal(true);
  
  // Handle scroll events with debounce
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // Check if at top of page
    if (currentScrollY < 10) {
      setIsAtTop(true);
      setIsVisible(true);
    } else {
      // Update at-top state if needed
      if (isAtTop()) {
        setIsAtTop(false);
      }
      
      // Check scroll direction
      const isScrollingUp = currentScrollY < lastScrollY();
      
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
    setLastScrollY(currentScrollY);
  };
  
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
  
  onMount(() => {
    // Set initial scroll position
    setLastScrollY(window.scrollY);
    // Initialize header state
    handleScroll();
  });
  
  createEffect(() => {
    // Add scroll event listener
    window.addEventListener("scroll", onScroll, { passive: true });
    
    onCleanup(() => {
      // Remove scroll event listener
      window.removeEventListener("scroll", onScroll);
    });
  });
  
  return (
    <header
      class={`fixed top-0 w-full z-50 transition-all duration-300 transform ${
        isVisible() ? "translate-y-0" : "-translate-y-full"
      } ${
        !isAtTop() ? "bg-base-100/95 backdrop-blur-sm shadow-md" : "bg-base-100"
      }`}
    >
      {props.children}
    </header>
  );
}
