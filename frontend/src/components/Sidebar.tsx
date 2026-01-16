import { Factory, Cpu, Box, Droplet, Settings, LayoutDashboard, LogOut, User, Battery } from 'lucide-react';
import { MenuType } from '../App';

interface SidebarProps {
  selectedMenu: MenuType;
  onMenuSelect: (menu: MenuType) => void;
  username: string;
  onLogout: () => void;
}

export function Sidebar({ selectedMenu, onMenuSelect, username, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'main' as MenuType, label: '메인 대시보드', icon: LayoutDashboard },
    { id: 'press' as MenuType, label: '프레스 머신', icon: Factory },
    { id: 'engine' as MenuType, label: '엔진 조립', icon: Cpu },
    { id: 'body' as MenuType, label: '차체 조립', icon: Box },
    { id: 'paint' as MenuType, label: '도장 품질', icon: Droplet },
    { id: 'battery' as MenuType, label: '배터리 예지보전', icon: Battery },
    { id: 'facility' as MenuType, label: '설비', icon: Settings },
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
          const isSelected = selectedMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onMenuSelect(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isSelected
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
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