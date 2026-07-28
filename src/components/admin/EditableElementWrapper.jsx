'use client';

import React, { useState } from 'react';

/**
 * EditableElementWrapper
 * Wraps content elements in Admin Visual Inspect Mode to make them click-selectable.
 * In standard visitor mode, renders children cleanly with zero overhead.
 */
export function EditableElementWrapper({
  elementKey,
  label,
  inspectMode = false,
  selectedKey = null,
  onSelect = () => {},
  children,
  style = {},
  className = '',
  as = 'div',
}) {
  const [hovered, setHovered] = useState(false);

  if (!inspectMode) {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, { 'data-editable-key': elementKey });
    }
    return <span data-editable-key={elementKey}>{children}</span>;
  }

  const isSelected = selectedKey === elementKey;
  const Component = as;

  const wrapperStyle = {
    position: 'relative',
    cursor: 'pointer',
    outline: isSelected
      ? '2px solid #b78646'
      : hovered
      ? '2px dashed #0284c7'
      : '1px dashed rgba(183, 134, 70, 0.3)',
    outlineOffset: '2px',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
    backgroundColor: isSelected
      ? 'rgba(183, 134, 70, 0.05)'
      : hovered
      ? 'rgba(2, 132, 199, 0.04)'
      : 'transparent',
    ...style,
  };

  const badgeStyle = {
    position: 'absolute',
    top: '-10px',
    left: '8px',
    background: isSelected ? '#b78646' : '#0284c7',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px',
    zIndex: 99,
    pointerEvents: 'none',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    whiteSpace: 'nowrap',
    letterSpacing: '0.3px',
  };

  return (
    <Component
      className={`editable-element-wrapper ${className}`}
      style={wrapperStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(elementKey);
      }}
    >
      {(hovered || isSelected) && (
        <span style={badgeStyle}>
          {isSelected ? '✓ Editing: ' : 'Click to Edit: '}{label || elementKey}
        </span>
      )}
      {children}
    </Component>
  );
}
