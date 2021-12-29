var {check} = require('express-validator')

module.exports = {
    validateApplyJob : [
        check('firstName','First name must be 3 characters long').exists().isLength({min : 3}),
        check('lastName','Last name cannot be blank').exists().isLength({min : 1}),
        check('email','Enter a valid email address').exists().isEmail(),
        check('phone','Enter a valid Phone number').exists().isLength({min : 10}),
        check('location','Enter a valid location').exists().isLength({min : 3}),
        check('experience','Enter a valid year of expirence').exists(),
        check('portfolio','Enter a valid portfolio URL').exists().isURL(),
        check('image','You must upload your Photo').exists(),
    ],
}



