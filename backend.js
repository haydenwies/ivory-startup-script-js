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
    const printQue = this.db.collection("printQue");

    //Takes a snapshot of the collection at that current point in time
    printQue.onSnapshot((querySnapshot) => {
      //Listens for when the querySnapshot document changes
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          console.log("An order has arrived:");
          const data = change.doc.data(); //Gets the data of the changed doc

          const id = data["id"]; // Get order id
          const printers = data["printers"]; // Get printers

          // Fetch order from the "orders" collection by querying the id
          const orderQuery = await this.db.collection("orders").where("id", "==", id).get();
          // Check if the document was able to be queried
          if (orderQuery.empty) {
            console.log("no docs");
          } else {
            let templateOnePromises = []; //Stores the array of printer promise requests to be executed by promise.allSetteled

            //Take the list of documents from the query and loop over them
            orderQuery.docs.forEach((order) => {
              //For each printer we will need to generate a receipt
              for (const printer of printers) {
                console.log(this.restaurantInfo)
                //Execute the promise that generates a new template for the receipt data (since it's asynchronous task)
                templateOnePromises.push(
                  new Promise((resolve, reject) => {
                    resolve,
                      (reject = new TemplateOne(
                        printer.name,
                        printer.ip,
                        printer.copies,
                        printer.beeps,
                        this.restaurantInfo,
                        order.data(),
                        resolve,
                        reject
                      ));
                  })
                );
              }

              // Call all of the promises at once
              Promise.allSettled([...templateOnePromises])
                .then(async (results) => {
                  let printStatus = { allPrinted: true, failedPrinters: [] };
                  for (let result of results) {
                    let { status, reason, value } = result;

                    // Prepares the failed set of printers
                    if (status === "rejected") {
                      let { id, printerName, ip, err } = reason;
                      printStatus.allPrinted = false;
                      let date = new Date().toLocaleString("sv", { timeZoneName: "short" }).slice(0, 19);
                      printStatus.id = id;
                      printStatus.failedPrinters.push({ date, printerName, ip, err: `${err}` });
                      console.log("\nFailed printer properties:\n");
                      console.table({
                        date,
                        printerName,
                        ip,
                        err: `${err}`,
                      });
                    }
                  }
                  console.log("\nThe results of the promises:\n");
                  console.table(results);
                  // Confirms that all receipts have been printed
                  if (printStatus.allPrinted) {
                    let ids = [];

                    //Gets all of the documents in the "orders" collection and loops through the doc data.
                    orderQuery.docs.forEach((doc) => {
                      ids.push(doc.id);
                    });

                    //Find each document with the respective id and update the printed property in the (orders collection) and delete the document in the printQue collection
                    ids.forEach(async (id) => {
                      this.db.collection("orders").doc(id).update({ printed: true });
                      await this.db.collection("printQue").doc(change.doc.id).delete();
                    });
                    console.log("\nOrder successfully printed");
                  } else if (!printStatus.allPrinted) {
                    console.log(printStatus);
                    // Indicates that one or more receipts have failed to print.
                    const x = printStatus;
                    this.db.collection("printQue").doc(id).delete();
                    this.db.collection("errLog").doc(id).set(x, { merge: true });
                  } else {
                    console.log("ERROR: NO RESPONSE FROM PRINTER.");
                  }
                })
                .catch((err) => {
                  console.log("\n\nWE HAVE AN ERROR\n\n", err);
                });
            });
          }
        }
      });
    });
  }
}

module.exports = Backend;
