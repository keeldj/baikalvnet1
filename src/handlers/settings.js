export const showSettingsMenu = async (ctx, db) => {
  await ctx.replyWithHTML("⚙️ <b>Настройки</b>\nВыберите опцию:");
};

export const handleDeviceChange = async (ctx, db) => {
  // Пример: обновление количества устройств
  await db.run("UPDATE users SET devices = ? WHERE id = ?", [5, ctx.from.id]);
  ctx.reply("✅ Лимит устройств изменен!");
};

export const toggleNotifications = async (ctx, db) => {
  // Пример: переключение уведомлений
  const user = await db.get("SELECT notify FROM users WHERE id = ?", ctx.from.id);
  await db.run("UPDATE users SET notify = ? WHERE id = ?", [!user.notify, ctx.from.id]);
  ctx.reply(`🔔 Уведомления: ${!user.notify ? "ВКЛ" : "ВЫКЛ"}`);
};