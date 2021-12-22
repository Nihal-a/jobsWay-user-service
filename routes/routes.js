var express = require('express')
const {getDashboard,signup,signin,verifyOtp,forgotPassword, googlesign, ForgotverifyOtp, editProfile ,getUserDetails} = require('../controllers/authController');
const { getCompanyDetails, getAllCompanies } = require('../controllers/compnayControllers');
const { getFeaturedJobs, getAllJobs, getJobsByCompany, applyJob, getUserAppliedJobs } = require('../controllers/jobControllers');
const {validateSignUp, validateSignIn, validatePhone, validateNewPassword} = require('../middlewares/AuthMiddleware');
const { validateApplyJob } = require('../middlewares/JobMiddleware');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const router  = express.Router();

router.get('/',getDashboard)

// Auth Routes.
router.post('/signup',validateSignUp,signup)
router.post('/signin',validateSignIn,signin)
router.post('/verifyotp',verifyOtp)
router.post('/googlesign',googlesign)
router.post('/forgot-password',validatePhone,forgotPassword)
router.post('/forgot-otp-verify',validateNewPassword,ForgotverifyOtp)
router.post('/edit-profile/:id', upload.single('pdf') ,editProfile)
router.get('/get-user/:id' , getUserDetails)

//Jobs
router.get('/getfeaturedjobs',getFeaturedJobs)
router.get('/getjobs' , getAllJobs)
router.get('/company-jobs/:id' , getJobsByCompany)
router.post('/applyjob' , validateApplyJob , applyJob)
router.get('/user-applied-jobs/:id' , getUserAppliedJobs)

//company
router.get('/companies' , getAllCompanies)
router.get('/getcompany/:id' , getCompanyDetails)

module.exports = router;