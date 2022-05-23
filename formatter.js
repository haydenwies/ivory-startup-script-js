class StringFormatter {

    constructor(lineWidth) {
        this.lineWidth = lineWidth
    }

    /**
     * Formats orderType for printing.
     * @param {String} orderType Options include PICKUP, DELIVERY, WALKIN.
     * @param {String} address Address included if DELIVERY, default null.
     */
    orderType(orderType, address = null) {
        
    }

    /**
     * Formats note for printing
     * @param {String} note Note string.
     */
    note(note) {

    }

    /**
     * Formats item object for printing.
     * @param {Item} item Contains name, price, components (used for combos), modifiers, and quantity.
     */
    itemBreakdown(item) {
        
    }

    /**
     * Formats priceLabel for printing.
     * @param {String} priceLabel Declares what type of pruce is being displayed (ex. beforeTaxDiscount).
     * @param {Float} price Displayed price.
     */
    priceStatement(priceLabel, price) {
        
    }

}