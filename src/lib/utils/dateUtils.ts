/**
 * Преобразует объект Date в строку формата 'YYYY-MM-DD' в локальном часовом поясе.
 * Это позволяет избежать проблем с преобразованием в UTC, которые дает toISOString().
 * @param date - Объект Date для преобразования.
 * @returns Строка с датой в формате 'YYYY-MM-DD'.
 */
export const toLocalDateString = (date: Date): string => {
  // Проверяем, что на вход подан корректный объект Date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    // Возвращаем сегодняшнюю дату как запасной вариант или можно выбросить ошибку
    console.warn("toLocalDateString received an invalid date. Falling back to today.");
    date = new Date();
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};