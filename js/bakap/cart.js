/**
 * Sweet Treats Cart Module
 * A modern, modular cart system for Sweet Treats by Krish
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id - Unique identifier for the cart item
 * @property {string} name - Product name
 * @property {number} price - Product price
 * @property {number} quantity - Item quantity
 * @property {string} [image] - Product image URL
 * @property {string} [category] - Product category
 * @property {string} [description] - Product description
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
            return JSON.parse(localStorage.getItem('cart')) || [];
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
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateCartCount();
            document.dispatchEvent(new CustomEvent('cartUpdated', { 
                detail: { 
                    cart: [...this.cart],
                    count: this.getTotalItems() 
                } 
            }));
            return true;
        } catch (error) {
            console.error('Error saving cart:', error);
            return false;
        }
    }

    /**
     * Initialize the cart
     */
    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
        this.updateCartCount();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Cart link click handler
        document.addEventListener('click', (e) => {
            const cartLink = e.target.closest('.cart-link');
            if (cartLink) {
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
        try {
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
            } else {
                // Add new item
                this.cart.push(processedItem);
            }
            
            this.saveCart();
            return { 
                success: true, 
                message: `${processedItem.name} added to cart`, 
                item: processedItem 
            };
            
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return { success: false, message: 'Failed to add item to cart' };
        }
    }

    /**
     * Validate cart item
     * @private
     * @param {any} item - Item to validate
     * @returns {boolean} Validation result
     */
    validateItem(item) {
        if (!item || typeof item !== 'object') {
            console.error('Invalid item:', item);
            return false;
        }

        if (!item.name || typeof item.name !== 'string') {
            console.error('Missing product name:', item);
            return false;
        }

        if (item.price === undefined || isNaN(parseFloat(item.price))) {
            console.error('Invalid price:', item);
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
        // Create a copy of the item to avoid modifying the original
        const processedItem = { ...item };
        
        // Generate ID if not provided
        if (!processedItem.id) {
            const slug = processedItem.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            processedItem.id = `${slug}-${Math.random().toString(36).substr(2, 6)}`;
        }
        
        // Process quantity
        processedItem.quantity = parseInt(processedItem.quantity) || 1;
        
        // Process price
        if (typeof processedItem.price === 'string') {
            processedItem.price = parseFloat(processedItem.price.replace(/[^0-9.-]+/g, ''));
        } else {
            processedItem.price = parseFloat(processedItem.price);
        }
        
        return processedItem;
    }

    /**
     * Update cart count in the UI
     */
    updateCartCount() {
        const totalItems = this.getTotalItems();
        let cartLink = document.querySelector('.cart-link');
        
        if (!cartLink) {
            const nav = document.querySelector('nav ul');
            if (!nav) return;
            
            const li = document.createElement('li');
            cartLink = document.createElement('a');
            cartLink.href = 'cart.html';
            cartLink.className = 'cart-link';
            li.appendChild(cartLink);
            nav.appendChild(li);
        }
        
        // Check if Font Awesome is available
        const cartIcon = (typeof FontAwesome !== 'undefined' || document.querySelector('link[href*="font-awesome"]')) 
            ? '<i class="fas fa-shopping-cart"></i> ' 
            : '';
            
        const countElement = cartLink.querySelector('.cart-count') || document.createElement('span');
        countElement.className = 'cart-count';
        countElement.textContent = totalItems;
        
        if (!cartLink.querySelector('.cart-count')) {
            cartLink.innerHTML = `${cartIcon}Cart <span class="cart-count">${totalItems}</span>`;
        }
    }
    
    /**
     * Get total number of items in cart
     * @returns {number} Total items count
     */
    getTotalItems() {
        return this.cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    }
    
    /**
     * Remove item from cart
     * @param {string} itemId - ID of the item to remove
     * @returns {{success: boolean, message: string}} Operation result
     */
    removeItem(itemId) {
        try {
            const initialLength = this.cart.length;
            this.cart = this.cart.filter(item => item.id !== itemId);
            
            if (this.cart.length < initialLength) {
                this.saveCart();
                return { success: true, message: 'Item removed from cart' };
            }
            return { success: false, message: 'Item not found in cart' };
        } catch (error) {
            console.error('Error removing item:', error);
            return { success: false, message: 'Failed to remove item' };
        }
    }
    
    /**
     * Update item quantity in cart
     * @param {string} itemId - ID of the item to update
     * @param {number} quantity - New quantity
     * @returns {{success: boolean, message: string}} Operation result
     */
    updateQuantity(itemId, quantity) {
        try {
            const newQuantity = Math.max(1, parseInt(quantity) || 1);
            const item = this.cart.find(item => item.id === itemId);
            
            if (item) {
                item.quantity = newQuantity;
                this.saveCart();
                return { success: true, message: 'Quantity updated' };
            }
            return { success: false, message: 'Item not found in cart' };
        } catch (error) {
            console.error('Error updating quantity:', error);
            return { success: false, message: 'Failed to update quantity' };
        }
    }
    
    /**
     * Clear the cart
     * @returns {{success: boolean, message: string}} Operation result
     */
    clearCart() {
        try {
            this.cart = [];
            this.saveCart();
            return { success: true, message: 'Cart cleared' };
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, message: 'Failed to clear cart' };
        }
    }
    
    /**
     * Get all items in cart
     * @returns {Array} Array of cart items
     */
    getItems() {
        return [...this.cart];
    }
    
    /**
     * Calculate cart subtotal
     * @returns {number} Subtotal amount
     */
    getSubtotal() {
        return this.cart.reduce((sum, item) => {
            return sum + (item.price * (item.quantity || 1));
        }, 0);
    }
    
    /**
     * Show cart popup
     */
    showCartPopup(e) {
        if (e) {
            e.preventDefault();
        }
        
        const popup = document.getElementById('cart-popup');
        const overlay = document.querySelector('.cart-popup-overlay');
        
        if (popup && overlay) {
            popup.style.display = 'block';
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
            this.renderCartPopup();
            
            // Close popup when clicking outside
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    popup.style.display = 'none';
                    overlay.style.display = 'none';
                    document.body.style.overflow = '';
                }
            };
            
            // Close button
            const closeBtn = popup.querySelector('.close-cart-popup');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    popup.style.display = 'none';
                    overlay.style.display = 'none';
                    document.body.style.overflow = '';
                };
            }
        } else {
            // Fallback to cart page if popup elements don't exist
            window.location.href = 'cart.html';
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

// Add click event listener for cart links
document.addEventListener('click', (e) => {
    const cartLink = e.target.closest('.cart-link');
    if (cartLink) {
        e.preventDefault();
        cart.showCartPopup(e);
    }
});

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

function updateCartItemQuantity(itemId, quantity) {
    try {
        // Ensure quantity is a valid number
        const newQuantity = Math.max(1, parseInt(quantity) || 1);
        
        // Find the item in the cart
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return { success: false, message: 'Item not found in cart' };
        }
        
        // Update quantity
        cart[itemIndex].quantity = newQuantity;
        
        // Update the last modified timestamp
        cart[itemIndex].updatedAt = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count in UI
        updateCartCount();
        
        // Update the specific quantity input in case it was changed programmatically
        const quantityInput = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
        if (quantityInput && parseInt(quantityInput.value) !== newQuantity) {
            quantityInput.value = newQuantity;
        }
        
        // Update the item total in the UI
        const itemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
        if (itemElement) {
            const priceElement = itemElement.querySelector('.cart-item-price');
            const totalElement = itemElement.querySelector('.cart-item-total');
            if (priceElement && totalElement) {
                const priceText = priceElement.textContent.replace(/[^0-9.-]+/g, '');
                const price = parseFloat(priceText) || 0;
                const total = price * newQuantity;
                totalElement.textContent = `₱${total.toFixed(2)}`;
            }
        }
        
        // Update the cart summary
        updateCartSummary(cart);
        
        // Trigger cart updated event
        document.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { 
                action: 'update',
                item: cart[itemIndex],
                cart: cart
            } 
        }));
        
        return { success: true, cart, item: cart[itemIndex] };
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        return { success: false, message: 'Error updating quantity', error };
    }
}

