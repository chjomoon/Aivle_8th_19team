import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { Battery, Zap, AlertTriangle, Activity, TrendingUp, PlayCircle, Pause, X, CheckCircle2, Cpu } from 'lucide-react';

interface SensorData {
    time: string;
    value: number;
    RealPower: number;
    PowerDifference: number;
    GateOnTime: number;
    Length: number;
    Speed: number;
    prediction: string;
}

export function BatteryDashboard() {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [systemStatus, setSystemStatus] = useState<'WAITING' | 'MONITORING' | 'ANALYZING'>('WAITING');

    const [stats, setStats] = useState({
        totalCount: 1250,
        ngCount: 12,
        efficiency: 98.2,
        recentYield: 99.5
    });

    const [dataBuffer, setDataBuffer] = useState<SensorData[]>([]);
    const [ngHistory, setNgHistory] = useState<SensorData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const SIM_CONFIG = {
        OK: {
            RealPower: { mean: 150, std: 2 },
            Length: { mean: 45, std: 1 },
            GateOnTime: { mean: 85, std: 2 },
            Speed: { mean: 250, std: 2 }
        },
        NG: {
            RealPower: { mean: 130, std: 10 },
            Length: { mean: 40, std: 3 },
            GateOnTime: { mean: 95, std: 5 },
            Speed: { mean: 260, std: 5 }
        }
    };

    const generateDataPoint = () => {
        const type = Math.random() > 0.05 ? 'OK' : 'NG';
        const config = SIM_CONFIG[type];

        const rand = (mean: number, std: number) => {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            return mean + z * std;
        };

        const RealPower = Math.round(rand(config.RealPower.mean, config.RealPower.std));
        const Length = parseFloat(rand(config.Length.mean, config.Length.std).toFixed(1));
        const GateOnTime = Math.round(rand(config.GateOnTime.mean, config.GateOnTime.std));
        const Speed = Math.round(rand(config.Speed.mean, config.Speed.std));
        const PowerDifference = Math.abs(Math.round(rand(8, 3)));

        return { type, Speed, Length, RealPower, GateOnTime, PowerDifference };
    };

    const handleStartMonitoring = () => {
        setIsMonitoring(true);
        setSystemStatus('MONITORING');
        setTimeout(() => {
            setSystemStatus('ANALYZING');
        }, 2000);
    };

    const handleStopMonitoring = () => {
        setIsMonitoring(false);
        setSystemStatus('WAITING');
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isMonitoring) {
            interval = setInterval(() => {
                const newData = generateDataPoint();
                const now = new Date();
                const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

                const newEntry: SensorData = {
                    time: timeStr,
                    value: 0,
                    RealPower: newData.RealPower,
                    PowerDifference: newData.PowerDifference,
                    GateOnTime: newData.GateOnTime,
                    Length: newData.Length,
                    Speed: newData.Speed,
                    prediction: newData.type
                };

                setStats(prev => ({
                    totalCount: prev.totalCount + 1,
                    ngCount: newData.type === 'NG' ? prev.ngCount + 1 : prev.ngCount,
                    efficiency: prev.efficiency,
                    recentYield: parseFloat(((1 - (newData.type === 'NG' ? prev.ngCount + 1 : prev.ngCount) / (prev.totalCount + 1)) * 100).toFixed(1))
                }));

                if (newData.type === 'NG') {
                    setNgHistory(prev => [newEntry, ...prev].slice(0, 20));
                }

                setDataBuffer(prev => {
                    const newBuffer = [...prev, newEntry];
                    if (newBuffer.length > 20) newBuffer.shift();
                    return newBuffer;
                });
            }, 500);
        }

        return () => clearInterval(interval);
    }, [isMonitoring]);

    const getAnalysis = (item: SensorData) => {
        const issues = [];
        if (item.RealPower < 145 || item.RealPower > 155) issues.push(`출력 이상 (${item.RealPower}W)`);
        if (item.Length < 43) issues.push(`용접 길이 부족 (${item.Length}mm)`);
        if (item.PowerDifference > 15) issues.push(`전력 편차 과다 (${item.PowerDifference})`);
        if (item.GateOnTime < 80 || item.GateOnTime > 90) issues.push(`게이트 온 타임 이탈 (${item.GateOnTime}ms)`);

        return issues.length > 0 ? issues.join(', ') + ' - 센서 데이터 임계치 초과로 인한 불량 판정' : '복합적인 센서 변동에 따른 품질 저하 우려';
    };

    return (
        <>
            <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                <Battery className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">배터리 모니터링</h2>
                                <p className="text-gray-600 mt-1">배터리 제조 공정 실시간 데이터 분석</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
                            style={{ backgroundColor: isMonitoring ? '#dc2626' : '#2563eb' }}
                            className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl flex items-center gap-2 outline-none focus:ring-4 ${isMonitoring ? 'hover:bg-red-700 focus:ring-red-200' : 'hover:bg-blue-700 focus:ring-blue-200'
                                }`}
                        >
                            {isMonitoring ? <Pause className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                            {isMonitoring ? 'STOP MONITORING' : 'START MONITORING'}
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Battery className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium text-gray-600">Yield Rate</p>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{stats.recentYield}%</p>
                        <p className="text-xs text-green-600 font-medium">최고 품질 유지 중</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                <p className="text-sm font-medium text-gray-600">Total Inspected</p>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{stats.totalCount}</p>
                        <p className="text-xs text-blue-600 font-medium">누적 검사 수량</p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white text-left rounded-2xl shadow-sm p-6 border-2 border-transparent hover:border-red-400 hover:shadow-lg transition-all cursor-pointer z-10 block w-full outline-none"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <p className="text-sm font-medium text-gray-600">Defect Detected</p>
                            </div>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                        <p className="text-4xl font-bold text-red-600 mb-2">{stats.ngCount}</p>
                        <p className="text-xs text-red-600 font-medium">상세 분석 리포트 보기</p>
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-purple-600" />
                                <p className="text-sm font-medium text-gray-600">Cycle Time</p>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-gray-900 mb-2">0.5s</p>
                        <p className="text-xs text-purple-600 font-medium">최적화된 생산 속도</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Real Power */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <h3 className="text-lg font-bold text-gray-900">Real Power Stability</h3>
                            </div>
                            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">target: 150W</span>
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataBuffer}>
                                    <defs>
                                        <linearGradient id="colorRealPower" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <YAxis domain={[120, 180]} stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="RealPower" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRealPower)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Power Difference */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                <h3 className="text-lg font-bold text-gray-900">Power Difference Analysis</h3>
                            </div>
                            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">target: &lt;15</span>
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dataBuffer}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <YAxis domain={[0, 30]} stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="PowerDifference" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gate On Time */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <h3 className="text-lg font-bold text-gray-900">Gate On Time Monitoring</h3>
                            </div>
                            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">target: 85±5ms</span>
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataBuffer}>
                                    <defs>
                                        <linearGradient id="colorGateOn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <YAxis domain={[70, 110]} stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="GateOnTime" stroke="#10b981" strokeWidth={3} fill="url(#colorGateOn)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Weld Length */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                <h3 className="text-lg font-bold text-gray-900">Weld Length Precision</h3>
                            </div>
                            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">target: ≥43mm</span>
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dataBuffer}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <YAxis domain={[35, 55]} stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="Length" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Simulation Logs */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Real-time Process Logs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {dataBuffer.slice(-5).reverse().map((d, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${d.prediction === 'OK' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                                }`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-gray-400">{d.time}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.prediction === 'OK' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                                        }`}>
                                        {d.prediction}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-gray-900">{d.RealPower}W</div>
                                <div className="text-[10px] text-gray-500">Diff: {d.PowerDifference}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Analysis Modal using Portal */}
            {isModalOpen && createPortal(
                <div
                    className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                        style={{ position: 'relative', maxHeight: '85vh', width: '100%', maxWidth: '900px', margin: 'auto' }}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-xl text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">불량 분석 리포트 (NG Analysis Report)</h2>
                                    <p className="text-sm text-gray-500">AI 기반 불량 원인 및 센서 데이터 임계치 분석</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 outline-none"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            {ngHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                                    <p>현재 감지된 불량 데이터가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ngHistory.map((item, index) => (
                                        <div key={index} className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                    DETECTED AT {item.time}
                                                </span>
                                                <span className="text-xs font-medium text-gray-400">ID: BATT-{index + 1000}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-500 mb-1">Power</p>
                                                    <p className="text-sm font-bold text-gray-900">{item.RealPower}W</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-500 mb-1">Length</p>
                                                    <p className="text-sm font-bold text-gray-900">{item.Length}mm</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-500 mb-1">Diff</p>
                                                    <p className="text-sm font-bold text-gray-900">{item.PowerDifference}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-500 mb-1">Gate On</p>
                                                    <p className="text-sm font-bold text-gray-900">{item.GateOnTime}ms</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 bg-red-50 p-4 rounded-xl border border-red-100">
                                                <Zap className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-900 mb-1">AI 분석 결과</p>
                                                    <p className="text-sm text-red-800 leading-tight font-medium">
                                                        {getAnalysis(item)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-10 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
