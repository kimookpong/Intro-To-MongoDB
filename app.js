require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const itemsRoutes = require("./routes/items");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// การเชื่อมต่อ MongoDB
let db;
const client = new MongoClient(process.env.MONGO_URI, {
  useUnifiedTopology: true,
});
client
  .connect()
  .then(() => {
    db = client.db(process.env.DB_NAME);
    console.log(`เชื่อมต่อกับ MongoDB: ${process.env.DB_NAME}`);
  })
  .catch((err) => {
    console.error("การเชื่อมต่อ MongoDB ล้มเหลว:", err);
    process.exit(1);
  });

// ส่งต่อฐานข้อมูลไปยัง routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use("/api/items", itemsRoutes);

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่พอร์ต ${PORT}`);
});
