const { Router } = require('express')

const { create, index, indexPhoto, update, remove, sortByCreatedAtAscending, sortByUsersAscending, sortByLikesAscending,
    filterByUser, filterByLikesMoreThan, filterByDescriptionContains, updateLikes } = require('./controller')

const { token } = require('../../services/passport');

const router = new Router();


router.post('/',
    token({ required: true }),
    create);

router.get('/',
    index);

router.get('/:id',
    indexPhoto);

router.put('/:id',
    token({ required: true }),
    update);

router.put('/:id/updateLikes',
    updateLikes);

router.delete('/:id',
    token({ required: true }),
    remove);

router.get('/sort/likes',
    sortByLikesAscending);

router.get('/sort/user',
    sortByUsersAscending);

router.get('/sort/created',
    sortByCreatedAtAscending);

router.get('/filter/likes/:likes',
    filterByLikesMoreThan);

router.get('/filter/user/:id',
    filterByUser);

router.get('/filter/description/:text',
    filterByDescriptionContains);


module.exports = router;
