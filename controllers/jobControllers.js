const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const collection = require('../config/collection')
const { validationResult } = require('express-validator')
const { cloudinary } = require('../utils/cloudinary')
const { ObjectId } = require('bson')
const { uploadFile } = require('../utils/s3')



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
            var allJobs = await db.get().collection(collection.JOBS_COLLECTION).find({status : true}).toArray()

            res.status(200).json(allJobs)
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
        const {formData , image } = req.body
        const resume = req.file
        const {jobId} = req.params
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

            const {Location} = await uploadFile(resume)
                
            await unLinkFile(resume.path)

            formData.resumeUrl = Location

            formData.status = 'PENDING' //APPROVED , REJECTED , PENDING

            await db.get().collection(collection.USER_COLLECTION).updateOne({_id : ObjectId(formData.userId)} , {
                    $addToSet : {
                        appliedJobs :{
                            id : ObjectId(formData.jobId) ,
                            status : formData.status
                        }
                    }
            })

            await db.get().collection(collection.JOBS_COLLECTION).updateOne({_id : ObjectId(jobId)} , {
                    $addToSet : {
                        applications : formData
                    }
            })


            let job = await db.get().collection(collection.JOBS_COLLECTION).findOne({_id : ObjectId(jobId)})

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
    },
    getJobById : async (req , res) => {

        const {jobId} = req.params

        try {

            const jobDetails = await db.get().collection(collection.JOBS_COLLECTION).findOne({_id : ObjectId(jobId)})

            if(!jobDetails) return res.status(400).json({msg : 'No job found with this ID'})

            res.status(200).json(jobDetails)
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}
