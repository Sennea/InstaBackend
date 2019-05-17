const passport = require('passport');
const { BasicStrategy } = require('passport-http');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { jwtSecret } = require('../../config');
const User = require('../../api/user/model').model;


/*
 PassportJS działa w oparciu o strategie - pluginy
 Dla każdego typu uwierzytelnienia potrzeba zarejestrować strategie i stworzyć middleware z niej korzystający
 Rejestracja strategii wiaze się z koniecznościa pobrania uzytkownika z bazy lub zwrocenia bledu

 Uwierzytelnienie w tej aplikacji:
 Login i hasło za pomocą BasicAuth, Backend zwraca token, każdy następny req juwierzytelniony tokenem.

 Czy pobieranie uzytwkonika z bazy przy każdym req jest konieczne?
 Poprawny token nie oznacza ze uzykownik jest ciagle w systemie lub nie zostal zablokowany
 Czy nie jest to obciazenie dla aplikacji?
 To zależy od aplikacji i ilości uzytkowników. Jeśli zacznie stanowić to problem można użyc cachu opartego o Redis.
 */


// Middleware dla uwierzytelnienia hasłem
const password = () => (req, res, next) =>
    passport.authenticate('password', {session: false}, (err, user, info) => {
        if (err && err.param) {
            return res.status(400).json(err)
        } else if (err || !user) {
            return res.status(401).end()
        }
        req.logIn(user, {session: false}, (err) => {
            if (err) return res.status(401).end()
            next()
        })
    })(req, res, next);


// Middleware dla tokenu JWT
const token = ({required, roles = User.roles} = {}) => (req, res, next) =>
    passport.authenticate('token', {session: false}, (err, user, info) => {

        // jesli nie ma uzytkownika w bazie lub niepodano tokenu => 401
        if (err || (required && !user)) {
            return res.status(401).end()
        }
        // jesli uzytkownik nie ma prawa => 403
        if(required && !roles.includes(user.role)){
            return res.status(403).end()
        }
        req.logIn(user, {session: false}, (err) => {
            if (err) return res.status(401).end()
            next()
        })
    })(req, res, next);


// Rejestracja strategii logowania hasłem
passport.use('password', new BasicStrategy((email, password, done) => {
    User.findOne({email}).then((user) => {
        if (!user) {
            done(true)
            return null
        }
        return user.authenticate(password, user.password).then((user) => {
            done(null, user)
            return null
        }).catch(done)
    })
}));

// Rejestracja strategii tokenu JWT
passport.use('token', new JwtStrategy({
    secretOrKey: jwtSecret,                 // Klucz szyfrujacy lub haslo
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromUrlQueryParameter('access_token'),
        ExtractJwt.fromBodyField('access_token'),
        ExtractJwt.fromAuthHeaderWithScheme('Bearer')
    ]),
    jsonWebTokenOptions: {
        maxAge: '31d'
    }
}, (payload, done) => {
    const {id} = payload
    User.findById(id).then((user) => {
        // Tu mozna sprawdzic np. czy uzytkownik nie zostal zablokowany
        done(null, user)        // done is a passport error first callback accepting arguments done(error, user, info)
        return null
    }).catch(done)
}));


module.exports = {
    password, token
};