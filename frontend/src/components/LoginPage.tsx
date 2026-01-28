import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Factory, Lock, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const saveSession = (token: string, uname: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', uname);
    onLogin(uname);
    // ✅ 로그인 후 원하는 첫 화면으로 이동 (App.tsx에서 /login 접근 시 /press로 보내게 했으니 맞춰줌)
    navigate('/press', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ✅ demo bypass를 유지하되, token도 저장해서 403이 안 뜨게 함
    if (username === 'test' && password === 'test') {
      saveSession('DEV_TOKEN', username);
      return;
    }

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // 에러일 때는 body가 json이 아닐 수도 있으니 안전 처리
      if (!response.ok) {
        let msg = '로그인 실패';
        try {
          const errJson = await response.json();
          msg = errJson?.error || errJson?.message || msg;
        } catch {
          const text = await response.text().catch(() => '');
          if (text) msg = text;
        }
        setError(msg);
        return;
      }

      const data = await response.json();

      // ✅ Swagger 예시: { token, username }
      // ✅ 혹시 래핑되어 오는 경우도 대비: { data: { token, username } }
      const token = data?.token ?? data?.data?.token;
      const uname = data?.username ?? data?.data?.username ?? username;

      if (!token) {
        setError('로그인 응답에 token이 없습니다. (백엔드 응답 구조 확인 필요)');
        return;
      }

      saveSession(token, uname);
    } catch (err) {
      console.error(err);
      setError('서버 연결 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">자동차 공정 관리</h1>
          <p className="text-slate-300">이상 및 납기 리스크 예측 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/signup"
              className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium block text-center"
            >
              계정이 없으신가요? 회원가입
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          © 2026 자동차 공정 관리 시스템. All rights reserved.
        </p>
      </div>
    </div>
  );
}
