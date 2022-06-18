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

  /**
   * Makes a secondary divider (****) running the width of the receipt.
   * @returns Divider string.
   */
  secondaryDivider(width) {
    var div = "";

    for (let i = 0; i < width; i++) {
      div += "*";
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
      return "Cash[  ]           Debit[  ]          Credit[  ]";
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
      return `DELIVERY`;
    } else if (orderType === "DINE_INN") {
      return "DINE INN";
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
    let newName = "           ";
    let quantity = `${item["quantity"] === 1 ? "" : item["quantity"] + " x "}`;
    let price = `$${item["price"].toFixed(2)}`;
    let spacer;
    let spacerString = "";
    if (item.category === "Special Combo") {
      //Formats it horizontally
      for (let comboItem of item["selectionList"].items) {
        newName = newName.concat(comboItem, "   ");
      }

      spacer = this.lineWidth - (quantity.length + newName.length + price.length); //Calculate the spacing length of the name horizontally
    } else {
      spacer = this.lineWidth - (quantity.length + item["name"].length + price.length); //Calculate the spacing length of the name vertically
    }

    // Adds the correct amount of spacing between item name and price
    for (let i = 0; i < spacer; i++) {
      spacerString = spacerString.concat(" ");
    }

    if (item.category === "Special Combo") {
      itemString = itemString.concat(quantity, newName, spacerString, price, "\n");
    } else {
      itemString = itemString.concat(quantity, item["name"], spacerString, price, "\n");
    }

    // Format selectionList
    for (let selectionList of item["selectionList"].items) {
      if (item.category === "Special Combo") break; //Exits the selection list if item is special combo
      const bullet = "  - ";
      spacer = "    ";
      itemString = itemString.concat(bullet, selectionList, "\n");
    }

    // Format modifiers
    for (let modifier of item.modifiers) {
      const priceBreak = "    ";
      const modifierWidth =
        this.lineWidth - (("$" + `${modifier.price.toFixed(2)}`).length + priceBreak.length);
      const modifierHeight = Math.ceil(modifier.name.length / modifierWidth);
      const modifyIndicator = "|--> ";
      spacerString = "";
      spacer =
        this.lineWidth -
        (`${modifyIndicator}${modifier.name}`.length + ("$" + `${modifier.price.toFixed(2)}`).length);

      if (spacer > 0) {
        for (let i = 0; i < spacer; i++) {
          spacerString = spacerString.concat(" ");
        }
      }

      if (modifierHeight > 1) {
        for (let i = 0; i < modifierHeight; i++) {
          const x = `${modifyIndicator}${modifier.name}`.slice(i * modifierWidth, (i + 1) * modifierWidth);

          if (i === 0) {
            itemString = itemString.concat(
              x,
              priceBreak,
              !item.flatFeeModifierOn && (modifier.type === "Add" || modifier.type === "No Add")
                ? "$0.00"
                : `$${modifier.price.toFixed(2)}`,
              "\n"
            );
          } else if (i === modifierHeight) {
            itemString = itemString.concat(x, ")\n");
          } else {
            itemString = itemString.concat(x, "\n");
          }
        }
      } else {
        itemString = itemString.concat(
          `${modifyIndicator}${modifier.name}`,
          spacerString,
          item.flatFeeModifierOn && (modifier.type === "Add" || modifier.type === "No Add") //Doesn't show price of items if there is a flat fee modify price
            ? "$0.00"
            : `$${modifier.price.toFixed(2)}`,
          "\n"
        );
      }
    }
    console.log(itemString);
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
