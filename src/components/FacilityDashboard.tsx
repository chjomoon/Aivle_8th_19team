import { Zap, TrendingDown, Calendar, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function FacilityDashboard() {
  const powerConsumptionData = [
    { 시간: '09:00', 전력: 4500 },
    { 시간: '10:00', 전력: 4800 },
    { 시간: '11:00', 전력: 5200 },
    { 시간: '12:00', 전력: 3800 },
    { 시간: '13:00', 전력: 5100 },
    { 시간: '14:00', 전력: 5400 },
    { 시간: '15:00', 전력: 5300 },
  ];

  const maintenanceData = [
    { 설비: '프레스', 예방정비: 12, 긴급정비: 3 },
    { 설비: '로봇', 예방정비: 18, 긴급정비: 5 },
    { 설비: '도장부스', 예방정비: 8, 긴급정비: 2 },
    { 설비: '컨베이어', 예방정비: 15, 긴급정비: 4 },
    { 설비: '공조시설', 예방정비: 6, 긴급정비: 1 },
  ];

  const facilityStatus = [
    { name: '정상 가동', value: 85, color: '#22c55e' },
    { name: '점검 대기', value: 10, color: '#f59e0b' },
    { name: '정비중', value: 5, color: '#ef4444' },
  ];

  const upcomingMaintenance = [
    { id: 1, equipment: '프레스 머신 PM-02', type: '정기 점검', date: '2026-01-12', priority: '높음' },
    { id: 2, equipment: '로봇 R-05', type: '부품 교체', date: '2026-01-13', priority: '긴급' },
    { id: 3, equipment: '도장 부스 PB-03', type: '필터 교체', date: '2026-01-15', priority: '중간' },
    { id: 4, equipment: '컨베이어 CB-01', type: '윤활유 보충', date: '2026-01-16', priority: '낮음' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">설비 관리</h2>
        <p className="text-gray-600 mt-1">전력 사용량, 정비 일정 및 설비 상태</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">현재 전력 사용량</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">5.3 MW</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">피크 대비 88%</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">에너지 효율</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">87.2%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">▲ 2.1% 개선</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">예정 정비</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">4건</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">7일 이내</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">설비 가동률</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">91.5%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-4">목표: 90% 이상</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">시간대별 전력 사용량</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={powerConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="시간" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="전력" stroke="#eab308" strokeWidth={2} name="전력 (kW)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">설비 가동 현황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={facilityStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {facilityStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Maintenance Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">설비별 정비 현황 (월간)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={maintenanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="설비" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="예방정비" fill="#22c55e" />
            <Bar dataKey="긴급정비" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming Maintenance */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">예정된 정비 일정</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">설비명</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">작업 내용</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">예정일</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">우선순위</th>
              </tr>
            </thead>
            <tbody>
              {upcomingMaintenance.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{item.equipment}</td>
                  <td className="py-3 px-4 text-gray-700">{item.type}</td>
                  <td className="py-3 px-4 text-gray-700">{item.date}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      item.priority === '긴급' 
                        ? 'bg-red-100 text-red-800' 
                        : item.priority === '높음'
                        ? 'bg-orange-100 text-orange-800'
                        : item.priority === '중간'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}