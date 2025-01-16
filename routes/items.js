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
