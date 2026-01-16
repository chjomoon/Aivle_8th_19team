import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { PressMachineDashboard } from './components/PressMachineDashboard';
import { EngineAssemblyDashboard } from './components/EngineAssemblyDashboard';
import { BodyAssemblyDashboard } from './components/BodyAssemblyDashboard';
import { PaintQualityDashboard } from './components/PaintQualityDashboard';
import { FacilityDashboard } from './components/FacilityDashboard';
import { MainDashboard } from './components/MainDashboard';
import { BatteryDashboard } from './components/BatteryDashboard';
import { AIChatbot } from './components/AIChatbot';

export type MenuType = 'main' | 'press' | 'engine' | 'body' | 'paint' | 'battery' | 'facility';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedMenu, setSelectedMenu] = useState<MenuType>('main');

  const handleLogin = (user: string) => {
    setUsername(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setSelectedMenu('main');
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderDashboard = () => {
    switch (selectedMenu) {
      case 'main':
        return <MainDashboard />;
      case 'press':
        return <PressMachineDashboard />;
      case 'engine':
        return <EngineAssemblyDashboard />;
      case 'body':
        return <BodyAssemblyDashboard />;
      case 'paint':
        return <PaintQualityDashboard />;
      case 'battery':
        return <BatteryDashboard />;
      case 'facility':
        return <FacilityDashboard />;
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        selectedMenu={selectedMenu}
        onMenuSelect={setSelectedMenu}
        username={username}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        {renderDashboard()}
      </main>
      {/* AI Chatbot - Only visible when logged in */}
      <AIChatbot />
    </div>
  );
}