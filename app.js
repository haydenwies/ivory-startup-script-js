const Backend = require("./backend");

const backend = new Backend();

console.log("Listener Active");
backend.orderQueListener();
