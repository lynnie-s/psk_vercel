// api/admin/export.js
const { getDB } = require('../_db');
const { checkAuth, setCors } = require('../_auth');

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req, res)) return;

  const db = getDB();
  const { data } = await db
    .from('responses')
    .select('*')
    .order('created_at', { ascending: true });

  const rows = data || [];
  const lines = ['id,personality,shade,answers,ip,created_at'];
  rows.forEach(r => {
    const ans = JSON.stringify(r.answers || []).replace(/"/g, '""');
    lines.push([r.id, r.personality, r.shade, `"${ans}"`, r.ip || '', r.created_at].join(','));
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="psk_responses.csv"');
  res.send('\uFEFF' + lines.join('\n'));
};
