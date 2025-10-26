const express = require("express");
const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// anti spam
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10, // 10 request per menit per IP
});
app.use(limiter);

app.use(express.static("public"));

async function extractVideoUrl(tiktokUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(tiktokUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // ambil elemen video
    const videoSrc = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.src : null;
    });

    return videoSrc;
  } finally {
    await browser.close();
  }
}

app.get("/api/download", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL TikTok tidak boleh kosong." });

  try {
    const videoUrl = await extractVideoUrl(url);
    if (!videoUrl) return res.status(404).json({ error: "Gagal menemukan video." });

    res.json({ success: true, videoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil video." });
  }
});

app.listen(PORT, () => console.log(`🔥 Hu Tao Downloader aktif di http://localhost:${PORT}`));
