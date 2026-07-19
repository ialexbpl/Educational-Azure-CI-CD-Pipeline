import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AgentDetail } from './pages/AgentDetail';
import { Terminal } from './pages/Terminal';
import { Login } from './pages/Login';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Toaster } from './components/ui/sonner';

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agent/:id" element={<AgentDetail />} />
          <Route path="/terminal/:id" element={<Terminal />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Demo Modal */}
        <ConfirmationModal
          open={showModal}
          onOpenChange={setShowModal}
          onConfirm={() => console.log('Confirmed!')}
          title="Confirm terminal session"
          description="Are you sure you want to start a remote terminal session with this agent? This action will be logged."
        />

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
