const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // serve index.html

// Health check
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ACH Payment Route
app.post("/pay", async (req, res) => {
  const { nonce, cashTag } = req.body;

  if (!nonce || !cashTag) {
    return res.status(400).json({ error: "Missing nonce or cashTag" });
  }

  try {
    const response = await axios.post(
      "https://connect.squareup.com/v2/payments",
      {
        idempotency_key: crypto.randomUUID(),
        source_id: nonce,
        amount_money: { amount: 1000, currency: "USD" },
        note: `ACH to ${cashTag}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Payment error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});