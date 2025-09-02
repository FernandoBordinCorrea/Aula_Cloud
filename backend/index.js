const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./database'); // Inicializa a conexão com o banco

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: FRONTEND_URL, // Permite apenas requisições do frontend
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/movies', require('./routes/movies'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'API OMDB Movie App',
    version: '1.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
  console.log(`Acessível em: http://0.0.0.0:${PORT}`);
  console.log(`Frontend configurado para: ${FRONTEND_URL}`);
});