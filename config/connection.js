const mongoClient = require('mongodb').MongoClient
const state = {
    db:null
}
module.exports.connect = function(done){
    const url = `mongodb+srv://jobsway:${process.env.MONGODB_PASSWORD}@jobsway.beeub.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
    const name = 'jobsWay'

    mongoClient.connect(url,{ useUnifiedTopology: true },(err,data)=>{
        if(err) return done(err)

        state.db = data.db(name)
        done()
    })
}

module.exports.get = function(){
    return state.db
}