class TemplateOne {

    constructor(ipAddress) {

        const escpos = require('escpos')

        try {
            const device = new escpos.Network(ipAddress)
            const options = { encoding : "utf8", width : 24 }
            const printer = new escpos.Printer(device, options)
        
            device.open(function(err) {

                // Receipt format

            })

        } catch(err) {
            console.log(ipAddress)
        }
    }

}