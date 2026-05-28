const express = require('express');
const router = express.Router();
const pool = require('../middleware/db');

function normalise(source, body) {
  if (source === 'bitespeed') {
    return {
      name: ((body.firstName || '') + ' ' + (body.lastName || '')).trim(),
      phone: body.phone || body.phoneNumber || '',
      query: body.lastMessage || body.message || ''
    };
  }
  if (source === 'kwikengage') {
    return {
      name: (body.contact && body.contact.name) || body.name || '',
      phone: (body.contact && body.contact.phone) || body.phone || '',
      query: body.text || body.message || ''
    };
  }
  if (source === 'team') {
    return {
      name: body.name || body.pushname || '',
      phone: body.from || body.phone || '',
      query: body.body || body.message || ''
    };
  }
  return {
    name: body.name || '',
    phone: body.phone || '',
    query: body.message || ''
  };
}

async function saveLead(source, body, res) {
  try {
    const { name, phone, query } = normalise(source, body);
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const sourceLabel = source.charAt(0).toUpperCase() + source.slice(1);
    const result = await pool.query(
      `INSERT INTO leads (name, phone, query, source)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name || 'Unknown', phone.replace(/\s+/g, ''), query, sourceLabel]
    );
    console.log(`New lead from ${sourceLabel}:`, phone);
    res.json({ success: true, lead: result.rows[0] });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
}

router.post('/bitespeed',  (req, res) => saveLead('bitespeed',  req.body, res));
router.post('/kwikengage', (req, res) => saveLead('kwikengage', req.body, res));
router.post('/team',       (req, res) => saveLead('team',       req.body, res));

module.exports = router;