var express = require('express')
const {getDashboard,signup,signin,verifyOtp,sendOtp, googlesign} = require('../controllers/authController');
const { getCompanyDetails, getAllCompanies } = require('../controllers/compnayControllers');
const { getFeaturedJobs, getAllJobs, getJobsByCompany, applyJob, getUserAppliedJobs } = require('../controllers/jobControllers');
const {validateSignUp, validateSignIn} = require('../middlewares/AuthMiddleware');
const { validateApplyJob } = require('../middlewares/JobMiddleware');

const router  = express.Router();

router.get('/',getDashboard)

// Auth Routes.
router.post('/signup',validateSignUp,signup)
router.post('/signin',validateSignIn,signin)
// router.post('/sendotp',sendOtp)
router.post('/verifyotp',verifyOtp)
router.post('/googlesign',googlesign)

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