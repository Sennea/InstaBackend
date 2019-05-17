const { Router } = require('express')

const { create, index, update, remove, sortByCreatedAtAscending, sortByAlbumSizeAscending, sortByNameAscending,
    filterByUser, filterByPhotoIn, filterByNameContains  } = require('./controller')

const { token } = require('../../services/passport');

const router = new Router();


router.post('/',
    token({ required: true }),
    create);

router.get('/',
    index);

router.put('/:id',
    token({ required: true }),
    update);

router.delete('/:id',
    token({ required: true }),
    remove);

router.get('/sort/size',
    sortByAlbumSizeAscending);

router.get('/sort/name',
    sortByNameAscending);

router.get('/sort/created',
    sortByCreatedAtAscending);

router.get('/filter/name/:name',
    filterByNameContains);

router.get('/filter/user/:id',
    filterByUser);

router.get('/filter/photo/:id',
    filterByPhotoIn);

module.exports = router;