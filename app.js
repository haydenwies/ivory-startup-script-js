const express = require("express");
const { printOrder } = require("./expressBackend");
const Backend = require("./backend");
const backend = new Backend();

console.log("Listener Active");
backend.orderQueListener();

const cors = require("cors");
const app = express();

app.use(express.json());
app.listen(3001, () => {
  console.log("Also listening on 3001");
});
app.use(
  cors({
    origin: ["localhost:3000", "http://localhost:3000/order", "https://ivoryoms-superwok.web.app"],
    // origin: "*",
  })
);
app.get("/", (req, res) => {
  console.log("WELCOME");
  res.status(201).send("HOME PAGE");
});
app.post("/print", (req, res) => {
  const data = req.body;
  const { receipt, printData } = data;
  printOrder(receipt, printData, res);
});
