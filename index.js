const express = require('express')
const routes = require('./routes/routes')
const db = require('./config/connection')
const cors = require('cors');
const logger = require('morgan')
var fs = require('fs')
var path = require('path')

const PORT  = 8000;
const app = express()

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })


app.use(logger('combined',{stream : accessLogStream}))
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cors());


app.use('/api/v1/user/',routes);

db.connect((err)=>{
    if(err) console.log("Database Connection Error"+err);
    else console.log("database Connected Successfully");
})

app.listen(PORT,(err) => {
    if(err) console.log("Server failed to start. Error : " + err);
    else console.log(`USER SERVICE - Server started at port : ${PORT}.`);
})
