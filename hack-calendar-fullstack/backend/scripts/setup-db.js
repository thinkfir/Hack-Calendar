const fs = require('fs');
const path = require('path');

// Define the path to the database file, relative to this script's location
const dbPath = path.resolve(__dirname, '../database.sqlite');

// --- Start: Delete existing database file ---
try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database file deleted successfully.');
  }
} catch (err) {
  console.error('Error deleting existing database file:', err);
  process.exit(1); // Exit the script if we can't delete the old DB
}
// --- End: Delete existing database file ---

const db = require('../src/config/database');

db.serialize(() => {
  console.log('Starting database setup...');

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hackathons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        start_date DATETIME NOT NULL,
        duration_hours INTEGER NOT NULL,
        project_idea TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hackathon_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color_index INTEGER NOT NULL CHECK (color_index BETWEEN 0 AND 7),
        sleep_start TIME DEFAULT '02:00',
        sleep_end TIME DEFAULT '08:00',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS member_skills (
        member_id INTEGER NOT NULL,
        skill_id INTEGER NOT NULL,
        PRIMARY KEY (member_id, skill_id),
        FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hackathon_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        phase_id INTEGER NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        estimated_hours REAL NOT NULL,
        priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Blocked')) DEFAULT 'Not Started',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE,
        FOREIGN KEY (phase_id) REFERENCES task_phases(id)
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
        task_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (task_id, member_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_dependencies (
        task_id INTEGER NOT NULL,
        depends_on_task_id INTEGER NOT NULL,
        PRIMARY KEY (task_id, depends_on_task_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        CHECK (task_id != depends_on_task_id)
    );

    CREATE TABLE IF NOT EXISTS ai_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hackathon_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
    );
  `;

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
      return db.close();
    }
    console.log('Tables created successfully.');

    const insertPhases = `
      INSERT OR IGNORE INTO task_phases (name, display_order) VALUES 
          ('planning', 1),
          ('design', 2),
          ('development', 3),
          ('integration', 4),
          ('testing', 5),
          ('presentation', 6);
    `;

    db.exec(insertPhases, (err) => {
      if (err) {
        console.error('Error inserting default task phases:', err.message);
        return db.close();
      }
      console.log('Default task phases inserted successfully.');

      const indexes = `
          CREATE INDEX IF NOT EXISTS idx_hackathons_user ON hackathons(user_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_hackathon ON tasks(hackathon_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);
          CREATE INDEX IF NOT EXISTS idx_members_hackathon ON team_members(hackathon_id);
          CREATE INDEX IF NOT EXISTS idx_task_assignments_member ON task_assignments(member_id);
          CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
      `;

      db.exec(indexes, (err) => {
        if (err) {
          console.error('Error creating indexes:', err.message);
        } else {
          console.log('Indexes created successfully.');
        }
        console.log('Database setup complete.');
        db.close((err) => {
          if (err) {
            console.error('Error closing the database:', err.message);
          }
        });
      });
    });
  });
});