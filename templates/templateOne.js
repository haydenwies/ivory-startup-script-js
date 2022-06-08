class TemplateOne {
  /**
   * Constructor initializes the printer options and executes the print command
   * @param {*} ip ip address of the printer
   * @param {*} restaurantInfo restaurant information
   * @param {*} order order details
   * @param {*} resolve stores the success state
   * @param {*} reject stores the failed state
   */
  constructor(ip, restaurantInfo, order, resolve, reject) {
    //ESCPOS libraries
    const escpos = require("escpos");
    escpos.Network = require("escpos-network");

    //Create a new instance of the formatter class
    const Formatter = require("./formatter");
    const formatter = new Formatter(48);

    //Printer device setup
    const device = new escpos.Network(ip);
    const options = { encoding: "utf8", width: 24 };
    const printer = new escpos.Printer(device, options);

    //Properties of the receipt
    const divider = formatter.divider(); //Divider string ("-----------------")
    // const dt = new Date().toLocaleString("sv", { timeZoneName: "short" }).slice(0, 19); //I'm assuming this is the current time
    let { date, hours, meridian, minutes, time } = order.scheduledTime;
    const scheduledTime = order.isScheduledOrder ? `${hours}:${minutes} ${meridian}\n${date}` : "";
    const orderTime = `${order.time[0]}, ${order.date}`;
    const finishTime = order.isScheduledOrder ? scheduledTime : order.finishTime;
    const orderType = formatter.orderType(order["orderType"], order["deliveryAddress"]); //The type of order with and a delivery address if applicable
    const orderNote = formatter.note(order["note"]); //The order note
    const isPaid = formatter.paidStatus(order.paid, order.paymentMethod);

    const formattedTotals = `${formatter.priceStatement("Sub total", order["subTotal"])}\n${
      order.discounted ? (order.afterTaxDiscount !== "" ? beforeTaxDiscount() + "\n" : "") : ""
    }${order.deliveryAddress === "" ? "" : deliveryFee() + "\n"}${formatter.priceStatement(
      "Tax",
      order["tax"]
    )}\n${
      order.discounted ? (order.beforeTaxDiscount !== "" ? afterTaxDiscount() + "\n" : "") : ""
    }${formatter.priceStatement("Total", order["total"])}`;

    // Formats the each individual item
    const items = () => {
      let items = "";
      for (const x of order["items"]) {
        let item = formatter.itemBreakdown(x);
        items = items.concat(item);
      }
      console.log(items);
      return items;
    };

    //Formats the delivery fee
    const deliveryFee = () => {
      if (order["orderType"] == "DELIVERY") {
        const deliveryFee = formatter.priceStatement("Delivery fee", order["deliveryFee"]);
        return deliveryFee;
      } else {
        return "";
      }
    };

    //Formats the beforeTaxDiscount
    const beforeTaxDiscount = () => {
      if (order["beforeTaxDiscount"] !== 0) {
        const beforeTaxDiscount = formatter.priceStatement("Before tax discount", order["beforeTaxDiscount"]);
        return beforeTaxDiscount;
      } else {
        return "";
      }
    };

    //Formats the afterTaxDiscount
    const afterTaxDiscount = () => {
      if (order["afterTaxDiscount"] !== 0) {
        const afterTaxDiscount = formatter.priceStatement("After tax discount", order["afterTaxDiscount"]);
        return afterTaxDiscount;
      } else {
        return "";
      }
    };

    //Attempts to connect to the thermal printer and execute the print
    device.open((err) => {
      try {
        if (err) {
          console.error(err);
          throw err;
        } else {
          printer
            // Restaurant name
            .align("ct")
            .size(1.5, 1)
            .text(`${restaurantInfo["name"]}`)
            // Spacer
            .feed()
            .size(1.5, 2)
            // Time
            .text(finishTime)
            .size(0.5, 1)

            // Spacer x2
            .text("\n")

            // Order number
            .align("lt")
            .text(`Phone number:  ${order["phoneNumber"]}`)
            // Order time
            .text(`Order time:  ${orderTime}`)
            // Spacer
            .feed()

            // Order type
            .text(orderType)
            // Order note
            .text(orderNote)
            .text("\n")

            // Payment Method
            .text(isPaid)

            // Divider
            .text(divider)
            // Spacer
            .text("\n")
            .size(0.5, 1)

            // Items
            .text(items())

            // Divider
            .text(divider)

            // Totals
            .text(formattedTotals)

            // Spacer x2
            .text("\n\n")
            
            .cut()
            .close();
          resolve("Printed successfully.");
          return resolve, reject;
        }
      } catch (err) {
        reject("Failed to print.");
        return resolve, reject;
      }
    });
  }
}

module.exports = TemplateOne;
