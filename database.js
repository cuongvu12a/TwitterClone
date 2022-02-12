const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const dbUri = process.env.DB_URI || '';

class Database {
  constructor() {
    this.connect();
  }
  connect() {
    mongoose
      .connect(dbUri)
      .then(() => {
        console.log('Database connection successful!');
      })
      .catch((err) => {
        console.log('Database connection error: ' + err);
      });
  }
}

module.exports = new Database();
