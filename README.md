# การสร้าง RESTful API พื้นฐานโดยใช้ Node.js และ MongoDB (โดยไม่ใช้ Mongoose)

คู่มือนี้แสดงวิธีการสร้าง RESTful API พื้นฐานโดยใช้ Node.js และ MongoDB โดยไม่พึ่งพา Mongoose หรือ ORM ใดๆ แต่จะใช้ตัวจัดการ MongoDB ดั้งเดิมสำหรับการโต้ตอบกับฐานข้อมูล

---

## สิ่งที่ต้องมี

- **Node.js**: เวอร์ชัน 14 หรือสูงกว่า
- **MongoDB**: ตรวจสอบให้แน่ใจว่ามีการรันอินสแตนซ์ MongoDB อยู่
- **Postman** (อุปกรณ์เสริม): สำหรับการทดสอบ API

---

## การตั้งค่าโครงการ

### 1. เริ่มต้นโครงการ

สร้างไดเรกทอรีสำหรับโครงการของคุณและเริ่มต้น:

```bash
npm init -y
```

### 2. ติดตั้ง Dependencies

ติดตั้งแพ็คเกจที่จำเป็น:

```bash
npm install express body-parser mongodb dotenv nodemon
```

### อธิบายแต่ละแพ็คเกจ

- **express**: เว็บเฟรมเวิร์กสำหรับ Node.js ใช้สำหรับสร้าง API และจัดการเส้นทาง (routes) อย่างง่ายดาย
- **body-parser**: ช่วยแปลงข้อมูลที่ส่งมากับคำขอ (request) เช่น JSON ให้อยู่ในรูปแบบที่ใช้งานได้ง่ายในเซิร์ฟเวอร์
- **mongodb**: ไดรเวอร์อย่างเป็นทางการสำหรับการเชื่อมต่อและการทำงานกับ MongoDB จาก Node.js
- **dotenv**: ใช้สำหรับจัดการตัวแปรสภาพแวดล้อม (environment variables) เช่น การตั้งค่าฐานข้อมูลหรือพอร์ต
- **nodemon**: เครื่องมือสำหรับการพัฒนา ช่วยรีสตาร์ทเซิร์ฟเวอร์โดยอัตโนมัติเมื่อมีการเปลี่ยนแปลงโค้ด

---

## โครงสร้างโฟลเดอร์

โครงการของคุณควรมีโครงสร้างดังนี้:

```
restful-api-raw/
├── routes/
│   └── items.js
├── app.js
├── package.json
├── .env
```

---

## การสร้างไฟล์

### 1. `.env`

สร้างไฟล์ `.env` สำหรับตัวแปรสภาพแวดล้อม:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=restful_api_raw
PORT=3000
```

### 2. `app.js`

จุดเริ่มต้นหลักสำหรับ API ของคุณ:

```javascript
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
```

### 3. `routes/items.js`

สร้างตัวจัดการเส้นทางสำหรับการดำเนินการ CRUD:

```javascript
const express = require("express");
const router = express.Router();

// GET สินค้าทั้งหมด
router.get("/", async (req, res) => {
  try {
    const items = await req.db.collection("items").find({}).toArray();
    res.json(items);
  } catch (err) {
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงข้อมูลสินค้าได้", error: err.message });
  }
});

// GET สินค้าชิ้นเดียวตาม ID
router.get("/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    const item = await req.db
      .collection("items")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!item) return res.status(404).json({ message: "ไม่พบสินค้า" });
    res.json(item);
  } catch (err) {
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงข้อมูลสินค้าได้", error: err.message });
  }
});

// POST สร้างสินค้าใหม่
router.post("/", async (req, res) => {
  try {
    const newItem = {
      name: req.body.name,
      quantity: req.body.quantity || 1,
      description: req.body.description || "",
    };
    const result = await req.db.collection("items").insertOne(newItem);
    res
      .status(201)
      .json({ message: "สร้างสินค้าเรียบร้อย", itemId: result.insertedId });
  } catch (err) {
    res
      .status(500)
      .json({ message: "ไม่สามารถสร้างสินค้าได้", error: err.message });
  }
});

// PATCH อัปเดตสินค้า
router.patch("/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    const updatedFields = {};
    if (req.body.name !== undefined) updatedFields.name = req.body.name;
    if (req.body.quantity !== undefined)
      updatedFields.quantity = req.body.quantity;
    if (req.body.description !== undefined)
      updatedFields.description = req.body.description;

    const result = await req.db
      .collection("items")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updatedFields });

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "ไม่พบสินค้า" });
    res.json({ message: "อัปเดตสินค้าเรียบร้อย" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "ไม่สามารถอัปเดตสินค้าได้", error: err.message });
  }
});

// DELETE สินค้า
router.delete("/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    const result = await req.db
      .collection("items")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "ไม่พบสินค้า" });
    res.json({ message: "ลบสินค้าเรียบร้อย" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "ไม่สามารถลบสินค้าได้", error: err.message });
  }
});

module.exports = router;
```

---

## การรันโครงการ

1. **เริ่มต้นเซิร์ฟเวอร์:**

   ```bash
   npm start
   ```

2. **ทดสอบ Endpoints ของ API:**
   ใช้เครื่องมืออย่าง Postman หรือ `curl` เพื่อตรวจสอบ endpoints ต่อไปนี้:

   - `GET /api/items` - ดึงสินค้าทั้งหมด
   - `GET /api/items/:id` - ดึงสินค้าเฉพาะ ID
   - `POST /api/items` - สร้างสินค้าใหม่
   - `PATCH /api/items/:id` - อัปเดตสินค้า
   - `DELETE /api/items/:id` - ลบสินค้า

---

## เทคโนโลยีที่ใช้

- **Node.js**: เฟรมเวิร์ก backend
- **Express.js**: เว็บเฟรมเวิร์กสำหรับ Node.js
- **MongoDB**: ฐานข้อมูล NoSQL
- **Dotenv**: การจัดการตัวแปรสภาพแวดล้อม

---
