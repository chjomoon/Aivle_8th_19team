import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Sidebar } from './components/Sidebar';
import { PressMachineDashboard } from './components/PressMachineDashboard';
import { WindShieldDashboard } from './components/WindShieldDashboard';
import { EngineVibrationDashboard } from './components/EngineVibrationDashboard';
import { WeldingImageDashboard } from './components/WeldingImageDashboard';
import { BodyAssemblyDashboard } from './components/BodyAssemblyDashboard';
import { PaintQualityDashboard } from './components/PaintQualityDashboard';
import { MainDashboard } from './components/MainDashboard';
import { AIChatbot } from './components/AIChatbot';
import { BoardListPage } from './components/Board/BoardListPage';
import { BoardWritePage } from './components/Board/BoardWritePage';
import { BoardDetailPage } from './components/Board/BoardDetailPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';

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

  const handleLogin = (user: string) => {
    // In a real app you might pass token here too, but checking localStorage in useEffect handles persistence
    // For immediate state update:
    const savedUsername = localStorage.getItem('username');
    setUsername(user || savedUsername || 'User');
    setIsLoggedIn(true);
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
                <Route path="/welding-image" element={<WeldingImageDashboard />} />
                <Route path="/windshield" element={<WindShieldDashboard />} />
                <Route path="/engine-vibration" element={<EngineVibrationDashboard />} />
                <Route path="/body" element={<BodyAssemblyDashboard />} />
                <Route path="/paint" element={<PaintQualityDashboard />} />

                {/* Board Routes */}
                <Route path="/board" element={<BoardListPage />} />
                <Route path="/board/write" element={<BoardWritePage />} />
                <Route path="/board/:id" element={<BoardDetailPage />} />

                {/* Policy Routes */}
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}