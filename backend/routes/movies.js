const express = require('express');
const axios = require('axios');
const db = require('../database');
const router = express.Router();

// Buscar filmes na OMDB API
router.get('/search', async (req, res) => {
  try {
    // Tentar usar proxy primeiro
    const omdbResponse = await axios.get('http://www.omdbapi.com/', {
      params: { apikey: process.env.OMDB_API_KEY, s: req.query.query },
      timeout: 5000
    });
    
    res.json(omdbResponse.data);
  } catch (error) {
    console.log('Falha no proxy, usando mock data');
    // Fallback para mock data
    const mockData = await generateMockData(req.query.query);
    res.json(mockData);
  }
});

// Buscar filme por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: id
      }
    });

    if (response.data.Response === 'False') {
      return res.status(404).json({ error: response.data.Error });
    }

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Adicionar filme aos favoritos
router.post('/favorites', (req, res) => {
  const { imdb_id, title, year, type, poster } = req.body;

  const query = `
    INSERT INTO favorite_movies (imdb_id, title, year, type, poster)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE title=VALUES(title), year=VALUES(year)
  `;

  db.query(query, [imdb_id, title, year, type, poster], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Filme adicionado aos favoritos', id: results.insertId });
  });
});

// Listar filmes favoritos
router.get('/favorites/all', (req, res) => {
  const query = 'SELECT * FROM favorite_movies ORDER BY created_at DESC';

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Remover filme dos favoritos
router.delete('/favorites/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM favorite_movies WHERE imdb_id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Filme removido dos favoritos' });
  });
});

module.exports = router;