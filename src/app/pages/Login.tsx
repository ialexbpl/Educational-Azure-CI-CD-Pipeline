import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login - in real app would validate credentials
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl text-[#58a6ff] mb-2">StatMaster</h1>
            <p className="text-[#8b949e]">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[#e6edf3] mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#8b949e] focus:border-[#58a6ff]"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[#e6edf3] mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#8b949e] focus:border-[#58a6ff]"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-[#30363d]"
              />
              <label 
                htmlFor="remember" 
                className="text-sm text-[#e6edf3] cursor-pointer"
              >
                Remember me
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white"
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-[#58a6ff] hover:underline">
              Forgot your password?
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-[#8b949e]">
          <p>Demo credentials: any email and password will work</p>
        </div>
      </div>
    </div>
  );
}
