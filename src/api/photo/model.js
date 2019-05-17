const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const photoSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    meta:{
        likes: {
            type: Number,
            default: 0
        },
        description: {
            type: String
        }
    }

}, {

    timestamps: true

});



photoSchema.methods = {
    view(full) {
        const view = {
            user: this.user,
            likes: this.meta.likes,
            description: this.meta.description

        };

        return full ? {
            ...view,
            id: this._id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        } : view;
    }
};

const model = mongoose.model('Photo', photoSchema);

module.exports = { model, photoSchema };