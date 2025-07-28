import React from 'react';

export const CustomFooter = ({ className }: { className?: string }) => {
  return (
    <div
      className={
        className ??
        'absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-2 py-2 text-center text-xs text-text-primary sm:flex md:px-[60px]'
      }
      role="contentinfo"
    >
      <span>Schoolkit can make mistakes. Check important info.</span>
    </div>
  );
};