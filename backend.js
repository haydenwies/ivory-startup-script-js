class Backend {

    constructor() {

        const { initializeApp, cert } = require('firebase-admin/app')
        const { getFirestore } = require('firebase-admin/firestore')

        const serviceAccount = require('./credentials.json')

        initializeApp({
            credential: cert(serviceAccount)
        })

        this.db = getFirestore()

        // Get resturant info

    }
    
    orderQueListener() {
        
        const TemplateOne = require('./templates/templateOne')
        const orderQue = this.db.collection("orderQue")

        orderQue.onSnapshot(querySnapshot => {
            querySnapshot.docChanges().forEach(async change => {

                if (change.type === "added") {

                    const data = change.doc.data()
                    
                    // Get order id
                    const id = data["id"]
                    // Get printers
                    const printers = data["printers"]
                    // Fetch order
                    const order = await this.db.collection("orders").doc(id).get()
                    // Check if exists
                    if (!order.exists) {
                        throw "Order cannot be found"
                    }

                    // Try print to each printer 
                    var failedPrinters = []
                    for (const printer of printers) {
                        try {
                            new TemplateOne(printer, "", order)
                        } catch(err) {
                            failedPrinters.push(err)
                        }
                    }

                    // If there was failed printers, log
                    if (failedPrinters.length > 0) {
                        this.db.collection("errLog").add({
                            "datetime" : new Date().toLocaleString('sv', {timeZoneName: 'short'}).slice(0, 18),
                            "errType" : "PRINTER_CONNECTION_ERR",
                            "errMessage" : `Failed to print to ${failedPrinters.length} printers`,
                            "failedPrinters" : failedPrinters
                        })
                    }

                }

            })
        })

    }

}

module.exports = Backend