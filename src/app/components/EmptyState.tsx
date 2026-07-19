import React from 'react';
import { Monitor } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="p-6 rounded-full bg-[#161b22] border border-[#30363d] mb-4">
        <Monitor size={48} className="text-[#8b949e]" />
      </div>
      <h3 className="text-xl text-[#e6edf3] mb-2">No agents connected</h3>
      <p className="text-[#8b949e] text-center max-w-md">
        Install the StatMaster agent on your Windows PCs to start monitoring their performance and status.
      </p>
    </div>
  );
}
