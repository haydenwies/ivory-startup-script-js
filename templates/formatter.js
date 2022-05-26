class Formatter {

    constructor(lineWidth) {
        this.lineWidth = lineWidth
    }

    /**
     * Makes a divider (----) runningn the width of the receipt.
     * @returns Divider string.
     */
    divider() {

        div = ""

        for (i = 0; i < this.lineWidth; i++) {
            div.concat("-")
        }

        return div
    }

    /**
     * Formats orderType for printing.
     * @param {String} orderType Options include PICKUP, DELIVERY, WALKIN.
     * @param {String} address Address included if DELIVERY, default null.
     * @returns Formatted text or null value.
     */
    orderType(orderType, address = null) {

        if (orderType === "PICKUP") {

            return "PICKUP\n"

        } else if (orderType === "DELIVERY") {

            const x = "DELIVERY:  "
            if (address.length > this.lineWidth - x.length) {

                return `DELIVERY:\n${address}`
            
            } else {

                return `${x}${address}`
            
            }

        } else {

            return null

        }

    }

    /**
     * Formats note for printing
     * @param {String} note Note string.
     * @returns Formatted note.
     */
    note(note) {

        const x = "NOTE:  "
        if (note.length > this.lineWidth - x.length) {

            // Return text with 'NOTE:' on line above
            return `NOTE:\n${note}`
        
        } else {
        
            // Return text
            return `NOTE:  ${note}`
        
        }

    }

    /**
     * Formats item object for printing.
     * @param {Object} item Contains name, price, components (used for combos), modifiers, and quantity.
     * @returns Formatted item with components and modifiers listed.
     */
    itemBreakdown(item) {

        itemString = ""
        
        // Format name, quantity, and price
        quantity = ` x${item["quantity"]}`
        spacer = 4
        spacerString = ""
        for (i = 0; i < spcaer; i++) {
            spacerString.concat(" ")
        }
        price = `$${item["price"]}`
        
        nameWidth = this.lineWidth - quantity.length - spacer - price 
        nameHeight = Math.ceil(item["name"]/nameWidth)

        if (nameHeight > 1) {

            for (let i = 0; i < nameHeight; i++) {

                itemString.concat(item["name"].slice(i*nameWidth, (i+1)*nameWidth))

                if (i === 0) {
                    itemString.concat(spacerString, price, "\n")
                } else if (i === nameHeight) {
                    itemString.concat(quantity, "\n")
                } else {
                    itemString.concat("\n")
                }
                
            }

        } else {

            item.concat(item["name"], quantity, spacerString, price, "\n")

        }
        
        // Format components
        for (const component of item["components"]) {

            const bullet = "  - "
            const spacer = "    "
            const componentWidth = this.lineWidth - bullet.length
            const componentHeight = Math.ceil(component.length / componentWidth)

            if (componentHeight > 1) {
                for (i = 0; i < componentHeight; i++) {

                    x = component.slice(i*componentWidth, (i+1)*componentWidth)

                    if (i === 0) {
                        itemString.concat(bullet, x, "\n")
                    } else {
                        itemString.concat(spacer, x, "\n")
                    }

                }
            } else {
                itemString.concat(bullet, component, "\n")
            }

        }

        // Format modifiers
        for (const modifier in item["modifiers"]) {

            const start = "    ("
            const spacer = "    "
            const modifierWidth = this.lineWidth - start.length
            const modifierHeight = Math.ceil((modifier.length + 2) / modifierWidth)

            if (modifierHeight > 1) {
                for (i = 0; i < modifierHeight; i++) {

                    x = modifier.split(i*modifierWidth, (i+1)*modifierWidth)

                    if (i === 0) {
                        itemString.concat(start, x, "\n")
                    } else if (i === modifierHeight) {
                        itemString.concat(spacer, x, ")\n")
                    } else {
                        itemString.concat(spacer, x, "\n")
                    }
                }
            }

        }

        return itemString

    }

    /**
     * Formats priceLabel for printing.
     * @param {String} priceLabel Declares what type of pruce is being displayed (ex. beforeTaxDiscount).
     * @param {Float} price Displayed price.
     */
    priceStatement(priceLabel, price) {

        const spacer = ""
        const x = this.lineWidth - priceLabel.length - 1 - price.toString().length

        for (let i = 0; i < x; i++) {
            spacer.concat(" ")
        }

        return `${priceLabel}:${spacer}$${price.toString()}`
    }

}

module.exports = Formatter