import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock data based on MainDashboard.tsx
const getMainDashboardData = () => {
  const anomalyData = [
    { process: '프레스', count: 5, avgDelayPerIssue: 2.5 },
    { process: '엔진', count: 3, avgDelayPerIssue: 4.0 },
    { process: '차체', count: 7, avgDelayPerIssue: 3.2 },
    { process: '도장', count: 4, avgDelayPerIssue: 2.8 },
    { process: '설비', count: 3, avgDelayPerIssue: 5.0 },
  ];

  const warningData = [
    { process: '프레스', count: 10, avgDelayPerIssue: 0.5 },
    { process: '엔진', count: 7, avgDelayPerIssue: 0.8 },
    { process: '차체', count: 15, avgDelayPerIssue: 0.6 },
    { process: '도장', count: 8, avgDelayPerIssue: 0.4 },
    { process: '설비', count: 5, avgDelayPerIssue: 1.0 },
  ];

  const totalAnomalies = anomalyData.reduce((sum, item) => sum + item.count, 0);
  const totalWarnings = warningData.reduce((sum, item) => sum + item.count, 0);

  const totalDelayHours = 
    anomalyData.reduce((sum, item) => sum + (item.count * item.avgDelayPerIssue), 0) +
    warningData.reduce((sum, item) => sum + (item.count * item.avgDelayPerIssue), 0);

  const originalDeadline = '2026-01-20T18:00:00';
  
  return {
    anomalyData,
    warningData,
    totalAnomalies,
    totalWarnings,
    totalDelayHours,
    originalDeadline,
    overallEfficiency: 86.6,
    productionEfficiency: 94.2
  };
};

app.get('/api/dashboard/main', (req, res) => {
  res.json(getMainDashboardData());
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
