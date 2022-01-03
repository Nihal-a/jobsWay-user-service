require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../config/connection')
const fs = require('fs')
const util = require('util')
const unLinkFile = util.promisify(fs.unlink)
const {USER_COLLECTION } = require('../config/collection')
const ACCOUNT_SID = process.env.ACCOUNT_SID
const AUTH_TOKEN = process.env.AUTH_TOKEN
const client = require('twilio')(ACCOUNT_SID,AUTH_TOKEN)
const { validationResult } = require('express-validator')
const { ObjectId } = require('mongodb')
const { uploadFile } = require('../utils/s3')
const { cloudinary } = require('../utils/cloudinary')


module.exports = {
    getDashboard: (req, res) => {
        res.send('Hey , Welcome to JobsWay User Service')
    },
    signup: async (req, res) => {
        const { phone} = req.body
        var errors = validationResult(req)

        //Signup user
        try {
            //Express Validator error.
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            var userExist = await db.get().collection(USER_COLLECTION).findOne({phone})


            if (userExist) return res.status(401).json({ errors: 'User already exists' })
            
            //Send Otp 
            try {
    
                client.verify
                    .services(process.env.SERVICE_ID)
                    .verifications.create({
                        to: `+91${phone}`,
                        channel: "sms"
                    }).then(({status}) => {
                        res.status(200).json({ status , userDetails : req.body})
                    })
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: error.message });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },
    //signin user
    signin: async (req, res) => {
        const { password , phone } = req.body
        var errors = validationResult(req)

        console.log(req.body);

        try {

            //Express Validator error.
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            var user = await db.get().collection(USER_COLLECTION).findOne({ phone })


            if (!user) return res.status(404).json({ errors: 'User Not found' })

            const isPasswordCorrect = await bcrypt.compare(password, user.password)

            if (!isPasswordCorrect) return res.status(401).json({ errors: 'Invalid Password' })

            const token = jwt.sign({ email: user.email, id: user._id }, 'secret', { expiresIn: "1h" })

            res.status(200).json({ user, token })

        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },

 
    //Otp verification
    verifyOtp: async (req, res) => {
        const { userDetails, otp } = req.body
        const { firstName, lastName, phone, password , email } = userDetails
        try {
            client.verify
                .services(process.env.SERVICE_ID)
                .verificationChecks.create({
                    to: `+91${phone}`,
                    code: otp
                }).then(async (response) => {
                    if (response.valid) {
                        const hashedPassword = await bcrypt.hash(password, 12)

                        var name = `${firstName} ${lastName}`

                        let result = await db.get().collection(USER_COLLECTION).insertOne({ phone, password: hashedPassword, name, ban: false ,email ,count : 0 , premium : false})

                        let user = await db.get().collection(USER_COLLECTION).findOne({ _id: result.insertedId })

                        const token = jwt.sign({ phone: result.phone, id: result.insertedId.str }, 'secret', { expiresIn: "1h" })

                        res.status(200).json({ user, token })
                    } else {
                        res.status(400).json({ Err: "Invalid OTP", userDetails })
                    }
                })
        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    },

    //Google Sign in
    googlesign: async (req, res) => {
        const { email, firstName, lastName, password } = req.body
        try {
            var userExist = await db.get().collection(USER_COLLECTION).findOne({ email })

            if (userExist) {
                
                var user = await db.get().collection(USER_COLLECTION).findOne({ email })

                if (!user) return res.status(200).send('No account found.')

                const isPasswordCorrect = await bcrypt.compare(password, user.password)

                if (!isPasswordCorrect) return res.status(200).send('Incorrect Password')

                const token = jwt.sign({ email: user.email, id: user._id }, 'secret', { expiresIn: "1h" })

                res.status(200).json({ user, token })
            } else {

                const hashedPassword = await bcrypt.hash(password, 12)

                var name = `${firstName} ${lastName}`

                if (lastName == undefined) name = firstName;

                let result = await db.get().collection(USER_COLLECTION).insertOne({ email, password: hashedPassword, name, ban: false ,count : 0 , premium : false})

                let user = await db.get().collection(USER_COLLECTION).findOne({ _id: result.insertedId })

                const token = jwt.sign({ email: result.email, id: result.insertedId.str }, 'secret', { expiresIn: "1h" })

                return res.status(200).json({ user, token })
            }

        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    },
    forgotPassword : async (req , res) => {
        const {phone} = req.body 
        var errors = validationResult(req)

        try {

            //Express Validator error.
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            var user = await db.get().collection(USER_COLLECTION).findOne({ phone })


            if (!user) return res.status(404).json({ errors: 'No Account with this phone number Found' })

            //Send Otp 
            try {
    
                client.verify
                    .services(process.env.SERVICE_ID)
                    .verifications.create({
                        to: `+91${phone}`,
                        channel: "sms"
                    }).then(({status}) => {
                        res.status(200).json({ status , phone})
                    })
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: error.message });
            }

            
        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    },
    ForgotverifyOtp: async (req, res) => {
        const { phone , newPassword , otp } = req.body
        try {
            client.verify
                .services(process.env.SERVICE_ID)
                .verificationChecks.create({
                    to: `+91${phone}`,
                    code: otp
                }).then(async (response) => {
                    if (response.valid) {
                        const hashedPassword = await bcrypt.hash(newPassword, 12)

                        let updatePassword = await db.get().collection(USER_COLLECTION).updateOne({ phone } , {
                            $set : {
                                password : hashedPassword
                            }
                        })

                        let user = await db.get().collection(USER_COLLECTION).findOne({ phone})

                        const token = jwt.sign({ phone: user.phone, id: user._id.str }, 'secret', { expiresIn: "1h" })

                        res.status(200).json({ user, token })
                    } else {
                        res.status(400).json({ Err: "Invalid OTP", phone })
                    }
                })
        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    },
    editProfile : async (req,res) => {
        const { userDetails , image } = req.body
        const resume = req.file
        const id = req.params.id

        try {

            const user = await db.get().collection(USER_COLLECTION).findOne({_id : ObjectId(id)})

            if(!user) return res.status(401).json({msg : "User not found"})

            // if(userDetails.email) {
            //     let emailExist = await db.get().collection(USER_COLLECTION).find({email : userDetails.email})
            //     console.log("this is : " , emailExist);
            //     if(emailExist) return res.status(401).json({msg : 'Account with this email already exists.'})
            // }
            
            // if(userDetails.phone){
            //     let phoneExist = await db.get().collection(USER_COLLECTION).find({phone : userDetails.phone})
            //     console.log("this is : " , phoneExist);
            //     if(phoneExist) return res.status(401).json({msg : 'Account with this phone number already exists.'})
            // }
            

            if(req.file){
                const {Location} = await uploadFile(resume)
                await db.get().collection(USER_COLLECTION).updateOne({_id : ObjectId(id) } , {
                    $set : {
                        resumeUrl : Location,
                    }
                })
                await unLinkFile(resume.path)
            }

            if(image) {
                const imageUploadedResponse = await cloudinary.uploader.upload(image , {
                    upload_preset : 'Applied_Users_Image'
                })
                await db.get().collection(USER_COLLECTION).updateOne({_id : ObjectId(id) } , {
                    $set : {
                        imgUrl : imageUploadedResponse.url,
                    }
                })
            }

            await db.get().collection(USER_COLLECTION).updateOne({_id : ObjectId(id) } , {
                $set : {
                    name : userDetails?.name,
                    designation : userDetails?.designation , 
                    instagram : userDetails?.instagram ,
                    twitter : userDetails?.twitter ,
                    facebook : userDetails?.facebook,
                    linkedIn : userDetails?.linkedIn ,
                    skills : userDetails?.skills ,
                    location : userDetails?.location ,
                    email : userDetails?.email , 
                    portfolio : userDetails?.portfolio ,
                    experience : userDetails?.experience , 
                    phone : userDetails?.phone
                }
            })

            let updatedUser = await db.get().collection(USER_COLLECTION).findOne({_id : ObjectId(id)})

            const token = jwt.sign({ email: updatedUser.email, id: updatedUser._id.str }, 'secret', { expiresIn: "1h" })

            res.status(200).json({updatedUser , token})
            
        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    },
    getUserDetails : async (req,res) => {
        const id = req.params.id

        try {
           let user = await db.get().collection(USER_COLLECTION).findOne({_id : ObjectId(id)})

           if(!user) return res.status(401).json({msg : 'No user found'})

           res.status(200).json(user)
        } catch (error) {
            console.log(error);
            res.json({ error: error.message })
        }
    }
}
