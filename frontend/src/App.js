import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Buscar filmes
  const searchMovies = async (query) => {
    if (!query) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/movies/search`, {
        params: { query }
      });
      
      if (response.data.Search) {
        setMovies(response.data.Search);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao buscar filmes');
    } finally {
      setLoading(false);
    }
  };

  // Carregar filmes favoritos
  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/movies/favorites/all`);
      setFavorites(response.data);
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
    }
  };

  // Adicionar aos favoritos
  const addToFavorites = async (movie) => {
    try {
      await axios.post(`${API_BASE_URL}/movies/favorites`, {
        imdb_id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        type: movie.Type,
        poster: movie.Poster
      });
      
      loadFavorites(); // Recarregar lista de favoritos
      alert('Filme adicionado aos favoritos!');
    } catch (err) {
      alert('Erro ao adicionar aos favoritos');
    }
  };

  // Remover dos favoritos
  const removeFromFavorites = async (imdbId) => {
    try {
      await axios.delete(`${API_BASE_URL}/movies/favorites/${imdbId}`);
      loadFavorites(); // Recarregar lista de favoritos
      alert('Filme removido dos favoritos!');
    } catch (err) {
      alert('Erro ao remover dos favoritos');
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 Movie Search App</h1>
        
        {/* Barra de pesquisa */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar filmes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMovies(searchQuery)}
          />
          <button onClick={() => searchMovies(searchQuery)}>
            🔍 Buscar
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Resultados da busca */}
        {loading && <div>Carregando...</div>}
        
        <div className="movies-grid">
          {movies.map(movie => (
            <div key={movie.imdbID} className="movie-card">
              <img 
                src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder-movie.png'} 
                alt={movie.Title}
              />
              <h3>{movie.Title}</h3>
              <p>{movie.Year} • {movie.Type}</p>
              <button onClick={() => addToFavorites(movie)}>
                ⭐ Adicionar aos Favoritos
              </button>
            </div>
          ))}
        </div>

        {/* Lista de favoritos */}
        <div className="favorites-section">
          <h2>⭐ Meus Filmes Favoritos</h2>
          <div className="favorites-grid">
            {favorites.map(movie => (
              <div key={movie.imdb_id} className="favorite-card">
                <img 
                  src={movie.poster !== 'N/A' ? movie.poster : '/placeholder-movie.png'} 
                  alt={movie.title}
                />
                <h4>{movie.title}</h4>
                <p>{movie.year} • {movie.type}</p>
                <button onClick={() => removeFromFavorites(movie.imdb_id)}>
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