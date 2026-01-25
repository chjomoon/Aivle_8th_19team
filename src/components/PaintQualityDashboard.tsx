import { Droplets, Wind, Sparkles, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';

export function PaintQualityDashboard() {
  const paintThicknessData = [
    { 차량: 1, 프론트: 32, 사이드: 35, 루프: 33, 리어: 34 },
    { 차량: 2, 프론트: 34, 사이드: 33, 루프: 35, 리어: 32 },
    { 차량: 3, 프론트: 31, 사이드: 34, 루프: 32, 리어: 33 },
    { 차량: 4, 프론트: 33, 사이드: 36, 루프: 34, 리어: 35 },
    { 차량: 5, 프론트: 35, 사이드: 32, 루프: 31, 리어: 33 },
  ];

  const environmentalData = [
    { 시간: '09:00', 온도: 22, 습도: 55, 압력: 1013 },
    { 시간: '10:00', 온도: 22.5, 습도: 54, 압력: 1013 },
    { 시간: '11:00', 온도: 23, 습도: 53, 압력: 1012 },
    { 시간: '12:00', 온도: 23.5, 습도: 52, 압력: 1012 },
    { 시간: '13:00', 온도: 24, 습도: 51, 압력: 1011 },
    { 시간: '14:00', 온도: 24.5, 습도: 50, 압력: 1011 },
    { 시간: '15:00', 온도: 25, 습도: 52, 압력: 1010 },
  ];

  const defectData = [
    { type: '먼지', count: 12, x: 30, y: 40, z: 12 },
    { type: '기포', count: 8, x: 50, y: 60, z: 8 },
    { type: '색상 불균일', count: 5, x: 70, y: 30, z: 5 },
    { type: '흐름자국', count: 15, x: 40, y: 70, z: 15 },
  ];

  const boothStatus = [
    { id: 'PB-01', status: '가동중', temp: 23.5, humidity: 52, thickness: 33.2, defectRate: 1.2 },
    { id: 'PB-02', status: '가동중', temp: 24.0, humidity: 51, thickness: 34.1, defectRate: 0.8 },
    { id: 'PB-03', status: '정비중', temp: 22.0, humidity: 55, thickness: 0, defectRate: 0 },
    { id: 'PB-04', status: '가동중', temp: 23.8, humidity: 50, thickness: 32.8, defectRate: 1.5 },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">도장 품질 모니터링</h2>
        <p className="text-gray-600 mt-1">도막 두께, 환경 조건 및 불량 분석</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 도막 두께</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">33.4 μm</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">목표: 30-35 μm</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">부스 온도</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">24.0°C</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wind className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">목표: 22-25°C</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">품질 적합률</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">98.3%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">▲ 0.5% 개선</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">불량 발생</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">40건</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-4">먼지 불량 주의</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">차량별 도막 두께 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={paintThicknessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="차량" />
              <YAxis domain={[25, 40]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="프론트" stroke="#3b82f6" />
              <Line type="monotone" dataKey="사이드" stroke="#10b981" />
              <Line type="monotone" dataKey="루프" stroke="#f59e0b" />
              <Line type="monotone" dataKey="리어" stroke="#8b5cf6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">환경 조건 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={environmentalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="시간" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="온도" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
              <Area yAxisId="left" type="monotone" dataKey="습도" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Defect Analysis */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">불량 유형 분석</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {defectData.map((defect) => (
            <div key={defect.type} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">{defect.type}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{defect.count}건</p>
            </div>
          ))}
        </div>
      </div>

      {/* Booth Status Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">도장 부스 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">부스 ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">상태</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">온도 (°C)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">습도 (%)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">도막두께 (μm)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">불량률 (%)</th>
              </tr>
            </thead>
            <tbody>
              {boothStatus.map((booth) => (
                <tr key={booth.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{booth.id}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      booth.status === '가동중' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booth.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{booth.temp}</td>
                  <td className="py-3 px-4 text-gray-700">{booth.humidity}</td>
                  <td className="py-3 px-4 text-gray-700">{booth.thickness}</td>
                  <td className="py-3 px-4 text-gray-700">{booth.defectRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
