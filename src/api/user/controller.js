const { success, notFound } = require('../../services/response');
const User = require('./model').model;
const { sign } = require('../../services/jwt');
const _ = require('lodash');
const catchDuplicateEmail = require("./helpers").catchDuplicateEmail;


const async = require('async');
const crypto = require('crypto');
const sendmail = require('../../services/email');

const index =  (req, res, next) =>
    User.find()
       .then((users) => users.map((user) => user.view(true)))
       .then(success(res))
       .catch(next);

const filterByName =  (req, res, next) =>{
    console.log(req.query.search)
    User.find({name: new RegExp("^" + req.query.search)})
        .then((users) => users.map((user) => user.view(true)))
        .then(success(res))
        .catch(next);
};


const show = ({ params }, res, next) =>
    User.findById(params.id)
        .then(notFound(res))
        .then((user) => user ? user.view(true) : null)
        .then(success(res))
        .catch(next);

const showMe = ({ user }, res, next) => {
    console.log(user)
    User.findById(user.id)
        .then(notFound(res))
        .then((user) => user ? user.view(true) : null)
        .then(success(res))
        .catch(next);
}

const create = ({ body }, res, next) => {
    User.create(body)
        .then(user => {
            sign(user)
                .then((token) => ({ token, user: user.view(true)}))
                .then(success(res, 201))
        })
        .catch((err) => catchDuplicateEmail(res, err, next));
};


const auth = (req, res, next) => {
    // na typ etapie mamy dostep do uzytkownika w polu req.user
    // Haslo dziala tylko przy logowaniu, wiec dalsza komunikacja jest z tokenem
    // Tworzymy i odsylamy nowy token

    const { user } = req;

    sign(user)
        .then((token) => ({token, user: user.view(true)}))
        .then(success(res, 201))
        .catch(next);
};


const forgot =
    function(req, res, next) {
    async.waterfall([

        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });

        },
        function(token, done) {

        User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    console.log('error', 'No account with that email address exists.');
                    return notFound(res)(null);
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;

                user.save(function(err) {
                    done(err, token, user);
                });
            });

        },
        function(token, user, done) {

            const content = 'Change password token:\n\n' +
                  token + '\n\n' ;

            sendmail(user.email, 'Reset password!', content,function(err) {
                console.log('info', 'e-mail has been sent to ' + user.email + ' with further informations.');
                done(err, 'done');
            });
        }
    ], function(err) {

        console.log(err);
        if (err) return next(err);

        return res.status(200).end();
    });
};


const reset = function(req, res, next) {
        async.waterfall([
            function(done) {

            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                    if (!user) {
                        console.log('error', 'Reset password token has expired.');
                        return res.status(401).end();
                    }

                    user.password = req.body.password;
                    console.log(req.body.password);

                    if(user.password === undefined || user.password === null || user.password === "")
                        return res.status(404).json({
                            errors: ['path `password` required']
                        }).end();

                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;


                    user.save(function(err) {
                        sign(user)
                            .then((token) => ({token, user: user.view(true)}))
                            .then(done(err, user))
                    });
                });

            },
            function(user, done) {

                const content =  'Hello,\n\n' +
                    'Password for your account ' + user.email + ' has just been changed.\n';

                sendmail(user.email, 'Your password has been changed', content,function(err) {
                    console.log('success', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {

            if(err) return next(err);

           return res.status(200).end();
        });
};

const update = ({ body, user }, res, next) =>
    User.findById(user.id)
        .then(notFound(res))
        .then((user) => user ? Object.assign(user, body).save() : null)
        .then((user) => user ? user.view(true) : null)
        .then(success(res))
        .catch((err) => catchDuplicateEmail(res, err, next));



const destroy = ({ params }, res, next) =>
    User.findById(params.id)
        .then(notFound(res))
        .then((user) => user ? user.remove() : null)
        .then(success(res, 204))
        .catch(next);

module.exports = {
  create, index, show, update, destroy, showMe, auth, forgot, reset, filterByName
};