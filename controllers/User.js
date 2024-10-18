const User = require('../models/User');

exports.getTopCreators = async (req, res) => {
    try {
        User
            .find({})
            .sort({ totalProject: 1 })
            .limit(5)
            .then(result => {
                res.status(200).json(result);
            })
    } catch (err) {
        res.status(400).json({ message: 'Something went wrong.' });
    }
}