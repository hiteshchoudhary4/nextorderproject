const express = require('express');
const jwt = require('jsonwebtoken');
const Kitchen = require('../models/Kitchen');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nextorder-super-secret-key-change-in-production';

// Auth Middleware
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please log in.'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please log in again.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please log in.'
        });
    }
}

/**
 * @route   POST /api/kitchens
 * @desc    Create a new kitchen with menu
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, address, phone, menu, settings } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Kitchen name is required'
            });
        }

        // Check if user already has a kitchen
        const existingKitchen = await Kitchen.findOne({ owner: req.userId });
        if (existingKitchen) {
            return res.status(400).json({
                success: false,
                message: 'You already have a kitchen. You can edit it instead.'
            });
        }

        // Create kitchen
        const kitchen = new Kitchen({
            name,
            owner: req.userId,
            description,
            address,
            phone,
            menu: menu || [],
            settings: settings || {}
        });

        await kitchen.save();

        // Update user with kitchen reference
        await User.findByIdAndUpdate(req.userId, { kitchen: kitchen._id });

        res.status(201).json({
            success: true,
            message: 'Kitchen created successfully',
            kitchen
        });

    } catch (error) {
        console.error('Create kitchen error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

/**
 * @route   GET /api/kitchens/my
 * @desc    Get current user's kitchen
 * @access  Private
 */
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ owner: req.userId });

        if (!kitchen) {
            return res.status(404).json({
                success: false,
                message: 'No kitchen found. Please create one.'
            });
        }

        // Include subscription status in response
        res.json({
            success: true,
            kitchen,
            subscription: {
                status: kitchen.subscription.status,
                isPremium: kitchen.subscription.isPremium,
                daysLeftInTrial: kitchen.daysLeftInTrial,
                isTrialExpired: kitchen.isTrialExpired,
                hasFullAccess: kitchen.hasFullAccess,
                trialEndDate: kitchen.subscription.trialEndDate,
                planName: kitchen.subscription.planName
            }
        });

    } catch (error) {
        console.error('Get kitchen error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/kitchens/my/subscription
 * @desc    Get subscription status for current user's kitchen
 * @access  Private
 */
router.get('/my/subscription', authMiddleware, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ owner: req.userId });

        if (!kitchen) {
            return res.status(404).json({
                success: false,
                message: 'No kitchen found.'
            });
        }

        res.json({
            success: true,
            subscription: {
                status: kitchen.subscription.status,
                isPremium: kitchen.subscription.isPremium,
                planName: kitchen.subscription.planName,
                daysLeftInTrial: kitchen.daysLeftInTrial,
                isTrialExpired: kitchen.isTrialExpired,
                hasFullAccess: kitchen.hasFullAccess,
                trialStartDate: kitchen.subscription.trialStartDate,
                trialEndDate: kitchen.subscription.trialEndDate,
                purchasedAt: kitchen.subscription.purchasedAt,
                amount: kitchen.subscription.amount
            },
            limits: {
                ordersPerDay: kitchen.hasFullAccess ? 'Unlimited' : 5,
                menuItems: kitchen.hasFullAccess ? 'Unlimited' : 10,
                reports: kitchen.hasFullAccess
            }
        });

    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/kitchens/my
 * @desc    Update current user's kitchen
 * @access  Private
 */
router.put('/my', authMiddleware, async (req, res) => {
    try {
        const { name, description, address, phone, menu, settings } = req.body;

        const kitchen = await Kitchen.findOne({ owner: req.userId });

        if (!kitchen) {
            return res.status(404).json({
                success: false,
                message: 'No kitchen found. Please create one first.'
            });
        }

        // Update fields
        if (name) kitchen.name = name;
        if (description !== undefined) kitchen.description = description;
        if (address !== undefined) kitchen.address = address;
        if (phone !== undefined) kitchen.phone = phone;
        if (menu) kitchen.menu = menu;
        if (settings) kitchen.settings = { ...kitchen.settings, ...settings };

        await kitchen.save();

        res.json({
            success: true,
            message: 'Kitchen updated successfully',
            kitchen
        });

    } catch (error) {
        console.error('Update kitchen error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/kitchens/my/menu
 * @desc    Add menu item to kitchen
 * @access  Private
 */
router.post('/my/menu', authMiddleware, async (req, res) => {
    try {
        const { name, price, description, category } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Product name and price are required'
            });
        }

        const kitchen = await Kitchen.findOne({ owner: req.userId });

        if (!kitchen) {
            return res.status(404).json({
                success: false,
                message: 'No kitchen found. Please create one first.'
            });
        }

        kitchen.menu.push({
            name,
            price,
            description,
            category: category || 'General'
        });

        await kitchen.save();

        res.status(201).json({
            success: true,
            message: 'Menu item added',
            menu: kitchen.menu
        });

    } catch (error) {
        console.error('Add menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/kitchens/my/menu/:itemId
 * @desc    Remove menu item from kitchen
 * @access  Private
 */
router.delete('/my/menu/:itemId', authMiddleware, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ owner: req.userId });

        if (!kitchen) {
            return res.status(404).json({
                success: false,
                message: 'No kitchen found.'
            });
        }

        kitchen.menu = kitchen.menu.filter(
            item => item._id.toString() !== req.params.itemId
        );

        await kitchen.save();

        res.json({
            success: true,
            message: 'Menu item removed',
            menu: kitchen.menu
        });

    } catch (error) {
        console.error('Remove menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/kitchens
 * @desc    Get all kitchens (public)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const kitchens = await Kitchen.find({ isActive: true })
            .select('name description address menuCount')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: kitchens.length,
            kitchens
        });

    } catch (error) {
        console.error('Get all kitchens error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/kitchens/:id
 * @desc    Get kitchen by ID with menu (public for customers)
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id)
            .select('-owner');

        if (!kitchen) {
            return res.status(404).json({
                success: false,
                message: 'Kitchen not found'
            });
        }

        res.json({
            success: true,
            kitchen
        });

    } catch (error) {
        console.error('Get kitchen error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
