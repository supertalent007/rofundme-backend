const Stripe = require("stripe");
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Project = require('../models/Project');

require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
    const { amount, product, rewardId, projectId, userId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/project/${projectId}`,
            cancel_url: `${process.env.CLIENT_URL}/project/${projectId}`,
            metadata: {
                rewardId: rewardId,
                projectId: projectId,
            },
        });

        const newTransaction = new Transaction({
            userId,
            rewardId,
            projectId,
            amount: amount / 100,
            stripePaymentId: session.id,
            paymentStatus: 'pending',
        });
        await newTransaction.save();

        res.json({ url: session.url });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
}

exports.handleStripeWebhook = async (req, res) => {
    const event = req.body;
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const transaction = await Transaction.findOne({ stripePaymentId: session.id });
                if (transaction) {
                    transaction.paymentStatus = 'succeeded';
                    await transaction.save();

                    const project = await Project.findById(transaction.projectId);

                    if (project) {
                        project.fundedAmount += transaction.amount;
                        await project.save();
                    }
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Failed to save payment info to DB:', error);
        res.status(500).send('Error saving payment info');
    }
};

exports.getUserTransaction = async (req, res) => {
    try {
        const userId = req.params.userId;

        Transaction
            .find({ userId: userId })
            .populate('projectId')
            .populate('userId')
            .sort({ createdAt: -1 })
            .then(result => {
                res.status(200).json(result);
            })
    } catch (err) {
        console.error('Failed to get transaction info to DB:', err);
        res.status(500).send('Error getting transaction info');
    }
}

exports.getTheLatestTransactions = async (req, res) => {
    try {
        Transaction
            .find({ paymentStatus: 'succeeded' })
            .populate('projectId')
            .populate('userId')
            .sort({ createdAt: -1 })
            .limit(5)
            .then(result => {
                res.status(200).json(result);
            })

    } catch (err) {
        console.error('Failed to get transaction info to DB:', err);
        res.status(500).send('Error getting transaction info');
    }
}

exports.getTotalNumberOfTransactions = (req, res) => {
    try {
        Transaction
            .find({})
            .then(result => {
                res.status(200).json(result.length);
            })
    } catch (err) {
        console.error('Failed to get transaction info to DB:', err);
        res.status(500).send('Error getting transaction info');
    }
}