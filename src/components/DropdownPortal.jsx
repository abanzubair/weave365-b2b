import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders a dropdown menu relative to an anchor element using a React Portal.
 * Solves stacking context issues and eliminates duplicate portal code.
 */
export function DropdownPortal({ anchorRef, isOpen, children, offsetY = 12, className = 'dropdown-menu' }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom, left: rect.left + rect.width / 2 });
    }
  }, [isOpen, anchorRef]);

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className={className}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: `translateX(-50%) translateY(${offsetY}px)`,
        zIndex: 10000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