// Function to get cart items
function getCart() {
    try {
        return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
        console.error('Error getting cart:', error);
        return [];
    }
}

// Function to clear cart
function clearCart(skipConfirmation = false) {
    try {
        // If confirmation is needed and not skipped, show confirmation dialog
        if (!skipConfirmation && !confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
            return { success: false, message: 'Clear cart cancelled' };
        }
        
        // Get the current cart for the event
        const previousCart = [...cart];
        
        // Clear the cart
        localStorage.removeItem('cart');
        cart = [];
        
        // Update cart count in UI
        updateCartCount();
        
        // If we're on the cart page, update the UI
        if (document.getElementById('cart-content')) {
            // Fade out all cart items
            const cartItems = document.querySelectorAll('.cart-item');
            cartItems.forEach((item, index) => {
                item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                
                // Remove after animation completes
                setTimeout(() => {
                    item.remove();
                }, 300 + (index * 50)); // Stagger the animations
            });
            
            // Show empty cart message after animations complete
            setTimeout(() => {
                renderCartItems();
            }, 300 + (cartItems.length * 50));
        }
        
        // Show a notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Your cart has been cleared</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove the notification after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // Trigger cart updated event
        document.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { 
                action: 'clear',
                previousCart: previousCart,
                cart: []
            } 
        }));
        
        return { success: true, previousCart };
    } catch (error) {
        console.error('Error clearing cart:', error);
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to clear cart. Please try again.</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove the notification after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        return { success: false, message: 'Error clearing cart', error };
    }
}

