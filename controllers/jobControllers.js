const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const collection = require('../config/collection')
const { validationResult } = require('express-validator')
const { cloudinary } = require('../utils/cloudinary')
const { ObjectId } = require('bson')
const { uploadFile } = require('../utils/s3')
const fs = require('fs')
const util = require('util')
const unLinkFile = util.promisify(fs.unlink)


module.exports = {
    getFeaturedJobs :async (req, res) => {
        try {
            // var allFeaturedJobs = await db.get().collection(collection.JOBS_COLLECTION).find({status : true}).limit(8).toArray()
            var allFeaturedJobs = await db.get().collection(collection.JOBS_COLLECTION).aggregate([
                {
                    $match : {status : true}
                },
                {
                    $lookup : {
                     from : collection.COMPANY_COLLECTION,
                     localField : "companyId" ,
                     foreignField : "_id",
                     as : 'companyDetails'
                    }
                },
            ]).limit(8).toArray()

            res.status(200).json(allFeaturedJobs)

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getAllJobs : async(req,res) => {
        try {

            var allJobs = await db.get().collection(collection.JOBS_COLLECTION).aggregate([
                { $match : { status : true } },
                {
                   $lookup : {
                    from : collection.COMPANY_COLLECTION,
                    localField : "companyId" ,
                    foreignField : "_id",
                    as : 'companyDetails'
                   }
                },
                {
                    $project : { applications : 0 }
                }
                
            ]).toArray()

            res.status(200).json(allJobs)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getJobsByCompany : async (req,res) => {
        const id = req.params.id

        console.log(req.url);
        console.log(id);

        try {
            const jobsOfCompany = await db.get().collection(collection.JOBS_COLLECTION).find({ $and : [ {companyId : ObjectId(id)} , {status : true} ] }).toArray()
            console.log(jobsOfCompany);
            res.status(200).json(jobsOfCompany)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    applyJob : async (req , res) => {
        const  formData  = req.body
        const resume = req.file
        const {jobId} = req.params
        var errors = validationResult(req)

        try {

            // Express Validator error.

            if (!errors.isEmpty()) {
                console.log(errors.array());
                return res.status(400).json({ errors: errors.array() })
            }

            let userJobCount =await  db.get().collection(collection.USER_COLLECTION).findOne({_id : ObjectId(formData.userId)})

            
            if(userJobCount.count >= 3 && userJobCount.premium == false) return res.status(400).json({msg : 'Update to Premium to Apply for unlimited job'})


            const imageUploadedResponse = await cloudinary.uploader.upload(formData.image , {
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
                    },
                    $inc : {
                        count : 1 
                    }
            })

            delete formData.image

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
        
        const { id } = req.params

        try {

            var appliedJobs = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match : {_id : ObjectId(id)}
                },
                {
                    $unwind : "$appliedJobs"
                },
                {
                    $lookup : {
                        from : collection.JOBS_COLLECTION,
                        localField : "appliedJobs.id",
                        foreignField : "_id",
                        as : 'appliedJobsDetails'
                    }
                },
                {
                    $unwind : "$appliedJobs"
                },
                {
                    $lookup : {
                        from : collection.COMPANY_COLLECTION,
                        localField : "appliedJobsDetails.companyId",
                        foreignField : "_id",
                        as : 'companyDetails'
                    }
                },
                {
                    $project : {
                        _id : 0,
                        appliedJobs : 1 ,
                        "appliedJobsDetails.jobTitle" : 1,
                        "appliedJobsDetails.companyId" : 1,
                        "companyDetails.companyName" : 1,
                        "companyDetails.logoUrl" : 1 ,
                        "companyDetails.location" : 1 ,
                    }
                },
                
            ]).toArray()

            console.log(appliedJobs);
            res.status(200).json(appliedJobs)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getJobById : async (req , res) => {

        const {jobId} = req.params
        try {

            // const jobDetails = await db.get().collection(collection.JOBS_COLLECTION).findOne({_id : ObjectId(jobId)})

            const jobDetails = await db.get().collection(collection.JOBS_COLLECTION).aggregate([
                {
                    $match :  {_id : ObjectId(jobId)}
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
                    $project : { "companyDetails.industry" : 0 , "companyDetails.email" : 0 , "companyDetails.bio" : 0 , "companyDetails.password" : 0 , "companyDetails.confirmPassword" : 0 , "companyDetails.status" : 0 , "companyDetails.ban" : 0 , "companyDetails.website" : 0 , "companyDetails.facebook" : 0 , "companyDetails.instagram" : 0 , "companyDetails.linkedIn" : 0 , "companyDetails.twitter" : 0 ,}
                }
            ]).toArray()

            if(!jobDetails) return res.status(400).json({msg : 'No job found with this ID'})

            res.status(200).json(jobDetails[0])
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getCategories : async (req,res) => {

        try {
            const jobCategories = await db.get().collection(collection.JOBS_COLLECTION).aggregate([
                {
                    $unwind : "$jobCategory"
                },
                {
                    $project : { jobCategory : 1 }
                },
                {
                    $group : { _id : "$jobCategory" ,  uniqueIds: {$addToSet: "$_id"}, count: {$sum: 1} }
                },
                {
                    $project : { uniqueIds : 0 }
                },
            ]).limit(6).toArray()

            res.status(200).json(jobCategories)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}
