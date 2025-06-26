const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  create: ({ username, email, password }, callback) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return callback(err);

      const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.run(sql, [username, email, hash], function (err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID });
      });
    });
  },

  findByEmail: (email, callback) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], callback);
  },

  findById: (id, callback) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], callback);
  },

  comparePassword: (candidatePassword, hash, callback) => {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
      if (err) return callback(err);
      callback(null, isMatch);
    });
  },
};

module.exports = User;