// Function to render cart items in the cart page
function renderCartItems() {
    try {
        const cartContent = document.getElementById('cart-content');
        if (!cartContent) return;

        // Show loading state
        cartContent.innerHTML = `
            <div class="loading-cart">
                <div class="spinner"></div>
                <p>Loading your cart...</p>
            </div>
        `;

        // Small delay to show loading state (UX improvement)
        setTimeout(() => {
            // Get current cart
            const cartItems = getCart();
            
            // Clear existing content
            cartContent.innerHTML = '';
            
            // Check if cart is empty
            if (cartItems.length === 0) {
                cartContent.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Your cart is empty</h3>
                        <p>Looks like you haven't added anything to your cart yet.</p>
                        <a href="products.html" class="btn">
                            <i class="fas fa-arrow-left"></i> Continue Shopping
                        </a>
                    </div>`;
                return;
            }
            
            // Create cart items list
            const cartItemsList = document.createElement('div');
            cartItemsList.className = 'cart-items';
            
            // Sort items by most recently added/updated
            const sortedCart = [...cartItems].sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.addedAt || 0);
                const dateB = new Date(b.updatedAt || b.addedAt || 0);
                return dateB - dateA; // Newest first
            });
            
            // Add each item to the cart
            sortedCart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.dataset.id = item.id;
                
                // Calculate item total
                const price = typeof item.price === 'string' ? 
                    parseFloat(item.price.replace(/[^0-9.-]+/g, '')) : 
                    parseFloat(item.price);
                const quantity = parseInt(item.quantity) || 1;
                const total = price * quantity;
                
                // Format the price and total
                const formattedPrice = price.toLocaleString('en-PH', { 
                    style: 'currency', 
                    currency: 'PHP',
                    minimumFractionDigits: 2
                }).replace('₱', '₱');
                
                const formattedTotal = total.toLocaleString('en-PH', { 
                    style: 'currency', 
                    currency: 'PHP',
                    minimumFractionDigits: 2
                }).replace('₱', '₱');
                
                itemElement.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}" onerror="this.onerror=null; this.src='images/placeholder.jpg';">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                        <p class="cart-item-price">${formattedPrice} <span class="each-text">each</span></p>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input 
                                type="number" 
                                class="quantity-input" 
                                value="${quantity}" 
                                min="1" 
                                data-id="${item.id}"
                                aria-label="Quantity"
                            >
                            <button class="quantity-btn" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="cart-item-total">
                        <p class="total-amount">${formattedTotal}</p>
                        <button class="remove-item" data-id="${item.id}" title="Remove item" aria-label="Remove item">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                
                cartItemsList.appendChild(itemElement);
            });
            
            // Create cart summary
            const cartSummary = document.createElement('div');
            cartSummary.className = 'cart-summary';
            cartSummary.innerHTML = `
                <h3>Order Summary</h3>
                <div class="summary-row">
                    <span>Subtotal (${cartItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0)} items)</span>
                    <span id="cart-subtotal">₱0.00</span>
                </div>
                <div class="summary-row">
                    <span>Shipping</span>
                    <span id="cart-shipping">Calculated at checkout</span>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span id="cart-total">₱0.00</span>
                </div>
                <div class="checkout-actions">
                    <a href="products.html" class="btn btn-outline">
                        <i class="fas fa-arrow-left"></i> Continue Shopping
                    </a>
                    <button id="checkout-btn" class="btn">
                        Proceed to Checkout <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="secure-checkout">
                    <i class="fas fa-lock"></i>
                    <span>Secure Checkout</span>
                </div>
            `;
            
            // Add items and summary to cart content
            cartContent.appendChild(cartItemsList);
            cartContent.appendChild(cartSummary);
            
            // Add event listeners
            addCartEventListeners();
            
            // Update the cart summary with correct values
            updateCartSummary(cartItems);
            
            // Add event listener for checkout button
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', () => {
                    // Check if user is logged in
                    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
                    if (currentUser) {
                        window.location.href = 'checkout.html';
                    } else {
                        // Redirect to login with return URL
                        window.location.href = 'login.html?redirect=checkout.html';
                    }
                });
            }
            
            // Dispatch event that cart has been rendered
            document.dispatchEvent(new CustomEvent('cartRendered', { 
                detail: { cart: cartItems } 
            }));
            
        }, 300); // End of setTimeout for loading state
        
    } catch (error) {
        console.error('Error rendering cart items:', error);
        const cartContent = document.getElementById('cart-content');
        if (cartContent) {
            cartContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Something went wrong</h3>
                    <p>We couldn't load your cart. Please try again later.</p>
                    <button class="btn" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Function to update cart summary
function updateCartSummary(cart) {
    try {
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartShipping = document.getElementById('cart-shipping');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartSubtotal || !cartShipping || !cartTotal) return;
        
        let subtotal = 0;
        let shipping = 100; // Flat rate shipping
        
        // Calculate subtotal
        cart.forEach(item => {
            const price = typeof item.price === 'string' ? 
                parseFloat(item.price.replace(/[^0-9.-]+/g, '')) : 
                parseFloat(item.price);
            const quantity = parseInt(item.quantity) || 1;
            subtotal += price * quantity;
        });
        
        // Update cart summary
        cartSubtotal.textContent = `₱${subtotal.toFixed(2)}`;
        cartShipping.textContent = shipping === 0 ? 'Free' : `₱${shipping.toFixed(2)}`;
        cartTotal.textContent = `₱${(subtotal + shipping).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error updating cart summary:', error);
        console.error('Error rendering cart items:', error);
        const cartContent = document.getElementById('cart-content');
        if (cartContent) {
            cartContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading your cart. Please try again.</p>
                    <button class="btn" onclick="location.reload()">Retry</button>
                </div>`;
        }
    }
}

function removeFromCart(itemId, skipConfirmation = false) {
    try {
        if (!skipConfirmation && !confirm('Are you sure you want to remove this item?')) {
            return { success: false, message: 'Removal cancelled' };
        }
        
        const cart = getCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return { success: false, message: 'Item not found in cart' };
        }
        
        const removedItem = cart.splice(itemIndex, 1)[0];
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update UI
        updateCartCount();
        
        // If on cart page, re-render
        if (window.location.pathname.includes('cart.html')) {
            renderCartItems();
        }
        
        return { 
            success: true, 
            message: 'Item removed from cart',
            item: removedItem 
        };
    } catch (error) {
        console.error('Error removing item:', error);
        return { success: false, message: 'Error removing item' };
    }
}

// Add event listeners for cart interactions
function addCartEventListeners() {
    // Use event delegation for better performance with dynamic content
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.quantity-btn, .remove-item');
        if (!target) return;
        
        e.preventDefault();
        
        // Handle quantity buttons
        if (target.classList.contains('quantity-btn')) {
            const action = target.dataset.action;
            const itemId = target.dataset.id;
            const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
            
            if (input) {
                let quantity = parseInt(input.value) || 1;
                
                if (action === 'increase') {
                    quantity++;
                } else if (action === 'decrease' && quantity > 1) {
                    quantity--;
                } else if (action === 'decrease' && quantity === 1) {
                    // If decreasing from 1, confirm removal
                    if (confirm('Remove this item from your cart?')) {
                        removeFromCart(itemId, true);
                        return;
                    } else {
                        return; // Don't proceed if user cancels
                    }
                }
                
                // Update the input value and trigger change event
                input.value = quantity;
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        } 
        // Handle remove item buttons
        else if (target.classList.contains('remove-item')) {
            const itemId = target.dataset.id;
            removeFromCart(itemId);
        }
    });
    
    // Handle direct input changes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const input = e.target;
            const itemId = input.dataset.id;
            let quantity = parseInt(input.value) || 1;
            
            // Ensure quantity is at least 1
            if (quantity < 1) {
                quantity = 1;
                input.value = 1;
            }
            
            // Add a small delay to handle rapid changes
            clearTimeout(input._timer);
            input._timer = setTimeout(() => {
                updateCartItemQuantity(itemId, quantity);
            }, 300);
        }
    });
    
    // Handle keyboard events for quantity inputs
    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('quantity-input') && (e.key === 'Enter' || e.key === 'Escape')) {
            e.preventDefault();
            e.target.blur(); // Remove focus on Enter or Escape
        }
    });
    
    // Handle touch events for mobile devices
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        const item = e.target.closest('.cart-item');
        if (item) {
            touchStartX = e.changedTouches[0].screenX;
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        const item = e.target.closest('.cart-item');
        if (item) {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            
            // Swipe right to delete (threshold of 50px)
            if (diff > 50) {
                const itemId = item.dataset.id;
                removeFromCart(itemId);
            }
        }
    }, { passive: true });
}

// Function to initialize the cart
function initializeCart() {
    try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                cart = JSON.parse(savedCart);
                // Validate cart structure
                if (!Array.isArray(cart)) {
                    console.warn('Invalid cart data in localStorage, resetting to empty cart');
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                }
            } catch (e) {
                console.error('Error parsing cart from localStorage:', e);
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
            }
        } else {
            // Initialize empty cart if it doesn't exist
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        
        // Update cart count in the UI
        updateCartCount();
        
        // If we're on the cart page, render the cart items
        if (window.location.pathname.includes('cart.html')) {
            renderCartItems();
        }
        
        // Listen for addToCart events from other scripts
        document.addEventListener('addToCart', function(e) {
            if (e.detail && e.detail.item) {
                const result = addToCart(e.detail.item);
                if (result.success) {
                    // Show notification if we're not on the cart page
                    if (!window.location.pathname.includes('cart.html')) {
                        showCartNotification(result.item);
                    }
                }
            }
        });
        
        // Listen for cart updates from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart') {
                try {
                    const newCart = JSON.parse(e.newValue || '[]');
                    if (Array.isArray(newCart)) {
                        cart = newCart;
                        updateCartCount();
                        if (window.location.pathname.includes('cart.html')) {
                            renderCartItems();
                        }
                    }
                } catch (error) {
                    console.error('Error processing storage event:', error);
                }
            }
        });
        
        // Dispatch event that cart is ready
        document.dispatchEvent(new CustomEvent('cartReady', { 
            detail: { cart } 
        }));
        
    } catch (error) {
        console.error('Error initializing cart:', error);
        
        // Show error to user if we're on the cart page
        if (window.location.pathname.includes('cart.html')) {
            const cartContent = document.getElementById('cart-content');
            if (cartContent) {
                cartContent.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Something went wrong</h3>
                        <p>We couldn't load your cart. Please try refreshing the page.</p>
                        <button class="btn" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt"></i> Refresh Page
                        </button>
                    </div>
                `;
            }
        }
    }
});
	setupCartPopupEvents();
}

