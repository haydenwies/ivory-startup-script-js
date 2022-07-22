const printOrder = async (receipt, printInfo, res) => {
  const DEFAULT_RESAURANT_NAME = "Super Wok";
  const DEFAULT_WEBSITE = "";
  const TemplateOne = require("./templates/templateOne");
  let restaurantInfo = { website: DEFAULT_WEBSITE, name: DEFAULT_RESAURANT_NAME };
  let printStatus = { allPrinted: true, failedPrinters: [], id: "", printId: "", otherErrors: [] };

  const id = printInfo.id; // Get order id
  const printers = printInfo.printers; // Get printers from printInfo

  let templateOnePromises = []; //Stores the array of printer promise requests to be executed by promise.allSetteled

  //Generating a receipt template for each print request
  for (const printer of printers) {
    //Store a list of promises into an array to be executed all at once
    templateOnePromises.push(
      new Promise((resolve, reject) => {
        resolve,
          (reject = new TemplateOne(
            printer.name !== undefined ? printer.name : "UNKNOWN",
            printer.ip !== undefined ? printer.ip : "192.168.0.1",
            printer.copies !== undefined ? printer.copies : "1",
            printer.beeps !== undefined ? printer.beeps : "1",
            restaurantInfo,
            receipt !== undefined ? receipt : {},
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

      // Displays a table of printer request results
      console.log(
        "\n// -------------------------- RESULTS OF THE PRINTER PROMISES -------------------------- //\n",
        results
      );

      //We loop over all of the results and record what the status is
      for (let result of results) {
        let { status } = result;
        //A print request has failed to exectute
        if (status === "rejected") {
          let { reason } = result;
          let date = new Date().toLocaleString("sv", { timeZoneName: "short" }).slice(0, 19); //Get the current date and time

          //Fills in a list of failed printers
          let { id, printerName, ip, printId, err } = reason; //Destructure the properties of the failed print attempt (promise)
          printStatus.id = id;
          printStatus.printId = printId;
          printStatus.allPrinted = false;
          printStatus.failedPrinters.push({ date, printerName, ip, err: `${err}` });

          // Displays out what the failed printer properties are
          console.log(
            ` \n\n// -------------------------- ${printerName} FAILED -------------------------- //\n\n`
          );
          console.table({
            date,
            printerName,
            ip,
            printId,
            err: `${err}`,
          });
        }
      } // End of printer results

      //All receipts printed successfully
      if (printStatus.allPrinted) {
        // Indicates if all printers were successful
        console.log(
          " \n\n// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ORDERS PRINTED SUCCESSFULLY !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //\n\n"
        );
        res.status(200).send("SUCCESS");
        return { status: 200, message: "All printers printed." };
      }
      //One or more receipts have failed to print. Now store the error in the errLog
      else if (!printStatus.allPrinted) {
        // Indicates one or more of the receipts failed
        console.log(
          " \n\n// -------------------------- ONE OR MORE ORDERS FAILED TO PRINT -------------------------- //\n\n",
          printStatus
        );
        res.status(409).send("FAILED");
      }
    })
    //This catch case will likely never be executed, but if it does I don't understand JS.
    .catch(async (err) => {
      console.error("\n\nWE HAVE AN ERROR\n\n", err);
    });
};
module.exports = { printOrder };
