import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Renders a dropdown menu relative to an anchor element using a React Portal.
 * Solves stacking context issues and eliminates duplicate portal code.
 */
export function DropdownPortal({ anchorRef, isOpen, children, offsetY = 12, className = 'dropdown-menu' }) {
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ 
    top: 0, 
    left: 0, 
    translateX: '-50%',
    transform: `translateX(-50%) translateY(${offsetY}px)` 
  });

  useIsomorphicLayoutEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropdownEl = dropdownRef.current;
      const dropdownWidth = dropdownEl ? dropdownEl.getBoundingClientRect().width : 210;
      
      let left = rect.left + rect.width / 2;
      let transformX = '-50%';
      const padding = 16;

      // Check if centering goes off the right edge of the viewport
      if (left + dropdownWidth / 2 > window.innerWidth - padding) {
        left = window.innerWidth - padding;
        transformX = '-100%';
      } else if (left - dropdownWidth / 2 < padding) {
        left = padding;
        transformX = '0%';
      }

      setPos({ 
        top: rect.bottom, 
        left, 
        translateX: transformX,
        transform: `translateX(${transformX}) translateY(${offsetY}px)` 
      });
    }
  }, [isOpen, anchorRef, children, offsetY]);

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div 
      ref={dropdownRef}
      className={className}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: pos.transform,
        '--translate-x': pos.translateX,
        zIndex: 10000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
