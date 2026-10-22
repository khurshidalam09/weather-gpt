
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const aiRoutes = require("./routes/aiRoutes");
const weatherRoutes = require("./routes/weatherRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/ai", aiRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Weather GPT API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "Weather GPT Backend",
  });
});

app.use("/api/weather", weatherRoutes);

app.listen(PORT, () => {
  console.log(`Weather GPT server running on port ${PORT}`);
});
