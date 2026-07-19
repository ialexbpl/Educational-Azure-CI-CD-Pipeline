import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

export function Navbar() {
  const location = useLocation();
  
  // Don't show navbar on login or terminal pages
  if (location.pathname === '/login' || location.pathname.startsWith('/terminal')) {
    return null;
  }

  return (
    <nav className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl text-[#58a6ff]">STATMASTER 1.0</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" size={18} />
              <input
                type="text"
                placeholder="Search agents..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-2 text-[#e6edf3] placeholder:text-[#8b949e] focus:outline-none focus:border-[#58a6ff] transition-colors"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#f85149] rounded-full"></span>
            </button>
            <Avatar>
              <AvatarFallback className="bg-[#58a6ff] text-white">AD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}
