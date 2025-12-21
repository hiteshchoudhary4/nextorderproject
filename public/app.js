/**
 * NextOrder - Main Application
 * Handles order flow, menu display, and real-time updates
 */

// Initialize Socket.io
const socket = io();

// State
let currentStep = 1;
let orderData = {
    type: '',
    items: [],
    customer: { name: '', phone: '' },
    payment: { method: '', status: 'Pending' },
    totalAmount: 0
};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!protectPage()) return;
    renderMenu();
});

// Menu Data - This will be vendor-specific later
const MENU_ITEMS = [
    { id: 1, name: 'Burger', price: 5.99, emoji: '🍔' },
    { id: 2, name: 'Fries', price: 2.99, emoji: '🍟' },
    { id: 3, name: 'Coke', price: 1.99, emoji: '🥤' },
    { id: 4, name: 'Pizza Slice', price: 8.99, emoji: '🍕' },
    { id: 5, name: 'Pasta', price: 7.49, emoji: '🍝' },
    { id: 6, name: 'Salad', price: 4.99, emoji: '🥗' },
    { id: 7, name: 'Ice Cream', price: 3.49, emoji: '🍦' },
    { id: 8, name: 'Coffee', price: 2.49, emoji: '☕' }
];

// ============================================
// SOCKET LISTENERS
// ============================================
socket.on('connect', () => {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: var(--color-success); border-radius: 50%; margin-right: 4px;"></span>
            Online
        `;
    }
});

socket.on('disconnect', () => {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: var(--color-error); border-radius: 50%; margin-right: 4px;"></span>
            Offline
        `;
    }
});

socket.on('new-order', (order) => {
    console.log('New order received:', order);
    fetchOrders();
});

socket.on('update-order', () => {
    fetchOrders();
});

// ============================================
// NAVIGATION
// ============================================
function goToStep(step) {
    // Validation
    if (step === 3 && orderData.items.length === 0) {
        showToast('Please select at least one item', 'warning');
        return;
    }

    if (step === 4) {
        const name = document.getElementById('customer-name').value.trim();
        if (!name) {
            showToast('Customer name is required', 'warning');
            return;
        }
        orderData.customer.name = name;
        orderData.customer.phone = document.getElementById('customer-phone').value.trim();
        const notes = document.getElementById('order-notes').value.trim();
        if (notes && orderData.items.length > 0) {
            orderData.items[0].notes = notes;
        }
        renderSummary();
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));

    // Show target page
    if (step === 'dashboard') {
        document.getElementById('dashboard').classList.add('active');
        fetchOrders();
    } else if (step === 'success') {
        document.getElementById('success').classList.add('active');
    } else {
        document.getElementById(`step-${step}`).classList.add('active');
    }

    currentStep = step;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// ORDER TYPE SELECTION
// ============================================
function selectOrderType(type) {
    orderData.type = type;
    document.getElementById('order-type-label').textContent = `${type} Order`;
    goToStep(2);
}

// ============================================
// MENU RENDERING
// ============================================
function renderMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    grid.innerHTML = MENU_ITEMS.map(item => `
        <div class="menu-item" data-id="${item.id}">
            <div style="font-size: 2.5rem; margin-bottom: var(--spacing-sm);">${item.emoji}</div>
            <div class="menu-item__name">${item.name}</div>
            <div class="menu-item__price">$${item.price.toFixed(2)}</div>
            <div class="menu-item__counter">
                <button class="counter-btn" onclick="updateQty(${item.id}, -1)">−</button>
                <span class="counter-value" id="qty-${item.id}">0</span>
                <button class="counter-btn" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');
}

function updateQty(id, change) {
    const item = MENU_ITEMS.find(i => i.id === id);
    if (!item) return;

    const existingIndex = orderData.items.findIndex(i => i.name === item.name);

    if (existingIndex > -1) {
        orderData.items[existingIndex].quantity += change;
        if (orderData.items[existingIndex].quantity <= 0) {
            orderData.items.splice(existingIndex, 1);
        }
    } else if (change > 0) {
        orderData.items.push({
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }

    // Update UI
    const qtyItem = orderData.items.find(i => i.name === item.name);
    const qty = qtyItem ? qtyItem.quantity : 0;
    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) {
        qtyEl.textContent = qty;
    }

    updateTotal();
}

function updateTotal() {
    const total = orderData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    orderData.totalAmount = total;
    const totalEl = document.getElementById('total-price');
    if (totalEl) {
        totalEl.textContent = total.toFixed(2);
    }
}

// ============================================
// ORDER SUMMARY
// ============================================
function renderSummary() {
    const container = document.getElementById('order-summary');
    if (!container) return;

    const itemsHtml = orderData.items.map(item => `
        <div class="order-summary__row">
            <span>${item.name} × ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="order-summary__row">
            <span style="color: var(--color-text-secondary);">Order Type</span>
            <span>${orderData.type}</span>
        </div>
        <div class="order-summary__row">
            <span style="color: var(--color-text-secondary);">Customer</span>
            <span>${orderData.customer.name}</span>
        </div>
        <div style="margin: var(--spacing-md) 0; border-top: 1px solid var(--color-border);"></div>
        ${itemsHtml}
        <div class="order-summary__row" style="font-weight: var(--font-weight-bold); font-size: var(--font-size-lg); padding-top: var(--spacing-md); border-top: 1px solid var(--color-border); margin-top: var(--spacing-md);">
            <span>Total</span>
            <span>$${orderData.totalAmount.toFixed(2)}</span>
        </div>
    `;

    // Reset payment selection
    resetPaymentSelection();
}

// ============================================
// PAYMENT
// ============================================
function selectPayment(method) {
    orderData.payment.method = method;

    // Update UI
    const cashBtn = document.getElementById('btn-cash');
    const onlineBtn = document.getElementById('btn-online');

    cashBtn.classList.toggle('selected', method === 'Cash');
    onlineBtn.classList.toggle('selected', method === 'Online');

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Place Order · $${orderData.totalAmount.toFixed(2)}`;
}

