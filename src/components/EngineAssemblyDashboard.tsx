import { Package, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function EngineAssemblyDashboard() {
  const productionData = [
    { 시간: '09:00', 생산량: 45, 불량: 2 },
    { 시간: '10:00', 생산량: 48, 불량: 1 },
    { 시간: '11:00', 생산량: 52, 불량: 3 },
    { 시간: '12:00', 생산량: 38, 불량: 1 },
    { 시간: '13:00', 생산량: 50, 불량: 2 },
    { 시간: '14:00', 생산량: 54, 불량: 4 },
    { 시간: '15:00', 생산량: 49, 불량: 2 },
  ];

  const cycleTimeData = [
    { 공정: '크랭크샤프트', 목표: 12, 실제: 11.5 },
    { 공정: '피스톤 조립', 목표: 15, 실제: 16.2 },
    { 공정: '캠샤프트', 목표: 10, 실제: 9.8 },
    { 공정: '실린더 헤드', 목표: 18, 실제: 17.5 },
    { 공정: '최종 검사', 목표: 8, 실제: 8.3 },
  ];

  const alerts = [
    { id: 1, line: 'EA-라인2', issue: '피스톤 조립 사이클 타임 지연', severity: '경고', time: '14:32' },
    { id: 2, line: 'EA-라인3', issue: '토크 렌치 교정 필요', severity: '주의', time: '13:15' },
    { id: 3, line: 'EA-라인1', issue: '부품 재고 부족 예상 (48시간)', severity: '경고', time: '11:20' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">엔진 조립 공정</h2>
        <p className="text-gray-600 mt-1">생산량, 사이클 타임 및 품질 모니터링</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">오늘 생산량</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">336대</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">목표: 350대 (96%)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 사이클 타임</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">12.7분</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-4">목표 대비 +0.7분</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">불량률</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">2.1%</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-4">목표: 1.5% 이하</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">생산 효율</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">93.8%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">▲ 1.2% 전일 대비</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">시간대별 생산량 및 불량</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="시간" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="생산량" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="불량" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">공정별 사이클 타임</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cycleTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="공정" angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="목표" fill="#94a3b8" />
              <Bar dataKey="실제" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">실시간 알림 및 이슈</h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className={`w-2 h-2 mt-2 rounded-full ${
                alert.severity === '경고' ? 'bg-yellow-500' : 'bg-orange-500'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{alert.line}</span>
                  <span className="text-sm text-gray-500">{alert.time}</span>
                </div>
                <p className="text-sm text-gray-700">{alert.issue}</p>
                <span className={`inline-flex mt-2 px-2 py-1 rounded-full text-xs ${
                  alert.severity === '경고' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
