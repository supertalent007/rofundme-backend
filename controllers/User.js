const User = require('../models/User');

exports.getUserById = async (req, res) => {
    const id = req.params.id;

    const user = await User.findOne({ _id: id });

    if (user) {
        res.status(200).json(user);
    } else {
        res.status(400).json({ message: 'There is no user with current id.' });
    }
}

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

exports.updateUserData = async (req, res) => {
    const { userId, ...updateData } = req.body;
    const BASE_URL = 'http://localhost:8000';

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { ...updateData, avatar: req.files['avatar'] ? `${BASE_URL}/${req.files['avatar'][0].path}` : null, }, { new: true });

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.send({ message: 'User profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({ message: 'Failed to update user profile' });
    }
}