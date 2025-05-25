// User Authentication
const UserService = {
    // Initialize with default admin user if no users exist
    init() {
        if (!localStorage.getItem('users')) {
            const adminUser = {
                id: 1,
                name: 'Admin',
                email: 'admin@sweettreats.com',
                password: 'admin123', // In a real app, this should be hashed
                isAdmin: true,
                orders: []
            };
            localStorage.setItem('users', JSON.stringify([adminUser]));
            localStorage.setItem('nextUserId', '2');
        }
        
        // Set current user from session
        const currentUser = sessionStorage.getItem('currentUser');
        if (currentUser) {
            this.currentUser = JSON.parse(currentUser);
        }
    },
    
    // Login user
    login(email, password) {
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid email or password' };
    },
    
    // Logout user
    logout() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
    },
    
    // Register new user
    register(name, email, password) {
        const users = JSON.parse(localStorage.getItem('users'));
        
        // Check if user already exists
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }
        
        const newUser = {
            id: parseInt(localStorage.getItem('nextUserId')),
            name,
            email,
            password, // In a real app, this should be hashed
            isAdmin: false,
            orders: []
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('nextUserId', (newUser.id + 1).toString());
        
        return { success: true, user: newUser };
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Update user profile
    updateProfile(userId, updates) {
        const users = JSON.parse(localStorage.getItem('users'));
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Update user data
        users[userIndex] = { ...users[userIndex], ...updates };
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user in session if it's the same user
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = users[userIndex];
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        
        return { success: true, user: users[userIndex] };
    },
    
    // Add order to user's history
    addOrder(userId, order) {
        const users = JSON.parse(localStorage.getItem('users'));
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;
        
        if (!users[userIndex].orders) {
            users[userIndex].orders = [];
        }
        
        users[userIndex].orders.push(order);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    },
    
    // Get all orders (admin only)
    getAllOrders() {
        if (!this.currentUser || !this.currentUser.isAdmin) {
            return [];
        }
        
        const users = JSON.parse(localStorage.getItem('users'));
        let allOrders = [];
        
        users.forEach(user => {
            if (user.orders && user.orders.length > 0) {
                user.orders.forEach(order => {
                    allOrders.push({
                        ...order,
                        userName: user.name,
                        userEmail: user.email
                    });
                });
            }
        });
        
        return allOrders;
    }
};

// Cart Service
const CartService = {
    // Get cart from localStorage
    getCart() {
        return JSON.parse(localStorage.getItem('cart')) || [];
    },
    
    // Save cart to localStorage
    saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
    },
    
    // Add item to cart
    addItem(item) {
        const cart = this.getCart();
        const existingItem = cart.find(i => 
            i.name === item.name && i.request === item.request
        );
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
        } else {
            cart.push({
                ...item,
                quantity: item.quantity || 1,
                id: Date.now().toString()
            });
        }
        
        this.saveCart(cart);
        return cart;
    },
    
    // Remove item from cart
    removeItem(itemId) {
        const cart = this.getCart().filter(item => item.id !== itemId);
        this.saveCart(cart);
        return cart;
    },
    
    // Update item quantity
    updateQuantity(itemId, quantity) {
        if (quantity < 1) return this.removeItem(itemId);
        
        const cart = this.getCart();
        const item = cart.find(i => i.id === itemId);
        
        if (item) {
            item.quantity = quantity;
            this.saveCart(cart);
        }
        
        return cart;
    },
    
    // Clear cart
    clearCart() {
        localStorage.removeItem('cart');
        this.updateCartCount();
        return [];
    },
    
    // Calculate cart total
    getCartTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
            return total + (price * (item.quantity || 1));
        }, 0);
    },
    
    // Update cart count in the UI
    updateCartCount() {
        const cart = this.getCart();
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Update cart count in header
        let cartLink = document.querySelector('.cart-link');
        if (!cartLink) {
            const nav = document.querySelector('nav');
            if (nav) {
                cartLink = document.createElement('a');
                cartLink.href = 'cart.html';
                cartLink.className = 'cart-link';
                nav.querySelector('ul').appendChild(cartLink);
            }
        }
        
        if (cartLink) {
            cartLink.innerHTML = `
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-count">${count}</span>
            `;
        }
        
        return count;
    },
    
    // Checkout - create order
    checkout(userId, paymentInfo = {}) {
        const cart = this.getCart();
        if (cart.length === 0) {
            return { success: false, message: 'Cart is empty' };
        }
        
        const order = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: [...cart],
            total: this.getCartTotal(),
            status: 'pending',
            paymentInfo
        };
        
        // Add order to user's history
        UserService.addOrder(userId, order);
        
        // Clear cart
        this.clearCart();
        
        return { success: true, order };
    }
};

