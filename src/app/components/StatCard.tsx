import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({ title, value, icon: Icon, color = '#58a6ff' }: StatCardProps) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 hover:border-[#58a6ff]/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#8b949e] mb-1">{title}</p>
          <p className="text-3xl" style={{ color }}>{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#0d1117]">
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );
}
