class TemplateOne {
    
    constructor(ipAddress, resolve, reject, restaurantInfo, order) {        


        const escpos = require('escpos')
        escpos.Network = require('escpos-network')
        const Formatter = require('./formatter')
        
        const formatter = new Formatter(48)

        const device = new escpos.Network(ipAddress)
        const options = { encoding : "utf8", width : 24 }
        const printer = new escpos.Printer(device, options)
    
        const divider = formatter.divider()
        const dt = new Date().toLocaleString('sv', {timeZoneName: 'short'}).slice(0, 19)
        const orderType = formatter.orderType(order["orderType"], order["deliveryAddress"])
        const orderNote = formatter.note(order["note"])

        // const items = () => {
        //     const items = ""
        //     for (const x of order["items"]) {
        //         const item = formatter.itemBreakdown(x)
        //         items.concat(item)
        //     }
        //     return items
        // }
        
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

        device.open((err) => {

            try {
                if (err) {
                    throw err
                } else {
                    printer
                    // Restaurant name
                    .align("ct")
                    .size(1.5, 1)
                    .text(`${restaurantInfo["name"]}`)
                    .size(0.5, 0.5)
                    // Spacer
                    .feed()
                    // Time
                    .text(dt)

                    // Spacer x2
                    .text("\n\n")

                    // Order number
                    .align("lt")
                    .text(`Phone number:  ${order["phoneNumber"]}`)
                    // Order time
                    .text(`Order time:  ${order["time"]}, ${order["date"]}`)
                    // Spacer
                    .feed()

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

                    // // Items
                    // .text(items())

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

                    .cut()
                    .close()

                    
                    resolve("Printed successfully.")
                    

                    return resolve, reject
                }
            } catch(err) {

                reject("Failed to print.")
                return resolve, reject
            }

        })
        
    }

}

module.exports = TemplateOne