import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import express from 'express';
import { Client } from 'yookassa';
import { setupDB } from './src/db/database.js';
import * as commands from './src/handlers/commands.js';
import payments from './src/handlers/payments.js';
import * as settings from './src/handlers/settings.js';
import * as support from './src/handlers/support.js';
import { formatTraffic } from './src/utils/formatters.js';
import config from './src/config.js';

dotenv.config();

// Инициализация
const app = express();
const port = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);
const db = await setupDB();
const yooKassa = new Client({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY
});
// Безопасная проверка всех условий
if (
  process.env.YOOKASSA_SHOP_ID && 
  process.env.YOOKASSA_SECRET_KEY &&
  process.env.YOOKASSA_SHOP_ID.startsWith('test_') &&
  process.env.YOOKASSA_SECRET_KEY.startsWith('test_')
) {
  console.log('\x1b[33m⚠️ ВНИМАНИЕ! Режим тестовых платежей\x1b[0m');
  console.log('Используются ключи:');
  console.log(`SHOP_ID: ${process.env.YOOKASSA_SHOP_ID}`);
  console.log(`SECRET_KEY: ${process.env.YOOKASSA_SECRET_KEY}`);

// Веб-сервер
app.use(express.json())
  .get('/', (_, res) => res.send('VPN Bot Active!'))
  .post('/yookassa-webhook', async (req, res) => {
    if (req.body.event === 'payment.succeeded') {
      const payment = req.body.object;
      const userId = payment.metadata.user_id;

      // Активация подписки
      await db.run(
        'UPDATE users SET is_active = 1, expiry_date = ? WHERE id = ?',
        [new Date(Date.now() + 30 * 86400000).toISOString(), userId]
      );

      // Уведомление пользователя
      await bot.telegram.sendMessage(userId, '✅ Подписка успешно активирована!');
    }
    res.status(200).send();
  })
  .listen(port);

// Главное меню
const showMainMenu = (ctx) => ctx.replyWithHTML(config.messages.mainMenu, {
  reply_markup: { keyboard: config.keyboards.main, resize_keyboard: true }
});

// Обработчики
bot.command('start', async (ctx) => commands.handleStart(ctx, db, showMainMenu));
bot.hears('🔑 Мой профиль', async (ctx) => commands.handleProfile(ctx, db, formatTraffic));
bot.hears('🌐 Купить подписку', async (ctx) => {
  try {
    const payment = await yooKassa.createPayment({
      amount: {
        value: '299.00',
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: `https://t.me/${ctx.botInfo.username}`
      },
      description: 'Премиум подписка на 1 месяц',
      metadata: {
        user_id: ctx.from.id
      }
    });

    await ctx.replyWithHTML('💳 Для оплаты подписки нажмите кнопку ниже:', {
      reply_markup: {
        inline_keyboard: [[{
          text: 'Оплатить 299₽',
          url: payment.confirmation.confirmation_url
        }]]
      }
    });
  } catch (e) {
    console.error('Ошибка платежа:', e);
    ctx.reply('❌ Не удалось создать платеж. Попробуйте позже.');
  }
});
bot.hears('⚙️ Настройки', (ctx) => settings.showSettingsMenu(ctx, db));
bot.hears('📞 Поддержка', (ctx) => support.showSupportMenu(ctx));

// Inline-обработчики
bot.action(/tariff_(\d+)/, async (ctx) => payments.handleTariffSelect(ctx, db, config));
bot.action('change_devices', async (ctx) => settings.handleDeviceChange(ctx, db));
bot.action('toggle_notify', async (ctx) => settings.toggleNotifications(ctx, db));
bot.action('create_ticket', async (ctx) => support.createSupportTicket(ctx, db));

  // ... предыдущий код

  // Система
  setInterval(() => fetch(process.env.REPLIT_URL).catch(console.error), 300000);
  bot.launch().then(() => console.log('Bot started! 🚀'));

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } // <-- Добавьте эту скобку, если она отсутствует