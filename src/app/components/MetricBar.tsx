import React from 'react';

interface MetricBarProps {
  label: string;
  value: number;
  color: string;
  showPercentage?: boolean;
}

export function MetricBar({ label, value, color, showPercentage = true }: MetricBarProps) {
  const colorClasses = {
    blue: 'bg-[#58a6ff]',
    purple: 'bg-[#a371f7]',
    orange: 'bg-[#d29922]',
    green: 'bg-[#3fb950]',
    red: 'bg-[#f85149]'
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">{label}</span>
        {showPercentage && <span className="text-xs text-[#e6edf3]">{value}%</span>}
      </div>
      <div className="h-1.5 bg-[#30363d] rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} transition-all duration-300`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
