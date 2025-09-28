import React from 'react';

function SidebarOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="sidebar-overlay active"
      onClick={onClose}
      aria-label="Fechar menu"
    />
  );
}

export default SidebarOverlay;
