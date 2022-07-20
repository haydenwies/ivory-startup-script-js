// const express = require("express");
const Backend = require("./backend");

const backend = new Backend();

console.log("Listener Active");
backend.orderQueListener();

// const app = express();

// app.use(express.json());
// app.listen(3000, () => {
//   console.log("WE ARE LISTENING");
// });
// app.post("/print", (req, res) => {
//   const receipt = req.body;

//   console.log(receipt);

//   res.status(201).send("SUCCESS");
// });
