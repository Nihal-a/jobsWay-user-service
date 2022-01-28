require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb')
const pdf = require("pdf-creator-node")
const fs = require("fs")
const { uploadFile } = require('../utils/s3')
const util = require('util')
const multer = require('multer')
const unLinkFile = util.promisify(fs.unlink)
var resumeHtml = fs.readFileSync('./Resume/index.html'  ,"utf8")
const upload = multer({ dest: 'uploads/' })


module.exports = {
    createResume : async (req , res) => {
        const {userId} = req.params
        const  formData =req.body
        console.log(formData);
        var options = {
            format: "A3",
            orientation: "portrait",
            border: "10mm",
            footer: {
                height: "10px",
                contents: '<div style="text-align: right; padding : 2px; font-size : 10px; ">Created With : <span style="color : #7BBBCE">JobsWay Resume</span?></div>'
            }
        };

        var document = {
            html: resumeHtml,
            data: {
              formData: formData,
            },
            path: `./Resume/Output/${userId}.pdf`,
            type: "",
          };
        pdf
        .create(document, options)
        .then(async(file) => {
            try {
                const data = { 
                    path : file.filename , 
                    filename : userId,
                    mimetype : 'application/pdf'
                }

            const {Location} = await uploadFile(data)

            await unLinkFile(data.path)

            console.log("---" , Location);
            console.log("###" ,data.path);

            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id : ObjectId(userId) }, {
                $set : {
                    resumeUrl : Location ,
                }
            })

            console.log("done");
            res.status(200).json({msg: 'Upload done successfully' , Link : Location})

            } catch (error) {
                console.log(error);
                res.json(404).json({msg : 'Upload went wrong'})
            }
        })
        .catch((error) => {
            console.error(error);
        });
            },


    getResume : async (req ,res) => {
        const {userId} = req.params
        try {
            const file = `uploads/${userId}.pdf`
            res.download(file)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    taskCompleted : async (req , res) => {

        const { answerUrl , taskId } = req.body
        console.log(req.body);
        try {

            await db.get().collection(collection.USER_TASK_COLLECTION).updateOne({_id : ObjectId(taskId) } ,
                {
                    $set : {
                        status : "COMPLETED",
                        result : answerUrl
                    }
                }
            )

            res.status(200).json({ msg : "Task Submitted Successfully."})
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    doSearch : async (req,res ) => {
        const { keyword } = req.params

        try {
            let searchResult = await db.get().collection(collection.JOBS_COLLECTION).aggregate([
                {
                    $match : {
                        $and : [
                            {
                                $or : [
                                    {
                                        jobTitle : { $regex: `${keyword}`, $options: 'i' }
                                    } ,
                                    {
                                        jobCategory : {  $regex: `${keyword}`, $options: 'i'  }
                                    } ,
                                    {
                                        jobLocation : {  $regex: `${keyword}`, $options: 'i' }
                                    }
                                ]
                            },
                            {
                                status : true
                            }
                        ]
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
                     $project : { applications : 0 }
                 }
            ]).toArray()

            res.status(200).json(searchResult)
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getUserAppliedJobStatus : async (req ,res) => {
        const { userId } = req.params

        try {
            const allAppliedJobs = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match : { _id  : ObjectId(userId) },
                },
                {
                    $project : { appliedJobs : 1 , _id : 0}
                },
                {
                    $unwind : "$appliedJobs"
                },
                {
                    $lookup : {
                     from : collection.JOBS_COLLECTION,
                     localField : "appliedJobs.id" ,
                     foreignField : "_id",
                     as : 'jobDetails'
                    }
                },
                {
                    $lookup : {
                     from : collection.COMPANY_COLLECTION,
                     localField : "jobDetails.companyId" ,
                     foreignField : "_id",
                     as : 'companyDetails'
                    }
                },
                {
                    $project : { "appliedJobs" : 1 , "jobDetails.jobTitle" : 1 ,  "jobDetails.companyId" : 1 , "jobDetails.jobLocation" : 1 ,  "companyDetails.companyName" : 1 , "companyDetails._id" : 1 ,  "companyDetails.logoUrl" : 1 } 
                },
            ]).toArray()

            res.status(200).json(allAppliedJobs)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}
