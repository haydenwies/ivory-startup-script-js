class Backend {
  constructor() {
    const { initializeApp, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");

    const serviceAccount = require("./credentials.json");

    //Validate firebase credentials in credentials.json
    initializeApp({
      credential: cert(serviceAccount),
    });

    this.db = getFirestore(); //Gets a reference to firestore

    //Pulls restaurant info data
    const x = async () => {
      const doc = await this.db.collection("general").doc("restaurantInfo").get();
      if (doc.exists) {
        this.restaurantInfo = doc.data();
      } else {
        this.restaurantInfo = null;
      }
    };
    x(); //Call the method to get restaurant info
  }

  /**
   * Firestore collection listener to listen to change events in the printQue collection
   */
  orderQueListener() {
    // const TemplateOne = require('./templates/templateOne')
    const TemplateOne = require("./templates/templateOne");
    const orderQue = this.db.collection("printQue");

    //Takes a snapshot of the collection at that current point in time
    orderQue.onSnapshot((querySnapshot) => {
      //Listens for when the querySnapshot document changes
      querySnapshot.docChanges().forEach(async (change) => {
        console.log("An order has arrived:");
        if (change.type === "added") {
          const data = change.doc.data(); //Gets the data of the changed doc

          const id = data["id"]; // Get order id
          const printers = data["printers"]; // Get printers

          // Fetch order from the "orders" collection by querying the id
          const orderQuery = await this.db.collection("orders").where("id", "==", id).get();

          // Check if the document was able to be queried
          if (orderQuery.empty) {
            console.log("no docs");
          } else {
            //Take the list of documents from the query and loop over them
            orderQuery.docs.forEach((order) => {
              //For each printer we will need to generate a receipt
              for (const printer of printers) {
                //Execute the promise that generates a new template for the receipt data (since it's asynchronous task)
                new Promise((resolve, reject) => {
                  resolve,
                    (reject = new TemplateOne(
                      printer.ip,
                      this.restaurantInfo,
                      order.data(),
                      resolve,
                      reject
                    ));
                })
                  .then(async (printerIp) => {
                    console.log("Order Successfully Printed");
                    const orderQuery = await this.db.collection("orders").where("id", "==", id).get();
                    const ids = [];

                    //Gets all of the documents in the "orders" collection and loops through the doc data.
                    orderQuery.docs.forEach((doc) => {
                      ids.push(doc.id);
                    });

                    //Find each document with the respective id and update the printed property in the (orders collection) and delete the document in the printQue collection
                    ids.forEach(async (id) => {
                      this.db.collection("orders").doc(id).update({ printed: true });
                      await this.db.collection("printQue").doc(change.doc.id).delete();
                    });
                  })

                  //If printing error record the printer ip address and date, then store it to err collection
                  .catch((err) => {
                    let [ip, errorMsg] = err;
                    const x = {};
                    x[printer.ip] = new Date().toLocaleString("sv", { timeZoneName: "short" }).slice(0, 19);
                    x.errorMsg = `${err}`;
                    this.db.collection("printQue").doc(id).delete();
                    this.db.collection("errLog").doc(id).set(x, { merge: true });
                  });
              }
            });
          }
        }
      });
    });
  }
}

module.exports = Backend;
