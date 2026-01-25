import { Wrench, Users, Shield, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export function BodyAssemblyDashboard() {
  const weldingData = [
    { 구역: '프론트', 용접점: 156, 정상: 148, 재작업: 8 },
    { 구역: '사이드 좌', 용접점: 132, 정상: 125, 재작업: 7 },
    { 구역: '사이드 우', 용접점: 134, 정상: 128, 재작업: 6 },
    { 구역: '리어', 용접점: 145, 정상: 137, 재작업: 8 },
    { 구역: '루프', 용접점: 98, 정상: 93, 재작업: 5 },
  ];

  const qualityMetrics = [
    { metric: '치수 정확도', 점수: 92 },
    { metric: '용접 품질', 점수: 88 },
    { metric: '표면 상태', 점수: 95 },
    { metric: '조립 정밀도', 점수: 90 },
    { metric: '작업 시간', 점수: 85 },
  ];

  const robotStatus = [
    { id: 'R-01', type: '스팟 용접', status: '가동중', utilization: 95, efficiency: 98 },
    { id: 'R-02', type: '스팟 용접', status: '가동중', utilization: 92, efficiency: 96 },
    { id: 'R-03', type: '아크 용접', status: '대기중', utilization: 78, efficiency: 94 },
    { id: 'R-04', type: '헤밍', status: '가동중', utilization: 88, efficiency: 95 },
    { id: 'R-05', type: '실링', status: '점검중', utilization: 0, efficiency: 0 },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">차체 조립 공정</h2>
        <p className="text-gray-600 mt-1">용접, 조립 및 로봇 운영 현황</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">용접 완료율</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">94.7%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">665/702 용접점</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">로봇 가동률</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">85.0%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">4/5 로봇 가동중</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">작업자 수</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">24명</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">3교대 운영</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">안전 지수</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">98.5</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">무재해 32일</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">구역별 용접 현황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weldingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="구역" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="정상" fill="#22c55e" />
              <Bar dataKey="재작업" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">품질 지표</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={qualityMetrics}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="점수" dataKey="점수" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Robot Status Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">로봇 운영 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">로봇 ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">작업 유형</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">상태</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">가동률</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">효율</th>
              </tr>
            </thead>
            <tbody>
              {robotStatus.map((robot) => (
                <tr key={robot.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{robot.id}</td>
                  <td className="py-3 px-4 text-gray-700">{robot.type}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      robot.status === '가동중' 
                        ? 'bg-green-100 text-green-800' 
                        : robot.status === '대기중'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {robot.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{robot.utilization}%</td>
                  <td className="py-3 px-4 text-gray-700">{robot.efficiency}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
