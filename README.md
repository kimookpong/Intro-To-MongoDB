# Creating a Basic RESTful API Using Node.js and MongoDB (Without Mongoose)

This guide demonstrates how to create a basic RESTful API using Node.js and MongoDB without relying on Mongoose or any ORM. Instead, it uses the native MongoDB driver for database interaction.

---

## Prerequisites

- **Node.js**: Version 14 or higher.
- **MongoDB**: Ensure a MongoDB instance is running.
- **Postman** (Optional): For API testing.

---

## Project Setup

### 1. Initialize the Project

Create a directory for your project and initialize it:

```bash
npm init -y
```

### 2. Install Dependencies

Install the required packages:

```bash
npm install express body-parser mongodb dotenv nodemon
```

---

## Folder Structure

Your project should have the following structure:

```
restful-api-raw/
├── routes/
│   └── items.js
├── app.js
├── package.json
├── .env
```

---

## Create Files

### 1. `.env`

Create an `.env` file for environment variables:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=restful_api_raw
PORT=3000
```

### 2. `app.js`

The main entry point for your API:

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

// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGO_URI, {
  useUnifiedTopology: true,
});
client
  .connect()
  .then(() => {
    db = client.db(process.env.DB_NAME);
    console.log(`Connected to MongoDB: ${process.env.DB_NAME}`);
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// Pass the database to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use("/api/items", itemsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. `routes/items.js`

Create a route handler for CRUD operations:

```javascript
const express = require("express");
const router = express.Router();

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await req.db.collection("items").find({}).toArray();
    res.json(items);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch items", error: err.message });
  }
});

// GET one item by ID
router.get("/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    const item = await req.db
      .collection("items")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch item", error: err.message });
  }
});

// POST create a new item
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
      .json({ message: "Item created", itemId: result.insertedId });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create item", error: err.message });
  }
});

// PATCH update an item
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
      return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item updated" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update item", error: err.message });
  }
});

// DELETE an item
router.delete("/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");
  try {
    const result = await req.db
      .collection("items")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete item", error: err.message });
  }
});

module.exports = router;
```

---

## Run the Project

1. **Start the Server:**

   ```bash
   npm start
   ```

2. **Test the API Endpoints:**
   Use a tool like Postman or `curl` to test the following endpoints:

   - `GET /api/items` - Retrieve all items.
   - `GET /api/items/:id` - Retrieve a single item by ID.
   - `POST /api/items` - Create a new item.
   - `PATCH /api/items/:id` - Update an item.
   - `DELETE /api/items/:id` - Delete an item.

---

## Technologies Used

- **Node.js**: Backend framework.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: NoSQL database.
- **Dotenv**: Environment variable management.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

## Acknowledgments

Thanks to the Node.js and MongoDB communities for providing excellent tools and resources.
