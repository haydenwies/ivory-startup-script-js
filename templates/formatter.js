class Formatter {
  constructor(lineWidth) {
    this.lineWidth = lineWidth;
  }

  /**
   * Makes a divider (----) runningn the width of the receipt.
   * @returns Divider string.
   */
  divider() {
    var div = "";

    for (let i = 0; i < this.lineWidth; i++) {
      div += "-";
    }
    return div;
  }

  paidStatus(isPaid, paymentMethod) {
    if (isPaid) {
      switch (paymentMethod) {
        case "CASH":
          return "Cash[ X ]          Debit[  ]          Credit[  ]";
        case "DEBIT":
          return "Cash[  ]          Debit[ X ]          Credit[  ]";
        case "CREDIT":
          return "Cash[  ]          Debit[  ]          Credit[ X ]";
      }
    } else {
      return "Cash[  ]          Debit[  ]          Credit[  ]";
    }
  }

  /**
   * Formats orderType for printing.
   * @param {String} orderType Options include PICKUP, DELIVERY, WALKIN.
   * @param {String} address Address included if DELIVERY, default null.
   * @returns Formatted text or null value.
   */
  orderType(orderType = "", address = "") {
    if (orderType === "PICKUP") {
      return "PICKUP";
    } else if (orderType === "DELIVERY") {
      const x = "DELIVERY:  ";
      if (address.length > this.lineWidth - x.length) {
        return `DELIVERY:\n${address}`;
      } else {
        return `${x}${address}`;
      }
    } else {
      return null;
    }
  }

  /**
   * Formats note for printing
   * @param {String} note Note string.
   * @returns Formatted note.
   */
  note(note = String) {
    const x = "NOTE:  ";
    if (note.length > this.lineWidth - x.length) {
      // Return text with 'NOTE:' on line above
      return `NOTE:\n${note}`;
    } else {
      // Return text
      return `NOTE:  ${note}`;
    }
  }

  /**
   * Formats item object for printing.
   * @param {Object} item Contains name, price, selectionLists (used for combos), modifiers, and quantity.
   * @returns Formatted item with selectionLists and modifiers listed.
   */
  itemBreakdown(item) {
    let itemString = "";

    // Format name, quantity, and price
    let newName = "            ";
    let quantity = `${item["quantity"] === 1 ? "" : item["quantity"] + " x "}`;
    let price = `$${item["price"].toFixed(2)}`;
    let spacer;
    let spacerString = "";
    if (item.category === "Special Combo") {
      for (let comboItem of item["selectionList"].items) {
        newName = newName.concat(comboItem, "   ");
      }
      spacer = this.lineWidth - (quantity.length + newName.length + price.length);
    } else {
      spacer = this.lineWidth - (quantity.length + item["name"].length + price.length);
    }

    // Adds the correct amount of spacing between item name and price
    for (let i = 0; i < spacer; i++) {
      spacerString = spacerString.concat(" ");
    }

    // let nameWidth = this.lineWidth - quantity.length - spacer - price;
    // let nameHeight = Math.ceil(item["name"] / nameWidth);

    // if (nameHeight > 1) {
    //   for (let i = 0; i < nameHeight; i++) {
    //     itemString = itemString.concat(item["name"].slice(i * nameWidth, (i + 1) * nameWidth));

    //     if (i === 0) {
    //       itemString = itemString.concat(spacerString, price, "\n");
    //     } else if (i === nameHeight) {
    //       itemString = itemString.concat(quantity, "\n");
    //     } else {
    //       itemString = itemString.concat("\n");
    //     }
    //   }
    // } else {
    if (item.category === "Special Combo") {
      itemString = itemString.concat(quantity, newName, spacerString, price, "\n");
    } else {
      itemString = itemString.concat(quantity, item["name"], spacerString, price, "\n");
    }

    // }

    // Format selectionList
    for (let selectionList of item["selectionList"].items) {
      if (item.category === "Special Combo") break; //Exits the selection list if item is special combo
      const bullet = "  - ";
      spacer = "    ";
      const selectionListWidth = this.lineWidth - bullet.length;
      const selectionListHeight = Math.ceil(selectionList.length / selectionListWidth);

      // if (selectionListHeight > 1) {
      //   for (let i = 0; i < selectionListHeight; i++) {
      //     let x = selectionList.slice(i * selectionListWidth, (i + 1) * selectionListWidth);

      //     if (i === 0) {
      //       itemString.concat(bullet, x, "\n");
      //     } else {
      //       itemString.concat(spacer, x, "\n");
      //     }
      //   }
      // } else {

      itemString = itemString.concat(bullet, selectionList, "\n");
      // }
    }

    // Format modifiers
    if (item.modifiers.length !== 0) {
      itemString = itemString.concat("! ----------------- N O T E ------------------ !\n");
    }

    for (let modifier of item["modifiers"]) {
      const start = "[";
      const modifierWidth = this.lineWidth - start.length;
      const modifierHeight = Math.ceil((modifier.name.length + 2) / modifierWidth);
      spacerString = "";
      spacer = this.lineWidth - (`${start}${modifier.name}]`.length + `$${modifier.price.toFixed(2)}`.length);
      for (let i = 0; i < spacer; i++) {
        spacerString = spacerString.concat(" ");
      }

      if (modifierHeight > 1) {
        for (let i = 0; i < modifierHeight; i++) {
          let x = modifier.name.split(i * modifierWidth, (i + 1) * modifierWidth);

          if (i === 0) {
            itemString = itemString.concat(start, x, "\n");
          } else if (i === modifierHeight) {
            itemString = itemString.concat(spacer, x, ")\n");
          } else {
            itemString = itemString.concat(spacer, x, "\n");
          }
        }
      } else {
        itemString = itemString.concat(
          start,
          `${modifier.name}]`,
          spacerString,
          `$${modifier.price.toFixed(2)}`,
          "\n"
        );
      }
    }
    return itemString + "\n";
  }

  /**
   * Formats priceLabel for printing.
   * @param {String} priceLabel Declares what type of price is being displayed (ex. beforeTaxDiscount).
   * @param {Float} price Displayed price.
   */
  priceStatement(priceLabel, price = Number) {
    var spacer = "";
    let x;
    if (priceLabel === "Before tax discount" || priceLabel === "After tax discount") {
      x = this.lineWidth - priceLabel.length - 1 - `-$${price.toFixed(2)}`.length;
    } else {
      x = this.lineWidth - priceLabel.length - 1 - `$${price.toFixed(2)}`.length;
    }

    for (let i = 0; i < x; i++) {
      spacer += " ";
    }

    if (priceLabel === "Before tax discount" || priceLabel === "After tax discount") {
      return `${priceLabel}:${spacer}-$${price.toFixed(2)}`;
    } else {
      return `${priceLabel}:${spacer}$${price.toFixed(2)}`;
    }
  }
}

module.exports = Formatter;
