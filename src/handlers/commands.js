import crypto from 'crypto';
import { hashToken } from '../db/database.js';

export const handleStart = async (ctx, db, showMainMenu) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', ctx.from.id);

  if (!user) {
    const token = crypto.randomBytes(8).toString('hex');
    await db.run(
      `INSERT INTO users (id, name, expiry, auth_token) VALUES (?, ?, ?, ?)`,
      [ctx.from.id, ctx.from.first_name, new Date(Date.now() + 2592000000).toISOString(), hashToken(token)]
    );

    // Реферальная система
    if (ctx.message.text.includes('ref_')) {
      const referrerId = ctx.message.text.split('_')[1];
      await db.run(
        `INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)`,
        [referrerId, ctx.from.id]
      );
    }
  }

  showMainMenu(ctx);
};

export const handleProfile = async (ctx, db, formatTraffic) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', ctx.from.id);
  if (!user) return ctx.reply('Используйте /start');

  ctx.replyWithHTML(
    `👤 <b>Профиль:</b>\n` +
    `├ Рефералов: ${user.referrals}\n` +
    `└ Токен: <code>${user.auth_token}</code>\n` +
    `⚡ Трафик: ${((user.traffic_used / user.traffic_total) * 100 || 0).toFixed(1)}%`
  );
};