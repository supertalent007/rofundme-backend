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

//User Management Router
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/verify', authController.verify);

router.post('/auth/reset_password', authController.resetPassword);
router.post('/auth/request_reset', authController.generateCode);
router.post('/auth/verify_code', authController.verifyCode);

router.delete('/user/:id', authController.deActiveUser);

router.get('/users/top_creators', userController.getTopCreators);
router.get('/users/single/:id', authController.getUser);

//Project Management Router
router.post('/projects/new', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mediaFiles', maxCount: 100 },
    { name: 'rewardFiles', maxCount: 100 }
]), projectController.createProject);

router.get('/projects', projectController.getProjectsPerPage);
router.get('/projects/recent', projectController.getRecentProjects);
router.get('/projects/total', projectController.getTotalNumberOfProjects);
router.get('/projects/single/:id', projectController.getProjectById);
router.get('/projects/:userId', projectController.getProjects);
router.get('/projects/get_number_of_backers_for_project/:projectId', projectController.getNumberOfBackersForProject);

router.get('/admin/projects', projectController.getProjectList);

//Subscription Router
router.get('/current_subscription/:userId', paymentController.getCurrentSubscription);
router.get('/subscriptions/:userId', paymentController.getSubscriptions);
router.post('/create_product', paymentController.createProduct);
router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/handle_stripe_webhook', paymentController.handleStripeWebhook);


module.exports = router;