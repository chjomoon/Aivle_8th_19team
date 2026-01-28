import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Sidebar } from './components/Sidebar';
import { PressMachineDashboard } from './components/PressMachineDashboard';
import { EngineAssemblyDashboard } from './components/EngineAssemblyDashboard';
import { BodyAssemblyDashboard } from './components/BodyAssemblyDashboard';
import { PaintQualityDashboard } from './components/PaintQualityDashboard';
import { FacilityDashboard } from './components/FacilityDashboard';
import { MainDashboard } from './components/MainDashboard';
import { AIChatbot } from './components/AIChatbot';


export type MenuType = 'main' | 'press' | 'engine' | 'body' | 'paint' | 'facility';

function Layout({ children, username, onLogout }: { children: React.ReactNode, username: string, onLogout: () => void }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar username={username} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <AIChatbot />
    </div>
  );
}

function ProtectedRoute({ children, isLoggedIn }: { children: JSX.Element, isLoggedIn: boolean }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (token && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: string, token: string) => {
    setUsername(user);
    setIsLoggedIn(true);
    localStorage.setItem('token', token);
    localStorage.setItem('username', user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/signup" element={
          isLoggedIn ? <Navigate to="/" replace /> : <SignupPage />
        } />

        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout username={username} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<MainDashboard />} />
                <Route path="/press" element={<PressMachineDashboard />} />
                <Route path="/engine" element={<EngineAssemblyDashboard />} />
                <Route path="/body" element={<BodyAssemblyDashboard />} />
                <Route path="/paint" element={<PaintQualityDashboard />} />
                <Route path="/facility" element={<FacilityDashboard />} />

              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}