const db = require('../config/database');

const Hackathon = {
  create: ({ name, startDate, durationHours, projectIdea, userId }, callback) => {
    const sql = 'INSERT INTO hackathons (name, start_date, duration_hours, project_idea, user_id) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [name, startDate, durationHours, projectIdea, userId], function (err) {
      if (err) return callback(err);
      callback(null, { id: this.lastID });
    });
  },

  findAllByUserId: (userId, callback) => {
    const sql = 'SELECT * FROM hackathons WHERE user_id = ? ORDER BY start_date DESC';
    db.all(sql, [userId], callback);
  },

  findById: (id, userId, callback) => {
    const sql = 'SELECT * FROM hackathons WHERE id = ? AND user_id = ?';
    db.get(sql, [id, userId], callback);
  },

  update: (id, userId, { name, startDate, durationHours, projectIdea }, callback) => {
    const sql = 'UPDATE hackathons SET name = ?, start_date = ?, duration_hours = ?, project_idea = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
    db.run(sql, [name, startDate, durationHours, projectIdea, id, userId], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  },

  delete: (id, userId, callback) => {
    const sql = 'DELETE FROM hackathons WHERE id = ? AND user_id = ?';
    db.run(sql, [id, userId], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this.changes });
    });
  },
};

module.exports = Hackathon;