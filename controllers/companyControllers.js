require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')




module.exports = {
    getCompanyDetails :async (req, res) => {
        const id = req.params.id

        try {
            // var companyDetails = await db.get().collection(collection.COMPANY_COLLECTION).findOne({_id : ObjectId(id)})
            var companyDetails = await db.get().collection(collection.COMPANY_COLLECTION).aggregate([
                {
                    $match : { _id : ObjectId(id) }
                },
                {
                    $lookup : {
                     from : collection.JOBS_COLLECTION,
                     localField : "_id" ,
                     foreignField : "companyId",
                     as : 'jobs'
                    }
                },

            ]).toArray()

            res.status(200).json(companyDetails[0])
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getAllCompanies : async (req,res) => {
        console.log("helloooo : " , req.url);
        try {
            var allCompanies = await db.get().collection(collection.COMPANY_COLLECTION).find({$and : [{status : true} , {ban : false}]}).limit(6).toArray()
            
            res.status(200).json(allCompanies)

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getAllTaskOfUser : async(req,res) => {

        const { userId } = req.params

        console.log(userId);
        try {
            // var allTask = await db.get().collection(collection.USER_TASK_COLLECTION).find({ $and : [ {userId : ObjectId(userId) } , {status : "PENDING"}] }).toArray()
            
            const allTask = await db.get().collection(collection.USER_TASK_COLLECTION).aggregate([
                {
                    $match : { 
                        $and : [ {userId : ObjectId(userId) } , {status : "PENDING"}]
                    }
                },
                {
                    $lookup : {
                     from : collection.COMPANY_COLLECTION,
                     localField : "companyId" ,
                     foreignField : "_id",
                     as : 'companyDetails'
                    }
                },
                {
                    $project : { "companyDetails.industry" : 0 , "companyDetails.email" : 0 , "companyDetails.bio" : 0 , "companyDetails.website" : 0 ,"companyDetails.facebook" : 0 ,"companyDetails.linkedIn" : 0 ,"companyDetails.twitter" : 0 ,"companyDetails.instagram" : 0 ,"companyDetails.password" : 0 ,"companyDetails.phone" : 0 ,  }
                }

            ]).toArray()

            res.status(200).json(allTask)

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    startTask: async(req ,res) => {

        const {taskId} = req.params

        try {
            
            
            const taskDetails =await db.get().collection(collection.USER_TASK_COLLECTION).findOne({_id : ObjectId(taskId)})
            
            if(taskDetails.status == "PENDING"){
                
                
                await db.get().collection(collection.USER_TASK_COLLECTION).updateOne({ _id : ObjectId(taskId) } , {
                    $set : {
                        status : "OPENED",
                    }
                })
                const token = jwt.sign({ time: taskDetails.time }, 'secret', { expiresIn: `${taskDetails.time}m` })

                const task = await db.get().collection(collection.USER_TASK_COLLECTION).findOne({ _id : ObjectId(taskId) })

                res.status(200).json({task , token})

            }else{
                res.status(404).json({msg : 'You have Already opened and Cannot Access the task Again'})
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}
