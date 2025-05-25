// src/utils/formatters.js

// Форматирование трафика (Б → МБ → ГБ)
export const formatTraffic = (bytes) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} МБ`;
  return `${(bytes / 1048576).toFixed(1)} ГБ`;
};

// Форматирование даты (пример)
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("ru-RU");
};