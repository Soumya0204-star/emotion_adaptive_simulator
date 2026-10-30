import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from '@/context/SessionContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPage } from '@/pages/ChatPage';
import { DashboardPage } from '@/pages/DashboardPage';

export const App: React.FC = () => {
  return (
    <SessionProvider>
      <Router>
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
          {/* Persistent Sidebar */}
          <Sidebar />

          {/* Main View Area */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <Routes>
              <Route path="/" element={<ChatPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SessionProvider>
  );
};

export default App;
