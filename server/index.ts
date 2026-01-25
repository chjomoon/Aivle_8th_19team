import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { initDb, getDb } from './database.ts';

const app = express();
const PORT = 3001;
const SECRET_KEY = 'your-secret-key'; // In production, use environment variable

app.use(cors());
app.use(express.json());

// Initialize Database
initDb();

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes (v1) ---

app.post('/api/v1/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const db = await getDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (username, password, start_date) VALUES (?, ?, ?)', [username, hashedPassword, new Date().toISOString()]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Board Routes (v1) ---

app.get('/api/v1/board', async (req, res) => {
  try {
    const db = await getDb();
    const posts = await db.all('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/v1/board', authenticateToken, async (req: any, res) => {
  const { title, content } = req.body;
  const { id, username } = req.user;

  try {
    const db = await getDb();
    await db.run('INSERT INTO posts (title, content, author_id, author_name) VALUES (?, ?, ?, ?)',
      [title, content, id, username]);
    res.status(201).json({ message: 'Post created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.get('/api/v1/board/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

app.delete('/api/v1/board/:id', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const db = await getDb();
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [id]);

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    await db.run('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// --- Dashboard Routes (v1) ---

app.get('/api/v1/dashboard/main', async (req, res) => {
  try {
    const db = await getDb();
    const processes = await db.all('SELECT * FROM processes');
    const anomalies = await db.all('SELECT * FROM anomalies WHERE type = "anomaly"');
    const warnings = await db.all('SELECT * FROM anomalies WHERE type = "warning"');
    const history = await db.all('SELECT * FROM dashboard_history ORDER BY id ASC');

    const totalAnomalies = anomalies.reduce((sum, item) => sum + item.count, 0);
    const totalWarnings = warnings.reduce((sum, item) => sum + item.count, 0);

    const totalDelayHours =
      anomalies.reduce((sum, item) => sum + (item.count * item.avg_delay), 0) +
      warnings.reduce((sum, item) => sum + (item.count * item.avg_delay), 0);

    const anomalyData = anomalies.map(a => ({
      process: a.process_name,
      count: a.count,
      avgDelayPerIssue: a.avg_delay
    }));

    const warningData = warnings.map(w => ({
      process: w.process_name,
      count: w.count,
      avgDelayPerIssue: w.avg_delay
    }));

    const historyData = history.map(h => ({
      날짜: h.date,
      지연시간: h.total_delay
    }));

    // Add current delay to history for charts
    historyData.push({
      날짜: '1/9',
      지연시간: Number(totalDelayHours.toFixed(1))
    });

    res.json({
      anomalyData,
      warningData,
      totalAnomalies,
      totalWarnings,
      totalDelayHours,
      originalDeadline: '2026-01-20T18:00:00',
      overallEfficiency: 86.6,
      productionEfficiency: 94.2,
      historyData,
      processStats: processes.map(p => ({
        name: p.name,
        정상: p.normal_count,
        경고: p.warning_count,
        이상: p.anomaly_count
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// --- Chatbot Routes (v1) ---

app.post('/api/v1/chatbot/query', async (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();

  let response = "";

  if (lowerMessage.includes('납기') && (lowerMessage.includes('리스크') || lowerMessage.includes('위험'))) {
    response = `📊 **납기 리스크 분석 결과**\n\n현재 가장 리스크가 높은 오더는 **ORD-2026-0015**입니다.\n\n**주요 리스크 요인:**\n• 차체 조립 공정 이상 7건 발생 (예상 지연: 22.4시간)\n• 설비 점검으로 인한 가동 중단 (예상 지연: 15시간)\n• 엔진 조립 사이클 타임 초과 (예상 지연: 12시간)\n\n**총 예상 지연:** 2일 1시간\n**원래 납기:** 2026년 1월 20일\n**예상 납기:** 2026년 1월 22일 오전 7시`;
  } else if (lowerMessage.includes('프레스')) {
    response = `🏭 **프레스 공정 현황**\n\n**전체 상태:** 양호\n**가동률:** 96%\n**이상 발생:** 5건 (경고 10건)\n\n**주요 지표:**\n• 평균 압력: 862 kPa (정상 범위)\n• 평균 온도: 77°C (정상 범위)\n• 평균 진동: 1.3 mm/s (정상 범위)`;
  } else if (lowerMessage.includes('전체') || lowerMessage.includes('종합')) {
    response = `📊 **종합 공정 현황**\n\n**주요 지표:**\n• 전체 가동률: 86.6%\n• 이상 발생: 22건\n• 경고: 45건\n• 생산 효율: 94.2%`;
  } else {
    response = "죄송합니다. 해당 질문에 대해 학습된 데이터가 부족합니다. '납기 리스크'나 '프레스 공정'에 대해 물어봐주세요.";
  }

  res.json({ content: response });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
