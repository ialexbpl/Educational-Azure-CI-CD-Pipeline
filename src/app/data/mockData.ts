import { Agent } from '../components/AgentCard';

export const mockAgents: Agent[] = [
  {
    id: '1',
    hostname: 'PC-BIURO-01',
    ip: '192.168.1.105',
    status: 'online',
    cpu: 45,
    ram: 62,
    disk: 78,
    uptime: '3d 14h',
    lastSeen: '2s ago'
  },
  {
    id: '2',
    hostname: 'PC-BIURO-02',
    ip: '192.168.1.106',
    status: 'online',
    cpu: 23,
    ram: 45,
    disk: 65,
    uptime: '5d 2h',
    lastSeen: '5s ago'
  },
  {
    id: '3',
    hostname: 'PC-BIURO-03',
    ip: '192.168.1.107',
    status: 'offline',
    cpu: 0,
    ram: 0,
    disk: 82,
    uptime: '0d 0h',
    lastSeen: '2h ago'
  },
  {
    id: '4',
    hostname: 'PC-SERVER-01',
    ip: '192.168.1.110',
    status: 'online',
    cpu: 78,
    ram: 85,
    disk: 45,
    uptime: '15d 6h',
    lastSeen: '1s ago'
  },
  {
    id: '5',
    hostname: 'PC-DEV-01',
    ip: '192.168.1.120',
    status: 'online',
    cpu: 55,
    ram: 72,
    disk: 58,
    uptime: '1d 8h',
    lastSeen: '3s ago'
  },
  {
    id: '6',
    hostname: 'PC-DEV-02',
    ip: '192.168.1.121',
    status: 'online',
    cpu: 38,
    ram: 51,
    disk: 71,
    uptime: '2d 12h',
    lastSeen: '7s ago'
  },
  {
    id: '7',
    hostname: 'PC-GRAPHICS-01',
    ip: '192.168.1.130',
    status: 'online',
    cpu: 92,
    ram: 88,
    disk: 90,
    uptime: '0d 4h',
    lastSeen: '1s ago'
  },
  {
    id: '8',
    hostname: 'PC-RECEPTION',
    ip: '192.168.1.140',
    status: 'online',
    cpu: 15,
    ram: 28,
    disk: 35,
    uptime: '7d 18h',
    lastSeen: '12s ago'
  },
  {
    id: '9',
    hostname: 'PC-STORAGE-01',
    ip: '192.168.1.150',
    status: 'offline',
    cpu: 0,
    ram: 0,
    disk: 95,
    uptime: '0d 0h',
    lastSeen: '4h ago'
  },
  {
    id: '10',
    hostname: 'PC-MANAGER-01',
    ip: '192.168.1.160',
    status: 'online',
    cpu: 42,
    ram: 58,
    disk: 62,
    uptime: '4d 9h',
    lastSeen: '4s ago'
  },
  {
    id: '11',
    hostname: 'PC-CONFERENCE',
    ip: '192.168.1.170',
    status: 'offline',
    cpu: 0,
    ram: 0,
    disk: 22,
    uptime: '0d 0h',
    lastSeen: '1d ago'
  },
  {
    id: '12',
    hostname: 'PC-BACKUP-01',
    ip: '192.168.1.180',
    status: 'online',
    cpu: 18,
    ram: 32,
    disk: 88,
    uptime: '30d 5h',
    lastSeen: '6s ago'
  }
];

export const generateChartData = (hours: number = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.floor(Math.random() * 30) + 30,
      ram: Math.floor(Math.random() * 25) + 50,
      disk: 78
    });
  }
  
  return data;
};

export const generateMetricsTableData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    data.push({
      timestamp: time.toLocaleString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      cpu: Math.floor(Math.random() * 40) + 30,
      ramUsed: (Math.random() * 4 + 4).toFixed(1),
      ramTotal: '8.0',
      diskUsed: '234',
      diskTotal: '500'
    });
  }
  
  return data;
};

export const generateEventLogs = () => {
  const levels = ['Info', 'Warning', 'Error'];
  const sources = ['System', 'Application', 'Security', 'Service Control Manager'];
  const messages = [
    'The system has been successfully started',
    'Disk space is running low on drive C:',
    'Failed to connect to update server',
    'Service StatMaster Agent started successfully',
    'A required system component is not installed',
    'Windows Update installed successfully',
    'Network connection established',
    'User login detected from 192.168.1.105',
    'System backup completed successfully',
    'Memory usage exceeded 80%'
  ];
  
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    const time = new Date(now.getTime() - i * 15 * 60 * 1000);
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    data.push({
      timestamp: time.toLocaleString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      level,
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)]
    });
  }
  
  return data;
};
