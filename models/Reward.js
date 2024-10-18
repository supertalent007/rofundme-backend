const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RewardSchema = new Schema({
    filePath: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
});

module.exports = mongoose.model('Reward', RewardSchema);