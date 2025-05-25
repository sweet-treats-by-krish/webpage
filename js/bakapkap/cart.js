/**
 * Sweet Treats Cart Module
 * A modern, modular cart system for Sweet Treats by Krish
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id - Unique identifier for the item
 * @property {string} name - Display name of the item
 * @property {number} price - Price of the item
 * @property {number} quantity - Quantity of the item
 * @property {string} [image] - Optional image URL
 * @property {string} [addedAt] - ISO timestamp when item was added
 * @property {string} [updatedAt] - ISO timestamp when item was last updated
 */

class SweetTreatsCart {
    constructor() {
        this.cart = this.loadCart();
        this.initialize();
    }

    /**
     * Load cart from localStorage or initialize a new one
     * @returns {CartItem[]} Array of cart items
     */
    loadCart() {
        try {
            const savedCart = localStorage.getItem('sweetTreatsCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        try {
            localStorage.setItem('sweetTreatsCart', JSON.stringify(this.cart));
            this.updateCartCount();
            
            // Dispatch cart updated event
            document.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: {
                    cart: this.cart,
                    count: this.getTotalItems()
                }
            }));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    /**
     * Initialize the cart
     */
    initialize() {
        this.setupEventListeners();
        this.updateCartCount();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle cart link clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.cart-link')) {
                e.preventDefault();
                this.showCartPopup();
            }
        });
    }

    /**
     * Add item to cart
     * @param {CartItem} item - Item to add to cart
     * @returns {{success: boolean, message: string}} Operation result
     */
    addItem(item) {
        // Validate item
        if (!this.validateItem(item)) {
            return { success: false, message: 'Invalid item' };
        }
        
        // Process item
        const processedItem = this.processItem(item);
        
        // Check if item already exists in cart
        const existingItemIndex = this.cart.findIndex(cartItem => cartItem.id === processedItem.id);
        
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            this.cart[existingItemIndex].quantity += processedItem.quantity;
            this.cart[existingItemIndex].updatedAt = new Date().toISOString();
        } else {
            // Add new item
            this.cart.push(processedItem);
        }
        
        this.saveCart();
        
        return { 
            success: true, 
            message: 'Item added to cart',
            item: processedItem,
            action: existingItemIndex > -1 ? 'updated' : 'added'
        };
    }

    /**
     * Validate cart item
     * @private
     * @param {any} item - Item to validate
     * @returns {boolean} Validation result
     */
    validateItem(item) {
        if (!item || typeof item !== 'object') {
            return false;
        }
        
        if (!item.id || typeof item.id !== 'string') {
            return false;
        }
        
        if (!item.name || typeof item.name !== 'string') {
            return false;
        }
        
        if (item.price === undefined || isNaN(parseFloat(item.price))) {
            return false;
        }
        
        return true;
    }

    /**
     * Process item before adding to cart
     * @private
     * @param {any} item - Item to process
     * @returns {CartItem} Processed cart item
     */
    processItem(item) {
        const now = new Date().toISOString();
        return {
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: Math.max(1, parseInt(item.quantity) || 1),
            image: item.image || '',
            addedAt: item.addedAt || now,
            updatedAt: now
        };
    }

    /**
     * Update cart count in the UI
     */
    updateCartCount() {
        const count = this.getTotalItems();
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
        return count;
    }

    /**
     * Get total number of items in cart
     * @returns {number} Total items count
     */
    getTotalItems() {
        return this.cart.reduce((total, item) => total + (item.quantity || 0), 0);
    }

    /**
     * Remove item from cart
     * @param {string} itemId - ID of the item to remove
     * @returns {{success: boolean, message: string}} Operation result
     */
    removeItem(itemId) {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.id !== itemId);
        
        if (this.cart.length < initialLength) {
            this.saveCart();
            return { success: true, message: 'Item removed from cart' };
        }
        
        return { success: false, message: 'Item not found in cart' };
    }

    /**
     * Update item quantity in cart
     * @param {string} itemId - ID of the item to update
     * @param {number} quantity - New quantity
     * @returns {{success: boolean, message: string}} Operation result
     */
    updateQuantity(itemId, quantity) {
        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return { success: false, message: 'Item not found in cart' };
        }
        
        const newQuantity = Math.max(1, parseInt(quantity) || 1);
        
        if (this.cart[itemIndex].quantity === newQuantity) {
            return { success: true, message: 'Quantity unchanged' };
        }
        
        this.cart[itemIndex].quantity = newQuantity;
        this.cart[itemIndex].updatedAt = new Date().toISOString();
        
        this.saveCart();
        
        return { 
            success: true, 
            message: 'Quantity updated',
            item: this.cart[itemIndex]
        };
    }

    /**
     * Clear the cart
     * @returns {{success: boolean, message: string}} Operation result
     */
    clearCart() {
        this.cart = [];
        this.saveCart();
        return { success: true, message: 'Cart cleared' };
    }

    /**
     * Get all items in cart
     * @returns {CartItem[]} Array of cart items
     */
    getItems() {
        return [...this.cart];
    }

    /**
     * Calculate cart subtotal
     * @returns {number} Subtotal amount
     */
    getSubtotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    /**
     * Show cart popup
     */
    showCartPopup() {
        const popup = document.getElementById('cart-popup');
        if (popup) {
            popup.style.display = 'block';
            this.renderCartPopup();
            
            // Close popup when clicking outside
            const overlay = popup.querySelector('.cart-popup-overlay');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        popup.style.display = 'none';
                    }
                });
            }
            
            // Close button
            const closeBtn = popup.querySelector('.close-cart-popup');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    popup.style.display = 'none';
                };
            }
        } else {
            // Fallback to cart page if popup doesn't exist
            window.location.href = 'cart.html';
        }
    }
    
    /**
     * Render cart popup content
     */
    renderCartPopup() {
        const popupContent = document.getElementById('cart-popup-content');
        if (!popupContent) return;

        if (this.cart.length === 0) {
            popupContent.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                    <a href="products.html" class="btn">Continue Shopping</a>
                </div>
            `;
            return;
        }

        const itemsHtml = this.cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image || 'img/placeholder.jpg'}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <div class="item-price">₱${item.price.toFixed(2)}</div>
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="cart.updateQuantity('${item.id}', this.value)">
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="cart.removeItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        popupContent.innerHTML = `
            <div class="cart-popup-header">
                <h3>Your Cart (${this.getTotalItems()} items)</h3>
                <button class="close-cart-popup">&times;</button>
            </div>
            <div class="cart-items">
                ${itemsHtml}
            </div>
            <div class="cart-summary">
                <div class="subtotal">
                    <span>Subtotal:</span>
                    <span>₱${this.getSubtotal().toFixed(2)}</span>
                </div>
                <div class="cart-actions">
                    <a href="cart.html" class="btn btn-view-cart">View Cart</a>
                    <a href="checkout.html" class="btn btn-checkout">Checkout</a>
                </div>
            </div>
        `;
    }
    
    /**
     * Show notification
     * @param {string} type - Type of notification (success, error, info)
     * @param {string} message - Message to display
     */
    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="close-notification">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto-remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Close button
        const closeBtn = notification.querySelector('.close-notification');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            });
        }
    }
}

// Initialize cart when DOM is loaded
const cart = new SweetTreatsCart();

// Export for use in other modules
window.SweetTreatsCart = cart;

// For backward compatibility
window.addToCart = function(item) { return cart.addItem(item); };
window.updateCartCount = function() { return cart.updateCartCount(); };
window.getCart = function() { return cart.getItems(); };
window.clearCart = function() { return cart.clearCart(); };

// Add event listener for cart updates to update the UI
document.addEventListener('cartUpdated', (e) => {
    const { count, cart: updatedCart } = e.detail;
    
    // Update cart count in the UI
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = count;
    }
    
    // If we're on the cart page, update the cart items
    const cartContent = document.getElementById('cart-content');
    if (cartContent) {
        if (updatedCart.length === 0) {
            cartContent.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                    <a href="products.html" class="btn">Continue Shopping</a>
                </div>
            `;
        } else {
            // Render cart items
            const itemsHtml = updatedCart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image || 'img/placeholder.jpg'}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <div class="item-price">₱${item.price.toFixed(2)}</div>
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <input type="number" value="${item.quantity}" min="1" onchange="cart.updateQuantity('${item.id}', this.value)">
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="cart.removeItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
            
            cartContent.innerHTML = `
                <div class="cart-items">
                    ${itemsHtml}
                </div>
                <div class="cart-summary">
                    <div class="subtotal">
                        <span>Subtotal:</span>
                        <span>₱${cart.getSubtotal().toFixed(2)}</span>
                    </div>
                    <button class="checkout-btn" onclick="window.location.href='checkout.html'">
                        Proceed to Checkout
                    </button>
                </div>
            `;
        }
    }
});

// Initialize the cart when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => cart.initialize());
} else {
    cart.initialize();
}
