const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
require("dotenv").config();


// --- GEMINI INITIALIZATION ---

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest", 
    systemInstruction: `You are the MyStore Supply Chain Assistant. 
    You have knowledge of the following logistics system features:
    - Pricing: Goods have a price per ton set by suppliers.
    - Fees: Every order includes a 5% Service Tax and a flat $100 Logistics Fee.
    - Port-to-Port Routes: Suppliers plan deliveries using 2 to 10 specific route segments (From Port -> To Port).
    - Roles: You assist both Clients (who make orders) and Suppliers (who manage inventory and transport).
    - Greetings: If the user says "hi", "hello", "hlo", or similar greetings, respond with: "Hello! I am your Supply Chain Assistant. How can I help you with your orders or logistics today?"
    - Fallbacks: If you cannot answer a specific question, respond with: "I'm sorry, I don't have that specific information. I can help you with pricing, route tracking, or order management instead. How can I assist you further?"
    Be professional, helpful, and concise.`
});
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("Connection error:", err));

const clientSchema = new mongoose.Schema({
    clientId: { type: String, unique: true }, // 🔥 NEW PRIMARY ID
    name: String,
    location: String,
    email: String,
    license: String,
    country: String
}, { timestamps: true });

const Client = mongoose.model("Client", clientSchema);

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    license: { type: String, required: true },
    country: { type: String, required: true }
}, { timestamps: true });

const Supplier = mongoose.model("Supplier", supplierSchema);

// 🔥 ADD GOODS SCHEMA
const goodsSchema = new mongoose.Schema({
    supplierName: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "General" }, // 🔥 NEW
    price: { type: Number, default: 0 }, // 🔥 NEW: Price per Ton
    quantity: { type: Number, required: true },
    tons: { type: Number, required: true },
    vehicle: { type: String, required: true },
    capacity: { type: Number, required: true },
    maxShipmentTime: { type: String, required: true },
    expiryDate: { type: Date }, // 🔥 NEW
    description: String
}, { timestamps: true });

const Goods = mongoose.model("Goods", goodsSchema);

// 🔥 ORDER SCHEMA
const orderSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    supplierName: { type: String, required: true },
    supplierLocation: { type: String, required: true },
    goods: { type: String, required: true },
    quantity: { type: Number, required: true },
    deliveryLocation: { type: String, required: true },
    status: { type: String, default: "Pending" },
    routes: [{ from: String, to: String }], // 🔥 UPDATED: Port-to-Port Route Pairs
    tax: { type: Number, default: 0 },
    logisticsFee: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);


function generateId() {
    return "CL-" + Math.random().toString(36).substring(2, 9);
}

