class TemplateOne {
  /**
   * Constructor initializes the printer options and executes the print command
   * @param {*} ip ip address of the printer
   * @param {*} restaurantInfo restaurant information
   * @param {*} order order details
   * @param {*} resolve stores the success state
   * @param {*} reject stores the failed state
   */
  constructor(printerName, ip, copies, restaurantInfo, order, resolve, reject) {
    console.log("Formatting receipt...");

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

    // Formats the each individual item
    const items = () => {
      let items = "";
      for (const x of order["items"]) {
        let item = formatter.itemBreakdown(x);
        items = items.concat(item);
      }
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

    const divider = formatter.divider();
    //Properties of the receipt
    let { date, hours, meridian, minutes } = order.scheduledTime;
    const scheduledTime = order.isScheduledOrder ? `${hours}:${minutes} ${meridian}\n${date}` : "";
    const orderTime = `${order.time[0]}, ${order.date}`;
    const finishTime = order.isScheduledOrder ? scheduledTime : order.finishTime;
    const orderType = formatter.orderType(order["orderType"], order["deliveryAddress"]);
    const orderNote = formatter.note(order["note"]);
    const isPaid = formatter.paidStatus(order.paid, order.paymentMethod);
    const endingMessage = "Thank You & Come Again :)";
    const subTotal = `${formatter.priceStatement("Sub total", order["subTotal"])}`;
    const beforeDiscount = `${
      order.discounted ? (order.afterTaxDiscount !== "" ? beforeTaxDiscount() + "\n" : "") : ""
    }`;
    const delivery = `${order.deliveryAddress === "" ? "" : deliveryFee() + "\n"}`;
    const tax = `${formatter.priceStatement("Tax", order["tax"])}`;
    const afterDiscount = `${
      order.discounted ? (order.beforeTaxDiscount !== "" ? afterTaxDiscount() + "\n" : "") : ""
    }`;
    const total = `${formatter.priceStatement("Total", order["total"])}`;

    const formattedTotals = `${subTotal}${beforeDiscount}${delivery}${tax}\n${afterDiscount}${total}`; //Formatted totals as one string

    console.log("Attempting to print...");
    //Attempts to connect to the thermal printer and execute the print

    for (i=0; i<copies; i++) {

      device.open((err) => {
        try {
          if (err) {
            throw err;
          } else {
            printer
              .beep(1, 5)
              // Restaurant name
              .align("ct")
              .size(1.5, 1)
              .text(`${restaurantInfo["name"]}`)

              // Spacer
              .feed()

              // Time
              .size(1.5, 2)
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
              .text(orderNote + "\n")

              // Payment Method
              .text(isPaid)

              // Divider
              .text(divider)

              // Items
              .size(0.5, 1)
              .text("\n" + items())

              // Divider
              .text(divider)

              // Totals
              .text(formattedTotals + "\n")

              // Finish Time
              .align("ct")
              .size(1.5, 2)
              .text(finishTime)

              // Ending MEssage
              .size(0.5, 1)
              .text(endingMessage)

              // Spacer x2
              .text("\n\n")

              // Cut Receipt & Close printer session
              .cut()
              .close();
            resolve({ id: order.id, printerName, ip });
            // return resolve, reject;
          }
        } catch (err) {
          reject({ id: order.id, printerName, ip, err });
          // return resolve, reject;
        }
      });

    }
    return resolve, reject;
  }
}

module.exports = TemplateOne;
