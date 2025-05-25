class SweetTreatsCart {
    constructor() {
        this.cart = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.loadCart();
        
        this.initializeEventListeners();
        
        this.updateCartDisplay();
        
        this.isInitialized = true;
        console.log('Sweet Treats Cart initialized');
    }

    loadCart() {
        const savedCart = localStorage.getItem('sweetTreatsCart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        } else {
            this.cart = [];
        }
    }

    saveCart() {
        localStorage.setItem('sweetTreatsCart', JSON.stringify(this.cart));
        window.cartData = this.cart;
    }

    addItem(nameOrProduct, price = null, quantity = 1, image = null) {
        try {
            let product;
            
            if (typeof nameOrProduct === 'object' && nameOrProduct !== null) {
                product = nameOrProduct;
            } else {
                product = {
                    name: nameOrProduct,
                    price: price,
                    quantity: quantity,
                    image: image
                };
            }

            if (!product || !product.name || product.price === null || product.price === undefined) {
                return { success: false, message: 'Invalid product data - name and price are required' };
            }

            const qty = parseInt(product.quantity) || 1;
            const productPrice = parseFloat(product.price);

            if (isNaN(productPrice) || productPrice < 0) {
                return { success: false, message: 'Invalid price value' };
            }

            if (qty < 1) {
                return { success: false, message: 'Quantity must be at least 1' };
            }

            const existingItemIndex = this.cart.findIndex(item => 
                item.name === product.name && item.price === productPrice
            );

            if (existingItemIndex > -1) {
                this.cart[existingItemIndex].quantity += qty;
            } else {
                const cartItem = {
                    id: Date.now() + Math.random(),
                    name: product.name,
                    price: productPrice,
                    quantity: qty,
                    image: product.image || image || 'img/default-product.png'
                };
                this.cart.push(cartItem);
            }

            this.saveCart();
            this.updateCartDisplay();
            
            return { success: true, message: 'Item added to cart successfully' };
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return { success: false, message: 'Failed to add item to cart' };
        }
    }

    removeItem(itemId) {
        try {
            const itemIndex = this.cart.findIndex(item => item.id == itemId);
            if (itemIndex > -1) {
                this.cart.splice(itemIndex, 1);
                this.saveCart();
                this.updateCartDisplay();
                return { success: true, message: 'Item removed from cart' };
            }
            return { success: false, message: 'Item not found in cart' };
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return { success: false, message: 'Failed to remove item from cart' };
        }
    }

    updateQuantity(itemId, newQuantity) {
        try {
            const quantity = parseInt(newQuantity);
            if (quantity <= 0) {
                return this.removeItem(itemId);
            }

            const item = this.cart.find(item => item.id == itemId);
            if (item) {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartDisplay();
                return { success: true, message: 'Quantity updated' };
            }
            return { success: false, message: 'Item not found in cart' };
        } catch (error) {
            console.error('Error updating quantity:', error);
            return { success: false, message: 'Failed to update quantity' };
        }
    }

    getTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    getItems() {
        return [...this.cart];
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
        return { success: true, message: 'Cart cleared successfully' };
    }

    updateCartDisplay() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const itemCount = this.getItemCount();
        
        cartCountElements.forEach(element => {
            element.textContent = itemCount;
            element.style.display = itemCount > 0 ? 'inline' : 'inline';
        });

        this.updateCartPopup();
        
        this.updateCartPage();
    }

    updateCartPopup() {
        const popupCartItems = document.getElementById('popupCartItems');
        const popupCartTotal = document.getElementById('popupCartTotal');
        
        if (!popupCartItems || !popupCartTotal) return;

        popupCartItems.innerHTML = '';

        if (this.cart.length === 0) {
            popupCartItems.innerHTML = '<li class="empty-cart-message" style="padding: 24px 0; text-align: center; color: #888;">Your cart is empty</li>';
            popupCartTotal.textContent = '0.00';
            return;
        }

        this.cart.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'cart-popup-item';
            listItem.style.display = 'flex';
            listItem.style.alignItems = 'center';
            listItem.style.justifyContent = 'space-between';
            listItem.style.padding = '12px 0';
            listItem.style.borderBottom = '1px solid #f0f0f0';

            listItem.innerHTML = `
                <div class="cart-item-info" style="display: flex; align-items: center; gap: 12px;">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid #eee;">
                    <div class="cart-item-details" style="display: flex; flex-direction: column;">
                        <span class="cart-item-name" style="font-weight: 600; font-size: 1rem; color: #333;">${item.name}</span>
                        <span class="cart-item-price" style="font-size: 0.95rem; color: #666;">₱${item.price.toFixed(2)} x ${item.quantity}</span>
                    </div>
                </div>
                <div class="cart-item-controls" style="display: flex; align-items: center; gap: 6px;">
                    <button class="quantity-btn" style="width: 28px; height: 28px; border-radius: 50%; border: none; background: #f3f3f3; color: #444; font-size: 1.1rem; cursor: pointer;" onclick="window.SweetTreatsCart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="quantity-display" style="min-width: 24px; text-align: center; font-weight: 500;">${item.quantity}</span>
                    <button class="quantity-btn" style="width: 28px; height: 28px; border-radius: 50%; border: none; background: #f3f3f3; color: #444; font-size: 1.1rem; cursor: pointer;" onclick="window.SweetTreatsCart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    <button class="remove-btn" style="margin-left: 8px; background: none; border: none; color: #e74c3c; font-size: 1.3rem; cursor: pointer;" onclick="window.SweetTreatsCart.removeItem(${item.id})" title="Remove item">&times;</button>
                </div>
            `;
            popupCartItems.appendChild(listItem);
        });

        popupCartTotal.textContent = this.getTotal().toFixed(2);
    }

    updateCartPage() {
        const cartPageContainer = document.getElementById('cartPageItems');
        const cartPageTotal = document.getElementById('cartPageTotal');
        
        if (!cartPageContainer) return;

        cartPageContainer.innerHTML = '';

        if (this.cart.length === 0) {
            cartPageContainer.innerHTML = `
                <div class="empty-cart">
                    <h3>Your cart is empty</h3>
                    <p>Add some delicious treats to get started!</p>
                    <a href="products.html" class="btn">Browse Products</a>
                </div>
            `;
            if (cartPageTotal) cartPageTotal.textContent = '0.00';
            return;
        }

        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-page-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">₱${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="window.SweetTreatsCart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" onchange="window.SweetTreatsCart.updateQuantity(${item.id}, this.value)">
                    <button class="quantity-btn" onclick="window.SweetTreatsCart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-total">
                    ₱${(item.price * item.quantity).toFixed(2)}
                </div>
                <div class="cart-item-remove">
                    <button class="remove-btn" onclick="window.SweetTreatsCart.removeItem(${item.id})">Remove</button>
                </div>
            `;
            cartPageContainer.appendChild(cartItem);
        });

        if (cartPageTotal) {
            cartPageTotal.textContent = this.getTotal().toFixed(2);
        }
    }

    showCartPopup() {
        const cartPopup = document.getElementById('cartPopup');
        if (cartPopup) {
            this.updateCartPopup();
            cartPopup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hideCartPopup() {
        const cartPopup = document.getElementById('cartPopup');
        if (cartPopup) {
            cartPopup.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    initializeEventListeners() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const cartLinks = document.querySelectorAll('.cart-link');
        cartLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCartPopup();
            });
        });

        const closeCartBtn = document.getElementById('closeCartPopup');
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.hideCartPopup());
        }

        const cartPopup = document.getElementById('cartPopup');
        if (cartPopup) {
            cartPopup.addEventListener('click', (e) => {
                if (e.target === cartPopup) {
                    this.hideCartPopup();
                }
            });
        }

        const checkoutBtn = document.getElementById('popupCheckoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideCartPopup();
            }
        });
    }

    proceedToCheckout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty. Please add some items before checking out.');
            return;
        }

        const validation = this.validateCartForCheckout();
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        const cartNotesElement = document.getElementById('cartNotes');
        if (cartNotesElement && cartNotesElement.value.trim()) {
            window.cartNotes = cartNotesElement.value.trim();
        }

        this.hideCartPopup();

        this.saveCart();

        window.location.href = 'checkout.html';
    }

    getCartData() {
        return {
            items: this.cart,
            total: this.getTotal(),
            itemCount: this.getItemCount()
        };
    }

    validateCartForCheckout() {
        if (this.cart.length === 0) {
            return {
                valid: false,
                message: 'Your cart is empty. Please add items before proceeding to checkout.'
            };
        }

        const invalidItems = this.cart.filter(item => 
            !item.name || 
            isNaN(item.price) || 
            item.price <= 0 || 
            !item.quantity || 
            item.quantity <= 0
        );

        if (invalidItems.length > 0) {
            return {
                valid: false,
                message: 'Some items in your cart are invalid. Please review and update your cart.'
            };
        }

        return {
            valid: true,
            message: 'Cart is valid for checkout.'
        };
    }
}

let cartInstance;

function initializeCart() {
    if (!window.SweetTreatsCart) {
        cartInstance = new SweetTreatsCart();
        window.SweetTreatsCart = cartInstance;
        console.log('Sweet Treats Cart system loaded successfully');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
} else {
    initializeCart();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SweetTreatsCart;
}

window.addToCart = function(nameOrProduct, price = null, quantity = 1, image = null) {
    if (window.SweetTreatsCart) {
        return window.SweetTreatsCart.addItem(nameOrProduct, price, quantity, image);
    }
    console.error('Cart system not initialized');
    return { success: false, message: 'Cart system not ready' };
};

window.showCart = function() {
    if (window.SweetTreatsCart) {
        window.SweetTreatsCart.showCartPopup();
    }
};

window.hideCart = function() {
    if (window.SweetTreatsCart) {
        window.SweetTreatsCart.hideCartPopup();
    }
};

window.proceedToCheckout = function() {
    if (window.SweetTreatsCart) {
        window.SweetTreatsCart.proceedToCheckout();
    }
};