const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Kitchen = require('../models/Kitchen');

const JWT_SECRET = process.env.JWT_SECRET || 'nextorder-super-secret-key-change-in-production';

// Auth Middleware
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// GET all orders for user's kitchen (queue)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Find user's kitchen
        const kitchen = await Kitchen.findOne({ owner: req.userId });
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }

        // Get all non-completed orders
        const orders = await Order.find({
            kitchen: kitchen._id,
            status: { $ne: 'Completed' }
        }).sort({ createdAt: 1 });

        res.json({
            success: true,
            orders
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all orders including completed (history)
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ owner: req.userId });
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }

        const orders = await Order.find({ kitchen: kitchen._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            orders
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET today's order stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ owner: req.userId });
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.find({
            kitchen: kitchen._id,
            createdAt: { $gte: today }
        });

        const totalOrders = todayOrders.length;
        const completedOrders = todayOrders.filter(o => o.status === 'Completed').length;
        const pendingOrders = todayOrders.filter(o => o.status !== 'Completed').length;
        const totalRevenue = todayOrders
            .filter(o => o.status === 'Completed')
            .reduce((sum, o) => sum + o.totalAmount, 0);

        res.json({
            success: true,
            stats: {
                totalOrders,
                completedOrders,
                pendingOrders,
                totalRevenue
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET report by date (query param: ?date=YYYY-MM-DD)
router.get('/report', authMiddleware, async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ owner: req.userId });
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }

        // Get date from query or default to today
        let selectedDate = req.query.date;
        let startDate, endDate;

        if (selectedDate) {
            // Specific date selected
            startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Default: today
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            selectedDate = startDate.toISOString().split('T')[0];
        }

        const orders = await Order.find({
            kitchen: kitchen._id,
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: -1 });

        // Calculate stats
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'Completed');
        const cancelledOrders = orders.filter(o => o.status === 'Cancelled');
        const pendingOrders = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status));

        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        const cashOrders = completedOrders.filter(o => o.payment.method === 'Cash');
        const onlineOrders = completedOrders.filter(o => o.payment.method === 'Online');

        const cashRevenue = cashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const onlineRevenue = onlineOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        // Item breakdown
        const itemStats = {};
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                if (!itemStats[item.name]) {
                    itemStats[item.name] = { quantity: 0, revenue: 0 };
                }
                itemStats[item.name].quantity += item.quantity;
                itemStats[item.name].revenue += item.price * item.quantity;
            });
        });

        // Convert to array and sort by quantity
        const topItems = Object.entries(itemStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.quantity - a.quantity);

        // Date-wise breakdown
        const dateWise = {};
        orders.forEach(order => {
            const dateKey = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            if (!dateWise[dateKey]) {
                dateWise[dateKey] = {
                    date: dateKey,
                    orders: 0,
                    completed: 0,
                    revenue: 0,
                    items: []
                };
            }

            dateWise[dateKey].orders++;
            if (order.status === 'Completed') {
                dateWise[dateKey].completed++;
                dateWise[dateKey].revenue += order.totalAmount;
            }
            dateWise[dateKey].items.push({
                orderNumber: order.orderNumber,
                customer: order.customer.name,
                time: new Date(order.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                amount: order.totalAmount,
                status: order.status,
                payment: order.payment.method
            });
        });

        // Convert to array sorted by date (most recent first)
        const dateWiseArray = Object.values(dateWise);

        res.json({
            success: true,
            report: {
                selectedDate,
                period: selectedDate,
                generatedAt: new Date(),
                summary: {
                    totalOrders,
                    completedOrders: completedOrders.length,
                    pendingOrders: pendingOrders.length,
                    cancelledOrders: cancelledOrders.length,
                    totalRevenue,
                    cashRevenue,
                    onlineRevenue,
                    averageOrderValue: totalOrders > 0 ? (totalRevenue / completedOrders.length) || 0 : 0
                },
                topItems,
                dateWise: dateWiseArray,
                orders: orders.map(o => ({
                    orderNumber: o.orderNumber,
                    customer: o.customer,
                    items: o.items,
                    totalAmount: o.totalAmount,
                    payment: o.payment,
                    status: o.status,
                    createdAt: o.createdAt
                }))
            }
        });
    } catch (err) {
        console.error('Report error:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST create new order
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { items, customer, payment, totalAmount } = req.body;

        // Validate required fields
        if (!customer?.name) {
            return res.status(400).json({ message: 'Customer name is required' });
        }

        if (!payment?.method) {
            return res.status(400).json({ message: 'Payment method is required' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        // Find user's kitchen
        const kitchen = await Kitchen.findOne({ owner: req.userId });
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }

        const order = new Order({
            kitchen: kitchen._id,
            items,
            customer: {
                name: customer.name,
                phone: customer.phone || ''
            },
            payment: {
                method: payment.method,
                status: payment.method === 'Online' ? 'Paid' : 'Pending'
            },
            totalAmount,
            status: 'Pending'
        });

        const newOrder = await order.save();
        console.log(`[Order Service] ✅ New order created: #${newOrder.orderNumber} for ${newOrder.customer.name} (Amount: ₹${newOrder.totalAmount})`);

        // Emit socket event
        const io = req.app.get('socketio');
        if (io) {
            io.emit('new-order', newOrder);
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: newOrder
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(400).json({ message: err.message });
    }
});

// PATCH update order status
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.body.status) {
            order.status = req.body.status;
        }
        if (req.body.paymentStatus) {
            order.payment.status = req.body.paymentStatus;
        }

        const updatedOrder = await order.save();

        const io = req.app.get('socketio');
        if (io) {
            io.emit('update-order', updatedOrder);
        }

        res.json({
            success: true,
            order: updatedOrder
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE cancel order
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('delete-order', order._id);
        }

        res.json({
            success: true,
            message: 'Order cancelled'
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
