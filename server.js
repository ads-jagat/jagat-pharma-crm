const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');
const leadsRoutes = require('./routes/leads');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use(require('express').static('public'));

app.use('/webhook', webhookRoutes);
app.use('/api/leads', leadsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', project: 'Jagat Pharma CRM' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Jagat CRM running on port ${PORT}`));