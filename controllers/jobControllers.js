const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const collection = require('../config/collection')
const { validationResult } = require('express-validator')
const { cloudinary } = require('../utils/cloudinary')
const { ObjectId } = require('bson')


module.exports = {
    getFeaturedJobs :async (req, res) => {
        try {
            var allFeaturedJobs = await db.get().collection(collection.JOBS_COLLECTION).find({status : true}).limit(8).toArray()

            res.status(200).json(allFeaturedJobs)

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getAllJobs : async(req,res) => {
        try {
            var allFeaturedJobs = await db.get().collection(collection.JOBS_COLLECTION).find({status : true}).toArray()

            res.status(200).json(allFeaturedJobs)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getJobsByCompany : async (req,res) => {
        const id = req.params.id

        try {
            var jobsOfCompany = await db.get().collection(collection.JOBS_COLLECTION).find({companyId : id}).toArray()
            console.log("helk");
            console.log(jobsOfCompany);
            res.status(200).json(jobsOfCompany)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    applyJob : async (req , res) => {
        const {formData , image , pdf} = req.body
        var errors = validationResult(req)

        try {

            // Express Validator error.

            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            const imageUploadedResponse = await cloudinary.uploader.upload(image , {
                upload_preset : 'Applied_Users_Image'
            })
    
            formData.imgUrl = imageUploadedResponse.url

            const pdfUploadedResponse = await cloudinary.uploader.upload(pdf , {
                upload_preset : 'Applied_Users_Pdf'
            })

            formData.pdfUrl = pdfUploadedResponse.url

            formData.status = 'PENDING' //APPROVED , REJECTED , PENDING

            await db.get().collection(collection.USER_COLLECTION).updateOne({_id : ObjectId(formData.userId)} , {
                    $addToSet : {
                        appliedJobs :{
                            id : ObjectId(formData.jobId) ,
                            status : formData.status
                        }
                    }
            })

            await db.get().collection(collection.JOBS_COLLECTION).updateOne({_id : ObjectId(formData.jobId)} , {
                    $addToSet : {
                        applications : formData
                    }
            })


            let job = await db.get().collection(collection.JOBS_COLLECTION).findOne({_id : ObjectId(formData.jobId)})

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({_id : ObjectId(formData.userId)})

            const token = jwt.sign({ email: user.email, id: user._id.str }, 'secret', { expiresIn: "1h" })

            const userData = {user , token}

            res.status(200).json({job , userData})

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getUserAppliedJobs : async (req,res) => {
        
        const id = req.params.id

        try {

            var appliedJobs = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match : {_id : ObjectId(id)}
                },
                {
                    $unwind : "$appliedJobs"
                },
                {
                    $project : {
                        _id : 0,
                        appliedJobs : 1
                    }
                },
                {
                    $lookup : {
                        from : collection.JOBS_COLLECTION,
                        localField : "appliedJobs",
                        foreignField : "_id",
                        as : 'appliedJobs'
                    }
                },
                {
                    $unwind : "$appliedJobs"
                },
                {
                    $project : {
                        "appliedJobs.jobTitle" : 1,
                        "appliedJobs.companyId" : 1
                    }
                },
                {
                    $lookup : {
                        from : collection.COMPANY_COLLECTION,
                        localField : "appliedJobs.companyId",
                        foreignField : "_id",
                        as : 'appliedJobs'
                    }
                },
                
            ]).toArray()

            res.status(200).json(appliedJobs)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    } 
}
