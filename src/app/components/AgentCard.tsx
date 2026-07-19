import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Terminal } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { MetricBar } from './MetricBar';

export interface Agent {
  id: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline';
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  lastSeen: string;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 hover:border-[#58a6ff]/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={agent.status} showDot={true} text="" />
            <h3 className="text-[#e6edf3]">{agent.hostname}</h3>
          </div>
          <p className="text-sm text-[#8b949e]">{agent.ip}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <MetricBar label="CPU" value={agent.cpu} color="blue" />
        <MetricBar label="RAM" value={agent.ram} color="purple" />
        <MetricBar label="Disk" value={agent.disk} color="orange" />
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[#8b949e]">Uptime</span>
          <span className="text-xs text-[#e6edf3]">{agent.uptime}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#30363d]">
        <span className="text-xs text-[#8b949e]">Last seen: {agent.lastSeen}</span>
        <div className="flex items-center gap-2">
          <Link 
            to={`/agent/${agent.id}`}
            className="p-2 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#58a6ff] transition-colors"
            title="View Details"
          >
            <BarChart3 size={16} />
          </Link>
          <Link 
            to={`/terminal/${agent.id}`}
            className="p-2 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#58a6ff] transition-colors"
            title="Open Terminal"
          >
            <Terminal size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
