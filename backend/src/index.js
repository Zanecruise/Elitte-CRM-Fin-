const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('./config/passport-setup');

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.FRONTEND_URLS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origem não permitida pelo CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.COOKIE_KEY || 'uma_chave_secreta_de_fallback_muito_longa',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/activities', activityRoutes);

app.get('/', (_req, res) => {
  res.send('Backend do CRM Financeiro está em execução!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
