const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL');

  // Criar tabela de filmes favoritos
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS favorite_movies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      imdb_id VARCHAR(20) UNIQUE,
      title VARCHAR(255),
      year VARCHAR(10),
      type VARCHAR(20),
      poster TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error('Erro ao criar tabela:', err);
    }
  });
});

module.exports = connection;