// Initialize cart when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
} else {
    initializeCart();
}

function setupCartPopupEvents() {
    const cartLink = document.querySelector('.cart-link');
    if (cartLink) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            renderCartPopup();
            const popup = document.getElementById('cartPopup');
            if (popup) {
                popup.style.display = 'flex';
            }
        });
    }
    
    const closeBtn = document.getElementById('closeCartPopup');
    if (closeBtn) {
        closeBtn.onclick = function() {
            const popup = document.getElementById('cartPopup');
            if (popup) {
                popup.style.display = 'none';
            }
        };
    }
    
    const checkoutBtn = document.getElementById('popupCheckoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = function() {
            const notes = document.getElementById('cartNotes')?.value || '';
            // Check if user is logged in (simplified for now)
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
            
            if (!currentUser) {
                alert('Please log in to checkout.');
                window.location.href = 'login.html?redirect=checkout.html';
                return;
            }
            
            // Process checkout
            const result = CartService.checkout(currentUser.id, { notes });
            if (result.success) {
                alert('Order placed successfully!');
                document.getElementById('cartPopup').style.display = 'none';
            } else {
                alert(result.message);
            }
        };
    }
}

// Function to show success notification
function showSuccessNotification(title, message, item) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification success';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 90%;
        width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    // Add notification content
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-check-circle"></i>
                <strong>${title}</strong>
            </div>
            <button class="close-notification" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; opacity: 0.7;">&times;</button>
        </div>
        <div>${message}</div>
        ${item ? `
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : ''}
            <div>
                <div style="font-weight: 500;">${item.name}</div>
                <div>${(parseFloat(item.price) * (item.quantity || 1)).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
            </div>
        </div>` : ''}
        <button class="view-cart-btn" style="margin-top: 10px; width: 100%; background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: 500;">
            View Cart & Checkout
        </button>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Add close button event
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideNotification(notification);
        });
    }

    // Add click event to view cart button
    const viewCartBtn = notification.querySelector('.view-cart-btn');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
            hideNotification(notification);
        });
    }

    // Auto-hide notification after 5 seconds
    const timeoutId = setTimeout(() => {
        hideNotification(notification);
    }, 5000);

    // Pause auto-hide on hover
    notification.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
    });

    // Resume auto-hide when mouse leaves
    notification.addEventListener('mouseleave', () => {
        setTimeout(() => {
            hideNotification(notification);
        }, 2000);
    });

    return notification;
}

