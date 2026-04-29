// api/admin/responses.js
const { getDB } = require('../_db');
const { checkAuth, setCors } = require('../_auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req, res)) return;

  const db = getDB();

  // ── GET: 列出（分頁 + 篩選）
  if (req.method === 'GET') {
    const { personality, shade, page = '1', limit = '30', id } = req.query;

    // 單筆查詢（給 viewResponse 用）
    if (id) {
      const { data } = await db.from('responses').select('*').eq('id', id).single();
      return res.json(data || null);
    }

    let query = db.from('responses').select('*', { count: 'exact' });
    if (personality && personality !== 'all') query = query.eq('personality', personality);
    if (shade && shade !== 'all') query = query.eq('shade', shade);

    const pg = Math.max(1, Number(page));
    const lim = Math.min(100, Math.max(1, Number(limit)));
    query = query.order('created_at', { ascending: false })
                 .range((pg - 1) * lim, pg * lim - 1);

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.json({
      data: data || [],
      total: count || 0,
      page: pg,
      pages: Math.ceil((count || 0) / lim)
    });
  }

  // ── DELETE: 刪除單筆或全部
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (id) {
      await db.from('responses').delete().eq('id', id);
    } else {
      await db.from('responses').delete().neq('id', 0); // delete all
    }
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
