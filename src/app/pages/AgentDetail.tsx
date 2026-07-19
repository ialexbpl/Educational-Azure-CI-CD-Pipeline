import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Terminal } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBadge } from '../components/StatusBadge';
import { mockAgents, generateChartData, generateMetricsTableData, generateEventLogs } from '../data/mockData';
import { Button } from '../components/ui/button';

export function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const agent = mockAgents.find(a => a.id === id);
  const [timeRange, setTimeRange] = useState('24h');
  const [eventFilter, setEventFilter] = useState('All');

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-[#e6edf3] mb-2">Agent not found</h2>
          <Link to="/" className="text-[#58a6ff] hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const chartData = generateChartData(timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24);
  const metricsData = generateMetricsTableData();
  const eventLogs = generateEventLogs().filter(log => 
    eventFilter === 'All' || log.level === eventFilter
  );

  const diskData = [
    { name: 'Used', value: agent.disk, color: '#d29922' },
    { name: 'Free', value: 100 - agent.disk, color: '#30363d' }
  ];

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-[#58a6ff] hover:underline">Dashboard</Link>
          <ChevronRight size={16} className="text-[#8b949e]" />
          <span className="text-[#e6edf3]">{agent.hostname}</span>
        </div>

        {/* Agent Header */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl text-[#e6edf3] mb-3">{agent.hostname}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <StatusBadge status={agent.status} />
                <span className="text-[#8b949e]">IP: <span className="text-[#e6edf3]">{agent.ip}</span></span>
                <span className="text-[#8b949e]">OS: <span className="text-[#e6edf3]">Windows 11 Pro</span></span>
                <span className="text-[#8b949e]">Uptime: <span className="text-[#e6edf3]">{agent.uptime}</span></span>
              </div>
            </div>
            <Button 
              onClick={() => navigate(`/terminal/${agent.id}`)}
              className="bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white"
            >
              <Terminal size={16} className="mr-2" />
              Open Terminal
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 mb-6">
          {['1h', '6h', '24h', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-[#58a6ff] text-white'
                  : 'bg-[#161b22] text-[#8b949e] hover:bg-[#30363d] border border-[#30363d]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* CPU Chart - Full Width */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h3 className="text-[#e6edf3] mb-4">CPU Usage Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#58a6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="time" stroke="#8b949e" />
                <YAxis stroke="#8b949e" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#161b22', 
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    color: '#e6edf3'
                  }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#58a6ff" strokeWidth={2} fill="url(#cpuGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* RAM Chart */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h3 className="text-[#e6edf3] mb-4">RAM Usage</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a371f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a371f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="time" stroke="#8b949e" />
                <YAxis stroke="#8b949e" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#161b22', 
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    color: '#e6edf3'
                  }}
                />
                <Area type="monotone" dataKey="ram" stroke="#a371f7" strokeWidth={2} fill="url(#ramGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Disk Chart */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h3 className="text-[#e6edf3] mb-4">Disk Usage</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={diskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {diskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#161b22', 
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                      color: '#e6edf3'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-3xl text-[#d29922]">{agent.disk}%</p>
              <p className="text-[#8b949e]">234 GB / 500 GB</p>
            </div>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
          <h3 className="text-[#e6edf3] mb-4">Recent Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#30363d]">
                  <th className="text-left py-3 px-4 text-[#8b949e]">Timestamp</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">CPU %</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">RAM Used</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">RAM Total</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Disk Used</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Disk Total</th>
                </tr>
              </thead>
              <tbody>
                {metricsData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-[#30363d] ${index % 2 === 0 ? 'bg-[#0d1117]/50' : ''}`}
                  >
                    <td className="py-3 px-4 text-[#e6edf3]">{row.timestamp}</td>
                    <td className="py-3 px-4 text-[#e6edf3]">{row.cpu}%</td>
                    <td className="py-3 px-4 text-[#e6edf3]">{row.ramUsed} GB</td>
                    <td className="py-3 px-4 text-[#e6edf3]">{row.ramTotal} GB</td>
                    <td className="py-3 px-4 text-[#e6edf3]">{row.diskUsed} GB</td>
                    <td className="py-3 px-4 text-[#e6edf3]">{row.diskTotal} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Logs */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#e6edf3]">Windows Event Log</h3>
            <div className="flex items-center gap-2">
              {['All', 'Error', 'Warning', 'Info'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    eventFilter === filter
                      ? 'bg-[#58a6ff] text-white'
                      : 'bg-[#0d1117] text-[#8b949e] hover:bg-[#30363d] border border-[#30363d]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#30363d]">
                  <th className="text-left py-3 px-4 text-[#8b949e]">Timestamp</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Level</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Source</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Message</th>
                </tr>
              </thead>
              <tbody>
                {eventLogs.map((log, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-[#30363d] ${index % 2 === 0 ? 'bg-[#0d1117]/50' : ''}`}
                  >
                    <td className="py-3 px-4 text-[#e6edf3]">{log.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        log.level === 'Error' ? 'bg-[#f85149]/20 text-[#f85149]' :
                        log.level === 'Warning' ? 'bg-[#d29922]/20 text-[#d29922]' :
                        'bg-[#58a6ff]/20 text-[#58a6ff]'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#e6edf3]">{log.source}</td>
                    <td className="py-3 px-4 text-[#8b949e]">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
