// electron/services/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'playsense.db');

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables();

  return db;
}

function createTables() {
  if (!db) return;

  // Gaming Sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS gaming_sessions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      game_name TEXT NOT NULL,
      game_executable TEXT NOT NULL,
      category TEXT CHECK(category IN ('competitive', 'creative', 'casual', 'social', 'unknown')) DEFAULT 'unknown',
      started_at DATETIME NOT NULL,
      ended_at DATETIME,
      duration_minutes INTEGER,
      is_synced BOOLEAN DEFAULT 0,
      synced_at DATETIME,
      cloud_session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add cloud_session_id column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE gaming_sessions ADD COLUMN cloud_session_id TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON gaming_sessions(started_at)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_sync ON gaming_sessions(is_synced)
  `);


  // Known Games Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS known_games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      executables TEXT NOT NULL,
      category TEXT NOT NULL,
      icon_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // App Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add games_last_synced setting if it doesn't exist
  db.exec(`
    INSERT OR IGNORE INTO settings (key, value, updated_at)
    VALUES ('games_last_synced', '1970-01-01T00:00:00Z', datetime('now'))
  `);

  // Sync Queue
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      last_attempt DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert known games
  seedKnownGames();
}

function seedKnownGames() {
  if (!db) return;

  const knownGames = [
    { name: "Fortnite", executables: ["FortniteClient-Win64-Shipping.exe", "FortniteClient-Mac-Shipping"], category: "competitive" },
    { name: "Valorant", executables: ["VALORANT.exe", "VALORANT-Win64-Shipping.exe"], category: "competitive" },
    { name: "League of Legends", executables: ["LeagueClient.exe", "League of Legends.exe"], category: "competitive" },
    { name: "Counter-Strike 2", executables: ["cs2.exe", "csgo.exe"], category: "competitive" },
    { name: "Apex Legends", executables: ["r5apex.exe"], category: "competitive" },
    { name: "Overwatch 2", executables: ["Overwatch.exe"], category: "competitive" },
    { name: "Rocket League", executables: ["RocketLeague.exe"], category: "competitive" },
    { name: "Call of Duty", executables: ["cod.exe", "ModernWarfare.exe", "BlackOpsColdWar.exe", "iw4sp.exe", "iw4mp.exe"], category: "competitive" },
    { name: "Minecraft", executables: ["javaw.exe", "Minecraft.exe", "minecraft-launcher.exe"], category: "creative" },
    { name: "Roblox", executables: ["RobloxPlayerBeta.exe", "RobloxPlayer"], category: "creative" },
    { name: "Terraria", executables: ["Terraria.exe"], category: "creative" },
    { name: "The Sims 4", executables: ["TS4_x64.exe", "The Sims 4"], category: "creative" },
    { name: "Among Us", executables: ["Among Us.exe"], category: "casual" },
    { name: "Fall Guys", executables: ["FallGuys_client_game.exe"], category: "casual" },
    { name: "Stardew Valley", executables: ["Stardew Valley.exe"], category: "casual" },
    { name: "Discord", executables: ["Discord.exe", "DiscordCanary.exe", "DiscordPTB.exe"], category: "social" },
    { name: "Steam", executables: ["steam.exe"], category: "social" },
    { name: "VRChat", executables: ["VRChat.exe"], category: "social" },
    { name: "Rec Room", executables: ["RecRoom.exe"], category: "social" },
  ];

  // Use INSERT OR REPLACE to update existing entries
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO known_games (id, name, executables, category)
    VALUES (?, ?, ?, ?)
  `);

  for (const game of knownGames) {
    const id = game.name.toLowerCase().replace(/\s+/g, '-');
    upsert.run(id, game.name, JSON.stringify(game.executables), game.category);
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

