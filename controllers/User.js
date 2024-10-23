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
    const { userId, firstName, lastName, email, address, city, state, country, zipCode } = req.body;
    const BASE_URL = process.env.BASE_URL;

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, {
            firstName: firstName,
            lastName: lastName,
            email: email,
            address: address,
            city: city,
            state: state,
            country: country,
            zipCode: zipCode,
            avatar: req.files['avatar'] ? `${BASE_URL}/${req.files['avatar'][0].path}` : null,
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.send({ message: 'User profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({ message: 'Failed to update user profile' });
    }
}

exports.getTotalNumberOfUsers = (req, res) => {
    try {
        User
            .find({})
            .then(result => {
                res.status(200).json(result.length);
            })
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).send({ message: 'Failed to get user data' });
    }
}