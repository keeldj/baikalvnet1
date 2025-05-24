const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '7861182562:AAF90sgh5_MpZ1bv-uUGL-8cMG6oXb1uwfc');

// Главное меню
function showMainMenu(ctx) {
  return ctx.reply(
    '🔐 <b>Baikal VNet — защищённый VPN с поддержкой Hiddify</b>',
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          ['🛍️ Купить подписку', '🔑 Мой конфиг'],
          ['📲 Установка Hiddify', '📞 Поддержка'],
          ['📜 Правила использования']
        ],
        resize_keyboard: true
      }
    }
  );
}

// Команда /start
bot.command('start', showMainMenu);

// Обработка кнопок
bot.hears('🛍️ Купить подписку', (ctx) => {
  ctx.reply('Выберите тариф:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '1 месяц - 100₽', callback_data: 'tariff_100' }],
        [{ text: '3 месяца - 190₽ (выгода 30%)', callback_data: 'tariff_190' }],
        [{ text: '❌ Отмена', callback_data: 'cancel' }]
      ]
    }
  });
});

bot.hears('🔑 Мой конфиг', async (ctx) => {
  ctx.replyWithHTML(
    '⌛ <b>Генерирую ваш конфиг...</b>\n' +
    'После получения используйте его в Hiddify:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Hiddify для Android', url: 'https://play.google.com/store/apps/details?id=app.hiddify.com' }],
          [{ text: 'Hiddify для iOS', url: 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532' }],
          [{ text: 'Hiddify для Windows', url: 'https://github.com/hiddify/hiddify-app/releases/latest/download/Hiddify-Windows-Setup-x64.Msix' }]
        ]
      }
    }
  );
  
  // Здесь будет реальная генерация конфига через 3x-ui API
  // const config = await generateVlessConfig(ctx.from.id);
  // ctx.replyWithHTML(`<code>${config}</code>`);
});

bot.hears('📲 Установка Hiddify', (ctx) => {
  ctx.replyWithHTML(
    '<b>📥 Установка Hiddify:</b>\n\n' +
    '• <a href="https://play.google.com/store/apps/details?id=app.hiddify.com">Android</a>\n' +
    '• <a href="https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532">iPhone/iPad</a>\n' +
    '• <a href="https://github.com/hiddify/hiddify-app/releases/latest/download/Hiddify-Windows-Setup-x64.Msix">Windows</a>\n\n' +
    'После установки нажмите "🔑 Мой конфиг"',
    { disable_web_page_preview: true }
  );
});

bot.hears('📞 Поддержка', (ctx) => {
  ctx.reply('По всем вопросам пишите: @baikalvnet_support');
});

bot.hears('📜 Правила использования', (ctx) => {
  ctx.replyWithHTML(
    '<b>📜 Условия:</b>\n\n' +
    '• Срок действия: 1/3 месяца\n' +
    '• Возврат: в течение 3 дней\n' +
    '• Запрещено нарушать законы РФ\n\n' +
    '<i>Подключение через Hiddify гарантирует стабильную работу</i>'
  );
});

// Обработка выбора тарифа
bot.action('tariff_100', (ctx) => handleTariff(ctx, 100));
bot.action('tariff_190', (ctx) => handleTariff(ctx, 190));

async function handleTariff(ctx, amount) {
  await ctx.deleteMessage(); // Удаляем сообщение с кнопками
  ctx.replyWithHTML(
    `💳 <b>Оплата ${amount}₽</b>\n` +
    'Ссылка для оплаты через ЮKassa: <i>генерируется...</i>\n\n' +
    'После оплаты автоматически получите конфиг',
    { reply_markup: { remove_keyboard: true } }
  );
  
  // Здесь будет интеграция с ЮKassa
}

// Запуск бота
bot.launch();
console.log('Бот запущен! 🚀');