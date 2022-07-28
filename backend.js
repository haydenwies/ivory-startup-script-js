class Backend {
  constructor() {
    // Firebase and firestore setup
    const { initializeApp, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    const serviceAccount = require("./credentials.json");

    const DEFAULT_RESTAURANT_NAME = "Super Wok";
    const DEFAULT_WEBSITE_NAME = "";

    //Validate firebase credentials in credentials.json
    initializeApp({
      credential: cert(serviceAccount),
    });
    this.db = getFirestore(); //Gets a reference to firestore

    this.restaurantInfo = {
      website: DEFAULT_WEBSITE_NAME,
      name: DEFAULT_RESTAURANT_NAME,
    };

    // Pulls restaurant info data
    const restaurantInfo = async () => {
      const doc = await this.db
        .collection("general")
        .doc("restaurantInfo")
        .get();
      if (doc.exists) {
        this.restaurantInfo = doc.data();
        if (
          this.restaurantInfo.name === undefined ||
          this.restaurantInfo.website === undefined
        ) {
          this.restaurantInfo = {
            website: DEFAULT_WEBSITE_NAME,
            name: DEFAULT_RESTAURANT_NAME,
          };
        }
      }
    };

    restaurantInfo(); //Call the method to get restaurant info
  }

  /**
   * Firestore collection listener to listen to change events in the printQue collection
   */
  async orderQueListener() {
    const TemplateOne = require("./templates/templateOne");
    const printQue = this.db.collection("printQue");
    let printStatus = {
      allPrinted: true,
      failedPrinters: [],
      id: "",
      printId: "",
      otherErrors: [],
    };

    //Takes a snapshot of the collection at that current point in time
    printQue.onSnapshot((querySnapshot) => {
      //Listens for when the querySnapshot document changes
      querySnapshot.docChanges().forEach(async (change) => {
        //Indicates that an order has been saved to the print Queue
        if (change.type === "added") {
          console.log(
            "\n\n******************* FIREBASE PRINTING ******************* "
          );
          console.log("An order has arrived:");

          //Gets the id and printer info for the print request
          const data = change.doc.data(); //Gets the data of the changed doc
          const id = data["id"]; // Get order id
          const printers = data["printers"]; // Get printers from the printQue doc

          // Checks for failed name property in
          for (let printer of printers) {
            if (printer.name === undefined) {
              printer.name = "";
              printStatus.otherErrors.push("Printer name undefined");
            }
          }

          // Fetch order from the "orders" collection by querying the id
          const orderQuery = await this.db
            .collection("orders")
            .where("id", "==", id)
            .get();

          // Check if the document was able to be queried
          if (orderQuery.empty) {
            console.log("no docs");
          } else {
            let templateOnePromises = []; //Stores the array of printer promise requests to be executed by promise.allSetteled

            //Take the queried doc (since the query should only find one doc) and prepare an array of promises
            orderQuery.docs.forEach((order) => {
              //Generating a receipt template for each print request
              for (const printer of printers) {
                //Store a list of promises into an array to be executed all at once
                templateOnePromises.push(
                  new Promise((resolve, reject) => {
                    resolve,
                      (reject = new TemplateOne(
                        printer.name !== undefined ? printer.name : "",
                        printer.ip !== undefined ? printer.ip : "192.168.0.1",
                        printer.copies !== undefined ? printer.copies : "1",
                        printer.beeps !== undefined ? printer.beeps : "1",
                        this.restaurantInfo !== undefined
                          ? this.restaurantInfo
                          : {
                              website: DEFAULT_WEBSITE_NAME,
                              name: DEFAULT_RESTAURANT_NAME,
                            },
                        order.data() !== undefined ? order.data() : {},
                        false, //wirePrint
                        resolve,
                        reject
                      ));
                  })
                );
              }

              // Execute printing process (load all of the promises) and wait for all of them to be finished before continuing.
              Promise.allSettled([...templateOnePromises])

                //Promise.allSettled doesn't have a catch case typically
                .then(async (results) => {
                  // Indicates whether the printers succesfully printed or failed and gives a list of failed printers.

                  //We loop over all of the results and record what the status is
                  for (let result of results) {
                    let { status } = result;
                    //A print request has failed to exectute
                    if (status === "rejected") {
                      let { reason } = result;
                      let date = new Date()
                        .toLocaleString("sv", { timeZoneName: "short" })
                        .slice(0, 19); //Get the current date and time

                      //Throws error to catch since the remaining properties are undefined.
                      if (reason.id == null) {
                        throw reason;
                      }

                      //Fills in a list of failed printers
                      let { id, printerName, ip, printId, err } = reason; //Destructure the properties of the failed print attempt (promise)
                      printStatus.id = id ?? "UNKNOWN";
                      printStatus.printId = printId ?? "UNKNOWN";
                      printStatus.allPrinted = false;
                      printStatus.failedPrinters.push({
                        date: date ?? "UNKNOWN",
                        printerName: printerName ?? "UNKNOWN",
                        ip: ip ?? "UNKNOWN",
                        err: `${err}`,
                      });

                      // Displays out what the failed printer properties are
                      console.log(
                        ` \n\n// -------------------------- ${printerName} FAILED -------------------------- //\n\n`
                      );
                      console.table({
                        date,
                        printerName: printerName ?? "UNKNOWN",
                        ip: ip ?? "UNKNOWN",
                        printId: printId ?? "UNKNOWN",
                        err: `${err}`,
                      });
                    }
                  } // End of printer results

                  //All receipts printed successfully
                  if (printStatus.allPrinted) {
                    let ids = [];

                    //Takes all of the queried receipt(s) (usually only just one doc) from the "orders" collection and pushes it to an ids array.
                    orderQuery.docs.forEach((doc) => {
                      ids.push(doc.id);
                    });

                    //Find each document with the respective id and update the printed property in the (orders collection) and delete the document in the printQue collection
                    ids.forEach(async (id) => {
                      this.db
                        .collection("orders")
                        .doc(id)
                        .update({ printed: true });
                      await this.db
                        .collection("printQue")
                        .doc(change.doc.id)
                        .delete();
                    });

                    // Indicates if all printers were successful
                    console.log(
                      " \n// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ORDERS PRINTED SUCCESSFULLY !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //\n"
                    );
                  }
                  //One or more receipts have failed to print. Now store the error in the errLog
                  else if (!printStatus.allPrinted) {
                    // Indicates one or more of the receipts failed
                    console.log(
                      " \n// -------------------------- ONE OR MORE ORDERS FAILED TO PRINT -------------------------- //\n",
                      printStatus
                    );

                    // Deletes order from the printQue list so it won't be printed again and uploads an error message to the error log collection
                    await this.db.collection("printQue").doc(id).delete();
                    await this.db
                      .collection("errLog")
                      .doc(printStatus.printId ?? "undefined")
                      .set(printStatus, { merge: true });
                      printStatus = {
                        allPrinted: true,
                        failedPrinters: [],
                        id: "",
                        printId: "",
                        otherErrors: [],
                      };
                  }
                })
                //This catch case will likely never be executed, but if it does I don't understand JS.
                .catch(async (err) => {
                  await this.db
                    .collection("serverLog")
                    .doc()
                    .set(
                      { backend: "Express", err: `${err}` ?? "UNDEFINED ERROR", date}
                    );
                  console.error("\n\nWE HAVE AN ERROR\n\n", err);
                });
            });
          }
        }
      });
    });
  }
}

module.exports = Backend;
