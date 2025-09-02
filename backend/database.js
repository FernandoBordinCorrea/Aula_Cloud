const mysql = require('mysql2');
require('dotenv').config();

// Configuração para conectar ao MySQL na VM de banco de dados
const connection = mysql.createConnection({
  host: process.env.DB_HOST, // IP da VM Database
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    // Tentar reconectar após 2 segundos
    setTimeout(() => connection.connect(), 2000);
    return;
  }
  console.log('Conectado ao MySQL na VM Database');

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
    } else {
      console.log('Tabela favorite_movies verificada/criada com sucesso');
    }
  });
});

module.exports = connection;