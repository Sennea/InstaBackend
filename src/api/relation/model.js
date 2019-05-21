const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const relationSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    meta:{
        numberOfViews: {
            type: Number,
            default: 0
        },
        time: {
            type: Date,
            // `Date.now()` returns the current unix timestamp as a number
            default: () => Date.now() + 60000*60// 1 h

        }
    }

}, {
    timestamps: true
});



relationSchema.methods = {

    view(full){

        const view = {
            user_id: this.user,
            numberOfViews: this.meta.numberOfViews
        };

        return full ? {
            ...view,
            id: this._id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            expireTime: this.meta.time
        } : view
    }
}

const model = mongoose.model('Relation', relationSchema);

module.exports = { model ,relationSchema };