app.post("/api/client", async (req, res) => {
    try {
        const { name, location, email, license, country } = req.body;

        const newClient = new Client({
            clientId: generateId(), // 🔥 USE CUSTOM ID
            name,
            location,
            email,
            license,
            country
        });

        await newClient.save();

        res.json({
            message: "Client registered",
            data: newClient
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/supplier", async (req, res) => {
    try {
        const { name, location, email, contact, license, country } = req.body;
        if (!name || !location || !email || !contact || !license || !country) {
            return res.status(400).json({ message: "All fields required" });
        }

        const newSupplier = new Supplier({
            name:name,
            location:location,
            email:email,
            contact:contact,
            license:license,
            country:country
        });

        await newSupplier.save();

        res.status(201).json({
            message: "✅ Supplier Registered Successfully",
            data: newSupplier
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 GET GOODS
app.get("/api/goods", async (req, res) => {
    try {
        const { supplierName } = req.query;
        let query = {};
        if (supplierName) {
            query.supplierName = supplierName;
        }
        const goods = await Goods.find(query).sort({ createdAt: -1 });
        res.json(goods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 DELETE GOODS
app.delete("/api/goods/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedGoods = await Goods.findByIdAndDelete(id);
        if (!deletedGoods) return res.status(404).json({ message: "Goods not found" });
        res.json({ message: "Goods deleted", data: deletedGoods });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 POST GOODS
app.post("/api/goods", async (req, res) => {
    try {
        const { supplierName, name, category, price, quantity, tons, vehicle, capacity, maxShipmentTime, expiryDate, description } = req.body;
        
        const newGoods = new Goods({ 
            supplierName, 
            name, 
            category,
            price: Number(price),
            quantity: Number(quantity), 
            tons: Number(tons), 
            vehicle, 
            capacity: Number(capacity), 
            maxShipmentTime,
            expiryDate,
            description
        });
        await newGoods.save();

        res.status(201).json({ message: "Goods added successfully", data: newGoods });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 GET ORDERS
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 POST ORDER (FROM CLIENT)
app.post("/api/orders", async (req, res) => {
    try {
        const orderData = req.body;
        const newOrder = new Order(orderData);
        await newOrder.save();
        res.status(201).json({ message: "Order placed", data: newOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 UPDATE ORDER STATUS
app.put("/api/orders/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, routes } = req.body;

        const updateData = { status };
        if (routes) updateData.routes = routes;

        const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

        res.json({ message: "Order updated", data: updatedOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 DELETE ORDER
app.delete("/api/orders/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(id);
        
        if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

        res.json({ message: "Order deleted", data: deletedOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/clients", async (req, res) => {
    const clients = await Client.find();
    res.json(clients);
});

// 🔥 GET CLIENT PROFILE
app.get("/api/client/:name", async (req, res) => {
    try {
        const client = await Client.findOne({ name: req.params.name });
        if (!client) return res.status(404).json({ message: "Client not found" });
        res.json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 UPDATE CLIENT PROFILE
app.put("/api/client/:name", async (req, res) => {
    try {
        const { location, email, license, country } = req.body;
        const updatedClient = await Client.findOneAndUpdate(
            { name: req.params.name },
            { location, email, license, country },
            { new: true }
        );
        if (!updatedClient) return res.status(404).json({ message: "Client not found" });
        res.json({ message: "Profile updated", data: updatedClient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/suppliers", async (req, res) => {
    const suppliers = await Supplier.find();
    res.json(suppliers);
});

// 🔥 GET SUPPLIER PROFILE
app.get("/api/supplier/:name", async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ name: req.params.name });
        if (!supplier) return res.status(404).json({ message: "Supplier not found" });
        res.json(supplier);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 UPDATE SUPPLIER PROFILE
app.put("/api/supplier/:name", async (req, res) => {
    try {
        const { location, email, contact, license, country } = req.body;
        const updatedSupplier = await Supplier.findOneAndUpdate(
            { name: req.params.name },
            { location, email, contact, license, country },
            { new: true }
        );
        if (!updatedSupplier) return res.status(404).json({ message: "Supplier not found" });
        res.json({ message: "Profile updated", data: updatedSupplier });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 GET SUPPLIER STATS
app.get("/api/supplier/stats/:name", async (req, res) => {
    try {
        const { name } = req.params;
        
        const totalGoodsCount = await Goods.countDocuments({ supplierName: name });
        const orders = await Order.find({ supplierName: name });
        
        const stats = {
            totalGoods: totalGoodsCount,
            pendingOrders: orders.filter(o => o.status === "Pending").length,
            deliveredOrders: orders.filter(o => o.status === "Delivered").length
        };
        
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔍 GLOBAL SEARCH (Client + Supplier + Goods)
app.get("/api/search", async (req, res) => {
    const query = req.query.q;

    try {
        const suppliers = await Supplier.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { location: { $regex: query, $options: "i" } },
            ]
        });

        // 🔥 SEARCH BY GOODS NAME
        const goods = await Goods.find({
            name: { $regex: query, $options: "i" }
        });

        // Map goods to include supplier info (assuming name linkage for now, or we could use ID if we had it)
        const goodsResults = await Promise.all(goods.map(async (g) => {
            const s = await Supplier.findOne({ name: g.supplierName });
            return {
                goodsName: g.name,
                supplierName: g.supplierName,
                location: s ? s.location : "Unknown",
                tons: g.tons,
                capacity: g.capacity,
                price: g.price, // 🔥 NEW
                category: g.category, // 🔥 NEW
                maxShipmentTime: g.maxShipmentTime // 🔥 NEW
            };
        }));

        res.json({ suppliers, goodsResults });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 🤖 ADDED CHATBOT API (RAG Integration) ---
app.post("/api/chat", async (req, res) => {
    try {
        const { message, history } = req.body;
        console.log("📩 User sent:", message); // Check your terminal for this!

        const chat = model.startChat({
            history: history || [],
        });

        // 🔥 IMPORTANT: We must await the result and the response specifically
        const result = await chat.sendMessage(message);
        const response = await result.response; 
        const text = response.text();

        console.log("🤖 AI Replied:", text);
        res.json({ reply: text }); // This sends the answer back to your UI

    } catch (err) {
        console.error("❌ Gemini Error:", err);
        res.status(500).json({ error: "AI is sleeping. Check terminal." });
    }
});
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
