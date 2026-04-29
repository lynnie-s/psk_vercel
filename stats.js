// api/admin/stats.js
const { getDB } = require('../_db');
const { checkAuth, setCors } = require('../_auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req, res)) return;

  const db = getDB();

  // 總數
  const { count: total } = await db
    .from('responses')
    .select('*', { count: 'exact', head: true });

  // 今日
  const today_start = new Date();
  today_start.setHours(0, 0, 0, 0);
  const { count: today } = await db
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today_start.toISOString());

  // 人格分佈
  const { data: byPersonality } = await db
    .from('responses')
    .select('personality');

  // 色號分佈
  const { data: byShade } = await db
    .from('responses')
    .select('shade');

  // 最近 15 筆
  const { data: recent } = await db
    .from('responses')
    .select('id, personality, shade, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  // 近 14 天趨勢（用 JS 計算）
  const { data: trendRaw } = await db
    .from('responses')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 13 * 86400000).toISOString());

  const trendMap = {};
  (trendRaw || []).forEach(r => {
    const day = r.created_at.substring(0, 10);
    trendMap[day] = (trendMap[day] || 0) + 1;
  });
  const trend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  // 聚合人格/色號計數
  const pCount = {}, sCount = {};
  (byPersonality || []).forEach(r => pCount[r.personality] = (pCount[r.personality] || 0) + 1);
  (byShade || []).forEach(r => sCount[r.shade] = (sCount[r.shade] || 0) + 1);

  res.json({
    total: total || 0,
    today: today || 0,
    byPersonality: Object.entries(pCount).map(([personality, count]) => ({ personality, count })),
    byShade: Object.entries(sCount).map(([shade, count]) => ({ shade, count })),
    recent: recent || [],
    trend
  });
};
