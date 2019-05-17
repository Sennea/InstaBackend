const { Router }= require('express');
const { token, password } = require('../../services/passport');
const { index, showMe, show, create, update, destroy, auth, forgot, reset } = require("./controller");

const router = new Router();

router.get('/',
    token({required: true, roles: ['admin']}),
    index);

router.get('/me',
    token({required: true}),
    showMe);

router.get('/:id',
    token({required: true, roles: ['admin']}),
    show);

router.post('/',
    create);

router.post('/auth',
    password(),
    auth);

router.put('/',
    token({required: true}),
    update);

router.delete('/:id',
    token({ required: true}),
    destroy);


router.post('/password/forgot', forgot);

router.post('/password/reset/:token', reset);

module.exports = router;