function resetPaymentSelection() {
    const cashBtn = document.getElementById('btn-cash');
    const onlineBtn = document.getElementById('btn-online');
    const submitBtn = document.getElementById('btn-submit');

    if (cashBtn) cashBtn.classList.remove('selected');
    if (onlineBtn) onlineBtn.classList.remove('selected');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Select Payment Method';
    }

    orderData.payment.method = '';
}

// ============================================
// ORDER SUBMISSION
// ============================================
async function submitOrder() {
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="opacity: 0.7;">Processing...</span>';

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById('success-id').textContent = '#' + data._id.slice(-4).toUpperCase();
            goToStep('success');

            // Reset order data
            resetOrderData();
        } else {
            showToast('Failed to place order. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Place Order · $${orderData.totalAmount.toFixed(2)}`;
        }
    } catch (err) {
        console.error(err);
        showToast('Network error. Please check your connection.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Place Order · $${orderData.totalAmount.toFixed(2)}`;
    }
}

function resetOrderData() {
    orderData = {
        type: '',
        items: [],
        customer: { name: '', phone: '' },
        payment: { method: '', status: 'Pending' },
        totalAmount: 0
    };
    updateTotal();
    renderMenu();

    // Clear form fields
    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const notesEl = document.getElementById('order-notes');

    if (nameEl) nameEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (notesEl) notesEl.value = '';
}

// ============================================
// DASHBOARD
// ============================================
function showDashboard() {
    goToStep('dashboard');
}

async function fetchOrders() {
    try {
        const res = await fetch('/api/orders');
        const orders = await res.json();
        const list = document.getElementById('orders-list');

        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="text-center" style="padding: var(--spacing-4xl); color: var(--color-text-secondary);">
                    <ion-icon name="receipt-outline" style="font-size: 3rem; margin-bottom: var(--spacing-md);"></ion-icon>
                    <p>No orders yet</p>
                </div>
            `;
            return;
        }

        list.innerHTML = orders.map(order => `
            <div class="order-card ${order.status === 'Completed' ? 'completed' : ''}">
                <div class="order-card__header">
                    <span class="order-card__id">#${order._id.slice(-4).toUpperCase()} · ${order.type}</span>
                    <span class="status-badge ${order.status === 'Pending' ? 'status-badge--pending' : 'status-badge--completed'}">
                        ${order.status}
                    </span>
                </div>
                <p style="color: var(--color-text-secondary); margin: var(--spacing-sm) 0;">
                    ${order.customer.name} · $${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-md);">
                    <small style="color: var(--color-text-tertiary);">
                        ${new Date(order.createdAt).toLocaleTimeString()}
                    </small>
                    ${order.status !== 'Completed' ? `
                        <button class="btn btn--primary" style="padding: var(--spacing-sm) var(--spacing-md); font-size: var(--font-size-sm);" onclick="updateStatus('${order._id}', 'Completed')">
                            Mark Complete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function updateStatus(id, status) {
    try {
        await fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        fetchOrders();
    } catch (err) {
        console.error(err);
        showToast('Failed to update order status', 'error');
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: var(--spacing-xl);
        left: 50%;
        transform: translateX(-50%);
        padding: var(--spacing-md) var(--spacing-xl);
        background: ${type === 'error' ? 'var(--color-error)' : type === 'warning' ? 'var(--color-warning)' : 'var(--color-text-primary)'};
        color: white;
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast animations
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes slideDown {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
`;
document.head.appendChild(toastStyles);
