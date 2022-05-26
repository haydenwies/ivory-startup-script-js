class TemplateOne {
    
    constructor(ipAddress, restaurantInfo, order) {        

        const escpos = require('escpos')
        const Formatter = require('./formatter')
        
        const formatter = new Formatter(42)

        try {
            const device = new escpos.Network(ipAddress)
            const options = { encoding : "utf8", width : 24 }
            const printer = new escpos.Printer(device, options)
        
            const divider = formatter.divider()
            const dt = new Date().toLocaleString('sv', {timeZoneName: 'short'}).slice(0, 18)
            const orderType = formatter.orderType(order["orderType"], order["address"])
            const orderNote = formatter.note(order["note"])

            const items = () => {
                const items = ""
                for (const x of order["items"]) {
                    const item = formatter.itemBreakdown(x)
                    items.concat(item)
                }
                return items
            }
            
            const deliveryFee = () => {
                if (order["orderType"] == "DELIVERY") {
                    const deliveryFee = formatter.priceStatement("Delivery fee", order["deliveryFee"])
                    return deliveryFee
                } else {
                    return ""
                }
            }

            const beforeTaxDiscount = () => {
                if (order["beforeTaxDiscount"]) {
                    const beforeTaxDiscount = formatter.priceStatement("Before tax discount", order["beforeTaxDiscount"])
                    return beforeTaxDiscount
                } else {
                    return ""
                }
            }

            const afterTaxDiscount = () => {
                if (order["afterTaxDiscount"]) {
                    const afterTaxDiscount = formatter.priceStatement("After tax discount", order["afterTaxDiscount"])
                    return afterTaxDiscount
                } else {
                    return ""
                }
            }

            device.open(function(err) {
                printer

                // Restaurant name
                .align("ct")
                .size(2, 2)
                .text(`${restaurantInfo["name"]}\n`)
                // Spacer
                .text("\n")
                // Time
                .size(1, 2)
                .text(dt)

                // Spacer x2
                .text("\n\n")

                // Order number
                .align("lt")
                .text(`Phone number:  ${order["phoneNumber"]}\n`)
                // Order time
                .text(`Order time:  ${order["time"]}, ${order["date"]}\n`)
                // Spacer
                .text("\n")

                // Order type
                .text(orderType)
                // Order note
                
                .text(orderNote)

                // Spacer
                .text("\n")
                // Divider
                .text(divider)
                // Spacer
                .text("\n")

                // Items
                .text(items())

                // Spacer
                .text("\n")
                // Divider
                .text(divider)
                // Spacer
                .text("\n")

                // Sub total
                .text(formatter.priceStatement("Sub total", order["subTotal"]))
                // Delivery fee
                .text(deliveryFee())
                // Before tex discount
                .text(beforeTaxDiscount())
                // Tax
                .text(formatter.priceStatement("Tax", order["tax"]))
                // After tax discount
                .text(afterTaxDiscount())
                // Total
                .text(formatter.priceStatement("Total", order["total"]))

                // Spacer x2
                .text("\n\n")

                .cut

            })

        } catch(err) {
            throw ipAddress
        }
    }

}

module.exports = TemplateOne