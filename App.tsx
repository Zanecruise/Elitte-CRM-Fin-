import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './components/navigation/SideNav';
import TopBar from './components/navigation/TopBar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Opportunities from './pages/Opportunities';
import Transactions from './pages/Transactions';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Partners from './pages/Partners';
import CommandPalette from './components/CommandPalette';
import Login from './pages/Login';
import { useAppContext } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { notifications } = useAppContext();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!user) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-700">
        Verificando sessão...
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar notifications={notifications} user={user} onLogout={logout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/tasks" element={<Activities />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

export default App;
