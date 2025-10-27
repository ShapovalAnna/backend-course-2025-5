const superagent = require("superagent");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { program } = require("commander");

// === 1. Параметри командного рядка ===
program
  .requiredOption("-h, --host <host>", "server host address")
  .requiredOption("-p, --port <port>", "server port number")
  .requiredOption("-c, --cache <path>", "path to cache directory");

program.parse(process.argv);
const options = program.opts();

// === 2. Перевірка існування директорії кешу ===
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
  console.log(`✅ Cache directory created at: ${options.cache}`);
} else {
  console.log(`📁 Using existing cache directory: ${options.cache}`);
}

// === 3. Функції для роботи з файлами ===
const getFilePath = (code) => path.join(options.cache, `${code}.jpg`);

// === 4. Створення сервера ===
const server = http.createServer(async (req, res) => {
  const method = req.method;
  const urlParts = req.url.split("/");
  const code = urlParts[1]; // наприклад, /200 → "200"

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("❌ Bad Request: no code provided");
  }

  const filePath = getFilePath(code);

  try {
    switch (method) {
      // === GET ===
case "GET": {
  try {
    // спроба прочитати файл із кешу
    const data = await fs.promises.readFile(filePath);
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    res.end(data);
  } catch (err) {
    console.log(`⚠️ Not in cache. Fetching from https://http.cat/${code}.jpg ...`);
    try {
      // завантажуємо з https://http.cat
      const response = await superagent.get(`https://http.cat/${code}.jpg`).responseType("blob");

      const buffer = response.body; // зображення
      // зберігаємо в кеш
      await fs.promises.writeFile(filePath, buffer);

      // відправляємо клієнту
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(buffer);
      console.log(`✅ Cached and sent image for code ${code}`);
    } catch (fetchError) {
      // якщо http.cat не має такої картинки
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("❌ Not Found on server or cache");
      console.error(`❌ Failed to fetch https://http.cat/${code}.jpg`);
    }
  }
  break;
}

      // === PUT ===
      case "PUT": {
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", async () => {
          const buffer = Buffer.concat(body);
          await fs.promises.writeFile(filePath, buffer);
          res.writeHead(201, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("✅ Image saved to cache");
        });
        break;
      }

      // === DELETE ===
      case "DELETE": {
        try {
          await fs.promises.unlink(filePath); //вилучення файлу
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("🗑️ Image deleted from cache");
        } catch (err) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("❌ Not Found: cannot delete non-existing file");
        }
        break;
      }

      // === Інші методи ===
      default: {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("❌ Method Not Allowed");
      }
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
});

// === 5. Запуск сервера ===
server.listen(options.port, options.host, () => {
  console.log(`🚀 Server running at http://${options.host}:${options.port}/`);
});
