import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { mockAgents } from '../data/mockData';

export function Terminal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const agent = mockAgents.find(a => a.id === id);
  const [sessionTime, setSessionTime] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'PS C:\\Users\\Admin> Get-ComputerInfo | Select-Object CsName, WindowsVersion',
    '',
    'CsName          WindowsVersion',
    '------          --------------',
    `${agent?.hostname || 'PC-BIURO-01'}  10.0.22631`,
    '',
    'PS C:\\Users\\Admin> Get-Process | Sort-Object CPU -Descending | Select-Object -First 5',
    '',
    'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName',
    '-------  ------    -----      -----     ------     --  -- -----------',
    '   1234      89   234567     456789     123.45   5678   1 chrome',
    '    987      45   123456     234567      89.12   4321   1 Code',
    '    543      23    98765     123456      45.67   8765   1 explorer',
    '    321      12    54321      87654      23.45   2345   0 System',
    '    234      11    43210      76543      12.34   9876   1 teams',
    '',
    'PS C:\\Users\\Admin> '
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      const newHistory = [
        ...commandHistory.slice(0, -1),
        `PS C:\\Users\\Admin> ${currentCommand}`,
        '',
        getCommandOutput(currentCommand),
        '',
        'PS C:\\Users\\Admin> '
      ];
      setCommandHistory(newHistory);
      setCurrentCommand('');
    }
  };

  const getCommandOutput = (command: string): string => {
    const cmd = command.toLowerCase().trim();
    
    if (cmd.includes('dir') || cmd.includes('ls')) {
      return `    Directory: C:\\Users\\Admin

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----          3/5/2026   2:30 PM                Desktop
d-----          3/5/2026   1:15 PM                Documents
d-----          3/5/2026  10:45 AM                Downloads
d-r---          2/20/2026  4:20 PM                Pictures
-a----          3/5/2026   9:30 AM          12345 report.docx
-a----          3/4/2026   3:15 PM         567890 data.xlsx`;
    } else if (cmd.includes('ipconfig')) {
      return `Windows IP Configuration

Ethernet adapter Ethernet:
   Connection-specific DNS Suffix  . : local
   IPv4 Address. . . . . . . . . . . : ${agent?.ip || '192.168.1.105'}
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1`;
    } else if (cmd.includes('systeminfo')) {
      return `Host Name:                 ${agent?.hostname || 'PC-BIURO-01'}
OS Name:                   Microsoft Windows 11 Pro
OS Version:                10.0.22631 N/A Build 22631
System Boot Time:          3/2/2026, 8:15:23 AM
System Manufacturer:       Dell Inc.
System Model:              OptiPlex 7090
Processor:                 Intel(R) Core(TM) i7-10700 CPU @ 2.90GHz
Total Physical Memory:     16,384 MB`;
    } else if (cmd.includes('help')) {
      return `Common commands:
  dir, ls      - List directory contents
  ipconfig     - Display network configuration
  systeminfo   - Display system information
  Get-Process  - List running processes
  Get-Service  - List Windows services
  Clear-Host   - Clear the terminal`;
    } else {
      return `Command executed: ${command}
[Simulated output - this is a demo terminal]`;
    }
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-[#e6edf3] mb-2">Agent not found</h2>
          <button onClick={() => navigate('/')} className="text-[#58a6ff] hover:underline">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/agent/${agent.id}`)}
              className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-[#e6edf3]">Terminal: {agent.hostname}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#3fb950] rounded-full"></span>
              <span className="text-[#e6edf3]">Connected</span>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg border border-[#f85149] text-[#f85149] hover:bg-[#f85149]/10 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Window */}
      <div 
        ref={terminalRef}
        className="flex-1 bg-black p-6 overflow-auto font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-[#3fb950]">
          {commandHistory.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line.startsWith('PS C:') ? (
                <span className="text-[#d29922]">{line}</span>
              ) : (
                <span className="text-[#e6edf3]">{line}</span>
              )}
            </div>
          ))}
          <div className="flex items-center">
            <span className="text-[#d29922]">PS C:\Users\Admin&gt; </span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] ml-1 caret-[#3fb950]"
              autoFocus
            />
            <span className="animate-pulse text-[#3fb950]">█</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-[#161b22] border-t border-[#30363d] px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="text-[#8b949e]">
            Agent: <span className="text-[#e6edf3]">{agent.hostname}</span>
            <span className="mx-2">|</span>
            IP: <span className="text-[#e6edf3]">{agent.ip}</span>
          </div>
          <div className="text-[#8b949e]">
            Session: <span className="text-[#e6edf3]">{formatTime(sessionTime)}</span>
            <span className="mx-2">|</span>
            Latency: <span className="text-[#3fb950]">12ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
