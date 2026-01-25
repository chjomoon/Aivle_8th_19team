import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  anomalyData: any[];
  warningData: any[];
  totalAnomalies: number;
  totalWarnings: number;
  totalDelayHours: number;
  originalDeadline: string;
  overallEfficiency: number;
  productionEfficiency: number;
}

export function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/dashboard/main')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-8">Loading...</div>;
  }

  const {
    anomalyData,
    warningData,
    totalAnomalies,
    totalWarnings,
    totalDelayHours,
    originalDeadline: deadlineStr,
    overallEfficiency,
    productionEfficiency
  } = data;

  // 예상 지연을 일과 시간으로 변환
  const delayDays = Math.floor(totalDelayHours / 24);
  const delayHours = Math.floor(totalDelayHours % 24);

  // 원래 납기일
  const originalDeadline = new Date(deadlineStr);

  // 예상 납기일 계산 (원래 납기일 + 지연 시간)
  const predictedDeadline = new Date(originalDeadline.getTime() + totalDelayHours * 60 * 60 * 1000);

  // 납기 상태 결정
  const getDeliveryStatus = () => {
    if (totalDelayHours < 24) return { status: '안전', color: 'green', icon: 'bg-green-100', textColor: 'text-green-600' };
    if (totalDelayHours < 72) return { status: '주의', color: 'yellow', icon: 'bg-yellow-100', textColor: 'text-yellow-600' };
    return { status: '위험', color: 'red', icon: 'bg-red-100', textColor: 'text-red-600' };
  };

  const deliveryStatus = getDeliveryStatus();

  const overallData = [
    { name: '프레스', 정상: 85, 경고: 10, 이상: 5 },
    { name: '엔진', 정상: 90, 경고: 7, 이상: 3 },
    { name: '차체', 정상: 78, 경고: 15, 이상: 7 },
    { name: '도장', 정상: 88, 경고: 8, 이상: 4 },
    { name: '설비', 정상: 92, 경고: 5, 이상: 3 },
  ];

  const deliveryRisk = [
    { 날짜: '1/5', 지연시간: 35 },
    { 날짜: '1/6', 지연시간: 42 },
    { 날짜: '1/7', 지연시간: 58 },
    { 날짜: '1/8', 지연시간: 51 },
    { 날짜: '1/9', 지연시간: totalDelayHours },
  ];

  const processStatus = [
    { name: '정상', value: 433, color: '#22c55e' },
    { name: '경고', value: 45, color: '#f59e0b' },
    { name: '이상', value: 22, color: '#ef4444' },
  ];

  // 공정별 지연 기여도
  const delayContribution = anomalyData.map(item => ({
    name: item.process,
    지연시간: item.count * item.avgDelayPerIssue
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">종합 대시보드</h2>
        <p className="text-gray-600 mt-1">전체 공정 상태 및 리스크 모니터링</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 가동률</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{overallEfficiency}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">▲ 2.3% 전일 대비</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이상 발생</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalAnomalies}건</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-4">경고 {totalWarnings}건 포함</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">예상 지연 시간</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {delayDays > 0 ? `${delayDays}일 ` : ''}{delayHours}시간
              </p>
            </div>
            <div className={`w-12 h-12 ${deliveryStatus.icon} rounded-lg flex items-center justify-center`}>
              <Clock className={`w-6 h-6 ${deliveryStatus.textColor}`} />
            </div>
          </div>
          <p className={`text-xs ${deliveryStatus.textColor} mt-4`}>상태: {deliveryStatus.status}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">생산 효율</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{productionEfficiency}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-4">▲ 1.5% 전일 대비</p>
        </div>
      </div>

      {/* Delivery Prediction Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border-2 border-blue-200 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">납기 예측 분석</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">예정 납기일</p>
                <p className="text-lg font-bold text-gray-900">
                  {originalDeadline.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">예상 납기일</p>
                <p className={`text-lg font-bold ${deliveryStatus.textColor}`}>
                  {predictedDeadline.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">총 지연 시간</p>
                <p className={`text-lg font-bold ${deliveryStatus.textColor}`}>
                  {totalDelayHours.toFixed(1)}시간
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ({delayDays > 0 ? `${delayDays}일 ` : ''}{delayHours}시간)
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">공정별 지연 기여도</p>
              <div className="grid grid-cols-5 gap-2">
                {anomalyData.map((item) => {
                  const delay = item.count * item.avgDelayPerIssue;
                  return (
                    <div key={item.process} className="text-center">
                      <p className="text-xs text-gray-600">{item.process}</p>
                      <p className="text-sm font-bold text-gray-900">{delay.toFixed(1)}h</p>
                      <p className="text-xs text-gray-500">({item.count}건)</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">공정별 상태 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overallData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="정상" stackId="a" fill="#22c55e" />
              <Bar dataKey="경고" stackId="a" fill="#f59e0b" />
              <Bar dataKey="이상" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">전체 공정 상태</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {processStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">누적 지연 시간 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={deliveryRisk}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="날짜" />
              <YAxis label={{ value: '시간', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="지연시간" stroke="#ef4444" strokeWidth={2} name="누적 지연 (시간)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">공정별 지연 시간 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={delayContribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: '시간', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="지연시간" fill="#f59e0b" name="지연 시간 (h)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}