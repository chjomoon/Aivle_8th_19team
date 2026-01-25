import { Activity, AlertTriangle, Gauge, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function PressMachineDashboard() {
  const pressureData = [
    { 시간: '09:00', 압력: 850, 온도: 72, 진동: 0.8 },
    { 시간: '10:00', 압력: 845, 온도: 74, 진동: 0.9 },
    { 시간: '11:00', 압력: 860, 온도: 76, 진동: 1.2 },
    { 시간: '12:00', 압력: 855, 온도: 75, 진동: 1.0 },
    { 시간: '13:00', 압력: 870, 온도: 78, 진동: 1.5 },
    { 시간: '14:00', 압력: 865, 온도: 77, 진동: 1.3 },
    { 시간: '15:00', 압력: 880, 온도: 80, 진동: 1.8 },
  ];

  const machines = [
    { id: 'PM-01', status: '정상', pressure: 855, temp: 75, vibration: 1.1, efficiency: 96 },
    { id: 'PM-02', status: '경고', pressure: 880, temp: 82, vibration: 1.9, efficiency: 88 },
    { id: 'PM-03', status: '정상', pressure: 850, temp: 74, vibration: 0.9, efficiency: 94 },
    { id: 'PM-04', status: '정상', pressure: 862, temp: 76, vibration: 1.2, efficiency: 95 },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">프레스 머신 모니터링</h2>
        <p className="text-gray-600 mt-1">실시간 압력, 온도, 진동 데이터 분석</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 압력</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">862 kPa</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Gauge className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">정상 범위: 800-900 kPa</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 온도</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">77°C</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">정상 범위: 70-85°C</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 진동</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">1.3 mm/s</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">정상 범위: 0-2.0 mm/s</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이상 예측</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">1건</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-4">PM-02 점검 권장</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">실시간 센서 데이터 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={pressureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="시간" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="압력" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Area yAxisId="left" type="monotone" dataKey="온도" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
            <Area yAxisId="right" type="monotone" dataKey="진동" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Machine Status Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">설비별 상태</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">설비 ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">상태</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">압력 (kPa)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">온도 (°C)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">진동 (mm/s)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">효율</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{machine.id}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      machine.status === '정상' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{machine.pressure}</td>
                  <td className="py-3 px-4 text-gray-700">{machine.temp}</td>
                  <td className="py-3 px-4 text-gray-700">{machine.vibration}</td>
                  <td className="py-3 px-4 text-gray-700">{machine.efficiency}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
