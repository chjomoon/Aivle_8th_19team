import { Link, useLocation } from 'react-router-dom';
import { Factory, Cpu, Box, Droplet, Settings, LayoutDashboard, LogOut, User, ClipboardList, Battery, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  username: string;
  onLogout: () => void;
}

export function Sidebar({ username, onLogout }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: '메인 대시보드', icon: LayoutDashboard },
    { path: '/press', label: '프레스 머신', icon: Factory },
    { path: '/welding-image', label: '용접(이미지)', icon: Factory},
    { path: '/windshield', label: '윈드실드', icon: ShieldCheck },
    { path: '/engine-vibration', label: '엔진 진동', icon:Cpu },
    { path: '/body', label: '차체 조립', icon: Box },
    { path: '/paint', label: '도장 품질', icon: Droplet },
    { path: '/battery', label: '배터리 예지보전', icon: Battery },
    { path: '/facility', label: '설비', icon: Settings },
    { path: '/board', label: '게시판', icon: ClipboardList },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">자동차 공정 관리</h1>
        <p className="text-sm text-slate-400 mt-1">이상 및 납기 리스크 예측</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{username}</p>
            <p className="text-xs text-slate-400">관리자</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isSelected
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors mb-3"
        >
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
        <div className="text-xs text-slate-500">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
      </div>
    </aside>
  );
}