// support.js
export const showSupportMenu = async (ctx) => {
  ctx.reply("📞 Свяжитесь с поддержкой: @help_baikalvpn");
};

export const createSupportTicket = async (ctx, db) => {
  await db.run("INSERT INTO tickets (user_id) VALUES (?)", [ctx.from.id]);
  ctx.reply("✅ Ваш запрос зарегистрирован!");
};