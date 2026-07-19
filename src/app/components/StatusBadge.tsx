import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning';
  showDot?: boolean;
  text?: string;
}

export function StatusBadge({ status, showDot = true, text }: StatusBadgeProps) {
  const colors = {
    online: 'bg-[#3fb950]/20 text-[#3fb950] border-[#3fb950]/30',
    offline: 'bg-[#f85149]/20 text-[#f85149] border-[#f85149]/30',
    warning: 'bg-[#d29922]/20 text-[#d29922] border-[#d29922]/30'
  };

  const dotColors = {
    online: 'bg-[#3fb950]',
    offline: 'bg-[#f85149]',
    warning: 'bg-[#d29922]'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colors[status]}`}>
      {showDot && <span className={`w-2 h-2 rounded-full ${dotColors[status]}`} />}
      <span className="capitalize">{text || status}</span>
    </span>
  );
}