// Function to show error notification
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification error';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f44336;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 90%;
        width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <div>${message}</div>
        <button class="close-notification" style="margin-left: auto; background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.7;">&times;</button>
    `;

    document.body.appendChild(notification);

    // Add close button event
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideNotification(notification);
        });
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
}

// Helper function to hide notification with animation
function hideNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.style.animation = 'fadeOut 0.3s ease-in';
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 300);
}

// Function to show cart notification (legacy, for backward compatibility)
function showCartNotification(item) {
    return showSuccessNotification('Added to Cart', `Added ${item.quantity || 1}x ${item.name} to cart!`, item);
}

// Add styles for the notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions for use in other scripts
window.CartService = {
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getCart,
    clearCart,
    updateCartCount,
    updateQuantity: updateCartItemQuantity,  // Alias for existing function
    removeItem: removeFromCart,              // Alias for existing function
    checkout: function(userId, options = {}) {
        try {
            const cart = getCart();
            if (cart.length === 0) {
                return { success: false, message: 'Your cart is empty' };
            }
			
            clearCart(true);  // Skip confirmation
            
            return { 
                success: true, 
                message: 'Order placed successfully!',
                orderData: {
                    userId,
                    items: cart,
                    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    notes: options.notes || '',
                    date: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error during checkout:', error);
            return { success: false, message: 'An error occurred during checkout' };
        }
    }
};

// Show cart popup when cart icon is clicked
document.querySelector('.cart-link').addEventListener('click', function(e) {
  e.preventDefault();
  renderCartPopup();
  document.getElementById('cartPopup').style.display = 'flex';
});

// Close popup
document.getElementById('closeCartPopup').onclick = function() {
  document.getElementById('cartPopup').style.display = 'none';
};

// Render cart items in popup
function renderCartPopup() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartList = document.getElementById('popupCartItems');
  const cartTotal = document.getElementById('popupCartTotal');
  cartList.innerHTML = '';

  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <span>${item.name}</span>
        <input type="number" min="1" value="${item.quantity}" data-id="${item.id}" class="popup-qty" style="width:40px; margin:0 8px;">
        <span>₱${(item.price * item.quantity).toFixed(2)}</span>
        <button class="remove-item" data-id="${item.id}">Remove</button>
      </div>
    `;
    cartList.appendChild(li);
  });
  cartTotal.textContent = total.toFixed(2);

  // Quantity change event
  cartList.querySelectorAll('.popup-qty').forEach(input => {
    input.onchange = function() {
      CartService.updateQuantity(this.dataset.id, parseInt(this.value));
      renderCartPopup();
    };
  });

  // Remove item event
  cartList.querySelectorAll('.remove-item').forEach(btn => {
    btn.onclick = function() {
      CartService.removeItem(this.dataset.id);
      renderCartPopup();
    };
  });
}

// Checkout button handler
document.getElementById('popupCheckoutBtn').onclick = function() {
  const notes = document.getElementById('cartNotes').value;
  const user = UserService.getCurrentUser();
  if (!user) {
    alert('Please log in to checkout.');
    return;
  }
  // Add notes to paymentInfo or order
  const result = CartService.checkout(user.id, { notes });
  if (result.success) {
    alert('Order placed successfully!');
    document.getElementById('cartPopup').style.display = 'none';
  } else {
    alert(result.message);
  }
};

window.UserService = {
    getCurrentUser: function() {
        return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    },
    login: function(username, password) {
        // In a real app, this would validate with your backend
        // For demo purposes, we'll accept any login
        const user = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            username: username,
            name: username
        };
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
    },
    logout: function() {
        sessionStorage.removeItem('currentUser');
        return { success: true };
    }
};