const db = require('../config/database');

const Hackathon = {
  create: ({ name, startDate, durationHours, projectIdea }, callback) => {
    const sql = 'INSERT INTO hackathons (name, start_date, duration_hours, project_idea) VALUES (?, ?, ?, ?)';
    db.run(sql, [name, startDate, durationHours, projectIdea], function (err) {
      callback(err, { id: this.lastID });
    });
  },

  findAll: (callback) => {
    const sql = 'SELECT * FROM hackathons ORDER BY start_date DESC';
    db.all(sql, [], callback);
  },

  findById: (id, callback) => {
    const sql = 'SELECT * FROM hackathons WHERE id = ?';
    db.get(sql, [id], callback);
  },

  update: (id, { name, startDate, durationHours, projectIdea }, callback) => {
    const sql = 'UPDATE hackathons SET name = ?, start_date = ?, duration_hours = ?, project_idea = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [name, startDate, durationHours, projectIdea, id], function (err) {
      callback(err, { changes: this.changes });
    });
  },

  delete: (id, callback) => {
    const sql = 'DELETE FROM hackathons WHERE id = ?';
    db.run(sql, [id], function (err) {
      callback(err, { changes: this.changes });
    });
  },
};

module.exports = Hackathon;