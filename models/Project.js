const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    title: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    category: {
        type: String,
        require: true
    },
    launchDate: {
        type: Date
    },
    duration: {
        type: Number,
        require: true
    },
    image: {
        type: String,
        require: true
    },
    status: {
        type: String,
        default: 'Pending'
    },
    badge: {
        type: String,
        default: 'Pending'
    },
    progress: {
        type: Number,
        default: 0
    },
    goal: {
        type: Number,
        default: 0
    },
    fundedAmount: {
        type: Number,
        default: 0
    },
    thumbs: [{
        type: Schema.Types.ObjectId,
        ref: "Thumb",
        require: true
    }],
    rewards: [{
        type: Schema.Types.ObjectId,
        ref: "Reward",
        require: true
    }],
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);