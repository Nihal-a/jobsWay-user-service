require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb')



module.exports = {
    getCompanyDetails :async (req, res) => {
        const id = req.params.id

        try {
            var companyDetails = await db.get().collection(collection.COMPANY_COLLECTION).findOne({_id : ObjectId(id)})

            res.status(200).json(companyDetails)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getAllCompanies : async (req,res) => {
        try {
            var allCompanies = await db.get().collection(collection.COMPANY_COLLECTION).find({$and : [{status : true} , {ban : false}]}).limit(6).toArray()
            
            res.status(200).json(allCompanies)

        } catch (error) {
            res.status(500).json({Err : error})
        }
    },
    getAllTaskOfUser : async(req,res) => {

        const { userId } = req.params

        try {
            var allTask = await db.get().collection(collection.USER_TASK_COLLECTION).find({userId : ObjectId(userId)}).toArray()
            
            res.status(200).json(allTask)

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}
