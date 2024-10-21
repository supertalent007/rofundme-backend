const Stripe = require("stripe");
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Project = require('../models/Project');

require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createProduct = async (req, res) => {
    try {
        const product = await stripe.products.create({
            name: 'Monthly Subscription',
        });

        const price = await stripe.prices.create({
            unit_amount: 1000,
            currency: 'usd',
            recurring: { interval: 'month' },
            product: product.id,
        });

        res.json({ product, price });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.createCheckoutSession = async (req, res) => {
    const { id, plan } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: req.body.items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.ceil(item.price * 100),
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `http://localhost:3000/translations`,
            cancel_url: `http://localhost:3000/translations`,
        });

        const user = await User.findById(id);

        if (!user) {
            throw new Error('User not found');
        }

        user.subscriptionId = session.id || "";
        user.plan = plan.title;
        user.characterLimit = plan.characterLimit;
        user.pageLimit = plan.pageLimit;
        user.fileSizeLimit = plan.fileSizeLimit;

        await user.save();

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserSubscriptions = async (userId) => {
    try {
        const user = await User.findById(userId).select('subscriptions');
        return user.subscriptions;
    } catch (error) {
        throw new Error('Could not fetch subscriptions');
    }
};

const getLastUserSubscription = async (userId) => {
    try {
        const user = await User.findById(userId).select('subscriptions');

        if (!user) {
            throw new Error('User not found');
        }

        const subscriptions = user.subscriptions;

        if (subscriptions.length === 0) {
            return null;
        }

        return subscriptions[subscriptions.length - 1];
    } catch (error) {
        throw new Error('Could not fetch the last subscription: ' + error.message);
    }
}

exports.getSubscriptions = async (req, res) => {
    try {
        const subscription = await getUserSubscriptions(req.params.userId);
        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getCurrentSubscription = async (req, res) => {
    try {
        const subscription = await getLastUserSubscription(req.params.userId);
        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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
        const userId = req.query.userId;
        await Transaction
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