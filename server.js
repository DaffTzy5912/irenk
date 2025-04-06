import express from "express";
import multer from "multer";
import Jimp from "jimp";
import * as faceapi from "face-api.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// Multer untuk menangani file upload
const upload = multer({ dest: "uploads/" });

// Load model deteksi wajah
(async () => {
  await faceapi.nets.tinyFaceDetector.loadFromDisk("./public/models");
})();

// Endpoint untuk menerapkan efek pada gambar
app.post("/apply-effect", upload.single("image"), async (req, res) => {
  const { color } = req.body;
  const imagePath = req.file.path;

  try {
    // Baca gambar menggunakan Jimp
    const image = await Jimp.read(imagePath);

    // Deteksi wajah menggunakan face-api.js
    const imgBuffer = await Jimp.read(imagePath).then((img) => img.getBufferAsync(Jimp.MIME_JPEG));
    const detectedFaces = await faceapi
      .detectAllFaces(await faceapi.fetchImage(imgBuffer), new faceapi.TinyFaceDetectorOptions());

    // Iterasi setiap wajah yang terdeteksi
    for (const face of detectedFaces) {
      const { x, y, width, height } = face.box;

      // Ubah warna wajah berdasarkan pilihan pengguna
      for (let i = x; i < x + width; i++) {
        for (let j = y; j < y + height; j++) {
          const pixelColor = Jimp.intToRGBA(image.getPixelColor(i, j));

          if (color === "brown") {
            pixelColor.r = 139; // Merah
            pixelColor.g = 69;  // Hijau
            pixelColor.b = 19;  // Biru
          } else if (color === "white") {
            pixelColor.r = 255;
            pixelColor.g = 255;
            pixelColor.b = 255;
          } else if (color === "black") {
            pixelColor.r = 0;
            pixelColor.g = 0;
            pixelColor.b = 0;
          }

          const newColor = Jimp.rgbaToInt(pixelColor.r, pixelColor.g, pixelColor.b, pixelColor.a);
          image.setPixelColor(newColor, i, j);
        }
      }
    }

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
  console.log(`Server running on http://irenk.vercel.app/:${PORT}`);
});
