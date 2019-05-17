const gridfs = require('mongoose-gridfs')
const mongoose = require('../../services/mongoose')

const photoModelGridFS = gridfs(
    {
        collection : 'relations',
        model : 'RelationGridFS',
        mongooseConnection: mongoose.connection
    }
)


module.exports = photoModelGridFS.model;