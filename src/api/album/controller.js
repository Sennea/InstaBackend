const mongoose = require('mongoose');

const { success, notFound } = require('../../services/response/')

const Album = require('./model').model;

const User = require('../user/model').model;

const Photo = require('../photo/model').model;

const create = async (req, res, next)  => {

    let body = req.body;
    let user = req.user;

    body.user = user.id;

    let album = await Album.create(body)
        .then((album) => album.view(true))
        .catch(next);

    console.log(album.id);

    if(album){
        user.albums.push(album.id);

        {
            await user.save();

            success(res, 201)(album);
        }
    }
};


const index =  (req, res, next) =>
    Album.find({})
        .then((album) => album.map((album) => album.view(true)))
        .then(success(res))
        .catch(next);


const update = async ({ body, user, params }, res, next)  => {

    if (user.role === 'admin' || (user.albums.indexOf(params.id) > -1)) {

        let photos = body.photos;

        if(photos){
            for(let p of photos) {
                console.log(body.photos);

                let photo = await Photo.findById(p).catch(next);


                if(!photo){
                    // bad request
                    return res.status(404).end();
                }
            }
        }

        let album = await Album.findById(params.id)
            .catch(next);

        if(body.photos)
           await album.update({"$addToSet": {"photos": photos}});

        if(body.name)
            await album.update({"$set" : {"name": body.name }});

        try {

            await album.save();

            album = await Album.findById(params.id);

            return success(res)(album);
        }catch (e) {
            return res.status(400).end()
        }


    }else{
        return res.status(404).end();
    }
};

const remove = async (req, res, next)  => {

    const { id } = req.params;
    const user = req.user;

    let album = await Album
        .findOne({_id: id});

    if (album === null)
        return notFound(res)(null);


    let userPromise = null;

    if (user.albums.indexOf(id) > -1) {
        userPromise = User.findOneAndUpdate({_id: user.id},
            {"$pull": {"albums": id}}).exec();
    }else{
        res.status(403).end();
    }

    if (userPromise === null)
        return notFound(res)(null);


    const albumPromise = album.remove();

    {
        await Promise.all([
            albumPromise,
            userPromise
        ]);

        try {
            return res.status(204).end();
        } catch (e) {
            res.status(400).end()
        }
    }
};


const sortByCreatedAtAscending =  (req, res, next) =>
    Album.find({}, null, {sort: {"createdAt": 1}})
        .then((album) => album.map((album) => album.view(true)))
        .then(success(res))
        .catch(next);


const sortByAlbumSizeAscending =  (req, res, next) =>
    Album.find({}, null, {sort: {"photos": 1 }})
        .then((album) => album.map((album) => album.view(true)))
        .then(success(res))
        .catch(next);

const sortByNameAscending =  (req, res, next) =>
    Album.find({}, null, {sort: {"name": 1 }})
        .then((album) => album.map((album) => album.view(true)))
        .then(success(res))
        .catch(next);






const filterByUser =  ({params}, res, next) =>
    Album.find({user: params.id})
        .then((album) => album.map((album) => album.view(true)))
        .then(success(res))
        .catch(next);


const filterByPhotoIn =  ({params}, res, next) =>
    Album.find({"photos" : {
            "$eq" : params.id }})
        .then((album) => album.map((album) => album.view(true)))
        .then(success(res))
        .catch(next);


const filterByNameContains =  ({params}, res, next) =>
    Album.find({"name":  new RegExp(params.name)})
        .then((album) => album.map((album) => album.view(true)))
        .then(success(res))
        .catch(next);



module.exports = { create, index, remove, update, sortByCreatedAtAscending, sortByAlbumSizeAscending, sortByNameAscending,
    filterByUser, filterByPhotoIn, filterByNameContains }