// Initialize services when the script loads
(function() {
    UserService.init();
    CartService.updateCartCount();
})();

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UserService
    if (typeof UserService !== 'undefined') {
        UserService.init();
    } else {
        console.error('UserService is not defined. Make sure app.js is loaded correctly.');
    }

    // Tab switching functionality
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    // Function to switch tabs
    function switchTab(tabName) {
        // Update active tab
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Show corresponding form
        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });
        
        // Clear any existing alerts
        const authAlerts = document.getElementById('authAlerts');
        if (authAlerts) {
            authAlerts.innerHTML = '';
        }
    }

    // Tab click event
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Switch tab from link
    document.querySelectorAll('.switch-tab').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab(this.dataset.tab);
        });
    });

    // Show alert message
    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.getElementById('authAlerts');
        if (container) {
            container.innerHTML = '';
            container.appendChild(alertDiv);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertDiv.style.opacity = '0';
                setTimeout(() => alertDiv.remove(), 300);
            }, 5000);
        }
    }

    // Login form submission
    const loginForm = document.getElementById('loginForm');
	if (loginForm) {
		loginForm.addEventListener('submit', function(e) {
			e.preventDefault();
			
			const email = document.getElementById('loginEmail').value.trim();
			const password = document.getElementById('loginPassword').value;
			
			// Basic validation
			if (!email || !password) {
				showAlert('Please fill in all fields', 'danger');
				return;
			}
			
			try {
				const result = UserService.login(email, password);
				
				if (result.success) {
					showAlert('Login successful! Redirecting...', 'success');
					// Redirect based on URL parameters or to home page
					const urlParams = new URLSearchParams(window.location.search);
					const redirect = urlParams.get('redirect') || 'sweet-treats-website.html';
					setTimeout(() => {
						window.location.href = redirect;
					}, 1500);
				} else {
					showAlert(result.message || 'Invalid email or password', 'danger');
				}
			} catch (error) {
				console.error('Login error:', error);
				showAlert('An error occurred during login. Please try again.', 'danger');
			}
		});
	}

    // Registration form submission
    const registerForm = document.getElementById('registerForm');
	if (registerForm) {
		registerForm.addEventListener('submit', function(e) {
			e.preventDefault();
			
			const name = document.getElementById('registerName').value.trim();
			const email = document.getElementById('registerEmail').value.trim();
			const password = document.getElementById('registerPassword').value;
			const confirmPassword = document.getElementById('registerConfirmPassword').value;
			
			// Validate form
			if (!name || !email || !password || !confirmPassword) {
				showAlert('Please fill in all fields', 'danger');
				return;
			}
			
			// Validate email format
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				showAlert('Please enter a valid email address', 'danger');
				return;
			}
			
			// Validate password strength
			if (password.length < 6) {
				showAlert('Password must be at least 6 characters long', 'danger');
				return;
			}
			
			// Validate passwords match
			if (password !== confirmPassword) {
				showAlert('Passwords do not match', 'danger');
				return;
			}
			
			try {
				// Register user
				const result = UserService.register(name, email, password);
				
				if (result.success) {
					showAlert('Registration successful! Logging you in...', 'success');
					// Auto-login after registration
					setTimeout(() => {
						UserService.login(email, password);
						const urlParams = new URLSearchParams(window.location.search);
						const redirect = urlParams.get('redirect') || 'sweet-treats-website.html';
						window.location.href = redirect;
					}, 1500);
				} else {
					showAlert(result.message || 'Registration failed. Please try again.', 'danger');
				}
			} catch (error) {
				console.error('Registration error:', error);
				showAlert('An error occurred during registration. Please try again.', 'danger');
			}
		});
	}

    // Forgot Password Modal functionality
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const closeModalBtn = document.querySelector('.close-modal');

    // Open modal
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (forgotPasswordModal) {
                forgotPasswordModal.classList.add('active');
            }
        });
    }

    // Close modal
    if (closeModalBtn && forgotPasswordModal) {
        closeModalBtn.addEventListener('click', function() {
            forgotPasswordModal.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', function(e) {
            if (e.target === forgotPasswordModal) {
                forgotPasswordModal.classList.remove('active');
            }
        });
    }

    // Forgot password form submission
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            
            if (!email) {
                showAlert('Please enter your email address', 'danger');
                return;
            }
            
            // In a real app, this would send an email with a reset link
            showAlert(`If an account exists for ${email}, you will receive a password reset link.`, 'info');
            this.reset();
            if (forgotPasswordModal) {
                forgotPasswordModal.classList.remove('active');
            }
        });
    }

    // Help section toggle
    document.querySelectorAll('.help-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            if (answer) {
                answer.classList.toggle('active');
            }
        });
    });
});