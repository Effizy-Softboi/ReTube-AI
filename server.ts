import express from "express";
import { createServer as createViteServer } from "vite";
import ytdl from "ytdl-core";
import cors from "cors";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/video-info", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      const info = await ytdl.getInfo(videoUrl);
      const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
      
      res.json({
        title: info.videoDetails.title,
        description: info.videoDetails.description,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        author: info.videoDetails.author.name,
        duration: info.videoDetails.lengthSeconds,
        formats: formats.map(f => ({
          quality: f.qualityLabel,
          container: f.container,
          url: f.url,
          hasVideo: f.hasVideo,
          hasAudio: f.hasAudio
        }))
      });
    } catch (error: any) {
      console.error("Error fetching video info:", error);
      res.status(500).json({ error: "Failed to fetch video info. YouTube might be blocking the request." });
    }
  });

  // Download proxy (optional, but helps with some browser restrictions)
  app.get("/api/download", async (req, res) => {
    const videoUrl = req.query.url as string;
    const itag = req.query.itag as string;

    if (!videoUrl) return res.status(400).send("URL required");

    try {
      res.header('Content-Disposition', 'attachment; filename="video.mp4"');
      ytdl(videoUrl, {
        quality: (itag ? parseInt(itag) : 'highestvideo') as any,
        filter: format => format.container === 'mp4'
      }).pipe(res);
    } catch (error) {
      res.status(500).send("Download failed");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
