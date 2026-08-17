/**
 * DropdownPortal Component
 * Renders an inline dropdown menu positioned reliably relative to its parent .nav-item-dropdown container.
 */
export function DropdownPortal({ isOpen, children, className = 'dropdown-menu' }) {
  if (!isOpen) return null;

  return (
    <div 
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
