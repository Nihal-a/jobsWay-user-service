var {check} = require('express-validator')

module.exports = {
    validateApplyJob : [
        check('formData.firstName','First name must be 3 characters long').exists().isLength({min : 3}),
        check('formData.lastName','Last name cannot be blank').exists().isLength({min : 1}),
        check('formData.email','Enter a valid email address').exists().isEmail(),
        check('formData.phone','Enter a valid Phone number').exists().isLength({min : 10}),
        check('formData.location','Enter a valid location').exists().isLength({min : 3}),
        check('formData.experience','Enter a valid year of expirence').exists().isNumeric(),
        check('formData.portfolio','Enter a valid portfolio URL').exists().isURL(),
        check('image','You must upload your Photo').exists().isLength({min : 10}),
        check('pdf','You must upload your Resume').exists().isLength({min : 10})
    ],
}



