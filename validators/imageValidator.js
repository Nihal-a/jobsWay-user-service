var expressValidator = require('express-validator');

app.use(expressValidator({
customValidators: {
    isImageOk: function(value, filename) {

        var extension = (path.extname(filename)).toLowerCase();
        switch (extension) {
            case '.jpg':
                return '.jpg';
            case '.jpeg':
                return '.jpeg';
            case  '.png':
                return '.png';
            default:
                return false;
        }
    }
}}));