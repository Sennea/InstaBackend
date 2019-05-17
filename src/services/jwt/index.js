
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config');
const util = require('util');

// Takes a function following the common error-first callback style,
// i.e. taking a (err, value) => ... callback as the last argument, and returns a version that returns promises.

const jwtSign = util.promisify(jwt.sign);
const jwtVerify = util.promisify(jwt.verify);

const sign = (user, options, method = jwtSign) => {
    // Deklarujemy zawartosc tokena
    // Minimum to ID uzytkownika, Czas utworzenia (iat) jest dodawany automatycznie
    // Czym mniejszy token tym lepiej! wszystko poza ID mozna pobrac z bazy
    // Rola przyda sie jesli frontend potrzebuje takich informacji

    const { id, role } = user;
    const payload = { id, role };

    return method(payload, jwtSecret, options);
};


module.exports = {

    sign

};