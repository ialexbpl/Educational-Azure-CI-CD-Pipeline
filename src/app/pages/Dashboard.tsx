import React from 'react';
import { Monitor, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { AgentCard } from '../components/AgentCard';
import { EmptyState } from '../components/EmptyState';
import { mockAgents } from '../data/mockData';

export function Dashboard() {
  const onlineAgents = mockAgents.filter(a => a.status === 'online');
  const offlineAgents = mockAgents.filter(a => a.status === 'offline');
  const alertCount = mockAgents.filter(a => a.cpu > 80 || a.ram > 80 || a.disk > 85).length;

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Agents" 
            value={mockAgents.length} 
            icon={Monitor} 
            color="#58a6ff"
          />
          <StatCard 
            title="Online" 
            value={onlineAgents.length} 
            icon={Wifi} 
            color="#3fb950"
          />
          <StatCard 
            title="Offline" 
            value={offlineAgents.length} 
            icon={WifiOff} 
            color="#f85149"
          />
          <StatCard 
            title="Alerts" 
            value={alertCount} 
            icon={AlertTriangle} 
            color="#d29922"
          />
        </div>

        {/* Agent Grid */}
        {mockAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
