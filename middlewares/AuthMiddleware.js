var {check} = require('express-validator')

module.exports = {
    validateSignUp : [
        check('email','Enter a valid email address').exists().isEmail(),
        check('password').exists().isLength({min : 8}).withMessage('Password Must be 8 char long'),
        check('firstName','First name must be 3 characters long').exists().isLength({min : 3}),
        check('lastName','Last name cannot be blank').exists().isLength({min : 1}),
        check('phone' , 'Enter a valid Phone Number').exists().isLength({min : 10 , max : 10}).isNumeric()
    ],
    validateSignIn :[
        check('phone').exists().isNumeric().withMessage('Phone number must be digits').isLength({min : 10 , max : 10}).withMessage('Enter a Valid Phone number'),
        // check('email').isEmail().withMessage('Enter a valid email Address'),
        check('password' , 'Password must contain minimum 8 characters').exists().isLength({min : 8})
    ]
}



