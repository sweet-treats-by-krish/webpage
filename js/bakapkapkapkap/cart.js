// Initialize cart from localStorage or create empty array
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Function to update cart count in navigation
function updateCartCount() {
    try {
        // Reload cart from localStorage to ensure we have the latest data
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Calculate total items (sum of quantities)
        const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
        
        // Update or create cart link in navigation
        let cartLink = document.querySelector('.cart-link');
        let cartIcon = '';
        
        // Check if Font Awesome is available
        if (typeof FontAwesome !== 'undefined' || document.querySelector('link[href*="font-awesome"]')) {
            cartIcon = '<i class="fas fa-shopping-cart"></i> ';
        }
        
        if (!cartLink) {
            const nav = document.querySelector('nav ul');
            if (nav) {
                const li = document.createElement('li');
                cartLink = document.createElement('a');
                cartLink.href = 'cart.html';
                cartLink.className = 'cart-link';
                cartLink.innerHTML = `${cartIcon}Cart <span class="cart-count">${totalItems}</span>`;
                li.appendChild(cartLink);
                nav.appendChild(li);
            }
        } else {
            const countElement = cartLink.querySelector('.cart-count') || document.createElement('span');
            countElement.className = 'cart-count';
            countElement.textContent = totalItems;
            
            if (!cartLink.querySelector('.cart-count')) {
                // If count element doesn't exist, update the entire link
                cartLink.innerHTML = `${cartIcon}Cart <span class="cart-count">${totalItems}</span>`;
            }
        }
        
        // Dispatch event when cart is updated
        document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalItems } }));
        
        return totalItems;
    } catch (error) {
        console.error('Error updating cart count:', error);
        return 0;
    }
}

// Function to add item to cart
function addToCart(item) {
    try {
        // Check if item is valid
        if (!item || typeof item !== 'object') {
            console.error('Invalid item:', item);
            showErrorNotification('Invalid product information');
            return { success: false, message: 'Invalid item' };
        }
        
        // Validate required fields
        if (!item.name || typeof item.name !== 'string') {
            console.error('Missing product name:', item);
            showErrorNotification('Product name is required');
            return { success: false, message: 'Missing product name' };
        }
        
        if (item.price === undefined || isNaN(parseFloat(item.price))) {
            console.error('Invalid price:', item);
            showErrorNotification('Invalid product price');
            return { success: false, message: 'Invalid price' };
        }
        
        // Ensure cart is up to date from localStorage
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Generate a unique ID if not provided
        if (!item.id) {
            // Create a slug from the name for a more readable ID
            const slug = item.name.toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-')      // Replace spaces with -
                .replace(/-+/g, '-');       // Replace multiple - with single -
            item.id = slug + '-' + Math.random().toString(36).substr(2, 6);
        }
        
        // Set default quantity if not provided
        item.quantity = parseInt(item.quantity) || 1;
        
        // Extract numeric price from string if needed (e.g., "₱200" -> 200)
        if (typeof item.price === 'string') {
            item.price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
        }
        
        // Ensure price is a valid number
        
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
        let result = {};
        
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            const currentQuantity = parseInt(cart[existingItemIndex].quantity) || 0;
            const newQuantity = currentQuantity + (parseInt(item.quantity) || 1);
            cart[existingItemIndex].quantity = newQuantity > 0 ? newQuantity : 1;
            cart[existingItemIndex].updatedAt = new Date().toISOString();
            
            // Show update notification
            showSuccessNotification(
                'Item Updated', 
                `${cart[existingItemIndex].name} quantity updated to ${cart[existingItemIndex].quantity}`,
                cart[existingItemIndex]
            );
            
            result = { 
                success: true, 
                action: 'updated',
                item: cart[existingItemIndex],
                cart: cart
            };
        } else {
            // Add new item to cart
            item.quantity = parseInt(item.quantity) || 1;
            item.addedAt = new Date().toISOString();
            item.updatedAt = new Date().toISOString();
            cart.push(item);
            
            // Show add notification
            showSuccessNotification(
                'Added to Cart', 
                `${item.quantity}x ${item.name} added to your cart`,
                item
            );
            
            result = { 
                success: true, 
                action: 'added',
                item: item,
                cart: cart
            };
        }

        // Save back to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count in navigation
        updateCartCount();
        
        // Dispatch event that cart was updated
        document.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { 
                ...result,
                cart: cart
            } 
        }));
        
        return result;
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showErrorNotification('An error occurred while adding the item to your cart. Please try again.');
        return { success: false, message: error.message };
    }
}

