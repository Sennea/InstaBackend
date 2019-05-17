const { Router } = require('express')
const _ = require('lodash')

const user = require('./user');
const album = require('./album');
const photo = require('./photo');
const relation = require('./relation');

const router = new Router()

router.use('/users', user);
router.use('/albums', album);
router.use('/photos', photo);
router.use('/relations', relation);

router.use((req, res, next) =>
    res.status(404).send({errors: ['Routing not found.']})
)

router.use((err, req, res, next) => {
    if(err.name === 'ValidationError'){
        const errors = _.map(err.errors, (v) => v.message)
        return res.status(400).send({errors})
    }

    res.status(500).send({errors: ['Application error']})
})

module.exports = router
