const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ThumbSchema = new Schema({
    filePath: { type: String, required: true },
    description: { type: String, required: false },
    type: { type: String, required: false },
});

module.exports = mongoose.model('Thumb', ThumbSchema);