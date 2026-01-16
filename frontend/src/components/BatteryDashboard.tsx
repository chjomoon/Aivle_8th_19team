import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Battery, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export function BatteryDashboard() {
    const [inputs, setInputs] = useState({
        Speed: 250,
        Length: 241.1,
        RealPower: 1688,
        SetFrequency: 1000,
        SetDuty: 100,
        SetPower: 82,
        GateOnTime: 1154
    });

    const [prediction, setPrediction] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: parseFloat(value)
        }));
    };

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        try {
            // In production, this should point to the proxy /ml-api/predict
            // For local dev without proxy setup yet, we might need direct URL if CORS allows, 
            // but let's assume /ml-api is set up or will be set up.
            // If direct access is needed temporarily: http://localhost:8000/predict
            const response = await fetch('/ml-api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inputs),
            });

            if (!response.ok) {
                throw new Error('Prediction failed');
            }

            const data = await response.json();
            setPrediction(data.prediction);
        } catch (err) {
            console.error(err);
            setError('예측 서비스 연결 실패');
            // Fallback for demo if backend not running
            // setPrediction(inputs.RealPower < 1650 ? 'NG' : 'OK');
        } finally {
            setLoading(false);
        }
    };

    // Mock data for charts
    const trendData = [
        { time: '10:00', power: 1700, temp: 65 },
        { time: '10:05', power: 1710, temp: 66 },
        { time: '10:10', power: 1690, temp: 65 },
        { time: '10:15', power: inputs.RealPower, temp: 67 },
        { time: '10:20', power: 1705, temp: 66 },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">배터리팩 예지보전 대시보드</h2>
                <p className="text-gray-600 mt-1">용접 공정 품질 예측 및 상태 모니터링</p>
            </div>

            <div className="grid grid-cols-1lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            공정 파라미터 입력
                        </h3>
                        <button
                            onClick={handlePredict}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : '예측 실행'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Speed (용접 속도)</label>
                            <input type="number" name="Speed" value={inputs.Speed} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RealPower (실제 전력)</label>
                            <input type="number" name="RealPower" value={inputs.RealPower} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Length (용접 길이)</label>
                            <input type="number" name="Length" value={inputs.Length} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GateOnTime</label>
                            <input type="number" name="GateOnTime" value={inputs.GateOnTime} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                        </div>
                        {/* Added sliders for interaction */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SetPower Adjustment</label>
                            <input type="range" min="50" max="100" name="SetPower" value={inputs.SetPower} onChange={handleInputChange} className="w-full" />
                            <div className="text-right text-xs text-gray-500">{inputs.SetPower}</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Results & Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Prediction Result Card */}
                    <div className={`rounded-xl shadow-sm p-6 border-l-4 ${prediction === 'NG' ? 'bg-red-50 border-red-500' : prediction === 'OK' ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">예측 결과</p>
                                <div className="flex items-center gap-3">
                                    {prediction === 'NG' ? (
                                        <AlertTriangle className="w-8 h-8 text-red-600" />
                                    ) : prediction === 'OK' ? (
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    ) : (
                                        <Battery className="w-8 h-8 text-gray-400" />
                                    )}
                                    <span className="text-3xl font-bold text-gray-900">
                                        {prediction || '대기 중'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">모델 상태</p>
                                <p className="text-green-600 font-medium">Random Forest (Accuracy 99.2%)</p>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    {/* Charts */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">전력 모니터링 트렌드</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis domain={[1600, 1800]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="power" stroke="#2563eb" strokeWidth={2} name="실제 전력 (W)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
