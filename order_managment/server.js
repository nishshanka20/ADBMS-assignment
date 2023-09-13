const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 8060;

app.use(cors());
app.use(bodyParser.json());

const URL = process.env.MONGODB_URL;

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("Mongodb connection sucess");
});

const orderrouter = require("./routes/orderRoute.js");
app.use("/order", orderrouter);
app.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
});
