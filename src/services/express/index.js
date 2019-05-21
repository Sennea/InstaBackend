
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

const expressConfig = (apiRoot, routes) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json());  // obsluga dekodowania JSON

    app.use(apiRoot, routes);

    return app
};



module.exports = expressConfig;