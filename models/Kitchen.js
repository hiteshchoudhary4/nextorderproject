const mongoose = require('mongoose');

// Menu Item Schema (embedded in Kitchen)
const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    image: {
        type: String
    }
}, {
    timestamps: true
});

// Kitchen Schema
const kitchenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Kitchen name is required'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    menu: [menuItemSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    settings: {
        currency: {
            type: String,
            default: '₹'
        },
        taxRate: {
            type: Number,
            default: 0
        }
    },
    // Subscription tracking
    subscription: {
        status: {
            type: String,
            enum: ['trial', 'active', 'expired'],
            default: 'trial'
        },
        trialStartDate: {
            type: Date,
            default: Date.now
        },
        trialEndDate: {
            type: Date,
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        },
        isPremium: {
            type: Boolean,
            default: false
        },
        purchasedAt: {
            type: Date
        },
        planName: {
            type: String,
            default: 'Free Trial'
        },
        amount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Virtual for total menu items
kitchenSchema.virtual('menuCount').get(function () {
    return this.menu.length;
});

// Virtual for days left in trial
kitchenSchema.virtual('daysLeftInTrial').get(function () {
    if (this.subscription.isPremium) return null; // Premium users don't have trial
    const now = new Date();
    const endDate = new Date(this.subscription.trialEndDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
});

// Virtual to check if trial is expired
kitchenSchema.virtual('isTrialExpired').get(function () {
    if (this.subscription.isPremium) return false; // Premium users never expire
    return new Date() > new Date(this.subscription.trialEndDate);
});

// Virtual to check if user has full access
kitchenSchema.virtual('hasFullAccess').get(function () {
    return this.subscription.isPremium || !this.isTrialExpired;
});

// Ensure virtuals are included in JSON
kitchenSchema.set('toJSON', { virtuals: true });
kitchenSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Kitchen', kitchenSchema);

