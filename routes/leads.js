router.get('/:phone/messages', async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const result = await pool.query(
      'SELECT * FROM messages WHERE phone = $1 ORDER BY received_at ASC',
      [phone]
    );
    res.set('Cache-Control', 'no-store').json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});