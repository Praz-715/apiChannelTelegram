const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    idchat: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: 0,
        required: true
    },
    token: {
        type: String,
        default: 'dordordor'
    }
}, {collection: 'channels', timestamps: true});

module.exports = mongoose.model('Channel', channelSchema);