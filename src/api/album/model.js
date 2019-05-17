const mongoose = require('mongoose');
const { Schema } = require('mongoose')

const albumSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    user:{
      type: Schema.ObjectId,
      ref: 'User'
    },
    photos: [
        {
            type: Schema.ObjectId,
            ref: 'Photo'
        }
    ]


}, {
    timestamps: true
});


albumSchema.methods = {

    view(full){

        const view = {
            user: this.user,
            albumName: this.name,
            photos: this.photos
        };

        return full ? {
            ...view,
            id: this._id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        } : view;
    }
};

const model = mongoose.model('Album', albumSchema);


module.exports = { model, albumSchema };