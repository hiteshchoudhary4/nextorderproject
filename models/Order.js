const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: Number
    },
    orderDate: {
        type: String  // Format: YYYY-MM-DD for daily grouping
    },
    kitchen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Kitchen',
        required: true
    },
    items: [{
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 }
    }],
    customer: {
        name: { type: String, required: true },
        phone: String
    },
    payment: {
        method: { type: String, enum: ['Cash', 'Online'], required: true },
        status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
    },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    totalAmount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Create compound index for order number uniqueness per kitchen per day
OrderSchema.index({ kitchen: 1, orderDate: 1, orderNumber: 1 }, { unique: true });

// Auto-generate order number before save - RESETS DAILY
OrderSchema.pre('save', async function () {
    if (this.isNew) {
        // Set order date (YYYY-MM-DD format)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        this.orderDate = dateStr;

        // Find highest order number for this kitchen on this date
        const lastOrder = await this.constructor.findOne({
            kitchen: this.kitchen,
            orderDate: dateStr
        })
            .sort({ orderNumber: -1 })
            .select('orderNumber');

        // Start from 1 each day
        this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
    }
});

module.exports = mongoose.model('Order', OrderSchema);
