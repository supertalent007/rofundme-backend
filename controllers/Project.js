const Project = require('../models/Project');
const Thumb = require('../models/Thumb');
const Reward = require('../models/Reward');
const Transaction = require('../models/Transaction');
const mongoose = require("mongoose");

//User Controllers
exports.createProject = async (req, res) => {
    const { userId, title, description, category, launchDate, duration, goal } = req.body;

    const mediaFiles = req.files['mediaFiles'] || [];
    const rewardFiles = req.files['rewardFiles'] || [];
    const mediaDescriptions = Array.isArray(req.body.mediaDescriptions) ? req.body.mediaDescriptions : [];
    const mediaTypes = Array.isArray(req.body.mediaTypes) ? req.body.mediaTypes : [];
    const rewardTitles = Array.isArray(req.body.rewardTitles) ? req.body.rewardTitles : [];
    const rewardDescriptions = Array.isArray(req.body.rewardDescriptions) ? req.body.rewardDescriptions : [];
    const rewardAmounts = Array.isArray(req.body.rewardAmounts) ? req.body.rewardAmounts : [];

    const BASE_URL = 'http://localhost:8000/';

    try {
        let thumbsArray = [];
        if (mediaFiles && Array.isArray(mediaFiles)) {
            thumbsArray = await Promise.all(mediaFiles.map(async (file, index) => {
                const thumb = new Thumb({
                    filePath: file.path,
                    description: mediaDescriptions[index] || '',
                    type: mediaTypes[index] || ''
                });
                await thumb.save();
                return thumb._id;  // Save and get the ObjectId
            }));
        }

        let rewardsArray = [];
        if (rewardFiles && Array.isArray(rewardFiles)) {
            rewardsArray = await Promise.all(rewardFiles.map(async (file, index) => {
                const reward = new Reward({
                    filePath: file.path,
                    title: rewardTitles[index] || '',
                    description: rewardDescriptions[index] || '',
                    amount: rewardAmounts[index] || ''
                });
                await reward.save();
                return reward._id;  // Save and get the ObjectId
            }));
        }

        const projectData = new Project({
            userId: userId,
            title: title,
            description: description,
            category: category,
            launchDate: launchDate,
            duration: duration,
            goal: goal,
            image: req.files['image'] ? `${BASE_URL}${req.files['image'][0].path}` : null,
            thumbs: thumbsArray,
            rewards: rewardsArray
        });

        await projectData.save();

        res.status(200).json({ message: 'Project created successfully.' });
    } catch (err) {
        res.status(400).json({ message: 'Something went wrong. Please try again.' });
    }
}

exports.getProjects = async (req, res) => {
    const userId = req.query.userId ? req.query.userId : '';

    Project
        .find({ userId: userId })
        .then(result => {
            res.status(200).json(result);
        });
}

exports.getTotalNumberOfProjects = async (req, res) => {
    Project
        .find({})
        .then(result => {
            res.status(200).json(result.length);
        })
}


exports.getProjectsPerPage = async (req, res) => {
    const perPage = req.query.projectsPerPage ? req.query.projectsPerPage : 12;
    const currentPage = req.query.currentPage ? req.query.currentPage : 1;
    const sortBy = req.query.sortBy ? req.query.sortBy : 'recent';

    let sortOption;

    switch (sortBy) {
        case 'recent':
            sortOption = { createdAt: -1 };
            break;
        case 'increase':
            sortOption = { goal: 1 };
            break;
        case 'decrease':
            sortOption = { goal: -1 };
            break;
        default:
            sortOption = { createdAt: -1 };
            break;
    }

    Project
        .find({})
        .populate('userId')
        .sort(sortOption)
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .then(result => {
            res.status(200).json(result);
        })
}

exports.getRecentProjects = async (req, res) => {
    Project
        .find({})
        .populate('userId')
        .sort({ createdAt: -1 })
        .limit(5)
        .then(result => {
            res.status(200).json(result);
        })
}


exports.getProjectById = async (req, res) => {
    const id = req.params.id;

    Project
        .find({ _id: id })
        .populate('thumbs')
        .populate('rewards')
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => {
            res.status(400).json({ message: 'There is no project with this id' });
        })
}


//Admin Controllers

exports.getProjectList = async (req, res) => {
    const status = req.query.status;

    if (status === 'All') {
        Project
            .find({})
            .then(result => {
                res.status(200).json(result);
            })

    } else {
        Project
            .find({ status: status })
            .then(result => {
                res.status(200).json(result);
            })
    }
}

exports.getNumberOfBackersForProject = async (req, res) => {
    try {
        const id = req.params.projectId;

        if (!id) {
            return res.status(400).send({ error: 'Project ID is required' });
        }

        const projectId = new mongoose.Types.ObjectId(id);

        const result = await Transaction.aggregate([
            {
                $match: {
                    paymentStatus: "succeeded",
                    projectId: projectId
                }
            },
            // {
            //     $group: {
            //         _id: "$userId"
            //     }
            // },
            {
                $count: "numberOfBackers"
            }
        ]);

        const numberOfBackers = result.length ? result[0].numberOfBackers : 0;

        res.status(200).send({ numberOfBackers });
    } catch (error) {
        console.error('Error fetching the number of backers:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
}