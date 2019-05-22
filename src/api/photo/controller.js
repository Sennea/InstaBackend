const mongoose = require('mongoose');

const { success, notFound } = require('../../services/response/')

const Photo = require('./model').model;

const User = require('../user/model').model;

const handleGridFsUpload = require('./upload-db');

const fileType = require('file-type');

const mime = require('mime-types')

const create = async (req, res, next)  => {

    handleGridFsUpload(req, res, (err)=> {

        let body = req.body;
        let user = req.user;

        body.user = user.id;

        if (err) return res.status(422).send({error: err.message});

        if (!req.file)
            return res.status(404).send({error: 'File not found'});

        const PhotoGridFs = require('./gridfs');


        PhotoGridFs.readById(req.file.id, async (err, buff) => {

            const type = fileType(buff);

            // typ nierozpoznany lub nie jest to obrazek
            if (type === null || type.mime !== mime.lookup('.png') && type.mime !== mime.lookup('.jpg')) {
                // Nieprawidlowy plik jest usuwany
                return PhotoGridFs.unlinkById(req.file.id, (err, doc) => {
                    return res.status(400).json({errors: [`That kind of file is not allowed!`]})
                })
            }
            req.body._id = req.file.id;

            let photo = null;

            try {
                photo =   await Photo.create(body)
                    .then((photo) => photo.view(true));
            }catch (e) {
                return PhotoGridFs.unlinkById(req.file.id, (err, doc) => {
                    res.status(400).send(e).end();
                });
            }


            if (photo) {
                console.log(photo)
                user.photos.push(photo.id);

                {
                    await user.save();

                    success(res, 201)(photo);
                }
            }
        });
    });
};


const index =  (req, res, next) =>
    Photo.find()
        .then(photos => {
            const requests = [];

            photos.map((photo) => {
                requests.unshift(
                    User.findById(photo.user, 'name')
                        .then(user => {
                            photo.set('userName', user.name, {strict: false});
                            return photo;
                        }).catch(next))
            });

            Promise.all(requests)
                .then((photos) => photos.map((photo) => {

                return {
                    user: photo.user,
                    likes: photo.meta.likes,
                    description: photo.meta.description,
                    id: photo._id,
                    createdAt: photo.createdAt,
                    updatedAt: photo.updatedAt,
                    userName: photo.get('userName')
                };
            }))
                .then(success(res))
                .catch(next);
        });


const indexPhoto = ({ params }, res, next) => {


    const PhotoGridFs = require('./gridfs');

    PhotoGridFs.findById(params.id, (err, doc) => {

        if(err || doc === null )
            return notFound(res)();

        console.log(doc);
        console.log(params.id);

        let stream  = PhotoGridFs.readById(mongoose.Types.ObjectId(params.id));
        console.log(params.id);

        stream.on('error', function (err) {
            console.log("err");
            console.log(err);
        });

        res.set('Content-Length',  doc.length);
        res.set('Content-Type',  doc.contentType);

        console.log(doc.length)
        stream.on('data', function (chunk)  {
            res.write(chunk);
        });

        stream.on('end',  function() {
            res.end();
        });

    });

};

const update = async ({ body, user, params }, res, next)  => {


    if (user.role === 'admin' || (user.photos.indexOf(params.id) > -1)) {
        let toUpdate = null;

        if(body.description && body.likes ){
            toUpdate = { meta: {likes : body.likes, description: body.description } , updatedAt: Date.now() }
        }else if(body.description){
            toUpdate = { meta: { description: body.description } , updatedAt: Date.now() }
        }else if(body.likes){
            toUpdate = { meta: { likes : body.likes } , updatedAt: Date.now() }
        }else{
            return res.status(404).end();
        }

        Photo.findById(params.id)
            .then(notFound(res))
            .then((photo) => photo ? photo.set(toUpdate).save() : null)
            .then((photo) => photo ? photo.view(true) : null)
            .then(success(res))
            .catch(next);
    }else{
        res.status(403).end();
    }
};


const updateLikes = async ({ body, params }, res, next)  => {

        let photo = await Photo.findById(params.id)
            .then(notFound(res));

        photo.meta.likes += body.likes;

        {
            await photo.save();
            success(res, 201)(photo);
        }


};


const remove = async (req, res, next)  => {

    const { id } = req.params;
    const user = req.user;


    let userPromise = null;

    console.log(user.photos.indexOf(id) > -1);

    if (user.photos.indexOf(id) > -1) {
        userPromise = User.findOneAndUpdate({_id: user.id},
            {"$pull": {"photos": id}}).exec();
    }else{
        return notFound(res)(null);
    }

    if (userPromise === null)
        return notFound(res)(null);

    let photo = await Photo
        .findOne({_id: id});

    if (photo === null)
        return notFound(res)(null);


    const PhotoGridFS = require('./gridfs');

    await PhotoGridFS.unlinkById(req.params.id, (err, doc) => {
        if (err || doc === null)
            return notFound(res)(doc);
    });


    const photoPromise = photo.remove();

    {
        await Promise.all([
            photoPromise,
            userPromise
        ]);

        try {
            return res.status(204).end();
        } catch (e) {
            res.status(400).end();
        }
    }
};


const sortByCreatedAtAscending =  (req, res, next) =>
    Photo.find({}, null, {sort: {"createdAt": 1}})
        .then((photo) => photo.map((photo) => photo.view(true)))
        .then(success(res))
        .catch(next);


const sortByUsersAscending =  (req, res, next) =>
    Photo.find({}, null, {sort: {"user": 1 }})
        .then((photo) => photo.map((photo) => photo.view(true)))
        .then(success(res))
        .catch(next);

const sortByLikesAscending =  (req, res, next) =>
    Photo.find({}, null, {sort: {"meta.likes": 1 }})
        .then((photo) => photo.map((photo) => photo.view(true)))
        .then(success(res))
        .catch(next);






const filterByUser =  ({params}, res, next) =>
    Photo.find({"user": params.id})
        .then((photo) => photo.map((photo) => photo.view(true)))
        .then(success(res))
        .catch(next);


const filterByLikesMoreThan =  ({params}, res, next) =>
    Photo.find({"meta.likes" : {
            "$gt" : params.likes }})
        .then((photo) => photo.map((photo) => photo.view(true)))
        .then(success(res))
        .catch(next);


const filterByDescriptionContains =  ({params}, res, next) =>
    Photo.find({"meta.description": new RegExp(params.text)})
        .then((photo) => photo.map((photo) => photo.view(true)))
        .then(success(res))
        .catch(next);



module.exports = { create, index, indexPhoto, remove, update, sortByCreatedAtAscending, sortByUsersAscending, sortByLikesAscending,
    filterByUser, filterByLikesMoreThan, filterByDescriptionContains, updateLikes}