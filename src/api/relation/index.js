const { Router } = require('express')

const { create, index, indexRelation, update, remove, sortByCreatedAtAscending, sortByUsersAscending, sortByTimeDescending,
    filterByUser, filterByTimeBetween, filterByTextEqual } = require('./controller')

const { token } = require('../../services/passport');

const router = new Router();


router.post('/',
    token({ required: true }),
    create);

router.get('/',
    index);

router.get('/:id',
    indexRelation);

router.put('/:id',
    token({ required: true }),
    update);

router.delete('/:id',
    token({ required: true }),
    remove);

router.get('/sort/time',
    sortByTimeDescending);

router.get('/sort/user',
    sortByUsersAscending);

router.get('/sort/created',
    sortByCreatedAtAscending);

router.get('/filter/time/:time',
    filterByTimeBetween);

router.get('/filter/user/:id',
    filterByUser);

router.get('/filter/text/:text',
    filterByTextEqual);


module.exports = router;