import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

console.log(process.env.REACT_APP_API_URL);

// Configuração dinâmica para API base
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.94.131:5000/api';

// Configurar axios com timeout e tratamento de erro global
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('Não foi possível conectar ao servidor backend');
      return Promise.reject(new Error('Servidor backend indisponível'));
    }
    return Promise.reject(error);
  }
);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Verificar status do backend
  const checkBackendStatus = async () => {
    try {
      await api.get('/health');
      setBackendStatus('online');
      setError('');
    } catch (err) {
      setBackendStatus('offline');
      setError('Backend indisponível. Verifique a conexão.');
      console.error('Erro de conexão com backend:', err);
    }
  };

  // Buscar filmes
  const searchMovies = async (query) => {
  if (!query) return;
  
  if (backendStatus === 'offline') {
    await checkBackendStatus();
    if (backendStatus === 'offline') return;
  }
  
  setLoading(true);
  setError('');
  
  try {
    // USAR O PROXY NO BACKEND
    const response = await api.get('/api/movies/proxy/omdb', {
      params: { s: query }
    });
    
    if (response.data.Search) {
      setMovies(response.data.Search);
    }
  } catch (err) {
    setError(err.response?.data?.error || 'Erro ao buscar filmes');
    if (err.response?.status === 0 || err.code === 'ECONNREFUSED') {
      setBackendStatus('offline');
    }
  } finally {
    setLoading(false);
  }
};

// ADICIONAR FUNÇÃO PARA BUSCAR DETALHES:
const getMovieDetails = async (imdbID) => {
  try {
    const response = await api.get('/api/movies/proxy/omdb', {
      params: { i: imdbID }
    });
    return response.data;
  } catch (err) {
    console.error('Erro ao buscar detalhes:', err);
    return null;
  }
};

  // Carregar filmes favoritos
  const loadFavorites = async () => {
    try {
      const response = await api.get('/movies/favorites/all');
      setFavorites(response.data);
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
      if (err.response?.status === 0 || err.code === 'ECONNREFUSED') {
        setBackendStatus('offline');
      }
    }
  };

  // Adicionar aos favoritos
  const addToFavorites = async (movie) => {
    try {
      await api.post('/movies/favorites', {
        imdb_id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        type: movie.Type,
        poster: movie.Poster
      });
      
      loadFavorites();
      alert('Filme adicionado aos favoritos!');
    } catch (err) {
      alert('Erro ao adicionar aos favoritos');
    }
  };

  // Remover dos favoritos
  const removeFromFavorites = async (imdbId) => {
    try {
      await api.delete(`/movies/favorites/${imdbId}`);
      loadFavorites();
      alert('Filme removido dos favoritos!');
    } catch (err) {
      alert('Erro ao remover dos favoritos');
    }
  };

  useEffect(() => {
    checkBackendStatus();
    loadFavorites();
    
    // Verificar status periodicamente
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 Movie Search App</h1>
        
        {/* Indicador de status do backend */}
        <div className={`status-indicator ${backendStatus}`}>
          Backend: {backendStatus === 'online' ? '✅ Online' : '❌ Offline'}
        </div>
        
        {/* Barra de pesquisa */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar filmes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMovies(searchQuery)}
            disabled={backendStatus === 'offline'}
          />
          <button 
            onClick={() => searchMovies(searchQuery)}
            disabled={backendStatus === 'offline' || loading}
          >
            {loading ? '⏳ Buscando...' : '🔍 Buscar'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Resultados da busca */}
        {loading && <div className="loading">Carregando...</div>}
        
        <div className="movies-grid">
          {movies.map(movie => (
            <div key={movie.imdbID} className="movie-card">
              <img 
                src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder-movie.png'} 
                alt={movie.Title}
                onError={(e) => {
                  e.target.src = '/placeholder-movie.png';
                }}
              />
              <h3>{movie.Title}</h3>
              <p>{movie.Year} • {movie.Type}</p>
              <button 
                onClick={() => addToFavorites(movie)}
                disabled={backendStatus === 'offline'}
              >
                ⭐ Adicionar aos Favoritos
              </button>
            </div>
          ))}
        </div>

        {/* Lista de favoritos */}
        <div className="favorites-section">
          <h2>⭐ Meus Filmes Favoritos</h2>
          {backendStatus === 'offline' && (
            <div className="warning">
              Modo offline: Os favoritos não podem ser atualizados
            </div>
          )}
          <div className="favorites-grid">
            {favorites.map(movie => (
              <div key={movie.imdb_id} className="favorite-card">
                <img 
                  src={movie.poster !== 'N/A' ? movie.poster : '/placeholder-movie.png'} 
                  alt={movie.title}
                  onError={(e) => {
                    e.target.src = '/placeholder-movie.png';
                  }}
                />
                <h4>{movie.title}</h4>
                <p>{movie.year} • {movie.type}</p>
                <button 
                  onClick={() => removeFromFavorites(movie.imdb_id)}
                  disabled={backendStatus === 'offline'}
                >
                  ❌ Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
