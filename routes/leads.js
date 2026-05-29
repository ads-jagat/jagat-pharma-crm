const express = require('express');
const router = express.Router();
const pool = require('../middleware/db');

router.get('/', async (req, res) => {
  try {
    const { status, source, search } = req.query;
    let conditions = [];
    let values = [];
    let i = 1;

    if (status) { conditions.push(`status = $${i++}`); values.push(status); }
    if (source) { conditions.push(`source = $${i++}`); values.push(source); }
    if (search) {
      conditions.push(`(name ILIKE $${i} OR phone ILIKE $${i})`);
      values.push(`%${search}%`); i++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(
      `SELECT * FROM leads ${where} ORDER BY received_at DESC`, values
    );
    res.set('Cache-Control', 'no-store').json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lead = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    const notes = await pool.query(
      'SELECT * FROM notes WHERE lead_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    if (!lead.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...lead.rows[0], notes: notes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['New', 'Follow-up', 'Closed'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const result = await pool.query(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/notes', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Note text required' });
    const result = await pool.query(
      'INSERT INTO notes (lead_id, text) VALUES ($1, $2) RETURNING *',
      [req.params.id, text]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, query, source, status } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const result = await pool.query(
      `INSERT INTO leads (name, phone, query, source, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name || 'Unknown', phone, query || '', source || 'Team', status || 'New']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;