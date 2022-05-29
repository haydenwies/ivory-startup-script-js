class Backend {

    constructor() {

        const { initializeApp, cert } = require('firebase-admin/app')
        const { getFirestore } = require('firebase-admin/firestore')

        const serviceAccount = require('./credentials.json')

        initializeApp({
            credential: cert(serviceAccount)
        })

        this.db = getFirestore()

        const doc = this.db.collection("general").doc("restaurantInfo").get()
        if (doc.exists) {
            this.restaurantInfo = doc.data()
        } else {
            this.restaurantInfo = null
        }

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
                    
        
                    // const fetch = new Promise 
                    
                    
                    // Fetch order
                    const order = await this.db.collection("orders").doc(id).get()
                    // Check if exists
                    if (!order.exists) {
                        throw "Order cannot be found."
                    } else {

                        for (const printer of printers) {                            
                            new Promise((resolve, reject) => {
                                resolve, reject = new TemplateOne(printer, resolve, reject, this.restaurantInfo, order.data())
                            }).catch((err) => {
                                let x = {}
                                x[printer] = new Date().toLocaleString('sv', {timeZoneName: 'short'}).slice(0, 19)
                                this.db.collection("errLog").doc(id).set(x, { merge: true })
                            })
                        }

                    }

                }

            })
        })

    }

}

module.exports = Backend