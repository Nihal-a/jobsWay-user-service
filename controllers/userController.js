require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb')



module.exports = {
    createResume : async (req , res) => {

        const userDetails = req.body

        try {
            

            db.get().collection(collection.RESUME_COLLECTION).insertOne()
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}