// Function to remove item from cart
function removeFromCart(itemId, skipConfirmation = false) {
    try {
        // If confirmation is needed and not skipped, show confirmation dialog
        if (!skipConfirmation && !confirm('Are you sure you want to remove this item from your cart?')) {
            return { success: false, message: 'Removal cancelled' };
        }
        
        // Get the item before removing it
        const itemToRemove = cart.find(item => item.id === itemId);
        if (!itemToRemove) {
            return { success: false, message: 'Item not found in cart' };
        }
        
        // Remove the item from the cart
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        // If we're on the cart page, update the UI
        if (document.getElementById('cart-content')) {
            // Find and remove the item element with animation
            const itemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
            if (itemElement) {
                itemElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                itemElement.style.opacity = '0';
                itemElement.style.transform = 'translateX(-20px)';
                
                // Remove after animation completes
                setTimeout(() => {
                    itemElement.remove();
                    
                    // If cart is now empty, show empty cart message
                    if (cart.length === 0) {
                        renderCartItems();
                    } else {
                        // Update the cart summary
                        updateCartSummary(cart);
                    }
                }, 300);
            }
        }
        
        // Show a notification with undo option
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
            <span>Removed ${itemToRemove.name} from cart</span>
            <button class="undo-btn" style="margin-left: 15px; padding: 2px 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 3px; background: transparent; color: white; cursor: pointer;">Undo</button>
        `;
        
        document.body.appendChild(notification);
        
        // Add click handler for undo button
        const undoBtn = notification.querySelector('.undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                // Add the item back to the cart
                cart.push(itemToRemove);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                
                // Re-render the cart items if on cart page
                if (document.getElementById('cart-content')) {
                    renderCartItems();
                }
                
                // Remove the notification
                notification.remove();
            });
        }
        
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
                action: 'remove',
                item: itemToRemove,
                cart: cart
            } 
        }));
        
        return { success: true, item: itemToRemove, cart };
    } catch (error) {
        console.error('Error removing item from cart:', error);
        return { success: false, error: 'Failed to remove item from cart' };
    }
}

// Function to update the cart summary (subtotal, shipping, total)
function updateCartSummary(cart) {
    try {
        // Calculate subtotal
        const subtotal = cart.reduce((sum, item) => {
            const price = typeof item.price === 'string' ? 
                parseFloat(item.price.replace(/[^0-9.-]+/g, '')) : 
                parseFloat(item.price);
            const quantity = parseInt(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
        
        // Flat rate shipping (could be made dynamic based on subtotal or location)
        const shipping = subtotal > 0 ? 100 : 0;
        const total = subtotal + shipping;
        
        // Update the summary elements if they exist
        const subtotalElement = document.querySelector('.summary-row:first-child span:last-child');
        const shippingElement = document.querySelector('.summary-row:nth-child(2) span:last-child');
        const totalElement = document.querySelector('.summary-row.total span:last-child');
        
        if (subtotalElement) subtotalElement.textContent = `₱${subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = shipping > 0 ? `₱${shipping.toFixed(2)}` : 'Free';
        if (totalElement) totalElement.textContent = `₱${total.toFixed(2)}`;
        
        // Also update the cart total in the header if it exists
        const cartTotalElement = document.getElementById('cart-total');
        if (cartTotalElement) cartTotalElement.textContent = `₱${total.toFixed(2)}`;
        
        return { subtotal, shipping, total };
    } catch (error) {
        console.error('Error updating cart summary:', error);
        return { subtotal: 0, shipping: 0, total: 0 };
    }
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