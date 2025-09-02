const express = require('express');
const axios = require('axios');
const db = require('../database');
const router = express.Router();

// PROXY PARA API OMDB - SOLUÇÃO PARA VM SEM INTERNET
router.get('/proxy/omdb', async (req, res) => {
  try {
    const { s, i, t, page = 1, type, y } = req.query;
    
    // Validar parâmetros
    if (!s && !i && !t) {
      return res.status(400).json({ 
        error: 'Parâmetro de busca necessário. Use: s (search), i (id) ou t (title)' 
      });
    }

    const params = {
      apikey: process.env.OMDB_API_KEY,
      s: s,
      i: i,
      t: t,
      page: page,
      type: type,
      y: y
    };

    // Remover parâmetros undefined/null
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null) {
        delete params[key];
      }
    });

    console.log('Buscando na OMDB API com parâmetros:', params);

    const response = await axios.get('http://www.omdbapi.com/', {
      params: params,
      timeout: 15000
    });

    // Se a API retornar erro, repassar para o frontend
    if (response.data.Response === 'False') {
      return res.status(404).json({ 
        error: response.data.Error || 'Filme não encontrado' 
      });
    }

    res.json(response.data);

  } catch (error) {
    console.error('Erro no proxy OMDB:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH') {
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível. Sem conexão com a API externa.' 
      });
    }
    
    if (error.response) {
      // Erro da API OMDB
      return res.status(error.response.status).json({ 
        error: error.response.data.Error || 'Erro na API OMDB' 
      });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar filmes via proxy
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Parâmetro query é obrigatório' });
    }

    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: query,
        page: page
      },
      timeout: 10000
    });

    if (response.data.Response === 'False') {
      return res.status(404).json({ error: response.data.Error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar filmes:', error.message);
    
    // Fallback para mock data em caso de erro
    const mockData = generateMockData(req.query.query);
    res.json(mockData);
  }
});

// Buscar filme por ID via proxy
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: id
      },
      timeout: 10000
    });

    if (response.data.Response === 'False') {
      return res.status(404).json({ error: response.data.Error });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar filme por ID:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para gerar mock data (fallback)
function generateMockData(query) {
  const mockMovies = [
    {
      Title: "Batman Begins",
      Year: "2005",
      imdbID: "tt0372784",
      Type: "movie",
      Poster: "https://m.media-amazon.com/images/M/MV5BOTY4YjI2N2MtYmFlMC00ZjcyLTg3YjEtMDQyM2ZjYzQ5YWFkXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg"
    },
    {
      Title: "The Dark Knight",
      Year: "2008",
      imdbID: "tt0468569",
      Type: "movie",
      Poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg"
    },
    {
      Title: "The Dark Knight Rises",
      Year: "2012",
      imdbID: "tt1345836",
      Type: "movie",
      Poster: "https://m.media-amazon.com/images/M/MV5BMTk4ODQzNDY3Ml5BMl5BanBnXkFtZTcwODA0NTM4Nw@@._V1_SX300.jpg"
    }
  ];

  const filteredMovies = query ? 
    mockMovies.filter(movie => 
      movie.Title.toLowerCase().includes(query.toLowerCase())
    ) : mockMovies;

  return {
    Search: filteredMovies,
    totalResults: filteredMovies.length.toString(),
    Response: "True"
  };
}

// ADICIONAR AOS FAVORITOS
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

// LISTAR FAVORITOS
router.get('/favorites/all', (req, res) => {
  const query = 'SELECT * FROM favorite_movies ORDER BY created_at DESC';

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// REMOVER DOS FAVORITOS
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