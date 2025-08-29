const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./database'); // Inicializa a conexão com o banco

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', require('./routes/movies'));

app.get('/', (req, res) => {
  res.json({ message: 'API OMDB Movie App' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});