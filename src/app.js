const http = require('http');
const Agenda = require('agenda');
const { env, port, ip, apiRoot, mongo } = require('./config')
const express = require('./services/express')
const api = require('./api')
const mongoose = require('./services/mongoose')
const app = express(apiRoot, api)
const server = http.createServer(app)

// Connect to mongoose and set up agenda that will delete old relations ----------

async function run() {
    await  mongoose.connect(mongo.uri)

    const User = require('./api/user/model').model;
    const Relation = require('./api/relation/model').model;
    const RelationGridFs = require('./api/relation/gridfs');

    const agenda = new Agenda({db: {address: ip}});

    agenda.define('deleteExpiredRelations', () => {
        Relation.find({ "meta.time": { $lte: Date.now() }}, function(err, response) {

           console.log(response.length);

            for(let relation of response){

                console.log(relation.id);
                console.log("relation.id");

                User.findOneAndUpdate({"relations": {$in: relation.id}},
                    {"$pull": {"relations": mongoose.Types.ObjectId(relation.id), }}, function (err, result) {
                       console.log(err)
                       console.log(result)
                    });

                RelationGridFs.unlinkById(relation.id, (err, doc) => {
                   console.log("UNLINKED");
                });

                relation.remove();
            }

        });


    });

    await new Promise(resolve => agenda.once('ready', resolve));

    agenda.every('1 second', 'deleteExpiredRelations');
    agenda.start();

}

run().catch(error => {
    console.error(error);
    process.exit(-1);
});

//-------------------------------------------------------------------------------------

setImmediate(() => {
    server.listen(port, ip, () => {
        console.log('Express server listening on http://%s:%d, in %s mode', ip, port, env)
    })
})



module.exports = app