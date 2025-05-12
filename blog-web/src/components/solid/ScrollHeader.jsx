import { createSignal, createEffect, onCleanup } from 'solid-js';

export default function ScrollHeader(props) {
  const [isVisible, setIsVisible] = createSignal(true);
  const [lastScrollY, setLastScrollY] = createSignal(0);
  const [isAtTop, setIsAtTop] = createSignal(true);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // Check if at top of page
    if (currentScrollY < 10) {
      setIsAtTop(true);
      setIsVisible(true);
    } else {
      setIsAtTop(false);
      
      // Show/hide based on scroll direction
      if (currentScrollY < lastScrollY()) {
        // Scrolling up - show header
        setIsVisible(true);
      } else if (currentScrollY > 50 && currentScrollY > lastScrollY()) {
        // Scrolling down and not at the very top - hide header
        setIsVisible(false);
      }
    }
    
    setLastScrollY(currentScrollY);
  };

  createEffect(() => {
    window.addEventListener('scroll', handleScroll);
    
    onCleanup(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  });

  return (
    <header 
      class={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isVisible() ? 'translate-y-0' : '-translate-y-full'
      } ${
        !isAtTop() ? 'bg-base-100/95 backdrop-blur-sm shadow-md' : 'bg-base-100'
      }`}
    >
      {props.children}
    </header>
  );
}