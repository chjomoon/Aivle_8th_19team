import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Factory,
  Cpu,
  Box,
  Droplet,
  LayoutDashboard,
  LogOut,
  User,
  ClipboardList,
  ShieldCheck,
  ShoppingCart,
  ListChecks,
  BarChart3,
  ArrowLeftRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface SidebarProps {
  username: string;
  onLogout: () => void;
}

type AppMode = "process" | "order";
const MODE_KEY = "app_mode"; // localStorage key

export function Sidebar({ username, onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ 모드 상태 (기본: process)
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === "order" ? "order" : "process";
  });

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  // ✅ 메뉴 2세트
  const processMenuItems = useMemo(
    () => [
      { path: "/dashboard", label: "메인 대시보드", icon: LayoutDashboard },
      { path: "/press", label: "프레스 머신", icon: Factory },
      { path: "/welding-image", label: "용접(이미지)", icon: Factory },
      { path: "/windshield", label: "윈드실드", icon: ShieldCheck },
      { path: "/engine-vibration", label: "엔진 진동", icon: Cpu },
      { path: "/body", label: "차체 조립", icon: Box },
      { path: "/paint", label: "도장 품질", icon: Droplet },
      { path: "/board", label: "게시판", icon: ClipboardList },
    ],
    []
  );

  const orderMenuItems = useMemo(
  () => [
    { path: "/order/orders", label: "주문", icon: ShoppingCart },
    { path: "/order/production", label: "생산", icon: Factory },
    { path: "/order/process", label: "공정", icon: ListChecks },
  ],
  []
);

  const menuItems = mode === "process" ? processMenuItems : orderMenuItems;

  // ✅ 선택 상태 계산 (현재 path가 하위 라우트면 active)
  const isActive = (itemPath: string) => {
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + "/");
  };

  // ✅ 모드 전환 버튼
  const handleSwitchMode = () => {
    if (mode === "process") {
      setMode("order");
      navigate("/order/orders");
    } else {
      setMode("process");
      navigate("/dashboard");
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">
          {mode === "process" ? "자동차 공정 관리" : "주문 생산 관리"}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {mode === "process" ? "이상 및 납기 리스크 예측" : "주문/계획/현황 모니터링"}
        </p>
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

      {/* Nav */}
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const selected = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                selected ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {/* ✅ 모드 전환 버튼 */}
        <button
          onClick={handleSwitchMode}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors mb-3"
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span>{mode === "process" ? "주문생산으로 이동" : "이상탐지로 이동"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors mb-3"
        >
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
        
        <div className="space-y-1 mb-3">
          <Link
            to="/terms"
            className="block text-xs text-slate-400 hover:text-slate-300 px-4 py-1"
          >
            이용약관
          </Link>
          <Link
            to="/privacy"
            className="block text-xs text-slate-400 hover:text-slate-300 px-4 py-1"
          >
            개인정보처리방침
          </Link>
        </div>

        <div className="text-xs text-slate-500">
          마지막 업데이트: {new Date().toLocaleTimeString("ko-KR")}
        </div>
      </div>
    </aside>
  );
}
