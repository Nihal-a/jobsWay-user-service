const jwt = require('jsonwebtoken')
const jwtDecode = require("jwt-decode")

module.exports = {
    verifyLogin: (req, res, next) => {
        if (req.headers.authorization) {
            jwt.verify(req.headers.authorization, 'secret', (err, authorizedData) => {
                if (err) {
                    res.status(403).json({ error: err })
                } else {
                    const decoded = jwtDecode(req.headers.authorization)
                    console.log(decoded);
                }
            })

        } else {
            res.status(403).json({ error: "No token available" })

        }

    },
}