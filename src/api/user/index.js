const { Router }= require('express');
const { token, password } = require('../../services/passport');
const { index, showMe, show, create, update, destroy, auth, forgot, reset, filterByName, updateMeta } = require("./controller");

const router = new Router();

router.get('/',
    index);

router.get('/filter',
    filterByName);

router.get('/me',
    token({required: true}),
    showMe);

router.get('/:id',
    show);

router.post('/',
    create);

router.post('/auth',
    password(),
    auth);

router.put('/',
    token({required: true}),
    update);

router.put('/updateMeta',
    token({required: true}),
    updateMeta);

router.delete('/:id',
    token({ required: true}),
    destroy);


router.post('/password/forgot', forgot);

router.post('/password/reset/:token', reset);

module.exports = router;