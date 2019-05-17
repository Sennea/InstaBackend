const gridfs = require('mongoose-gridfs');
const mongoose = require('../../services/mongoose');

const photoModelGridFS = gridfs(
    {
        collection : 'photos',
        model : 'PhotoGridFS',
        mongooseConnection: mongoose.connection
    }
);


module.exports = photoModelGridFS.model;