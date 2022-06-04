class Backend {

    constructor() {

        const { initializeApp, cert } = require('firebase-admin/app')
        const { getFirestore } = require('firebase-admin/firestore')

        const serviceAccount = require('./credentials.json')

        initializeApp({
            credential: cert(serviceAccount)
        })

        this.db = getFirestore()

        const x = async () => {
            const doc = await this.db.collection("general").doc("restaurantInfo").get()
            if (doc.exists) {
                this.restaurantInfo = doc.data()
            } else {
                this.restaurantInfo = null
            }
        }
        x()

    }
    
    orderQueListener() {
        
        // const TemplateOne = require('./templates/templateOne')
        const TemplateOne = require('./templates/templateOne')
        const orderQue = this.db.collection("printQue")

        orderQue.onSnapshot(querySnapshot => {
            querySnapshot.docChanges().forEach(async change => {

                if (change.type === "added") {

                    const data = change.doc.data()
                    
                    // Get order id
                    const id = data["id"]
                    // Get printers
                    const printers = data["printers"]
                    
                    // Fetch order
                    // const order = await this.db.collection("orders").doc(id).get()
                    const orderQuery = await this.db.collection("orders").where("id", "==", id).get()
                    // Check if exists
                    if (orderQuery.empty) {
                        console.log("no docs")
                    } else {
                        orderQuery.docs.forEach((order => {
                            for (const printer of printers) {                            
                                new Promise((resolve, reject) => {
                                    // resolve, reject = new TemplateOne.print(printer.ip, resolve, reject, this.restaurantInfo, order.data())
                                    resolve, reject = new TemplateOne(printer.ip, this.restaurantInfo, order.data(), resolve, reject)
                                }).then(async () => {
                                    // this.db.collection("orders").doc(id).update({printed: true}) 
                                    const orderQuery = await this.db.collection("orders").where("id", "==", id).get()
                                    const ids = []
                                    orderQuery.docs.forEach((doc) => {
                                        ids.push(doc.id)
                                    })
                                    ids.forEach((id) => {
                                        this.db.collection("orders").doc(id).update({printed: true})
                                        await this.db.collection("printQue").doc(change.doc.id).delete()
                                    })
                                }).catch((err) => {
                                    console.log(printer.ip)
                                    const x = {}
                                    x[printer.ip] = new Date().toLocaleString('sv', {timeZoneName: 'short'}).slice(0, 19)
                                    this.db.collection("errLog").doc(id).set(x, {merge: true})
                                })
                            }
                        }))
                        
                    }

                }

            })
        })

    }

}

module.exports = Backend