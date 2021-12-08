const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const { USER_COLLECTION } = require('../config/collection')
const collection = require('../config/collection')
const SERVICE_ID = process.env.SERVICE_ID
const ACCOUNT_SID = process.env.ACCOUNT_SID
const AUTH_TOKEN = process.env.AUTH_TOKEN
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN)
const { validationResult } = require('express-validator')
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
    }
}
