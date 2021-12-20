var {check} = require('express-validator')

module.exports = {
    validateSignUp : [
        check('firstName','First name must be 3 characters long').exists().isLength({min : 3}),
        check('lastName','Last name cannot be blank').exists().isLength({min : 1}),
        check('password').exists().isLength({min : 8}).withMessage('Password Must be 8 char long'),
        check('phone').exists().withMessage('Phone Number Cannot must be Blank').isLength({min : 10 , max : 10}).withMessage('Enter a Valid Phone Number').isNumeric().withMessage('Phone Number should be digits from 0-9')
    ],
    validateSignIn :[
        check('phone').exists().isNumeric().withMessage('Phone number must be digits').isLength({min : 10 , max : 10}).withMessage('Enter a Valid Phone number'),
        // check('email').isEmail().withMessage('Enter a valid email Address'),
        check('password' , 'Password must contain minimum 8 characters').exists().isLength({min : 8})
    ],
    validatePhone : [
        check('phone').exists().isNumeric().withMessage('Phone number must be digits').isLength({min : 10 , max : 10}).withMessage('Enter a Valid Phone number'),
    ],
    validateNewPassword : [
        check('newPassword' , 'Password must contain minimum 8 characters').exists().isLength({min : 8})
    ]
}



