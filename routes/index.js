const express = require("express");
const multer = require('multer');

const paymentController = require('../controllers/Payment');
const authController = require('../controllers/Auth');
const projectController = require('../controllers/Project');
const userController = require('../controllers/User');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

let router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

//Auth Management Router
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/verify', authController.verify);

router.post('/auth/reset_password', authController.resetPassword);
router.post('/auth/request_reset', authController.generateCode);
router.post('/auth/verify_code', authController.verifyCode);

//User Management Router
router.delete('/user/:id', authController.deActiveUser);

router.get('/users/top_creators', userController.getTopCreators);
router.get('/users/single/:id', userController.getUserById);
router.put('/users/update', upload.fields([
    { name: 'avatar', maxCount: 1 }
]), userController.updateUserData);
router.get('/users/total', userController.getTotalNumberOfUsers);

//Project Management Router
router.post('/projects/new', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mediaFiles', maxCount: 100 },
    { name: 'rewardFiles', maxCount: 100 }
]), projectController.createProject);

router.get('/projects', projectController.getProjectsPerPage);
router.get('/projects/top', projectController.getTopProjects);
router.get('/projects/recent', projectController.getRecentProjects);
router.get('/projects/total', projectController.getTotalNumberOfProjects);
router.get('/projects/single/:id', projectController.getProjectById);
router.get('/projects/created/:userId', projectController.getUserCreatedProjects);
router.get('/projects/backed/:userId', projectController.getUserBackedProjects);
router.get('/projects/get_number_of_backers_for_project/:projectId', projectController.getNumberOfBackersForProject);

router.get('/admin/projects', projectController.getProjectList);

//Transaction Router
router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/handle_stripe_webhook', paymentController.handleStripeWebhook);

router.get('/transactions/:userId', paymentController.getUserTransaction);
router.get('/transactions/latest', paymentController.getTheLatestTransactions);
router.get('/transactions/total', paymentController.getTotalNumberOfTransactions);

module.exports = router;