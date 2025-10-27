// index.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { program } = require("commander");

// === 1. Визначення параметрів командного рядка ===
program
  .requiredOption("-h, --host <host>", "server host address")
  .requiredOption("-p, --port <port>", "server port number")
  .requiredOption("-c, --cache <path>", "path to cache directory");

program.parse(process.argv);
const options = program.opts();

// === 2. Перевірка та створення директорії кешу ===
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
  console.log(`✅ Cache directory created at: ${options.cache}`);
} else {
  console.log(`📁 Using existing cache directory: ${options.cache}`);
}

// === 3. Створення веб-сервера ===
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Proxy server is running! 🐱");
});

// === 4. Запуск сервера ===
server.listen(options.port, options.host, () => {
  console.log(`🚀 Server running at http://${options.host}:${options.port}/`);
});
