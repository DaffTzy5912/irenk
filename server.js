import express from "express";
import multer from "multer";
import Jimp from "jimp";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// Multer untuk menangani file upload
const upload = multer({ dest: "uploads/" });

// Google Generative AI setup
const API_KEY = process.env.GOOGLE_API_KEY; // Ambil dari environment variable
const genAI = new GoogleGenerativeAI(API_KEY);

// Endpoint untuk memanggil Google Generative AI
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ output: text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

// Endpoint untuk menerapkan efek pada gambar
app.post("/apply-effect", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    // Baca gambar menggunakan Jimp
    const image = await Jimp.read(imagePath);

    // Ubah gambar menjadi hitam-putih
    image.grayscale();

    // Kirim gambar yang sudah diproses sebagai respons
    res.set("Content-Type", "image/jpeg");
    image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
      if (err) {
        console.error("Error processing image:", err);
        return res.status(500).send("Failed to process image");
      }
      res.send(buffer);
    });
  } catch (error) {
    console.error("Error applying effect:", error);
    res.status(500).send("Failed to apply effect");
  }
});

// Serve static files (frontend)
app.use(express.static("public"));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://irenk.vervel.app/:${PORT}`);
});
