const mongoClient = require('mongodb').MongoClient
const state = {
    db:null
}
module.exports.connect = function(done){
    const url = process.env.MONGODB_URL
    const name = process.env.MONGODB_NAME

    mongoClient.connect(url,{ useUnifiedTopology: true },(err,data)=>{
        if(err) return done(err)

        state.db = data.db(name)
        done()
    })
}

module.exports.get = function(){
    return state.db
}