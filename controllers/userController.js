require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb')
const pdf = require('html-pdf')
const pdfTemplate = require("../public/Resume");


module.exports = {
    createResume : async (req , res) => {

        const {userId} = req.params
        const userDetails = req.body

        console.log(userDetails);

        const options = {
            height: "42cm",
            width: "29.7cm",
            timeout: "6000",
        };
        

        try {
            
            pdf.create(pdfTemplate(userDetails) , options).toFile(`uploads/${userId}.pdf` , (err) => {
                if (err) {
                    console.log(err);
                    res.status(401).json(err)
                } else res.status(200).json('Done')
            })
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
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
        try {

            await db.get().collection(collection.USER_TASK_COLLECTION).updateOne({_id : ObjectId(taskId) } ,
                {
                    $set : {
                        status : "COMPLETED",
                        result : answerUrl
                    }
                }
            )
            
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
                }
            ]).toArray()

            res.status(200).json(searchResult)
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}
