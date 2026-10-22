
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const aiRoutes = require("./routes/aiRoutes");
const weatherRoutes = require("./routes/weatherRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/ai", aiRoutes);
app.use("/api/weather", weatherRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "Weather GPT Backend",
  });
});

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"), (error) => {
    if (error) {
      res.status(200).json({
        success: true,
        message: "Weather GPT API is running!",
        note: "Build the frontend to serve the website.",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Weather GPT server running on port ${PORT}`);
});
