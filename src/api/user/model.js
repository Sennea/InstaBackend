// używane do autentykacji hasła
// https://medium.com/@mridu.sh92/a-quick-guide-for-authentication-using-bcrypt-on-express-nodejs-1d8791bb418f
const bcrypt = require('bcrypt');

const mongoose = require('mongoose');
const roles = ['user', 'admin'];

const Schema = mongoose.Schema;

const Relation = require('../relation/model').model;

const userSchema = new Schema({
    email: {
        type: String,
        match: /^\S+@\S+\.\S+$/,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    role: {
        type: String,
        enum: roles,
        default: 'user'
    },
    photos: [
        {
            type: Schema.ObjectId,
            ref: 'Photo'
        }
    ],
    albums: [
        {
            type: Schema.ObjectId,
            ref: 'Album'
        }
    ],
    relations: [{
        type: Schema.ObjectId,
        ref: "Relation",
    }],

    resetPasswordToken: String,
    resetPasswordExpires: Date

}, {
    timestamps: true
});

userSchema.pre('save', function (next) {
    if(!this.isModified('password'))
        return next();

    const rounds = 9;

    bcrypt.hash(this.password, rounds).then((hash) => {
        this.password = hash;
        next();
    }).catch(next);

});


userSchema.methods = {
    view (full){
        let view = {};
        let fields = ['id', 'name', ];

        if(full){
            fields = [...fields, 'role', 'email', 'albums', 'photos', 'relations', "resetPasswordExpires", "resetPasswordToken", "password"];
        }

        fields.forEach((field) => { view[field] = this[field]});

        return view;
    },

    authenticate (password){
        return bcrypt.compare(password, this.password).then((valid) => valid ? this : false);
    }
};

userSchema.statics = {
    roles
};

const model = mongoose.model('User', userSchema);

module.exports = { model, userSchema };