const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();
const Test = require("./models/Test");

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function testDB() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log("✅ MongoDB Connected");

  const data = await Test.create({ name: "Sumit" });
  console.log("✅ Document created:", data);

  await mongoose.disconnect();
}

testDB().catch((err) => console.log("❌ Error:", err.message));
