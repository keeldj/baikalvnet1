import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createHash } from 'node:crypto';
import config from '../config.js';
import logger from '../utils/logger.js'; // Предполагается наличие модуля для логирования

// Инициализация базы данных
export const setupDB = async () => {
  try {
    const db = await open({
      filename: config.DB_PATH || './data/vpnbot.db', // Используем путь из конфига
      driver: sqlite3.Database,
    });

    // Включение журналирования запросов
    db.on('trace', (query) => logger.debug(`SQL: ${query}`));

    await db.exec(`
      PRAGMA foreign_keys = ON; -- Включение внешних ключей

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        expiry TEXT NOT NULL CHECK(datetime(expiry) IS NOT NULL),
        traffic_used INTEGER DEFAULT 0 CHECK(traffic_used >= 0),
        traffic_total INTEGER DEFAULT ${config.DEFAULT_TRAFFIC} CHECK(traffic_total > 0),
        devices INTEGER DEFAULT 1 CHECK(devices BETWEEN 1 AND 5),
        notifications BOOLEAN DEFAULT TRUE,
        auth_token TEXT UNIQUE,
        referrals INTEGER DEFAULT 0 CHECK(referrals >= 0)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL CHECK(length(message) > 5),
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'pending')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS referrals (
        referrer_id INTEGER NOT NULL REFERENCES users(id),
        referred_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (referrer_id, referred_id)
      );
    `);

    logger.info('Database initialized successfully');
    return db;
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    throw error;
  }
};

// Хеширование токенов
export const hashToken = (token) => 
  createHash('sha256').update(token + config.SALT).digest('hex');

// Получение пользователя с обработкой ошибок
export const getUser = async (db, userId) => {
  try {
    return await db.get(
      'SELECT * FROM users WHERE id = ?',
      userId
    );
  } catch (error) {
    logger.error(`Failed to get user ${userId}: ${error.message}`);
    throw new Error('Database operation failed');
  }
};

// Создание пользователя с транзакцией
export const createUser = async (db, ctx, token) => {
  const transaction = await db.beginTransaction();
  try {
    await transaction.run(
      `INSERT INTO users (id, name, expiry, auth_token) 
       VALUES (?, ?, ?, ?)`,
      [
        ctx.from.id,
        ctx.from.first_name || 'Anonymous',
        new Date(Date.now() + 2592000000).toISOString(),
        hashToken(token)
      ]
    );

    await transaction.commit();
    logger.info(`User ${ctx.from.id} created`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`User creation failed: ${error.message}`);
    throw error;
  }
};

// Закрытие соединения с проверкой
export const closeDB = async (db) => {
  if (db) {
    try {
      await db.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error(`Failed to close database: ${error.message}`);
    }
  }
};