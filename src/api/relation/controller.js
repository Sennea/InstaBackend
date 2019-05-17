const mongoose = require('mongoose');

const { success, notFound } = require('../../services/response/')

const Relation = require('./model').model;

const User = require('../user/model').model;


const handleGridFsUpload = require('./upload-db');

const fileType = require('file-type');

const mime = require('mime-types')

const create = async (req, res, next)  => {
    handleGridFsUpload(req, res, (err)=> {

        let body = req.body;
        let user = req.user;

        body.user = user.id;
        console.log(req);
        console.log(body);


        if (err) return res.status(422).send({error: err.message});

        if (!req.file)
            return res.status(404).send({error: 'File not found'});

        const RelationGridFs = require('./gridfs');

        RelationGridFs.readById(req.file.id, async (err, buff) => {

            const type = fileType(buff);

            if (type === null || type.mime !== mime.lookup('.png') && type.mime !== mime.lookup('.jpg')) {
                return RelationGridFs.unlinkById(req.file.id, (err, doc) => {
                    return res.status(400).json({errors: [`That kind of file is not allowed!`]})
                })
            }

            req.body._id = req.file.id;

            let relation = null;

            try {
                relation =   await Relation.create(body)
                    .then((relation) => relation.view(true));
            }catch (e) {
                return RelationGridFs.unlinkById(req.file.id, (err, doc) => {
                    res.status(400).send(e).end();
                });
            }

            console.log(relation.id);

            if (relation) {
                user.relations.push(relation.id);

                {
                    await user.save();

                    success(res, 201)(relation);
                }
            }
        });
    });
};


const index =  (req, res, next) =>
    Relation.find()
        .then((relation) => relation.map((relation) => relation.view(true)))
        .then(success(res))
        .catch(next);

const indexRelation = ({ params }, res, next) => {


    const RelationGridFS = require('./gridfs');

    RelationGridFS.findById(params.id, (err, doc) => {

        if(err || doc === null )
            return notFound(res)();

        let stream  = RelationGridFS.readById(mongoose.Types.ObjectId(params.id));

        stream.on('error', function (err) {
            console.log("err");
            console.log(err);
        });

        res.set('Content-Length',  doc.length);
        res.set('Content-Type',  doc.contentType);

        stream.on('data', function (chunk)  {
            res.write(chunk);
        });

        stream.on('end',  function() {
            res.end();
        });

    });

};

const update = async ({ body, user, params }, res, next)  => {

    if (user.role === 'admin' || (user.relations.indexOf(params.id) > -1)) {

        let toUpdate = { meta : { text: body.text }, updatedAt: Date.now() }

        Relation.findById(params.id)
            .then(notFound(res))
            .then((relation) => relation ? relation.set(toUpdate).save() : null)
            .then((relation) => relation ? relation.view(true) : null)
            .then(success(res))
            .catch(next);
    }else{
        return res.status(403).end();
    }
};

const remove = async (req, res, next)  => {

    const { id } = req.params;
    const user = req.user;

    let userPromise = null;

    if (user.relations.indexOf(id) > -1) {
        userPromise = User.findOneAndUpdate({_id: user.id},
            {"$pull": {"relations": id}}).exec();
    }else{
        res.status(403).end();
    }

    if (userPromise === null)
        return notFound(res)(null);


    let relation = await Relation
        .findOne({_id: id});

    if (relation === null)
        return notFound(res)(null);



    const RelationGridFS = require('./gridfs');

    await RelationGridFS.unlinkById(req.params.id, (err, doc) => {
        if (err || doc === null)
            return notFound(res)(doc);
    });



    const relationPromise = relation.remove();

    {
        await Promise.all([
            relationPromise,
            userPromise
        ]);

        try {
            return res.status(204).end()
        } catch (e) {
            res.status(400).end()
        }
    }
};




const sortByCreatedAtAscending =  (req, res, next) =>
    Relation.find({}, null, {sort: {createdAt: 1}})
        .then((relation) => relation.map((relation) => relation.view(true)))
        .then(success(res))
        .catch(next);


const sortByUsersAscending =  ({params}, res, next) =>
    Relation.find({}, null, {sort: {"user": 1 }})
        .then((relation) => relation.map((relation) => relation.view(true)))
        .then(success(res))
        .catch(next);

const sortByTimeDescending =  ({params}, res, next) =>
    Relation.find({}, null, {sort: {"meta.time": -1 }})
        .then((relation) => relation.map((relation) => relation.view(true)))
        .then(success(res))
        .catch(next);


const filterByUser =  ({params}, res, next) =>
    Relation.find({user: params.id})
        .then((relation) => relation.map((relation) => relation.view(true)))
        .then(success(res))
        .catch(next);


const filterByTimeBetween =  ({params}, res, next) =>
    Relation.find({"meta.time" : {
            "$gte" : Date.now() }})
        .then((relation) => relation.map((relation) => relation.view(true)))
        .then(success(res))
        .catch(next);


const filterByTextEqual =  ({params}, res, next) =>
    Relation.find({"meta.text": {
            "$eq": params.text }
    })
        .then((relation) => relation.map((relation) => relation.view(true)))
        .then(success(res))
        .catch(next);


module.exports = { create, index, indexRelation, remove, update, sortByCreatedAtAscending, sortByUsersAscending, sortByTimeDescending,
    filterByUser, filterByTimeBetween, filterByTextEqual }