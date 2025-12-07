const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // 🔥 АБСОЛЮТНОЕ ИСПРАВЛЕНИЕ: ПЕРЕПИСЫВАЕМ ЗАГОЛОВКИ ДО ОБРАБОТКИ
    fixRequestHeaders(req);
    
    // ✅ ЕДИНСТВЕННЫЙ ВЕРНЫЙ ПАТТЕРН ДЛЯ APP ROUTER
    handle(req, res);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});

// 🔑 КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ
function fixRequestHeaders(req) {
  // 1. Гарантируем корректный Host
  req.headers.host = req.headers.host?.replace(/\/+$/, '') || `localhost:${port}`;
  
  // 2. Чиним URL от двойных слешей
  const parsed = parse(req.url);
  let cleanPath = parsed.pathname
    ?.replace(/\/{2,}/g, '/') // Убираем множественные слеши
    ?.replace(/\/$/, '') || '/'; // Убираем trailing slash
  
  // 3. Формируем чистый URL
  req.url = cleanPath + (parsed.search || '');
  
  // 4. Чиним Referer для корректных редиректов
  if (req.headers.referer) {
    req.headers.referer = req.headers.referer
      .replace(/\/\/+/g, '/')
      .replace(/:\d+\/{2,}/, `:${port}/`);
  }
}
