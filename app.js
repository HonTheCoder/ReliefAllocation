
// ===== LOADING SCREEN MANAGEMENT =====
let loadingScreen = null;
let isAppInitialized = false;
let loadingTimeout = null;
let isLoggingOut = false;

// Show loading screen immediately
function showLoadingScreen() {
    // Don't show loading screen during logout
    if (isLoggingOut) {
        console.log('Logout in progress, skipping loading screen');
        return;
    }
    
    loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.classList.remove('fade-out');
        
        // Update loading text dynamically
        updateLoadingText('Initializing system...');
        
        // Safety timeout - hide loading screen after 2 seconds max (silent)
        if (loadingTimeout) clearTimeout(loadingTimeout);
        loadingTimeout = setTimeout(() => {
            // Silent timeout - no console warning since we have proper fallbacks
            forceHideLoadingScreen();
        }, 2000);
    }
}

// Update loading screen text
function updateLoadingText(text) {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

// Hide loading screen with fast animation
function hideLoadingScreen() {
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
    
    if (loadingScreen && !isAppInitialized) {
        updateLoadingText('Ready!');
        
        // Much faster animation - reduced from 300ms + 500ms to 100ms + 200ms
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                isAppInitialized = true;
            }, 200);
        }, 100);
    }
}

// Force hide loading screen (emergency fallback)
function forceHideLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        loadingScreen.style.display = 'none';
        isAppInitialized = true;
    }
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
}

// Initialize loading screen immediately when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Don't show loading screen if logging out
    if (isLoggingOut) {
        console.log('Logout in progress, skipping DOMContentLoaded loading screen');
        return;
    }
    
    // Only show loading screen if we're on main.html (not index.html)
    if (document.getElementById('dashboardContainer') || document.getElementById('loginContainer')) {
        showLoadingScreen();
        
        // Fallback: Hide loading screen after 1.5 seconds if auth doesn't complete
        setTimeout(() => {
            if (loadingScreen && loadingScreen.style.display !== 'none') {
                console.log('DOMContentLoaded fallback: hiding loading screen after 1.5 seconds');
                hideLoadingScreen();
            }
        }, 1500);
    }
});

// ===== MESSAGE MODALS =====
function showSuccess(msg) {
    openMessageModal("Success", msg, "success");
}

function showError(msg) {
    openMessageModal("Error", msg, "error");
}

function showWarning(msg) {
    openMessageModal("Warning", msg, "warning");
}

function showInfo(msg) {
    openMessageModal("Information", msg, "info");
}

function openMessageModal(title, msg, type = "info") {
    const modal = document.getElementById("messageModal");
    if (!modal) {
        // Fallback to alert if modal is not available
        alert(msg);
        return;
    }
    
    // Remove any existing type classes
    modal.classList.remove('success', 'error', 'warning', 'info', 'show', 'hide');
    
    // Set title
    const titleEl = document.getElementById("messageTitle");
    if (titleEl) titleEl.textContent = title;
    
    // Set message content
    const textEl = document.getElementById("messageText");
    if (textEl) {
        textEl.innerHTML = msg;
        textEl.className = "message-text"; // Ensure proper class
    }
    
    // Set icon based on type
    const iconEl = document.getElementById("messageIcon");
    if (iconEl) {
        iconEl.className = `message-icon ${type}`;
        iconEl.innerHTML = getMessageIcon(type);
    }
    
    // Add type class to modal for styling
    modal.classList.add(type, 'message-modal');
    
    // Show modal with enhanced styling and animation
    modal.classList.remove("hidden");
    
    // Auto-close after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            closeMessageModal();
        }, 5000);
    }
    
    // Focus management for accessibility
    const okBtn = document.getElementById("messageOkBtn");
    if (okBtn) {
        setTimeout(() => okBtn.focus(), 100);
    }
}

function getMessageIcon(type) {
    switch (type) {
        case 'success': return '<span class="material-icons" style="color: #10b981;">check_circle</span>';
        case 'error': return '<span class="material-icons" style="color: #ef4444;">error</span>';
        case 'warning': return '<span class="material-icons" style="color: #f59e0b;">warning</span>';
        case 'info': return '<span class="material-icons" style="color: #3b82f6;">info</span>';
        default: return '<span class="material-icons" style="color: #3b82f6;">info</span>';
    }
}

// Removed openMessageModalWithRefresh function - no longer needed

function closeMessageModal() {
    const modal = document.getElementById("messageModal");
    if (!modal) return;
    
    // Add hide animation and remove modal classes
    modal.classList.add("hidden");
    modal.classList.remove('success', 'error', 'warning', 'info', 'show', 'hide', 'message-modal');
}

// Expose for inline onclick in main.html
window.closeMessageModal = closeMessageModal;

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("messageOkBtn");
    if (btn) {
        btn.addEventListener("click", closeMessageModal);
    }
});

let currentUserRole = null; // 'mswd' or 'barangay'
let currentBarangayName = null; // barangay username if barangay role
// app.js
import { 
    db, 
    auth, 
    requestAccount, 
    getPendingRequests, 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc,
    addDoc, 
    setDoc,
    doc, 
    updateDoc, 
    deleteDoc, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    createUserInFirestore,
    fetchSignInMethodsForEmail,
    addResidentToFirestore,
    changePassword,
    updateInventoryTransaction,
    addInventory,
    getInventoryTotals,
    getActiveBatch,
    startNewBatch,
    logInventoryTransaction,
    getInventoryLogs,
    markDeliveryDeducted,
    isDeliveryDeducted,
    getDeliveries,
    validateInventoryAvailability,
    addCustomItem,
    // Enhanced session management functions
    checkActiveSession,
    createUserSession,
    terminateUserSession,
    cleanupExpiredSessions,
    validateCurrentSession,
    updateUserActivity,
    getSessionConfig,
    updateSessionConfig
} from './firebase.js';

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { onSnapshot, runTransaction, Timestamp, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let loggedInUserData = null; //(GLOBAL VARIABLE)

// Lightweight global app registry for listeners and dynamic assets
window.App = window.App || {
    currentSection: null,
    listeners: new Map(),
    addListener(sectionKey, unsubscribe) {
        if (!unsubscribe) return;
        const arr = this.listeners.get(sectionKey) || [];
        arr.push(unsubscribe);
        this.listeners.set(sectionKey, arr);
    },
    clearListeners(sectionKey) {
        const arr = this.listeners.get(sectionKey) || [];
        arr.forEach(unsub => { try { unsub(); } catch(_) {} });
        this.listeners.delete(sectionKey);
    },
    clearAll() {
        for (const key of Array.from(this.listeners.keys())) this.clearListeners(key);
    }
};

async function ensureDataTables() {
    // If jQuery & DataTables present, return
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.dataTable) return;
    // Try to load from CDN if not present
    const loadScript = (src) => new Promise((res, rej) => { const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
    const loadCss = (href) => { const l=document.createElement('link'); l.rel='stylesheet'; l.href=href; document.head.appendChild(l); };
    try {
        loadCss('https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
        loadCss('https://cdn.datatables.net/buttons/2.4.1/css/buttons.dataTables.min.css');
        if (!window.jQuery) await loadScript('https://code.jquery.com/jquery-3.7.1.min.js');
        await loadScript('https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js');
        await loadScript('https://cdn.datatables.net/buttons/2.4.1/js/dataTables.buttons.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js');
        await loadScript('https://cdn.datatables.net/buttons/2.4.1/js/buttons.html5.min.js');
        await loadScript('https://cdn.datatables.net/buttons/2.4.1/js/buttons.print.min.js');
    } catch (e) { console.warn('Failed to lazy-load DataTables', e); }
}

// Auto login persist with loading screen integration
onAuthStateChanged(auth, async (user) => {
    try {
        if (user) {
            console.log("User is logged in:", user.email);
            updateLoadingText('Verifying credentials...');
            
            // Skip initialization if this is the admin user already logged in
            // This prevents redirect when the admin creates a new account
            if (loggedInUserData && loggedInUserData.email === user.email) {
                console.log('Admin already logged in, skipping re-initialization');
                // Hide loading screen immediately for already authenticated users
                setTimeout(() => hideLoadingScreen(), 50);
                return;
            }
            
            updateLoadingText('Loading user data...');
            const q = query(collection(db, "users"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                updateLoadingText('Setting up dashboard...');
                
                // Initialize user immediately
                initializeUser(userData);
                
                // Hide loading screen immediately
                setTimeout(() => {
                    hideLoadingScreen();
                }, 100);
            } else {
                updateLoadingText('User not found...');
                setTimeout(() => {
                    hideLoadingScreen();
                    showError('User account not found. Please contact administrator.');
                }, 1000);
            }
        } else {
            console.log("No user logged in");
            
            // Don't show loading screen if we're logging out
            if (isLoggingOut) {
                console.log('Logout in progress, skipping auth state change handling');
                return;
            }
            
            // Don't show loading screen if we're already on login page
            const loginContainer = document.getElementById('loginContainer');
            const dashboardContainer = document.getElementById('dashboardContainer');
            
            if (loginContainer && !loginContainer.classList.contains('hidden')) {
                // Already on login page, no need for loading screen
                console.log('Already on login page, skipping loading screen');
                return;
            }
            
            // Show login container immediately without loading screen
            if (loginContainer && dashboardContainer) {
                loginContainer.classList.remove('hidden');
                dashboardContainer.classList.add('hidden');
            }
            
            // Hide any existing loading screen
            hideLoadingScreen();
        }
    } catch (error) {
        console.error('Authentication error:', error);
        updateLoadingText('Authentication error...');
        
        setTimeout(() => {
            hideLoadingScreen();
            showError('Authentication failed. Please try again.');
        }, 1000);
    }
});

// Initialize App when page loads
document.addEventListener("DOMContentLoaded", async () => {
    try {
        updateLoadingText('Loading application...');
        
        // Initialize core functions
        await initializeDefaultAdmin();
        updateLoadingText('Loading barangays...');
        
        loadBarangaysFromFirebase(); // Load Barangays on page load
        
        updateLoadingText('Setting up forms...');
        // Initialize enhanced click prevention for forms
        initializeFormEnhancements();
        
        // Override global functions with full implementations
        setupGlobalFunctions();
        
        updateLoadingText('Starting session management...');
        // NEW: Initialize session management and monitoring
        initializeSessionManagement();
        
        updateLoadingText('Almost ready...');
        
    } catch (error) {
        console.error('App initialization error:', error);
        updateLoadingText('Initialization error...');
        setTimeout(() => {
            hideLoadingScreen();
            showError('Failed to initialize application. Please refresh the page.');
        }, 1000);
    }
});

// Initialize critical event listeners immediately when DOM is ready
function initializeRequestAccountButton() {
    console.log('Initializing Request Account button...');
    
    const requestBtn = document.getElementById("requestAccountBtn");
    if (requestBtn) {
        console.log('Request Account button found, adding event listener');
        // Remove any existing listeners first
        requestBtn.removeEventListener("click", showRequestAccount);
        requestBtn.addEventListener("click", showRequestAccount);
        console.log('Event listener added successfully');
    } else {
        console.error('Request Account button not found!');
    }
}

// Try multiple times to ensure the button is found
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - initializing critical event listeners');
    
    // Initialize Request Account button
    initializeRequestAccountButton();
    
    // Also try after a small delay in case of timing issues
    setTimeout(initializeRequestAccountButton, 100);
    setTimeout(initializeRequestAccountButton, 500);
    
    // Add other event listeners
    document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
    
    // Modal click outside to close
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("requestAccountModal");
        if (event.target === modal) hideRequestAccount();
    });
    
    // Password Eye Icon Fix
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? 'visibility_off' : 'visibility';
        });
    }
    
    // Cancel Button Fix for Request Account
    const cancelRequestBtn = document.getElementById("cancelRequestBtn");
    if (cancelRequestBtn) {
        cancelRequestBtn.addEventListener("click", hideRequestAccount);
    }
});

async function initializeDefaultAdmin() {
    const usersRef = collection(db, "users");
    const adminQuery = query(usersRef, where("username", "==", "admin_mswd"));
    const querySnapshot = await getDocs(adminQuery);

    if (querySnapshot.empty) {
        const userCredential = await createUserWithEmailAndPassword(auth, "admin_mswd@example.com", "polangui12345");
        await createUserInFirestore(userCredential.user.uid, "admin_mswd", "admin_mswd@example.com", "mswd");
    }
}

// Centralized auth error mapping
function mapAuthError(err) {
    const code = err && err.code;
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid username or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please wait and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection and try again.';
        case 'auth/requires-recent-login':
            return 'Please log out and log back in, then retry.';
        case 'auth/weak-password':
            return 'New password is too weak. Choose a stronger one.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!usernameField?.value.trim() || !passwordField?.value) {
        showError('Please enter both username and password.');
        return false;
    }
    
    const raw = usernameField.value || '';
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '');
    const password = passwordField.value;

    // Enforce barangay_ prefix for barangay accounts (admin_mswd exempt)
    const isAdminLogin = normalized === 'admin_mswd';
    if (!isAdminLogin && !normalized.startsWith('barangay_')) {
        showError('For barangay accounts, the username must start with "barangay_". Example: barangay_name');
        return false;
    }

    const barangayName = normalized.replace('barangay_', '');
    const email = `${barangayName}@example.com`;
    
    // Show loading screen and disable form during processing
    showLoadingScreen();
    updateLoadingText('Checking session...');
    
    usernameField.disabled = true;
    passwordField.disabled = true;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Checking session...';
    }

    try {
        // SMART SESSION CHECK: Automatically handle expired sessions
        updateLoadingText('Checking for existing sessions...');
        const sessionCheck = await checkActiveSession(email);
        
        if (sessionCheck.hasActiveSession) {
            // Check if session was automatically cleaned up (expired)
            if (sessionCheck.silentCleanup) {
                console.log(`✨ Expired session automatically cleaned up for ${email} due to ${sessionCheck.reason}`);
                updateLoadingText('Previous session expired, continuing login...');
                // Continue with login - no modal needed
            }
            // Check if this is a multiple session allowed scenario
            else if (sessionCheck.allowMultiple) {
                console.log(`🔄 Multiple sessions allowed for ${email}`);
                updateLoadingText('Multiple sessions enabled, continuing login...');
                // Continue with login - no modal needed
            }
            // Only show modal for truly active sessions that require user action
            else if (sessionCheck.requiresUserAction) {
                const loginTime = sessionCheck.loginTimestamp ? 
                    new Date(sessionCheck.loginTimestamp).toLocaleString() : 'Unknown';
                const lastActive = sessionCheck.lastActive ? 
                    new Date(sessionCheck.lastActive).toLocaleString() : 'Unknown';
                const userAgent = sessionCheck.userAgent || 'Unknown device';
                const inactiveMinutes = sessionCheck.inactiveMinutes || 0;
                
                let dialogResult;
                if (window.Swal) {
                    dialogResult = await Swal.fire({
                        title: 'Account Currently Active',
                        html: `
                            <div style="text-align: left; margin: 10px 0;">
                                <p><strong>This account has an active session:</strong></p>
                                <ul style="text-align: left; margin-left: 20px;">
                                    <li>Login time: ${loginTime}</li>
                                    <li>Last active: ${lastActive}</li>
                                    <li>Inactive for: ${inactiveMinutes} minutes</li>
                                    <li>Device: ${userAgent}</li>
                                </ul>
                                <p><strong>Options:</strong></p>
                                <ul style="text-align: left; margin-left: 20px;">
                                    <li><strong>Terminate & Login:</strong> End the other session and login here</li>
                                    <li><strong>Cancel:</strong> Keep the existing session active</li>
                                </ul>
                            </div>
                        `,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Terminate & Login',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#f59e0b',
                        cancelButtonColor: '#6b7280',
                        background: '#ffffff',
                        color: '#1f2937',
                        didOpen: (popup) => {
                            popup.style.borderTop = '6px solid #f59e0b';
                            popup.style.borderBottom = '6px solid #ef4444';
                        }
                    });
                } else {
                    const message = `This account has an active session:\n\nLogin: ${loginTime}\nLast active: ${lastActive}\nInactive for: ${inactiveMinutes} minutes\nDevice: ${userAgent}\n\nWould you like to terminate the other session and login here?`;
                    dialogResult = {
                        isConfirmed: confirm(message)
                    };
                }
                
                if (dialogResult.isConfirmed) {
                    // Terminate existing session and continue with login
                    updateLoadingText('Terminating existing session...');
                    await terminateUserSession(email);
                    updateLoadingText('Session terminated, continuing login...');
                } else {
                    // User cancelled, abort login
                    updateLoadingText('Login cancelled...');
                    setTimeout(() => hideLoadingScreen(), 1000);
                    return false;
                }
            }
        }
        
        // Update button text for actual authentication
        updateLoadingText('Authenticating...');
        if (submitBtn) {
            submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Authenticating...';
        }
        
        // Proceed with Firebase authentication
        await signInWithEmailAndPassword(auth, email, password);
        
        // NEW: Create new session after successful authentication
        updateLoadingText('Creating session...');
        const sessionId = await createUserSession(email, { username: normalized });
        console.log(`New session created: ${sessionId}`);
        
        // Store session ID for later validation
        localStorage.setItem('currentSessionId', sessionId);
        localStorage.setItem('currentUserEmail', email);
        
        // START SMART ACTIVITY TRACKING
        startTrackingUser(email);
        
        updateLoadingText('Login successful!');
        
        // Hide loading screen immediately after login success
        hideLoadingScreen();
        
        // Enhanced fast success popup with better UX
        const isBarangayUser = normalized.startsWith('barangay_');
        const userRole = isBarangayUser ? 'Barangay' : 'Admin';
        const successWelcomeText = `Welcome back, ${userRole}!`;
        
        if (window.Swal) {
            Swal.fire({
                title: 'Login Successful',
                html: `
                    <div style="text-align: center; margin: 10px 0;">
                        <p style="font-size: 1.1rem; color: #16a34a; font-weight: 600; margin: 8px 0;">
                            ${successWelcomeText}
                        </p>
                        <p style="font-size: 0.9rem; color: #6b7280; margin: 4px 0;">
                            Redirecting to dashboard...
                        </p>
                    </div>
                `,
                icon: 'success',
                showConfirmButton: false,
                timer: 1200,
                timerProgressBar: true,
                background: '#ffffff',
                color: '#1f2937',
                customClass: {
                    popup: 'fast-login-success',
                    title: 'fast-login-title'
                },
                didOpen: (popup) => {
                    // Enhanced styling with smooth animations
                    popup.style.borderTop = '4px solid #2563eb';
                    popup.style.borderBottom = '4px solid #16a34a';
                    popup.style.borderRadius = '12px';
                    popup.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
                    
                    // Add smooth entrance animation
                    popup.style.animation = 'fastLoginPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                },
                willClose: () => {
                    // Smooth exit animation
                    const popup = Swal.getPopup();
                    if (popup) {
                        popup.style.animation = 'fastLoginFadeOut 0.3s ease-out';
                    }
                }
            });
        } else {
            showSuccess(`Login successful! Welcome, ${userRole}!`);
        }
        return true;
    } catch (error) {
        console.error('Login error:', error);
        updateLoadingText('Login failed...');
        
        // Hide loading screen after a brief delay
        setTimeout(() => {
            hideLoadingScreen();
        }, 1000);
        
        // Modern error popup (UI-only)
        let errorMessage = 'Login failed. Please try again.';
        
        // Handle specific session-related errors
        if (error.message && error.message.includes('session')) {
            errorMessage = 'Session management error. Please try again.';
        } else {
            errorMessage = mapAuthError(error);
        }
        
        if (window.Swal) {
            await Swal.fire({
                title: 'Login Failed',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Retry',
                confirmButtonColor: '#2563eb',
                background: '#ffffff',
                color: '#1f2937',
                didOpen: (popup) => {
                    // Red/blue theme accent
                    popup.style.borderTop = '6px solid #ef4444';
                    popup.style.borderBottom = '6px solid #2563eb';
                }
            });
        } else {
            showError(errorMessage);
        }
        return false;
    } finally {
        // Re-enable form
        setTimeout(() => {
            usernameField.disabled = false;
            passwordField.disabled = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login';
            }
        }, 1000);
    }
}

async function initializeUser(userData) {
    loggedInUserData = userData;
    console.log("Initializing user with data:", userData);
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('dashboardContainer').classList.remove('hidden');
    // Dynamic sidebar greeting: show actual barangay name when role is barangay
    (function(){
        const el = document.getElementById('userRole');
        if (!el) return;
        if (userData && userData.role === 'barangay') {
            const raw = (userData.username || '').toString();
            const barangayNameRaw = raw.replace(/^barangay_?/i, '').replace(/_/g, ' ').trim();
            const pretty = barangayNameRaw.split(' ').map(s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s).join(' ');
            el.innerText = `Welcome, Barangay ${pretty}`;
        } else if (userData && userData.role) {
            el.innerText = `Welcome, ${userData.role.toUpperCase()}`;
        } else {
            el.innerText = 'Welcome';
        }
    })();

    // NEW: Initialize session status display
    updateSessionStatusUI();

    if (userData.role === 'mswd') {
        document.querySelectorAll('.mswd-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.barangay-only').forEach(el => el.style.display = 'none');
        
        // Load account requests using the new function
        if (typeof loadAccountRequests === 'function') {
            loadAccountRequests();
        }
    
        showSection('deliveryScheduling');
} else if (userData.role === 'barangay') {
        document.querySelectorAll('.barangay-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.mswd-only').forEach(el => el.style.display = 'none');

        loadBarangayDeliveries(userData.username); 
        
        const barangayName = userData.username.replace('barangay_', '');
        loadResidentsForBarangay(barangayName); // Automatic load residents pag login
        
        // Setup barangay-specific button functionality
        setTimeout(() => {
            setupBarangayButtons();
        }, 100); // Small delay to ensure DOM is ready
        
        showSection('deliveryStatus');
    }
}



// Old loadAccountRequests and declineRequest functions removed - now using new system

async function handleRequestAccount(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const barangayName = document.getElementById('requestUsername').value.trim();
    const email = document.getElementById('requestEmail').value.trim();
    const contact = document.getElementById('requestContact').value.trim();
    const message = document.getElementById('requestMessage').value.trim();
    
    if (!barangayName || !email || !contact || !message) {
        showError('Please fill in all fields');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    // Disable form during processing
    const formInputs = form.querySelectorAll('input, textarea, button');
    formInputs.forEach(input => {
        input.disabled = true;
        input.style.opacity = '0.7';
    });
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Submitting Request...';
    }
    
    try {
        // Explicitly call with parameter names matching the function definition
        await requestAccount(barangayName, email, contact, message);

        // Close the Request Account modal FIRST before showing success message
        hideRequestAccount();

		// Show success message with Swal if available or fallback
        if (window.Swal) {
            await Swal.fire({
                title: 'Request Submitted',
                text: 'Account request submitted successfully! We will review your request and get back to you soon.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#16a34a',
                background: '#ffffff',
                color: '#1f2937',
                didOpen: (popup) => {
                    popup.style.borderTop = '6px solid #2563eb';
                    popup.style.borderBottom = '6px solid #16a34a';
                }
            });
        } else {
            showSuccess('Account request submitted successfully! We will review your request and get back to you soon.');
        }

        // Reload the page after successful submission
        setTimeout(() => {
            location.reload();
        }, 500);
        
        return true;
    } catch (error) {
        console.error('Request account error:', error);
        
        // Show error message with Swal if available or fallback
        if (window.Swal) {
            await Swal.fire({
                title: 'Request Failed',
                text: 'Failed to submit request. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb',
                background: '#ffffff',
                color: '#1f2937',
                didOpen: (popup) => {
                    popup.style.borderTop = '6px solid #ef4444';
                    popup.style.borderBottom = '6px solid #2563eb';
                }
            });
        } else {
            showError('Failed to submit request. Please try again.');
        }
        return false;
    } finally {
        // Force immediate UI update for button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Request';
        }
        
        // Re-enable other form elements with a small delay
        setTimeout(() => {
            formInputs.forEach(input => {
                if (input !== submitBtn) { // Skip button as we already updated it
                    input.disabled = false;
                    input.style.opacity = '';
                }
            });
        }, 500);
    }
}

function showRequestAccount() { 
    console.log('showRequestAccount called');
    const modal = document.getElementById("requestAccountModal");
    if (modal) {
        modal.classList.remove("hidden");
        console.log('Request Account modal opened');
    } else {
        console.error('Request Account modal not found');
    }
}

// Make sure functions are available globally for onclick
window.showRequestAccount = showRequestAccount;

function hideRequestAccount() { 
    const modal = document.getElementById("requestAccountModal");
    if (modal) {
        modal.classList.add("hidden");
        
        // Reset the form and button state when hiding modal
        const form = document.getElementById("requestAccountForm");
        if (form) {
            // Reset form
            form.reset();
            
            // Reset all form inputs
            const formInputs = form.querySelectorAll('input, textarea, button');
            formInputs.forEach(input => {
                input.disabled = false;
                input.style.opacity = '';
                
                // Clear any double-click prevention data
                if (input._preventionData && typeof input._preventionData.cleanup === 'function') {
                    input._preventionData.cleanup();
                }
            });
            
            // Reset submit button specifically
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Request';
                
                // Clear any double-click prevention data
                if (submitBtn._preventionData && typeof submitBtn._preventionData.cleanup === 'function') {
                    submitBtn._preventionData.cleanup();
                }
            }
        }
        
        // Clear any processing buttons related to request account
        const requestBtn = document.getElementById('requestAccountBtn');
        const cancelBtn = document.getElementById('cancelRequestBtn');
        
        [requestBtn, cancelBtn].forEach(btn => {
            if (btn && btn._preventionData && typeof btn._preventionData.cleanup === 'function') {
                btn._preventionData.cleanup();
            }
        });
    }
}

// Make hideRequestAccount globally available too
window.hideRequestAccount = hideRequestAccount;

// ===== ENHANCED SMART SESSION MANAGEMENT =====

// Activity tracking state
let activityTracker = {
    heartbeatInterval: null,
    lastActivity: Date.now(),
    userEmail: null,
    isActive: false
};

// Initialize enhanced session management with smart activity tracking
function initializeSessionManagement() {
    console.log('🔐 Initializing smart session management...');
    
    // Cleanup expired sessions on page load
    cleanupExpiredSessions().catch(error => {
        console.warn('Session cleanup failed on page load:', error);
    });
    
    // Set up periodic session validation and cleanup (every 5 minutes)
    setInterval(async () => {
        try {
            await cleanupExpiredSessions();
        } catch (error) {
            console.warn('Periodic session cleanup failed:', error);
        }
    }, 5 * 60 * 1000);
    
    // Set up user activity detection
    initializeActivityTracking();
    
    // Set up visibility change handler for session validation
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up page unload handler for session cleanup
    window.addEventListener('beforeunload', handlePageUnload);
    
    // Set up periodic heartbeat for activity updates
    startActivityHeartbeat();
    
    console.log('✅ Smart session management initialized');
}

// Initialize activity tracking for user interactions
function initializeActivityTracking() {
    const activityEvents = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
    
    // Throttled activity update to prevent excessive Firebase calls
    let lastActivityUpdate = 0;
    const ACTIVITY_UPDATE_THROTTLE = 30 * 1000; // 30 seconds
    
    const handleUserActivity = () => {
        const now = Date.now();
        activityTracker.lastActivity = now;
        
        // Update Firebase if enough time has passed and user is logged in
        if (activityTracker.isActive && activityTracker.userEmail && 
            (now - lastActivityUpdate) > ACTIVITY_UPDATE_THROTTLE) {
            lastActivityUpdate = now;
            updateUserActivity(activityTracker.userEmail).catch(error => {
                console.warn('Failed to update user activity:', error);
            });
        }
    };
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    console.log('💓 Activity tracking initialized');
}

// Start periodic heartbeat for activity updates
function startActivityHeartbeat() {
    // Clear any existing heartbeat
    if (activityTracker.heartbeatInterval) {
        clearInterval(activityTracker.heartbeatInterval);
    }
    
    // Start new heartbeat every 30 seconds
    activityTracker.heartbeatInterval = setInterval(async () => {
        if (activityTracker.isActive && activityTracker.userEmail) {
            try {
                await updateUserActivity(activityTracker.userEmail);
            } catch (error) {
                console.warn('Heartbeat activity update failed:', error);
            }
        }
    }, 30 * 1000);
    
    console.log('💓 Activity heartbeat started');
}

// Stop activity tracking (called on logout)
function stopActivityTracking() {
    activityTracker.isActive = false;
    activityTracker.userEmail = null;
    
    if (activityTracker.heartbeatInterval) {
        clearInterval(activityTracker.heartbeatInterval);
        activityTracker.heartbeatInterval = null;
    }
    
    console.log('🚫 Activity tracking stopped');
}

// Start tracking activity for a user (called after successful login)
function startTrackingUser(email) {
    activityTracker.isActive = true;
    activityTracker.userEmail = email;
    activityTracker.lastActivity = Date.now();
    
    // Store in localStorage for recovery
    localStorage.setItem('currentUserEmail', email);
    
    console.log(`🔍 Started tracking activity for: ${email}`);
}

// Validate current user's session
async function validateCurrentUserSession() {
    const currentEmail = localStorage.getItem('currentUserEmail');
    const sessionId = localStorage.getItem('currentSessionId');
    
    if (currentEmail && sessionId) {
        try {
            const isValid = await validateCurrentSession(currentEmail, sessionId);
            if (!isValid) {
                console.warn('Current session is no longer valid, logging out...');
                if (window.Swal) {
                    await Swal.fire({
                        title: 'Session Expired',
                        text: 'Your session has expired. Please log in again.',
                        icon: 'warning',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#f59e0b',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                }
                // Force logout
                await window.logout();
            }
        } catch (error) {
            console.error('Error validating current session:', error);
        }
    }
}

// Handle page visibility changes (for session activity tracking)
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('Page hidden - user switched tabs/apps');
    } else {
        console.log('Page visible - user returned to tab');
        // Validate session when user returns and update UI
        validateCurrentUserSessionWithUI();
    }
}

// Enhanced page unload handler for automatic session cleanup
function handlePageUnload(event) {
    const currentEmail = localStorage.getItem('currentUserEmail');
    const currentSessionId = localStorage.getItem('currentSessionId');
    
    if (currentEmail && currentSessionId) {
        console.log('💬 Page unloading - stopping activity tracking and cleaning up session');
        
        // Stop activity tracking immediately
        stopActivityTracking();
        
        // Mark session as inactive in localStorage for recovery scenarios
        localStorage.setItem('sessionEndReason', 'page_unload');
        localStorage.setItem('sessionEndTime', Date.now().toString());
        
        // Use sendBeacon for reliable cleanup (if available)
        if (navigator.sendBeacon && window.fetch) {
            // In a production environment, you'd send this to a server endpoint
            // For now, we'll rely on the automatic cleanup mechanisms
            console.log('Session cleanup will be handled by automatic cleanup systems');
        }
        
        // Try synchronous cleanup (not guaranteed to complete)
        try {
            terminateUserSession(currentEmail);
        } catch (error) {
            console.warn('Synchronous session cleanup failed:', error);
        }
    }
}

// SESSION STATUS UI MANAGEMENT

// Update session status indicator in the UI
function updateSessionStatusUI(status = 'active') {
    const sessionStatusEl = document.getElementById('sessionStatus');
    const sessionDotEl = document.getElementById('sessionDot');
    const sessionTextEl = document.getElementById('sessionText');
    const sessionTimeEl = document.getElementById('sessionTime');
    
    if (!sessionStatusEl) return; // Element might not exist on login page
    
    // Show the session status
    sessionStatusEl.style.display = 'block';
    
    // Get current session info from localStorage
    const currentEmail = localStorage.getItem('currentUserEmail');
    const sessionId = localStorage.getItem('currentSessionId');
    
    if (currentEmail && sessionId) {
        // Update session time
        const now = new Date();
        sessionTimeEl.textContent = now.toLocaleTimeString();
        
        // Update status based on parameter
        sessionDotEl.className = `session-dot ${status}`;
        
        switch (status) {
            case 'active':
                sessionTextEl.textContent = 'Active Session';
                break;
            case 'expired':
                sessionTextEl.textContent = 'Session Expired';
                break;
            case 'invalid':
                sessionTextEl.textContent = 'Invalid Session';
                break;
            default:
                sessionTextEl.textContent = 'Session Status';
        }
    } else {
        // Hide if no session info available
        sessionStatusEl.style.display = 'none';
    }
}

// Hide session status (used during logout)
function hideSessionStatusUI() {
    const sessionStatusEl = document.getElementById('sessionStatus');
    if (sessionStatusEl) {
        sessionStatusEl.style.display = 'none';
    }
}

// Update session validation to also update UI
async function validateCurrentUserSessionWithUI() {
    const currentEmail = localStorage.getItem('currentUserEmail');
    const sessionId = localStorage.getItem('currentSessionId');
    
    if (currentEmail && sessionId) {
        try {
            const isValid = await validateCurrentSession(currentEmail, sessionId);
            if (!isValid) {
                console.warn('Current session is no longer valid, updating UI...');
                updateSessionStatusUI('invalid');
                
                // Show session expired dialog
                if (window.Swal) {
                    await Swal.fire({
                        title: 'Session Expired',
                        text: 'Your session has expired. Please log in again.',
                        icon: 'warning',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#f59e0b',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                }
                
                // Force logout
                await window.logout();
            } else {
                // Session is valid, update UI to show active status
                updateSessionStatusUI('active');
            }
        } catch (error) {
            console.error('Error validating current session:', error);
            updateSessionStatusUI('invalid');
        }
    }
}

// ENHANCED LOGOUT WITH SESSION MANAGEMENT
window.logout = async function () {
    try {
        // Set logout flag to prevent loading screen conflicts
        isLoggingOut = true;
        
        // Clear any existing loading timeouts immediately
        if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
        }
        
        const currentEmail = localStorage.getItem('currentUserEmail');
        
        console.log('Starting smart logout process...');
        
        // STOP ACTIVITY TRACKING IMMEDIATELY
        stopActivityTracking();
        
        // Terminate session in Firestore (don't wait if it takes too long)
        if (currentEmail) {
            terminateUserSession(currentEmail).catch(error => {
                console.error('Error terminating session in Firestore:', error);
                // Continue with logout even if session termination fails
            });
        }
        
        // Clear local storage and hide session status immediately
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('currentUserEmail');
        hideSessionStatusUI();
        
        // Hide any existing loading screen immediately
        forceHideLoadingScreen();
        
        // Sign out from Firebase Auth
        await auth.signOut();
        console.log('Firebase auth sign out complete');
        
        // Show brief logout success message (no blocking)
        if (window.Swal) {
            Swal.fire({
                title: 'Logged Out',
                text: 'Successfully logged out.',
                icon: 'success',
                timer: 400,
                showConfirmButton: false,
                background: '#ffffff',
                color: '#1f2937'
            });
        }
        
        // Reload immediately
        setTimeout(() => {
            location.reload();
        }, 50);
        
    } catch (error) {
        console.error('Error during logout:', error);
        
        // Clear any existing loading timeouts
        if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
        }
        
        // Clear local state on error
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('currentUserEmail');
        
        // Hide loading screen and reload immediately
        forceHideLoadingScreen();
        setTimeout(() => {
            location.reload();
        }, 50);
    }
};

// Example change password functionality (Optional)
// removed duplicate placeholder to avoid conflicts

// Load Barangay List from Firestore
async function loadBarangaysFromFirebase() {
    const tableBody = document.getElementById("barangayTableBody");
    if (!tableBody) return;

    // Unsubscribe from previous listener to prevent duplicates
    if (window._barangayUnsubscribe) {
        try {
            window._barangayUnsubscribe();
        } catch (error) {
            console.warn('Error unsubscribing from previous barangay listener:', error);
        }
    }

    tableBody.innerHTML = "";

    const barangaysRef = collection(db, "users");
    const q = query(barangaysRef, where("role", "==", "barangay"));

    // Store the unsubscribe function to prevent multiple listeners
    window._barangayUnsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('Loading barangays from Firebase, found:', snapshot.size, 'barangays');
        
        // Clear table to prevent duplicates
        tableBody.innerHTML = "";
        
        if (snapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='3'>No data available</td></tr>";
            return;
        }
        
        // Use a Map to track already processed barangays and prevent duplicates
        // Store both the name and the document data for better deduplication
        const processedBarangays = new Map();
        
        for (const docSnap of snapshot.docs) {
            const barangayData = docSnap.data();
            const barangayName = (barangayData.username?.replace('barangay_', '') || barangayData.barangayName || '').toLowerCase().trim();
            
            // Skip if barangay name is empty or invalid
            if (!barangayName) {
                console.warn('Invalid barangay name found in document:', docSnap.id, '- skipping');
                continue;
            }
            
            // Skip if we've already processed this barangay name (case-insensitive)
            if (processedBarangays.has(barangayName)) {
                console.warn('Duplicate barangay found:', barangayName, '- skipping duplicate document:', docSnap.id);
                continue;
            }
            
            // Add to processed map with the original case name as display value
            const displayName = barangayData.username?.replace('barangay_', '') || barangayData.barangayName || barangayName;
            processedBarangays.set(barangayName, { docId: docSnap.id, displayName, data: barangayData });
            
            // Count residents linked to this barangay (use display name for querying)
            const residentsRef = collection(db, "residents");
            const residentsQ = query(residentsRef, where("barangay", "==", displayName));
            const residentsSnap = await getDocs(residentsQ);
            const residentCount = residentsSnap.size;

            const tr = document.createElement('tr');
            const tdB = document.createElement('td'); tdB.textContent = displayName;
            const tdCount = document.createElement('td'); tdCount.textContent = String(residentCount);
            const tdAct = document.createElement('td');
            const btn = document.createElement('button');
            btn.className = 'view-residents-btn';
            btn.setAttribute('data-id', docSnap.id);
            btn.setAttribute('data-bname', displayName);
            btn.textContent = 'View';
            btn.addEventListener('click', () => window.viewBarangay(docSnap.id, displayName));
            tdAct.appendChild(btn);
            tr.appendChild(tdB); tr.appendChild(tdCount); tr.appendChild(tdAct);
            tableBody.appendChild(tr);
        }
        
        console.log('Barangay table updated with', processedBarangays.size, 'unique barangays');
    });
    // Ensure click works even if inline is skipped
    tableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-residents-btn');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const bname = btn.getAttribute('data-bname');
        console.log('[barangayTable] View clicked for', bname, 'id:', id);
        if (typeof window.viewBarangay === 'function') {
            window.viewBarangay(id, bname);
        }
    });
}

// Handle Viewing Barangay Residents
// View Residents Modal with Search Filter
// (Removed duplicate window.viewBarangay; unified implementation is defined later)

// Function to schedule a delivery
async function loadBarangayDropdown() {
    const barangaySelect = document.getElementById("barangaySelect");
    if (!barangaySelect) {
        console.warn("[loadBarangayDropdown] barangaySelect element not found");
        return;
    }

    barangaySelect.innerHTML = ""; // Clear it first!

    // Add a default option (optional)
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Barangay";
    barangaySelect.appendChild(defaultOption);

    // Fetch barangays from the "users" collection
    const q = query(collection(db, "users"), where("role", "==", "barangay"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = data.username; // Assuming 'username' is unique
        option.textContent = data.username.replace("barangay_", ""); // Remove prefix
        barangaySelect.appendChild(option);
    });
}

// Function to load deliveries for a barangay
// Add a new function to fetch deliveries for the logged-in barangay
// Update loadBarangayDeliveries to include status update buttons

// Live updates for Barangay Deliveries

function loadBarangayDeliveries(barangay) {
    const tableBody = document.getElementById("deliveriesTableBody");
    if (!tableBody) {
        console.warn("[Barangay Deliveries] Table body not found.");
        return;
    }
    const deliveriesRef = collection(db, "deliveries");
    const q = query(deliveriesRef, where("barangay", "==", barangay));

    if (window._unsubDeliveries) { try { window._unsubDeliveries(); } catch(_) {} }
    const unsub = onSnapshot(q, (snapshot) => {
        tableBody.innerHTML = "";
        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">No deliveries scheduled yet.</td>
                </tr>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            const row = document.createElement('tr');
            const deliveryDate = d.deliveryDate?.toDate?.();
            const dateStr = deliveryDate ? deliveryDate.toLocaleDateString() : 'No Date';
            
            // Create enhanced details with goods information including custom items
            const goodsItems = [];
            if (d.goods) {
                if (d.goods.rice > 0) goodsItems.push(`${d.goods.rice} Rice`);
                if (d.goods.biscuits > 0) goodsItems.push(`${d.goods.biscuits} Biscuits`);
                if (d.goods.canned > 0) goodsItems.push(`${d.goods.canned} Canned`);
                if (d.goods.shirts > 0) goodsItems.push(`${d.goods.shirts} Shirts`);
            }
            
            // Add custom items to goods display
            if (d.customItems) {
                Object.entries(d.customItems).forEach(([itemName, quantity]) => {
                    if (quantity > 0) {
                        const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1).replace(/([A-Z])/g, ' $1');
                        goodsItems.push(`${quantity} ${displayName}`);
                    }
                });
            }
            
            const detailsPreview = d.details || 'No description';
            const goodsPreview = goodsItems.join(', ');
            
            const hasExpandableDetails = goodsItems.length > 0 || (d.details && d.details.length > 40);
            
            // Create table cells
            // Date & Time Column
            const tdDate = document.createElement('td');
            tdDate.innerHTML = `
                <div class="date-cell">
                    <span class="date-text">${dateStr}</span>
                </div>
            `;
            
            // Items & Quantity Column 
            const tdItems = document.createElement('td');
            const itemsSummary = goodsItems.length > 0 ? goodsItems.join('<br>') : 'No items specified';
            tdItems.innerHTML = `
                <div class="items-cell">
                    <div class="items-content">${itemsSummary}</div>
                </div>
            `;
            
            // Details Column
            const tdDetails = document.createElement('td');
            tdDetails.innerHTML = `
                <div class="details-cell" ${hasExpandableDetails ? `onclick="toggleBarangayDeliveryDetails('${docSnap.id}')" style="cursor: pointer;"` : ''}>
                    <div class="details-preview">
                        <div class="details-text" title="${d.details || 'No description'}">
                            ${detailsPreview}
                            ${hasExpandableDetails ? '<span class="expand-indicator">▼</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Status Column (text-only badge)
            const tdStatus = document.createElement('td');
            const statusClass = getStatusClass(d.status || 'Pending');
            tdStatus.innerHTML = `
                <div class="status-cell">
                    <span class="status-badge ${statusClass}">
                        <span class="status-text">${d.status || 'Pending'}</span>
                    </span>
                </div>
            `;
            
            row.appendChild(tdDate);
            row.appendChild(tdItems);
            row.appendChild(tdDetails);
            row.appendChild(tdStatus);
            const tdBtn = document.createElement('td');
            
            // Create action buttons container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'barangay-action-buttons';
            
            // Add Receive button if delivery is not yet received
            const currentStatus = d.status || 'Pending';
            if (currentStatus !== 'Received') {
                const receiveBtn = document.createElement('button');
                receiveBtn.innerHTML = 'Receive';
                receiveBtn.className = 'receive-btn';
                receiveBtn.title = 'Mark delivery as received';
                receiveBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row expansion
                    confirmReceiveDelivery(docSnap.id, d);
                });
                buttonContainer.appendChild(receiveBtn);
            }
            
            // Add Print button
            const printBtn = document.createElement('button');
            printBtn.innerHTML = 'Print';
            printBtn.className = 'print-receipt-btn';
            printBtn.title = 'Print delivery receipt';
            printBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row expansion
                printBarangayDeliveryReceipt(docSnap.id, d);
            });
            
            buttonContainer.appendChild(printBtn);
            tdBtn.appendChild(buttonContainer);
            row.appendChild(tdBtn);
            tableBody.appendChild(row);
            
            // Create expandable details row if needed (like admin design)
            if (hasExpandableDetails) {
                const expandRow = document.createElement("tr");
                expandRow.className = "details-expanded-row hidden";
                expandRow.id = `barangay-details-row-${docSnap.id}`;
                
                const expandCell = document.createElement("td");
                expandCell.colSpan = 5; // 5 columns for barangay table: Date, Items, Details, Status, Actions
                expandCell.innerHTML = `
                    <div class="expanded-content">
                        <div class="full-details">
                            <h4>Full Details:</h4>
                            <p>${d.details || 'No description provided'}</p>
                        </div>
                        <div class="full-goods">
                            <h4>Items Received:</h4>
                            <div class="goods-grid">
                                ${goodsItems.map(item => `<span class="goods-item">${item}</span>`).join('')}
                            </div>
                            ${goodsItems.length === 0 ? '<p class="no-goods">No specific items listed</p>' : ''}
                        </div>
                    </div>
                `;
                
                expandRow.appendChild(expandCell);
                tableBody.appendChild(expandRow);
            }
        });
    });
    window._unsubDeliveries = unsub;
    window.App.addListener('deliveryStatus', unsub);
}

// Function to update delivery status
async function updateDeliveryStatus(deliveryId, newStatus) {
    try {
        // Get delivery data first
        const deliveryRef = doc(db, "deliveries", deliveryId);
        const deliverySnap = await getDoc(deliveryRef);
        const deliveryData = deliverySnap.data();
        
        await updateDoc(deliveryRef, {
            status: newStatus,
            updatedAt: new Date()
        });
        
        // If marking as "Received" (goods actually delivered) and not already deducted, deduct inventory
        if (newStatus === 'Received' && deliveryData?.goods && !(await isDeliveryDeducted(deliveryId))) {
            try {
                await updateInventoryTransaction({
                    rice: -Number(deliveryData.goods.rice || 0),
                    biscuits: -Number(deliveryData.goods.biscuits || 0),
                    canned: -Number(deliveryData.goods.canned || 0),
                    shirts: -Number(deliveryData.goods.shirts || 0)
                });
                
                // Mark as deducted and log transaction
                await markDeliveryDeducted(deliveryId);
                await logInventoryTransaction({
                    action: 'delivery',
                    type: 'deduction',
                    deliveryId,
                    barangay: deliveryData.barangay?.replace('barangay_', '') || 'Unknown',
                    items: deliveryData.goods,
                    user: loggedInUserData?.username || 'System',
                    description: `Delivery to ${deliveryData.barangay?.replace('barangay_', '') || 'Unknown'}`
                });
                
                console.log(`Inventory deducted for delivery ${deliveryId}`);
                showSuccess(`Delivery marked as received. Inventory has been automatically updated.`);
                return; // Exit early since we already showed success message
            } catch (inventoryError) {
                console.error('Inventory deduction failed:', inventoryError);
                if (inventoryError.message === 'INSUFFICIENT_INVENTORY') {
                    showError('Insufficient inventory for this delivery. Please add stock first.');
                    return;
                }
            }
        }
        
        console.log(`Delivery ${deliveryId} status updated to ${newStatus}`);
        if (newStatus !== 'Received') {
            showSuccess(`Delivery status updated to ${newStatus}`);
        }
        
        // Refresh the deliveries table to show updated status
        const currentUser = auth.currentUser;
        if (currentUser) {
            const userData = await getDoc(doc(db, "users", currentUser.uid));
            if (userData.exists()) {
                const userDataObj = userData.data();
                if (userDataObj.role === 'admin') {
                    loadAllDeliveriesForAdmin();
                } else {
                    loadBarangayDeliveries(userDataObj.username);
                }
            }
        }
        
        // Refresh inventory totals if available
        if (typeof window.refreshInventoryTotals === 'function') {
            await window.refreshInventoryTotals();
        }
        
        // Update inventory display in delivery form
        if (typeof updateInventoryDisplay === 'function') {
            await updateInventoryDisplay();
        }
    } catch (error) {
        console.error("Error updating delivery status:", error);
        showError("Failed to update delivery status. Please try again.");
    }
}

// Function to handle scheduling deliveries
let isSchedulingDelivery = false; // Global flag to prevent duplicates

async function handleScheduleDelivery() {
    // Prevent duplicate submissions
    if (isSchedulingDelivery) {
        console.log('Delivery scheduling already in progress, ignoring duplicate request');
        return;
    }
    
    isSchedulingDelivery = true;
    
    try {
        // Get form values
        const barangay = document.getElementById("barangaySelect").value;
        const deliveryDate = document.getElementById("deliveryDate").value;
        const deliveryDetails = document.getElementById("deliveryDetails").value;

        const goods = {
            rice: Number(document.getElementById('goodsRice')?.value || 0),
            biscuits: Number(document.getElementById('goodsBiscuits')?.value || 0),
            canned: Number(document.getElementById('goodsCanned')?.value || 0),
            shirts: Number(document.getElementById('goodsShirts')?.value || 0),
        };
        
        // Collect custom items from delivery form
        const customInputs = document.querySelectorAll('#deliveryForm input[data-item]');
        const customItems = {};
        customInputs.forEach(input => {
            const key = input.getAttribute('data-item');
            const value = Number(input.value || 0);
            if (value > 0 && key) {
                // Skip basic items (they're already handled above)
                if (!['rice', 'biscuits', 'canned', 'shirts'].includes(key)) {
                    customItems[key] = value;
                    // Also add to goods object for validation
                    goods[key] = value;
                }
            }
        });
        
        console.log('Custom items for delivery:', customItems);

        if (!barangay || !deliveryDate || !deliveryDetails) {
            if (window.Swal) {
                await Swal.fire({
                    title: 'Schedule Failed',
                    text: 'Please complete all required fields.',
                    icon: 'error',
                    confirmButtonText: 'Retry',
                    confirmButtonColor: '#2563eb',
                    background: '#ffffff',
                    color: '#1f2937',
                    didOpen: (popup) => {
                        popup.style.borderTop = '6px solid #ef4444';
                        popup.style.borderBottom = '6px solid #2563eb';
                    }
                });
            } else {
                showError("All fields are required!");
            }
            return;
        }
        
        // Validate that at least one item has quantity > 0
        const basicItemsTotal = goods.rice + goods.biscuits + goods.canned + goods.shirts;
        const customItemsTotal = Object.values(customItems).reduce((sum, qty) => sum + qty, 0);
        const totalQuantity = basicItemsTotal + customItemsTotal;
        
        console.log('Delivery quantity validation:', {
            basicItems: { rice: goods.rice, biscuits: goods.biscuits, canned: goods.canned, shirts: goods.shirts },
            basicItemsTotal,
            customItems,
            customItemsTotal,
            totalQuantity
        });
        
        if (totalQuantity === 0) {
            if (window.Swal) {
                await Swal.fire({
                    title: 'No Items Selected',
                    text: 'Please specify quantities for at least one item before scheduling delivery.',
                    icon: 'warning',
                    confirmButtonText: 'Add Items',
                    confirmButtonColor: '#f59e0b',
                    background: '#ffffff',
                    color: '#1f2937',
                    didOpen: (popup) => {
                        popup.style.borderTop = '6px solid #f59e0b';
                        popup.style.borderBottom = '6px solid #ef4444';
                    }
                });
            } else {
                showError('Please specify quantities for at least one item before scheduling delivery.');
            }
            return;
        }

        // NEW: Validate inventory availability before scheduling delivery
        try {
            const inventoryValidation = await validateInventoryAvailability(goods);
            
            if (!inventoryValidation.isValid) {
                const insufficientItemsText = inventoryValidation.insufficientItems
                    .map(item => {
                        const displayName = item.isCustomItem && item.itemName ? item.itemName : item.item;
                        return `${displayName}: requested ${item.requested}, available ${item.available} (shortage: ${item.shortage})`;
                    })
                    .join('\n');
                
                const errorMessage = `Insufficient inventory for this delivery:\n\n${insufficientItemsText}\n\nPlease add more stock to inventory before scheduling this delivery.`;
                
                if (window.Swal) {
                    await Swal.fire({
                        title: 'Insufficient Inventory',
                        text: errorMessage,
                        icon: 'warning',
                        confirmButtonText: 'Add Stock First',
                        confirmButtonColor: '#f59e0b',
                        background: '#ffffff',
                        color: '#1f2937',
                        didOpen: (popup) => {
                            popup.style.borderTop = '6px solid #f59e0b';
                            popup.style.borderBottom = '6px solid #ef4444';
                        }
                    });
                } else {
                    showError(errorMessage);
                }
                return; // Prevent delivery scheduling
            }
        } catch (inventoryError) {
            console.error('Error validating inventory:', inventoryError);
            const errorMessage = 'Unable to validate inventory availability. Please try again.';
            
            if (window.Swal) {
                await Swal.fire({
                    title: 'Validation Error',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'Retry',
                    confirmButtonColor: '#2563eb'
                });
            } else {
                showError(errorMessage);
            }
            return;
        }

        // Create unique delivery ID to prevent duplicates
        const deliveryId = `${barangay}-${deliveryDate}-${Date.now()}`;
        console.log('Creating delivery:', deliveryId);

        // Save delivery with basic data and custom items
        const deliveryData = {
            deliveryId, // Add unique ID
            barangay,
            deliveryDate: Timestamp.fromDate(new Date(deliveryDate)),
            details: deliveryDetails,
            goods,
            status: 'Pending',
            timestamp: serverTimestamp(),
            createdBy: loggedInUserData?.username || 'Admin'
        };
        
        // Add custom items to delivery if any exist
        if (Object.keys(customItems).length > 0) {
            deliveryData.customItems = customItems;
            console.log('Saving delivery with custom items:', customItems);
        }
        
        await addDoc(collection(db, 'deliveries'), deliveryData);
        
        // NOTE: Inventory will be deducted when delivery is marked as 'Received'
        if (window.Swal) {
            await Swal.fire({
                title: 'Schedule Successful',
                text: 'Delivery has been successfully scheduled.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#16a34a',
                background: '#ffffff',
                color: '#1f2937',
                didOpen: (popup) => {
                    popup.style.borderTop = '6px solid #2563eb';
                    popup.style.borderBottom = '6px solid #16a34a';
                }
            });
        } else {
            showSuccess('Delivery scheduled successfully.');
        }
        // Reset form
        document.getElementById('deliveryForm')?.reset();
        
    } catch (error) {
        console.error('Error scheduling delivery:', error);
        if (window.Swal) {
            await Swal.fire({
                title: 'Schedule Failed',
                text: 'Please complete all required fields.',
                icon: 'error',
                confirmButtonText: 'Retry',
                confirmButtonColor: '#2563eb',
                background: '#ffffff',
                color: '#1f2937',
                didOpen: (popup) => {
                    popup.style.borderTop = '6px solid #ef4444';
                    popup.style.borderBottom = '6px solid #2563eb';
                }
            });
        } else {
            showError('Failed to schedule delivery.');
        }
        throw error; // Re-throw to be handled by the form submission
    } finally {
        // Always reset the flag
        setTimeout(() => {
            isSchedulingDelivery = false;
        }, 2000); // 2 second cooldown
    }
}


// Global variable to store all deliveries for filtering
let allDeliveries = [];

// Global variable to store current inventory for real-time updates
let currentInventory = { rice: 0, biscuits: 0, canned: 0, shirts: 0 };

// Function to update inventory display with color-coded quantities
async function updateInventoryDisplay() {
    try {
        // Fetch current inventory totals
        currentInventory = await getInventoryTotals();
        
        // Update each inventory hint
        const inventoryHints = {
            'riceInventory': { item: 'rice', label: 'Rice' },
            'biscuitsInventory': { item: 'biscuits', label: 'Biscuits' },
            'cannedInventory': { item: 'canned', label: 'Canned Goods' },
            'shirtsInventory': { item: 'shirts', label: 'Shirts' }
        };
        
        // Store current inventory in global variable for use by updateFormLabelsWithInventory
        window.currentInventory = currentInventory;
        
        // Don't update hints here - let updateFormLabelsWithInventory handle it
        // This prevents conflicts between the two functions
        
        // Load custom items into delivery form if we're in delivery scheduling (with safety check)
        if (document.getElementById('deliveryScheduling') && !document.getElementById('deliveryScheduling').classList.contains('hidden')) {
            // Only load custom items if the main form structure exists and is intact
            const barangaySelect = document.getElementById('barangaySelect');
            const deliveryDate = document.getElementById('deliveryDate');
            const basicItemsRow = document.querySelector('#deliveryForm .form-section .form-row');
            
            if (barangaySelect && deliveryDate && basicItemsRow) {
                console.log('Main form structure intact, loading custom items...');
                await loadCustomItemsIntoDeliveryForm();
            } else {
                console.warn('Main form structure incomplete, skipping custom items loading');
                console.log('Elements found:', {
                    barangaySelect: !!barangaySelect,
                    deliveryDate: !!deliveryDate,
                    basicItemsRow: !!basicItemsRow
                });
            }
        }
        
        // Update form labels to include quantities
        updateFormLabelsWithInventory();
        
        // Update main inventory summary if visible
        updateMainInventorySummary();
        
    } catch (error) {
        console.error('Error updating inventory display:', error);
    }
}

// Get appropriate color for inventory quantity
function getInventoryColor(quantity, isExceeding = false) {
    if (isExceeding) return '#ef4444'; // Red for exceeding stock
    if (quantity === 0) return '#9ca3af'; // Gray for empty
    if (quantity > 0 && quantity <= 10) return '#f59e0b'; // Orange for low stock
    return '#10b981'; // Green for good stock
}

// Update form labels with inventory quantities (shows remaining after input)

// duplicate removed

// SAFETY: Provide a single, robust implementation that does not alter data logic
// Attach via assignment to avoid function redeclarations across reloads
window.updateFormLabelsWithInventory = function() {
    try {
        const inventory = window.currentInventory || {};
        const basicUnits = { rice: 'sacks', biscuits: 'boxes', canned: 'boxes', shirts: 'packs' };
        const inDelivery = !!(document.getElementById('deliveryScheduling') && !document.getElementById('deliveryScheduling').classList.contains('hidden'));
        const inTrackGoods = !!(document.getElementById('trackGoods') && !document.getElementById('trackGoods').classList.contains('hidden'));

        // Helper to ensure a label has the correct base text and an inventory hint span
        const ensureLabel = (inputId, baseLabel, hintId) => {
            const input = document.getElementById(inputId);
            if (!input) return null;
            const formGroup = input.closest('.form-group');
            if (!formGroup) return null;
            const label = formGroup.querySelector('label');
            if (!label) return null;

            // Ensure base label text with unit (avoid the "Item ()" issue)
            // Preserve an existing hint span if present
            let hint = document.getElementById(hintId);
            if (!hint) {
                // Try to find existing hint span inside label
                hint = label.querySelector('.inventory-hint');
                if (hint) {
                    hint.id = hintId; // normalize id for later lookups
                }
            }

            // Force a clean base text and preserve the hint element
            const baseText = `${baseLabel}`;
            if (!hint) {
                // Try to find existing hint span inside label first
                hint = label.querySelector('.inventory-hint');
            }
            if (!hint) {
                hint = document.createElement('span');
                hint.className = 'inventory-hint';
                hint.id = hintId;
            } else {
                // Ensure the hint has the correct id for later lookups
                if (!hint.id) hint.id = hintId;
            }
            // Reset label content to guaranteed base text, then re-append hint
            label.textContent = baseText;
            label.appendChild(hint);
            return { input, label, hint };
        };

        // Basic items mapping
        const basics = [
            { key: 'rice', inputId: 'goodsRice', hintId: 'riceInventory', label: `Rice (${basicUnits.rice})` },
            { key: 'biscuits', inputId: 'goodsBiscuits', hintId: 'biscuitsInventory', label: `Biscuits (${basicUnits.biscuits})` },
            { key: 'canned', inputId: 'goodsCanned', hintId: 'cannedInventory', label: `Canned Goods (${basicUnits.canned})` },
            { key: 'shirts', inputId: 'goodsShirts', hintId: 'shirtsInventory', label: `Shirts (${basicUnits.shirts})` }
        ];

        basics.forEach(b => {
            const ctx = ensureLabel(b.inputId, b.label, b.hintId);
            if (!ctx) return;
            const available = Number(inventory[b.key] || 0);
            const requested = Number(ctx.input.value || 0);

            // Show availability only on Delivery Scheduling; hide on Track Goods
            let text = '';
            let color = getInventoryColor(available, requested > available);
            if (inDelivery) {
                if (requested > 0) {
                    if (requested > available) {
                        text = ` (Exceeds by ${requested - available}; Available: ${available})`;
                    } else {
                        const remaining = available - requested;
                        text = ` (Remaining: ${remaining} of ${available})`;
                    }
                } else {
                    text = ` (Available: ${available})`;
                }
            } else if (inTrackGoods) {
                text = '';
            }
            ctx.hint.textContent = text;
            ctx.hint.style.color = color;
            ctx.hint.style.fontWeight = '600';
            ctx.hint.style.fontSize = '0.85em';
            ctx.hint.style.marginLeft = '4px';
        });

        // Custom items (Delivery Scheduling only). Their labels already contain name + unit.
        const customs = (inventory && inventory.customItems) ? inventory.customItems : {};
        Object.entries(customs).forEach(([key, item]) => {
            const hint = document.getElementById(`custom${key}Inventory`);
            if (!hint) return;
            const input = document.getElementById(`deliveryCustom_${key}`);
            const available = Number(item?.quantity || 0);
            const requested = Number(input?.value || 0);

            let text = '';
            let color = getInventoryColor(available, requested > available);
            if (inDelivery) {
                if (requested > 0) {
                    if (requested > available) {
                        text = ` (Exceeds by ${requested - available}; Available: ${available})`;
                    } else {
                        const remaining = available - requested;
                        text = ` (Remaining: ${remaining} of ${available})`;
                    }
                } else {
                    text = ` (Available: ${available})`;
                }
            } else {
                text = '';
            }
            hint.textContent = text;
            hint.style.color = color;
            hint.style.fontWeight = '600';
            hint.style.fontSize = '0.85em';
            hint.style.marginLeft = '4px';
        });
    } catch (e) {
        console.warn('updateFormLabelsWithInventory failed:', e);
    }
};

// Update main inventory summary display

function updateMainInventorySummary() {
    try {
        const totalsTable = document.getElementById('goodsTotalsTable');
        if (!totalsTable) return;
        const tbody = totalsTable.querySelector('tbody') || (() => { const b = document.createElement('tbody'); totalsTable.appendChild(b); return b; })();
        tbody.innerHTML = ''; // clear existing rows
        
        const inv = window.currentInventory || {};
        // Define built-in items in order
        const builtIns = [
            { key: 'rice', label: 'Rice (sacks)' },
            { key: 'biscuits', label: 'Biscuits (boxes)' },
            { key: 'canned', label: 'Canned Goods (boxes)' },
            { key: 'shirts', label: 'Shirts (packs)' }
        ];
        
        let overallTotal = 0;
        
        builtIns.forEach(item => {
            let qty = 0;
            if (typeof inv[item.key] === 'number') qty = inv[item.key];
            else if (inv[item.key] && typeof inv[item.key].quantity === 'number') qty = inv[item.key].quantity;
            overallTotal += Number(qty) || 0;
            const tr = document.createElement('tr');
            const td1 = document.createElement('td'); td1.textContent = item.label;
            const td2 = document.createElement('td'); td2.textContent = String(qty);
            tr.appendChild(td1); tr.appendChild(td2);
            tbody.appendChild(tr);
        });
        
        // Add custom items if present
        const customs = (inv && inv.customItems) ? inv.customItems : {};
        Object.entries(customs).forEach(([key, obj]) => {
            const qty = Number(obj.quantity || 0);
            overallTotal += qty;
            const tr = document.createElement('tr');
            const td1 = document.createElement('td'); td1.textContent = obj.name + ' (' + (obj.unit || '') + ')';
            const td2 = document.createElement('td'); td2.textContent = String(qty);
            tr.appendChild(td1); tr.appendChild(td2);
            tbody.appendChild(tr);
        });
        
        // Final overall total row
        const trTotal = document.createElement('tr');
        const tdLabel = document.createElement('td'); tdLabel.innerHTML = '<strong>CURRENT TOTAL</strong>';
        const tdValue = document.createElement('td'); tdValue.innerHTML = '<strong>' + String(overallTotal) + '</strong>';
        trTotal.appendChild(tdLabel); trTotal.appendChild(tdValue);
        tbody.appendChild(trTotal);
        
    } catch (e) {
        console.warn('Failed to update main inventory summary:', e);
    }
}


// Real-time validation styling for input fields
function updateInputValidationStyling() {
    const inputs = {
        'goodsRice': 'rice',
        'goodsBiscuits': 'biscuits', 
        'goodsCanned': 'canned',
        'goodsShirts': 'shirts'
    };
    
    // Handle basic inventory inputs
    Object.entries(inputs).forEach(([inputId, item]) => {
        const input = document.getElementById(inputId);
        if (input) {
            const requested = Number(input.value) || 0;
            const available = currentInventory[item] || 0;
            
            // Remove previous validation classes
            input.classList.remove('input-valid', 'input-warning', 'input-error', 'input-zero');
            
            // Add appropriate validation class
            if (requested === 0) {
                // No special styling for zero, but show total stock in tooltip
                input.title = `Total available: ${available}`;
            } else if (requested > available) {
                input.classList.add('input-error'); // Red border for exceeding stock
                input.title = `Exceeds available stock by ${requested - available}! Available: ${available}`;
            } else if (requested === available) {
                input.classList.add('input-zero'); // White/gray border for using all stock (remaining = 0)
                input.title = `Using all available stock (${available}). Remaining: 0`;
            } else if (requested > available * 0.8) {
                input.classList.add('input-warning'); // Orange border for high usage
                const remaining = available - requested;
                input.title = `High usage. Remaining: ${remaining} of ${available}`;
            } else {
                input.classList.add('input-valid'); // Green border for valid amounts
                const remaining = available - requested;
                input.title = `Valid amount. Remaining: ${remaining} of ${available}`;
            }
        }
    });
    
    // Handle custom item inputs
    const customInputs = document.querySelectorAll('#deliveryForm input[data-item]');
    customInputs.forEach(input => {
        const key = input.getAttribute('data-item');
        
        // Skip basic items (already handled above)
        if (['rice', 'biscuits', 'canned', 'shirts'].includes(key)) {
            return;
        }
        
        const requested = Number(input.value) || 0;
        let available = 0;
        
        // Get available quantity from current inventory
        if (currentInventory && currentInventory.customItems && currentInventory.customItems[key]) {
            available = currentInventory.customItems[key].quantity || 0;
        }
        
        // Remove previous validation classes
        input.classList.remove('input-valid', 'input-warning', 'input-error', 'input-zero');
        
        // Add appropriate validation class
        if (requested === 0) {
            input.title = `Total available: ${available}`;
        } else if (requested > available) {
            input.classList.add('input-error');
            input.title = `Exceeds available stock by ${requested - available}! Available: ${available}`;
        } else if (requested === available) {
            input.classList.add('input-zero');
            input.title = `Using all available stock (${available}). Remaining: 0`;
        } else if (requested > available * 0.8) {
            input.classList.add('input-warning');
            const remaining = available - requested;
            input.title = `High usage. Remaining: ${remaining} of ${available}`;
        } else {
            input.classList.add('input-valid');
            const remaining = available - requested;
            input.title = `Valid amount. Remaining: ${remaining} of ${available}`;
        }
    });
}

// Load custom items into delivery scheduling form
async function loadCustomItemsIntoDeliveryForm() {
    try {
        console.log('Loading custom items into delivery form...');
        
        // Get the form section that contains "Items & Quantities"
        const formSection = document.querySelector('#deliveryForm .form-section');
        if (!formSection) {
            console.warn('Form section not found');
            return;
        }
        
        // Clear existing custom items in delivery form
        const existingCustomItems = formSection.querySelectorAll('[data-custom-delivery-item]');
        console.log(`Removing ${existingCustomItems.length} existing custom items from delivery form`);
        existingCustomItems.forEach(item => item.remove());
        
        // Get custom items from current inventory
        const customItems = (currentInventory && currentInventory.customItems) ? currentInventory.customItems : {};
        console.log(`Found ${Object.keys(customItems).length} custom items to add`);
        
        // If there are custom items, create a new form-row for them
        if (Object.keys(customItems).length > 0) {
            const customItemsRow = document.createElement('div');
            customItemsRow.className = 'form-row';
            customItemsRow.setAttribute('data-custom-delivery-items-container', 'true');
            
            // Add each custom item to the new row
            Object.entries(customItems).forEach(([key, item]) => {
                console.log(`Adding custom item to delivery form: ${item.name} (${item.unit})`);
                
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';
                formGroup.setAttribute('data-custom-delivery-item', key);
                formGroup.innerHTML = `
                    <label for="deliveryCustom_${key}">${item.name} (${item.unit}) <span class="inventory-hint" id="custom${key}Inventory"></span></label>
                    <input type="number" id="deliveryCustom_${key}" name="deliveryCustom_${key}" min="0" value="0" class="inventory-input" data-item="${key}" data-unit="${item.unit}">
                `;
                
                customItemsRow.appendChild(formGroup);
                
                // Update the inventory hint for this custom item
                const hintElement = document.getElementById(`custom${key}Inventory`);
                if (hintElement) {
                    const quantity = item.quantity || 0;
                    const color = getInventoryColor(quantity);
                    hintElement.textContent = `(Available: ${quantity})`;
                    hintElement.style.color = color;
                    hintElement.style.fontWeight = '600';
                    hintElement.style.fontSize = '0.85em';
                }
            });
            
            // Insert the custom items row after the basic items row
            const basicItemsRow = formSection.querySelector('.form-row');
            if (basicItemsRow && basicItemsRow.nextSibling) {
                formSection.insertBefore(customItemsRow, basicItemsRow.nextSibling);
            } else {
                formSection.appendChild(customItemsRow);
            }
        }
        
        // Setup event listeners for the new custom item inputs
        setupCustomItemEventListeners();
        
            // Adjust container size to accommodate custom items
            const deliveryFormCard = document.querySelector('.delivery-form-card');
            const formSectionContainer = document.querySelector('#deliveryForm .form-section');
            
            if (deliveryFormCard && Object.keys(customItems).length > 0) {
                // Add extra padding/height to accommodate custom items
                deliveryFormCard.style.minHeight = 'auto';
                deliveryFormCard.style.paddingBottom = '2rem';
                
                if (formSectionContainer) {
                    formSectionContainer.style.marginBottom = '1.5rem';
                }
                
                console.log('Adjusted container size for custom items');
                
                // Inject CSS for better spacing
                const customFormStyles = document.getElementById('customFormStyles');
                if (!customFormStyles) {
                    const style = document.createElement('style');
                    style.id = 'customFormStyles';
                    style.textContent = `
                        /* Container fixes for 100% zoom visibility */
                        #deliveryScheduling {
                            height: auto !important;
                            min-height: 100vh !important;
                            overflow: visible !important;
                        }
                        .delivery-form-card {
                            min-height: auto !important;
                            height: auto !important;
                            overflow: visible !important;
                            max-height: none !important;
                            padding: 2rem !important;
                        }
                        #deliveryForm {
                            height: auto !important;
                            overflow: visible !important;
                            max-height: none !important;
                        }
                        #deliveryForm .form-section {
                            margin-bottom: 2rem !important;
                            height: auto !important;
                            overflow: visible !important;
                        }
                        #deliveryForm .form-row {
                            margin-bottom: 1.5rem !important;
                            height: auto !important;
                            overflow: visible !important;
                            flex-wrap: wrap !important;
                        }
                        #deliveryForm .form-row:last-child {
                            margin-bottom: 1rem !important;
                        }
                        #deliveryForm .form-group {
                            margin-bottom: 1rem !important;
                            height: auto !important;
                            min-height: auto !important;
                            overflow: visible !important;
                        }
                        #deliveryScheduling .card {
                            overflow: visible !important;
                            height: auto !important;
                            max-height: none !important;
                        }
                        .main-content {
                            height: auto !important;
                            min-height: 100vh !important;
                            overflow: visible !important;
                        }
                        /* Additional responsive fixes */
                        @media screen and (min-width: 1024px) {
                            #deliveryForm .form-row {
                                display: grid !important;
                                grid-template-columns: 1fr 1fr !important;
                                gap: 1.5rem !important;
                            }
                        }
                        /* Ensure form elements are always visible */
                        #barangaySelect, #deliveryDate, #deliveryDetails {
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            position: relative !important;
                            z-index: 1 !important;
                        }
                        #deliveryDetails {
                            min-height: 120px !important;
                            height: auto !important;
                            padding: 16px !important;
                            border: 2px solid #d1d5db !important;
                            border-radius: 12px !important;
                            background: white !important;
                            font-size: 15px !important;
                            line-height: 1.5 !important;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
                            transition: all 0.2s ease !important;
                            resize: vertical !important;
                        }
                        #deliveryDetails:hover {
                            border-color: #3b82f6 !important;
                            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1) !important;
                        }
                        #deliveryDetails:focus {
                            outline: none !important;
                            border-color: #2563eb !important;
                            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
                        }
                        #barangaySelect, #deliveryDate {
                            height: 52px !important;
                            min-height: 52px !important;
                            padding: 14px 18px !important;
                            border: 2px solid #d1d5db !important;
                            border-radius: 12px !important;
                            font-size: 16px !important;
                            line-height: 1.5 !important;
                            background: white !important;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
                            transition: all 0.2s ease !important;
                            cursor: pointer !important;
                        }
                        #barangaySelect:hover, #deliveryDate:hover {
                            border-color: #3b82f6 !important;
                            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1) !important;
                            transform: translateY(-1px) !important;
                        }
                        #barangaySelect:focus, #deliveryDate:focus {
                            outline: none !important;
                            border-color: #2563eb !important;
                            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
                        }
                        .select-wrapper, .date-wrapper {
                            height: auto !important;
                            min-height: 52px !important;
                            position: relative !important;
                        }
                        .select-wrapper::after {
                            content: '▼' !important;
                            position: absolute !important;
                            right: 16px !important;
                            top: 50% !important;
                            transform: translateY(-50%) !important;
                            pointer-events: none !important;
                            color: #6b7280 !important;
                            font-size: 14px !important;
                        }
                        #deliveryForm input[type="number"] {
                            height: 46px !important;
                            min-height: 46px !important;
                            padding: 12px 14px !important;
                            font-size: 15px !important;
                            border: 2px solid #d1d5db !important;
                            border-radius: 10px !important;
                            background: white !important;
                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
                            transition: all 0.2s ease !important;
                        }
                        #deliveryForm input[type="number"]:hover {
                            border-color: #3b82f6 !important;
                            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1) !important;
                        }
                        #deliveryForm input[type="number"]:focus {
                            outline: none !important;
                            border-color: #2563eb !important;
                            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
                        }
                    `;
                    document.head.appendChild(style);
                    console.log('Custom form spacing styles injected');
                }
            }
            
            console.log('Custom items loaded into delivery form successfully');
            
        } catch (error) {
            console.error('Error loading custom items into delivery form:', error);
        }
}

// Setup event listeners for custom item inputs in delivery form
function setupCustomItemEventListeners() {
    const customInputs = document.querySelectorAll('#deliveryForm input[data-item]');
    
    customInputs.forEach(input => {
        // Skip if already has listeners (to avoid duplicates)
        if (input.hasAttribute('data-listeners-attached')) {
            return;
        }
        
        input.classList.add('inventory-input');
        
        // Add real-time validation on input
        input.addEventListener('input', function() {
            updateInputValidationStyling();
            updateFormLabelsWithInventory();
        });
        
        // Add validation on blur (when user leaves field)
        input.addEventListener('blur', function() {
            updateInputValidationStyling();
            updateFormLabelsWithInventory();
        });
        
        // Add validation on keyup for immediate feedback
        input.addEventListener('keyup', function() {
            updateFormLabelsWithInventory();
        });
        
        // Mark as having listeners attached
        input.setAttribute('data-listeners-attached', 'true');
    });
}

// Setup event listeners for inventory tracking
function setupInventoryEventListeners() {
    const inventoryInputs = ['goodsRice', 'goodsBiscuits', 'goodsCanned', 'goodsShirts'];
    
    inventoryInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Add inventory-input class for styling
            input.classList.add('inventory-input');
            
            // Add real-time validation on input
            input.addEventListener('input', function() {
                updateInputValidationStyling();
                updateFormLabelsWithInventory(); // Update remaining stock display
            });
            
            // Add validation on blur (when user leaves field)
            input.addEventListener('blur', function() {
                updateInputValidationStyling();
                updateFormLabelsWithInventory(); // Update remaining stock display
            });
            
            // Add validation on keyup for immediate feedback
            input.addEventListener('keyup', function() {
                updateFormLabelsWithInventory(); // Update remaining stock display
            });
        }
    });
    
    // Also setup listeners for any existing custom items
    setupCustomItemEventListeners();
    
    // Initial validation styling
    updateInputValidationStyling();
}

function loadAllDeliveriesForAdmin() {
    const tableBody = document.getElementById("adminDeliveriesTableBody");
    if (!tableBody) {
        console.warn("[Admin Deliveries] Table body not found.");
        return;
    }

    const deliveriesRef = collection(db, "deliveries");

    onSnapshot(deliveriesRef, (snapshot) => {
        console.log("[Admin Deliveries] Snapshot size:", snapshot.size);
        
        // Clear global deliveries array
        allDeliveries = [];
        
        if (snapshot.empty) {
            console.log("[Admin Deliveries] No documents found");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">No deliveries scheduled yet.</td>
                </tr>`;
            showEmptyState(true);
            return;
        }

        snapshot.forEach((docSnap) => {
            const delivery = docSnap.data();
            console.log("[Admin Deliveries] Delivery:", docSnap.id, delivery);
            
            // Store delivery data for filtering
            allDeliveries.push({
                id: docSnap.id,
                barangay: delivery.barangay ? delivery.barangay.replace("barangay_", "") : "Unknown",
                deliveryDate: delivery.deliveryDate?.toDate?.() || null,
                details: delivery.details || "No Details",
                status: delivery.status || "Pending",
                rawData: delivery
            });
        });
        
        // Render all deliveries initially
        renderDeliveries(allDeliveries);
        
        // Setup search and filter event listeners
        setupDeliverySearchAndFilters();
    });
}

// Enhanced delivery rendering with better UI (back to original structure)
function renderDeliveries(deliveries) {
    const tableBody = document.getElementById("adminDeliveriesTableBody");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    if (deliveries.length === 0) {
        showEmptyState(true);
        return;
    }
    
    showEmptyState(false);
    
    deliveries.forEach((delivery) => {
        const row = document.createElement("tr");
        row.className = "delivery-row";
        
        // Barangay with professional styling
        const tdBarangay = document.createElement("td");
        tdBarangay.innerHTML = `
            <div class="barangay-cell">
                <span class="barangay-name">${delivery.barangay}</span>
            </div>
        `;
        row.appendChild(tdBarangay);

        // Delivery Date with professional styling
        const tdDate = document.createElement("td");
        const deliveryDate = delivery.deliveryDate;
        const dateText = deliveryDate ? deliveryDate.toLocaleDateString() : "No Date";
        const dateClass = deliveryDate && deliveryDate < new Date() ? "past-date" : "future-date";
        tdDate.innerHTML = `
            <div class="date-cell ${dateClass}">
                <div class="date-info">
                    <span class="date-text">${dateText}</span>
                </div>
            </div>
        `;
        row.appendChild(tdDate);

        // Items & Quantity Column including custom items
        const tdItems = document.createElement("td");
        const goodsItems = [];
        if (delivery.rawData?.goods) {
            const goods = delivery.rawData.goods;
            if (goods.rice > 0) goodsItems.push(`${goods.rice} Rice`);
            if (goods.biscuits > 0) goodsItems.push(`${goods.biscuits} Biscuits`);
            if (goods.canned > 0) goodsItems.push(`${goods.canned} Canned`);
            if (goods.shirts > 0) goodsItems.push(`${goods.shirts} Shirts`);
        }
        
        // Add custom items to admin deliveries display
        if (delivery.rawData?.customItems) {
            Object.entries(delivery.rawData.customItems).forEach(([itemName, quantity]) => {
                if (quantity > 0) {
                    const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1).replace(/([A-Z])/g, ' $1');
                    goodsItems.push(`${quantity} ${displayName}`);
                }
            });
        }
        
        const itemsSummary = goodsItems.length > 0 ? goodsItems.join(', ') : 'No items specified';
        tdItems.innerHTML = `
            <div class="items-cell">
                <div class="items-content">${itemsSummary}</div>
            </div>
        `;
        row.appendChild(tdItems);
        
        // Details Column (full text, with dropdown)
        const tdDetails = document.createElement("td");
        const detailsPreview = delivery.details;
        const hasExpandedDetails = (goodsItems.length > 0);
        
        tdDetails.innerHTML = `
            <div class="details-cell">
                <div class="details-preview" ${hasExpandedDetails ? `onclick="toggleDeliveryDetails('${delivery.id}')" style="cursor: pointer;"` : ''}>
                    <div class="details-text" title="${delivery.details}">
                        ${detailsPreview}
                        ${hasExpandedDetails ? '<span class="expand-indicator">▼</span>' : ''}
                    </div>
                </div>
            </div>
        `;
        row.appendChild(tdDetails);

        // Status with enhanced styling
        const tdStatus = document.createElement("td");
        const statusClass = getStatusClass(delivery.status);
        tdStatus.innerHTML = `
            <div class="status-cell">
                <span class="status-badge ${statusClass}">
                    <span class="status-text">${delivery.status}</span>
                </span>
            </div>
        `;
        row.appendChild(tdStatus);

        // Action with enhanced styling (Print and Delete with proper spacing)
        const tdAction = document.createElement("td");
        tdAction.innerHTML = `
            <div class="admin-action-buttons">
                <button class="admin-print-btn" onclick="printDeliveryReceipt('${delivery.id}')">
                    Print
                </button>
                <button class="admin-delete-btn" onclick="deleteDelivery('${delivery.id}')">
                    Delete
                </button>
            </div>
        `;
        row.appendChild(tdAction);

        tableBody.appendChild(row);
        
        // Create expandable details row if needed
        if (goodsItems.length > 0 || delivery.details.length > 50) {
            const expandRow = document.createElement("tr");
            expandRow.className = "details-expanded-row hidden";
            expandRow.id = `details-row-${delivery.id}`;
            
            const expandCell = document.createElement("td");
            expandCell.colSpan = 6; // Updated for 6 columns: Barangay, Date & Time, Items & Quantity, Details, Status, Actions
            
            expandCell.innerHTML = `
                <div class="expanded-content">
                    <div class="expanded-row">
                        <div class="expanded-section">
                            <h4>Full Details:</h4>
                            <p>${delivery.details}</p>
                        </div>
                        <div class="expanded-section">
                            <h4>Items to Deliver:</h4>
                            <div class="goods-grid">
                                ${goodsItems.map(item => `<span class="goods-item">${item}</span>`).join('')}
                            </div>
                            ${goodsItems.length === 0 ? '<p class="no-goods">No specific items listed</p>' : ''}
                        </div>
                    </div>
                    <div class="expanded-metadata">
                        <span class="metadata-item"><strong>Created By:</strong> ${delivery.rawData?.createdBy || 'Unknown'}</span>
                    </div>
                </div>
            `;
            
            expandRow.appendChild(expandCell);
            tableBody.appendChild(expandRow);
        }
        });
}

// Helper function for modern status classes
function getModernStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'received': return 'received';
        case 'pending': return 'pending';
        case 'in transit': return 'in-transit';
        case 'delayed': return 'delayed';
        default: return 'pending';
    }
}

// Toggle description details dropdown
function toggleDescriptionDetails(deliveryId) {
    const descFullElement = document.getElementById(`descFull_${deliveryId}`);
    const arrowElement = document.getElementById(`arrow_${deliveryId}`);
    
    if (!descFullElement || !arrowElement) return;
    
    if (descFullElement.style.display === 'none' || !descFullElement.style.display) {
        // Show full description
        descFullElement.style.display = 'block';
        arrowElement.style.transform = 'rotate(180deg)';
        arrowElement.innerHTML = '▲';
    } else {
        // Hide full description
        descFullElement.style.display = 'none';
        arrowElement.style.transform = 'rotate(0deg)';
        arrowElement.innerHTML = '▼';
    }
}

// Helper functions for enhanced UI
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'pending': return 'status-pending';
        case 'in transit': return 'status-transit';
        case 'received': return 'status-received';
        default: return 'status-pending';
    }
}

function getStatusIcon(status) {
    switch (status.toLowerCase()) {
        case 'pending': return '<span class="material-icons">pending</span>';
        case 'in transit': return '<span class="material-icons">local_shipping</span>';
        case 'received': return '<span class="material-icons">check_circle</span>';
        default: return '<span class="material-icons">pending</span>';
    }
}

function showEmptyState(show) {
    const emptyMessage = document.getElementById("noDeliveriesMessage");
    const tableContainer = document.querySelector(".table-container");
    
    if (emptyMessage && tableContainer) {
        if (show) {
            emptyMessage.classList.remove("hidden");
            tableContainer.style.display = "none";
        } else {
            emptyMessage.classList.add("hidden");
            tableContainer.style.display = "block";
        }
    }
}

// Toggle delivery details expansion
function toggleDeliveryDetails(deliveryId) {
    const detailsRow = document.getElementById(`details-row-${deliveryId}`);
    const mainRow = detailsRow?.previousElementSibling;
    const indicator = mainRow?.querySelector('.expand-indicator');
    
    if (detailsRow && mainRow) {
        const isExpanding = detailsRow.classList.contains('hidden');
        detailsRow.classList.toggle('hidden');
        
        // Rotate the indicator and add visual feedback
        if (indicator) {
            indicator.style.transform = isExpanding ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        
        // Add visual feedback to the main row
        if (isExpanding) {
            mainRow.classList.add('row-expanded');
            detailsRow.style.display = 'table-row';
        } else {
            mainRow.classList.remove('row-expanded');
            detailsRow.style.display = 'none';
        }
    }
}

// Setup search and filter functionality
function setupDeliverySearchAndFilters() {
    const searchInput = document.getElementById("deliverySearchInput");
    const statusFilter = document.getElementById("statusFilter");
    const dateFilter = document.getElementById("dateFilter");
    const clearFiltersBtn = document.getElementById("clearFilters");
    
    if (searchInput) {
        searchInput.addEventListener("input", filterDeliveries);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener("change", filterDeliveries);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener("change", filterDeliveries);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", clearDeliveryFilters);
    }
}

// Filter deliveries based on search and filter criteria
function filterDeliveries() {
    const searchTerm = document.getElementById("deliverySearchInput")?.value.toLowerCase() || "";
    const statusFilter = document.getElementById("statusFilter")?.value || "";
    const dateFilter = document.getElementById("dateFilter")?.value || "";
    
    let filteredDeliveries = allDeliveries.filter(delivery => {
        // Search filter
        const matchesSearch = !searchTerm || 
            delivery.barangay.toLowerCase().includes(searchTerm) ||
            delivery.details.toLowerCase().includes(searchTerm) ||
            (delivery.deliveryDate && delivery.deliveryDate.toLocaleDateString().includes(searchTerm));
        
        // Status filter
        const matchesStatus = !statusFilter || delivery.status.toLowerCase() === statusFilter.toLowerCase();
        
        // Date filter
        let matchesDate = true;
        if (dateFilter && delivery.deliveryDate) {
            const today = new Date();
            const deliveryDate = delivery.deliveryDate;
            
            switch (dateFilter) {
                case 'today':
                    matchesDate = deliveryDate.toDateString() === today.toDateString();
                    break;
                case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = deliveryDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    matchesDate = deliveryDate >= monthAgo;
                    break;
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    renderDeliveries(filteredDeliveries);
}

// Clear all filters
function clearDeliveryFilters() {
    const searchInput = document.getElementById("deliverySearchInput");
    const statusFilter = document.getElementById("statusFilter");
    const dateFilter = document.getElementById("dateFilter");
    
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "";
    if (dateFilter) dateFilter.value = "";
    
    renderDeliveries(allDeliveries);
}

// Enhanced delete delivery function
async function deleteDelivery(deliveryId) {
    try {
        console.log('Deleting delivery:', deliveryId);
        
        let confirmed = true;
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Delete Scheduled Delivery?',
                html: `
                    <div style="text-align: left; margin: 15px 0;">
                        <p><strong>Are you sure you want to delete this scheduled delivery?</strong></p>
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>Warning:</strong> This action cannot be undone. The delivery will be permanently removed from the system.
                            </p>
                        </div>
                        <p style="color: #6b7280; font-size: 0.9em;">
                            This will remove the scheduled delivery and all associated information.
                        </p>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete Delivery',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                background: '#ffffff',
                color: '#1f2937',
                allowOutsideClick: false,
                didOpen: (popup) => {
                    popup.style.borderTop = '6px solid #ef4444';
                }
            });
            confirmed = result.isConfirmed;
        } else {
            confirmed = confirm('Are you sure you want to delete this scheduled delivery? This action cannot be undone.');
        }

        if (!confirmed) return;

        await deleteDoc(doc(db, 'deliveries', deliveryId));

        if (window.Swal) {
            await Swal.fire({
                title: 'Delivery Deleted Successfully!',
                text: 'The scheduled delivery has been permanently removed from the system.',
                icon: 'success',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#16a34a',
                background: '#ffffff',
                color: '#1f2937',
                timer: 3000,
                timerProgressBar: true,
                didOpen: (popup) => {
                    popup.style.borderTop = '6px solid #16a34a';
                }
            });
        } else {
            showSuccess('Scheduled delivery deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting delivery:', error);
        if (window.Swal) {
            await Swal.fire({
                title: 'Delete Failed',
                text: 'Failed to delete delivery. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
        } else {
            showError('Failed to delete delivery. Please try again.');
        }
    }
}

// Initialize form enhancements
function initializeFormEnhancements() {
    console.log('Initializing form enhancements...');

    // Ensure global functions are wired before we verify
    try { setupGlobalFunctions(); } catch (_) {}
    
    // Apply to login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Remove existing listeners to avoid duplicates
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        
        newForm.addEventListener('submit', handleLogin);
    }
    
    // Apply to request account form
    const requestForm = document.getElementById('requestAccountForm');
    if (requestForm) {
        const newForm = requestForm.cloneNode(true);
        requestForm.parentNode.replaceChild(newForm, requestForm);
        
        newForm.addEventListener('submit', handleRequestAccount);
    }
    
    // Add simple event listener for cancel button (no double-click prevention)
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');
    
    if (cancelRequestBtn) {
        cancelRequestBtn.addEventListener('click', hideRequestAccount);
    }
    
    // Apply enhanced prevention to key buttons (excluding request account buttons)
    const buttons = {
        'togglePassword': () => {
            const passwordInput = document.getElementById('password');
            const toggleBtn = document.getElementById('togglePassword');
            if (passwordInput && toggleBtn) {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                toggleBtn.textContent = type === 'password' ? 'visibility_off' : 'visibility';
            }
        }
    };
    
    Object.entries(buttons).forEach(([id, action]) => {
        const button = document.getElementById(id);
        if (button && typeof action === 'function') {
            addDoubleClickPrevention(button, action, {
                loadingText: 'Processing...',
                cooldown: 500,
                preventMultiple: false
            });
        }
    });
    
    // Verify all required global functions are available
    verifyGlobalFunctions();
    
    console.log('Form enhancements initialized successfully.');
}

// Setup global functions by overriding HTML placeholders with full implementations
function setupGlobalFunctions() {
    console.log('Setting up global functions with full implementations...');
    
    // Expose modal and navigation functions globally so HTML onclick handlers use a single source
    window.showSection = showSection;
    window.showAddResidentModal = showAddResidentModal;
    window.closeAddResidentModal = closeAddResidentModal;
    window.closeEditResidentModal = closeEditResidentModal;

    // Edit and delete functions are handled by event delegation
    window.toggleBarangayDeliveryDetails = toggleBarangayDeliveryDetails;
    window.printBarangayDeliveryReceipt = printBarangayDeliveryReceipt;
    
    // Override other functions
    // window.logout is already defined above
    
    // Functions that exist in different places
    if (typeof viewBarangay === 'function') {
        window.viewBarangay = viewBarangay;
    }
    if (typeof clearDeliveryFilters === 'function') {
        window.clearDeliveryFilters = clearDeliveryFilters;
    }
    if (typeof deleteDelivery === 'function') {
        window.deleteDelivery = deleteDelivery;
    }
    if (typeof printDeliveryReceipt === 'function') {
        window.printDeliveryReceipt = printDeliveryReceipt;
    }
    
    console.log('Global functions setup complete - full implementations now available');
}

// Verify that all global functions used in HTML onclick handlers are available
function verifyGlobalFunctions() {
    const requiredFunctions = [
        'closeEditResidentModal',
        'closeAddResidentModal', 
        'showAddResidentModal',
        'closeApproveModal',
        'showSection',
        'toggleMobileSidebar',
        'closeMobileSidebar',
        'closeChangePasswordModal',
        'closeMessageModal',
        'showChangePassword',
        'logout',
        'editResident',
        'deleteResident',
        'viewBarangay',
        'printBarangayDeliveryReceipt',
        'toggleBarangayDeliveryDetails'
    ];
    
    const missing = [];
    const available = [];
    
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            available.push(funcName);
        } else {
            missing.push(funcName);
            // Create placeholder function to prevent errors
            window[funcName] = function(...args) {
                console.warn(`Function ${funcName} was called but not properly implemented. Args:`, args);
                if (typeof showError === 'function') {
                    showError(`Feature ${funcName.replace(/([A-Z])/g, ' $1').toLowerCase()} is not yet implemented.`);
                } else {
                    alert(`Feature ${funcName.replace(/([A-Z])/g, ' $1').toLowerCase()} is not yet implemented.`);
                }
            };
        }
    });
    
    console.log('Function verification complete:');
    console.log('Available functions:', available);
    if (missing.length > 0) {
        console.warn('Missing functions (placeholders created):', missing);
    }
    
    return { available, missing };
}

// Expose utility functions globally (modal functions handled by main.html global script)
window.clearDeliveryFilters = clearDeliveryFilters;
window.deleteDelivery = deleteDelivery;
window.printDeliveryReceipt = printDeliveryReceipt;
window.updateInventoryDisplay = updateInventoryDisplay; // For global access
// Printable delivery receipt
async function printDeliveryReceipt(deliveryId) {
    try {
        const snap = await getDoc(doc(db, 'deliveries', deliveryId));
        if (!snap.exists()) { showError('Delivery not found'); return; }
        const d = snap.data();
        const title = `Delivery Receipt - ${d.barangay || ''}`;
        const win = window.open('', '_blank');
        const now = new Date().toLocaleString();
        const goods = d.goods || { rice:0, biscuits:0, canned:0, shirts:0 };
        const customItems = d.customItems || {};
        
        // Build goods table rows
        let goodsTableRows = `
                <tr><th>Rice (sacks)</th><td>${goods.rice || 0}</td></tr>
                <tr><th>Biscuits (boxes)</th><td>${goods.biscuits || 0}</td></tr>
                <tr><th>Canned Goods (boxes)</th><td>${goods.canned || 0}</td></tr>
                <tr><th>Shirts (packs)</th><td>${goods.shirts || 0}</td></tr>
        `;
        
        // Add custom items to the table
        if (Object.keys(customItems).length > 0) {
            Object.entries(customItems).forEach(([itemName, quantity]) => {
                if (quantity > 0) {
                    const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1).replace(/([A-Z])/g, ' $1');
                    goodsTableRows += `<tr><th>${displayName}</th><td>${quantity}</td></tr>`;
                }
            });
        }
        
        const contentHTML = `
            <h3>Delivery Information</h3>
            <table>
                <tr><th>Barangay</th><td>${d.barangay || ''}</td></tr>
                <tr><th>Date</th><td>${d.deliveryDate?.toDate ? d.deliveryDate.toDate().toLocaleDateString() : new Date(d.deliveryDate).toLocaleDateString()}</td></tr>
                <tr><th>Details</th><td>${d.details || ''}</td></tr>
            </table>
            <h3>Relief Goods Delivered</h3>
            <table>
                ${goodsTableRows}
            </table>
        `;
        
        const standardHTML = generateStandardExportHTML(
            title,
            contentHTML,
            { 
                reportTitle: 'DELIVERY RECEIPT',
                includeSignatures: true 
            }
        );
        
        win.document.write(standardHTML);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 200);
    } catch (e) {
        console.error(e);
        showError('Failed to print receipt.');
    }
}

// Generic print helper for residents tables (MSWD modal and Barangay table)
function printResidents(tableId, title = 'Residents') {
    try {
        const table = document.getElementById(tableId);
        if (!table) { showError('Residents table not found.'); return; }

        const win = window.open('', '_blank');
        if (!win) { showError('Popup blocked. Allow popups to print.'); return; }

        const now = new Date().toLocaleString();
        const standardHTML = generateStandardExportHTML(
            title,
            table.outerHTML,
            { 
                reportTitle: `${title.toUpperCase()} REPORT`,
                includeSignatures: true 
            }
        );
        
        win.document.write(standardHTML);
        win.document.close();
        win.focus();
        // Slight delay to allow rendering before print
        setTimeout(() => { win.print(); win.close(); }, 200);
    } catch (err) {
        console.error('Print error:', err);
        showError('Failed to prepare print view.');
    }
}

window.printResidents = printResidents;



    async function showDeliveries() {
        const user = auth.currentUser; // Get logged-in user
        if (!user) {
            console.log("No Barangay is logged in.");
            return;
        }
    
        const barangayId = user.uid; // Use the user's UID as Barangay ID (if applicable)
    
        try {
            const deliveries = await getDeliveries(barangayUsername); // Fetch deliveries for the Barangay
            console.log("Fetched deliveries: ", deliveries); // Add this line to check deliveries
    
            if (deliveries.length === 0) {
                console.log("No deliveries scheduled.");
                return;
            }
    
            const deliveriesContainer = document.getElementById("deliveries-container");
    
            deliveries.forEach(delivery => {
                const deliveryElement = document.createElement("div");
                deliveryElement.classList.add("delivery");
    
                deliveryElement.innerHTML = `
                    <h3>Delivery ID: ${delivery.id}</h3>
                    <p>Date: ${new Date(delivery.deliveryDate.seconds * 1000).toLocaleDateString()}</p>
                    <p>Details: ${delivery.details}</p>
                    <p>Status: ${delivery.status}</p>
                `;
    
                deliveriesContainer.appendChild(deliveryElement);
            });
        } catch (error) {
            console.error("Error displaying deliveries:", error);
        }
    }
    
// Show modal when the button is clicked
function showAddResidentModal() {
    const modal = document.getElementById("addResidentModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
        modal.style.pointerEvents = "auto";
        console.log("Modal element found, hidden class removed");
        console.log("Modal classes:", modal.className);
        console.log("Modal style.display:", modal.style.display);
        console.log("Modal style.visibility:", modal.style.visibility);
        console.log("Modal style.opacity:", modal.style.opacity);
        
        // Auto-populate terrain based on barangay
        setTimeout(autoPopulateTerrainForBarangay, 100);
    } else {
        console.error("Modal element not found!");
    }

    // Check if user is logged in
    if (!loggedInUserData || !loggedInUserData.username) {
        console.error("User data not loaded properly!");
        showError("Please login again.");
        return;
    }
    
    console.log("Add Resident Modal opened successfully");
}

// Close modal
function closeAddResidentModal() {
    const modal = document.getElementById("addResidentModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
        modal.style.pointerEvents = "none";

        // Reset form and clear validation styles
        const form = document.getElementById("addResidentForm");
        if (form) form.reset();
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('error', 'success');
            input.style.borderColor = '';
        });
    }
}

// Close Edit Resident modal (single source of truth)
function closeEditResidentModal() {
    const modal = document.getElementById("editResidentModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
        modal.style.pointerEvents = "none";

        // Reset form and clear validation styles
        const form = document.getElementById("editResidentForm");
        if (form) form.reset();
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('error', 'success');
            input.style.borderColor = '';
        });
    }
}

window.loadResidentsForBarangay = async function(barangayName) {
    const tableBody = document.getElementById("residentsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = ""; // clear before loading

    const q = query(collection(db, "residents"), where("barangay", "==", barangayName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        tableBody.innerHTML = "<tr><td colspan='10'>No residents found.</td></tr>";
        return;
    }

    const residents = [];
    snapshot.forEach(docSnap => {
        const resident = docSnap.data();
        residents.push({ id: docSnap.id, ...resident });
        
        // Create status display with badges
        let status = "";
        let statusClass = "";
        if (resident.isStudent && resident.isWorking) {
            status = "Student & Working";
            statusClass = "status-both";
        } else if (resident.isStudent) {
            status = "Student";
            statusClass = "status-student";
        } else if (resident.isWorking) {
            status = "Working";
            statusClass = "status-working";
        } else {
            status = "None";
            statusClass = "status-none";
        }
        
    });

    // Sort A–Z by last name
    function lastNameOf(fullName = '') {
        const parts = String(fullName).trim().split(/\s+/);
        return parts.length ? parts[parts.length - 1].toLowerCase() : '';
    }
    residents.sort((a,b) => lastNameOf(a.name).localeCompare(lastNameOf(b.name)));

    residents.forEach((resident) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-household', String(resident.householdNumber ?? ''));

        // All resident data should now be properly saved and loaded
        
        const cells = [
    { text: resident.name ?? "", order: lastNameOf(resident.name) },
    { text: resident.age ?? "" },
    { text: resident.addressZone ?? "" },
    { text: resident.householdNumber ?? "" },
    { text: resident.gender ?? "" },
    { text: resident.householdStatus ?? "" },
    { text: resident.houseMaterial ?? "" },
    { text: resident.barangayTerrain ?? "" },
    { text: resident.familyMembers ?? "" },
    { text: resident.monthlyIncome ?? "" },
    { text: resident.aidHistory ?? "" },
    { text: resident.evacueeHistory ?? "" },
    { text: `<span class="badge ${resident.isWorking ? 'badge-success' : resident.isStudent ? 'badge-info' : 'badge-secondary'}">${(resident.isWorking ? 'WORKING' : resident.isStudent ? 'STUDENT' : 'N/A')}</span>` },
    { text: resident.remarks ?? "" }
];

        cells.forEach((c, idx) => {
            const td = document.createElement('td');
            if (idx === 0 && c.order) td.setAttribute('data-order', c.order);
            
            // Use innerHTML for status column (index 12) to render HTML badges properly
            if (idx === 12) {
                td.innerHTML = String(c.text);
                td.className = 'status-column';
            } else {
                td.textContent = String(c.text);
            }
            
            if (idx === 3) td.className = 'household';
            // Add special styling for remarks column (index 13)
            if (idx === 13) {
                td.className = 'remarks-column';
                td.style.maxWidth = '200px';
                td.style.wordWrap = 'break-word';
                // Show placeholder if empty
                if (!c.text || c.text.trim() === '') {
                    td.textContent = '-';
                    td.style.color = '#9ca3af';
                    td.style.fontStyle = 'italic';
                }
            }
            tr.appendChild(td);
        });
        const actionTd = document.createElement('td');
        actionTd.className = 'no-export';
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.setAttribute('data-id', resident.id);
        editBtn.textContent = 'Edit';
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.setAttribute('data-id', resident.id);
        delBtn.textContent = 'Delete';
        actionTd.appendChild(editBtn);
        actionTd.appendChild(delBtn);
        tr.appendChild(actionTd);
        tableBody.appendChild(tr);
    });

    // Initialize DataTable for barangay residents with MSWD-style export buttons
    try {
        if (window.jQuery && $('#residentsTable').length) {
            if ($.fn.dataTable.isDataTable('#residentsTable')) {
                $('#residentsTable').DataTable().destroy();
            }
            const dt = $('#residentsTable').DataTable({
                order: [[0, 'asc']],
                dom: 'Bfrtip',
                buttons: [
                    { 
                      extend: 'excelHtml5', 
                      title: 'Residents_Export', 
                      text: 'Excel', 
                      exportOptions: { 
                        columns: function (idx, data, node) {
                          // Exclude action columns and no-export columns
                          const $node = $(node);
                          return !$node.hasClass('no-export') && 
                                 !$node.text().toLowerCase().includes('action');
                        },
                        format: {
                          body: function (data, row, column, node) {
                            // Clean data by removing HTML tags and buttons
                            return typeof data === 'string' ? 
                              data.replace(/<[^>]*>/g, '').trim() : data;
                          }
                        }
                      },
                      customize: function (xlsx) {
                        const config = EXPORT_CONFIG;
                        const sheet = xlsx.xl.worksheets['sheet1.xml'];
                        const currentDate = new Date().toLocaleString();
                        
                        // Add header information
                        const headerData = [
                          config.header.title,
                          config.header.subtitle,
                          `${config.header.address} | ${config.header.contact}`,
                          'RESIDENTS REPORT',
                          `Generated on: ${currentDate}`,
                          '' // Empty row
                        ];
                        
                        // Insert header rows at the beginning
                        let sheetData = $('sheetData', sheet);
                        let existingRows = $('row', sheetData);
                        
                        // Add header rows
                        headerData.forEach((text, index) => {
                          if (text) {
                            let newRow = `<row r="${index + 1}"><c r="A${index + 1}" t="inlineStr"><is><t>${text}</t></is></c></row>`;
                            sheetData.prepend(newRow);
                          }
                        });
                        
                        // Update row numbers for existing data
                        existingRows.each(function(i) {
                          const newRowNum = i + headerData.length + 1;
                          $(this).attr('r', newRowNum);
                          $(this).find('c').each(function() {
                            const cellRef = $(this).attr('r');
                            if (cellRef) {
                              const newRef = cellRef.replace(/\d+/, newRowNum);
                              $(this).attr('r', newRef);
                            }
                          });
                        });
                      }
                    },
                    { 
                      extend: 'pdfHtml5', 
                      title: 'Residents_PDF', 
                      text: 'PDF', 
                      orientation: 'landscape',
                      pageSize: 'A4',
                      exportOptions: { 
                        columns: function (idx, data, node) {
                          const $node = $(node);
                          return !$node.hasClass('no-export') && 
                                 !$node.text().toLowerCase().includes('action');
                        },
                        format: {
                          body: function (data, row, column, node) {
                            return typeof data === 'string' ? 
                              data.replace(/<[^>]*>/g, '').trim() : data;
                          }
                        }
                      },
                      customize: function (doc) {
                        const config = EXPORT_CONFIG;
                        const currentDate = new Date().toLocaleString();
                        
                        // Clear existing content
                        doc.content = [];
                        
                        // Add clean header
                        doc.content.push(
                          { text: config.header.title, style: 'title', alignment: 'center', margin: [0, 0, 0, 6] },
                          { text: config.header.subtitle, style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 4] },
                          { text: `${config.header.address} | ${config.header.contact}`, style: 'address', alignment: 'center', margin: [0, 0, 0, 8] },
                          { text: 'RESIDENTS REPORT', style: 'reportTitle', alignment: 'center', margin: [0, 0, 0, 15] }
                        );
                        
                        // Build clean table data with proper alignment using enhanced extraction
                        const tableData = [];
                        const table = document.getElementById('residentsTable');
                        if (table) {
                          const cleanData = extractBarangayResidentsTableData(table);
                          cleanData.forEach((row, index) => {
                            if (index === 0) {
                              // Header row with center alignment
                              tableData.push(row.map(cell => ({ 
                                text: cell, 
                                style: 'tableHeader',
                                alignment: 'center',
                                fontSize: 9,
                                bold: true
                              })));
                            } else {
                              // Data rows with center alignment
                              tableData.push(row.map(cell => ({
                                text: cell,
                                alignment: 'center',
                                fontSize: 8
                              })));
                            }
                          });
                        }
                        
                        if (tableData.length > 0) {
                          doc.content.push({
                            table: {
                              headerRows: 1,
                              widths: '*',
                              body: tableData,
                              alignment: 'center'
                            },
                            layout: {
                              hLineWidth: function() { return 0.5; },
                              vLineWidth: function() { return 0.5; },
                              hLineColor: function() { return '#cbd5e1'; },
                              vLineColor: function() { return '#cbd5e1'; }
                            },
                            alignment: 'center',
                            margin: [20, 0, 20, 0]
                          });
                        }
                        
                        // Add footer with signature section
                        doc.content.push(
                          { text: `Generated on: ${currentDate}`, style: 'footer', alignment: 'right', margin: [0, 20, 0, 10] },
                          {
                            columns: [
                              { text: '_______________\nPrepared by', style: 'signature', alignment: 'center' },
                              { text: '_______________\nVerified by', style: 'signature', alignment: 'center' },
                              { text: '_______________\nApproved by', style: 'signature', alignment: 'center' }
                            ],
                            margin: [0, 30, 0, 0],
                            alignment: 'center'
                          }
                        );
                        
                        // Define clean styles with proper alignment
                        doc.styles = {
                          title: { fontSize: 16, bold: true, color: '#1e293b', alignment: 'center' },
                          subtitle: { fontSize: 14, bold: true, color: '#1e293b', alignment: 'center' },
                          address: { fontSize: 11, color: '#475569', alignment: 'center' },
                          reportTitle: { fontSize: 13, bold: true, color: '#1e293b', alignment: 'center' },
                          tableHeader: { 
                            fontSize: 10, 
                            bold: true, 
                            fillColor: '#f1f5f9', 
                            color: '#1e293b',
                            alignment: 'center'
                          },
                          footer: { fontSize: 9, color: '#475569' },
                          signature: { fontSize: 10, color: '#1e293b', alignment: 'center' }
                        };
                        
                        doc.pageMargins = [30, 50, 30, 50];
                        doc.pageOrientation = 'landscape';
                        
                        // Default styles for better table alignment
                        doc.defaultStyle = {
                          columnGap: 20,
                          alignment: 'center'
                        };
                      }
                    },
                    { 
                      extend: 'print', 
                      title: 'Residents_Print', 
                      text: 'Print',
                      exportOptions: { 
                        columns: function (idx, data, node) {
                          const $node = $(node);
                          return !$node.hasClass('no-export') && 
                                 !$node.text().toLowerCase().includes('action');
                        },
                        format: {
                          body: function (data, row, column, node) {
                            return typeof data === 'string' ? 
                              data.replace(/<[^>]*>/g, '').trim() : data;
                          }
                        }
                      },
                      customize: function (win) {
                        try {
                          // Get the window document
                          const doc = win.document;
                          const body = doc.body;
                          const head = doc.head;
                          
                          // Completely clear everything first
                          body.innerHTML = '';
                          head.innerHTML = '<meta charset="UTF-8">';
                          
                          // Set a clean title
                          const titleElement = doc.createElement('title');
                          titleElement.textContent = 'Residents Report';
                          head.appendChild(titleElement);
                          
                          // Get clean table data from the original table
                          const originalTable = document.getElementById('residentsTable');
                          let cleanTableHTML = '<p>No table data found</p>';
                          
                          if (originalTable) {
                            cleanTableHTML = cleanTableDataForExport(originalTable);
                          }
                          
                          // Generate completely clean HTML without any duplicates
                          const cleanHTML = generateCleanExportHTML(
                            'Residents',
                            cleanTableHTML,
                            { 
                              reportTitle: 'RESIDENTS REPORT'
                            }
                          );
                          
                          // Parse the clean HTML and extract only the body content
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = cleanHTML;
                          const bodyContent = tempDiv.querySelector('body').innerHTML;
                          const headContent = tempDiv.querySelector('head').innerHTML;
                          
                          // Set the head content
                          head.innerHTML = headContent;
                          
                          // Set the body content
                          body.innerHTML = bodyContent;
                          
                          // Additional cleanup after setting content
                          setTimeout(() => {
                            // Remove any duplicate elements by comparing text content
                            const allElements = body.querySelectorAll('*');
                            const seenContent = new Map();
                            
                            allElements.forEach(el => {
                              const text = el.textContent?.trim();
                              const tagName = el.tagName?.toLowerCase();
                              
                              // Skip if element has no text or is a standard element we want to keep
                              if (!text || ['table', 'thead', 'tbody', 'tr', 'th', 'td'].includes(tagName)) {
                                return;
                              }
                              
                              const key = `${tagName}:${text}`;
                              if (seenContent.has(key)) {
                                // This is a duplicate, remove it
                                el.remove();
                              } else {
                                seenContent.set(key, el);
                              }
                            });
                            
                            // Clean up any unwanted text nodes containing browser artifacts
                            const walker = doc.createTreeWalker(
                              body,
                              NodeFilter.SHOW_TEXT,
                              {
                                acceptNode: function(node) {
                                  const text = node.textContent?.trim() || '';
                                  if (text.includes('about:blank') || 
                                      text.includes('file:///') ||
                                      text.match(/^\s*chrome-extension:\/\//) ||
                                      text.match(/^\s*moz-extension:\/\//) ||
                                      text === 'Residents_Print') {
                                    return NodeFilter.FILTER_ACCEPT;
                                  }
                                  return NodeFilter.FILTER_SKIP;
                                }
                              },
                              false
                            );
                            
                            const unwantedTextNodes = [];
                            let node;
                            while (node = walker.nextNode()) {
                              unwantedTextNodes.push(node);
                            }
                            
                            unwantedTextNodes.forEach(textNode => {
                              textNode.textContent = '';
                            });
                            
                            // Final cleanup of empty elements
                            const emptyElements = body.querySelectorAll('div:empty, p:empty, span:empty');
                            emptyElements.forEach(el => {
                              if (el.children.length === 0 && !el.textContent?.trim()) {
                                el.remove();
                              }
                            });
                            
                          }, 50);
                          
                        } catch(e) {
                          console.warn('Print customization failed:', e);
                          // Fallback: basic cleanup with standard print layout
                          try {
                            const body = win.document.body;
                            const config = window.EXPORT_CONFIG || {
                              header: {
                                title: 'RELIEF GOODS DELIVERY RECEIPT',
                                subtitle: 'Municipal Social Welfare and Development Office',
                                address: 'LGU Polangui, Polangui, Albay',
                                contact: '0945 357 0566'
                              }
                            };
                            
                            // Clear body and create basic structure
                            body.innerHTML = `
                              <div style="text-align:center; margin-bottom:30px; border-bottom:2px solid #333; padding-bottom:15px;">
                                <h1 style="margin:0 0 10px 0; font-size:18px;">${config.header.title}</h1>
                                <p style="margin:0 0 8px 0; font-size:14px;">${config.header.subtitle}</p>
                                <p style="margin:0 0 10px 0; font-size:12px;">${config.header.address} | ${config.header.contact}</p>
                                <h2 style="margin:10px 0 0 0; font-size:16px;">RESIDENTS REPORT</h2>
                              </div>
                              <div>${cleanTableDataForExport(document.getElementById('residentsTable'))}</div>
                              <div style="margin-top:30px; text-align:right; font-size:10px; color:#666;">
                                Generated on: ${new Date().toLocaleString()}
                              </div>
                            `;
                            
                            // Remove unwanted elements
                            const unwanted = body.querySelectorAll('button, .btn, .no-export, .action-buttons, .edit-btn, .delete-btn');
                            unwanted.forEach(el => el.remove());
                            
                          } catch(fallbackError) {
                            console.warn('Fallback cleanup also failed:', fallbackError);
                          }
                        }
                      }
                    }
                ],
                columnDefs: [ { targets: 'no-export', searchable: false, orderable: false } ],
                pageLength: 10
            });
            
            // Create custom export buttons and position them outside table container
            setTimeout(() => {
                try {
                    const searchSection = document.getElementById('barangayResidentSearchSection');
                    const wrapper = document.getElementById('residentsTable').closest('.dataTables_wrapper');
                    const dtButtons = wrapper ? wrapper.querySelector('.dt-buttons') : null;
                    const filter = wrapper ? wrapper.querySelector('.dataTables_filter') : null;
                    
                    if (searchSection) {
                        // Prevent duplicating buttons on reloads
                        if (searchSection.dataset.customButtonsCreated === '1') {
                            return;
                        }
                        
                        // Remove any existing export buttons to avoid duplicates
                        const existingContainer = searchSection.querySelector('.export-buttons-container');
                        if (existingContainer) {
                            existingContainer.remove();
                        }
                        
                        // Create a dedicated export buttons container
                        const exportContainer = document.createElement('div');
                        exportContainer.className = 'export-buttons-container';
                        exportContainer.style.cssText = `
                            display: flex;
                            gap: 8px;
                            margin-bottom: 16px;
                            flex-wrap: wrap;
                            justify-content: flex-start;
                        `;
                        
                        // Create custom export buttons
                        const buttons = [
                            { text: 'Excel', color: '#16a34a', action: 'excel' },
                            { text: 'PDF', color: '#dc2626', action: 'pdf' },
                            { text: 'Print', color: '#7c3aed', action: 'print' }
                        ];
                        
                        buttons.forEach((btnConfig) => {
                            const button = document.createElement('button');
                            button.textContent = btnConfig.text;
                            button.className = `export-btn-custom ${btnConfig.action}-btn`;
                            button.style.cssText = `
                                display: inline-flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                width: auto !important;
                                min-height: 36px !important;
                                padding: 8px 16px !important;
                                margin: 0 !important;
                                background: ${btnConfig.color} !important;
                                color: white !important;
                                border: none !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                font-size: 0.875rem !important;
                                font-weight: 500 !important;
                                pointer-events: auto !important;
                                user-select: none !important;
                                z-index: 1001 !important;
                                position: relative !important;
                                transition: all 0.2s ease !important;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                            `;
                            
                            // Add hover effects
                            button.addEventListener('mouseenter', function() {
                                this.style.transform = 'translateY(-1px)';
                                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                            });
                            
                            button.addEventListener('mouseleave', function() {
                                this.style.transform = 'translateY(0)';
                                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            });
                            
                            // Add click handlers
                            button.addEventListener('click', function() {
                                handleCustomExport(btnConfig.action, dt);
                            });
                            
                            exportContainer.appendChild(button);
                        });
                        
                        // Insert the export container at the beginning of the search section
                        searchSection.insertBefore(exportContainer, searchSection.firstChild);
                        
                        // Hide original DataTables buttons if they exist
                        if (dtButtons) {
                            dtButtons.style.display = 'none';
                        }
                        
                        // Mark as created to avoid re-adding on subsequent loads
                        searchSection.dataset.customButtonsCreated = '1';
                    }
                    
                    // Hide DataTables' built-in search and use our custom search
                    if (filter) { filter.style.display = 'none'; }
                    
                    // Setup custom search functionality
                    const customSearchInput = document.getElementById('barangayResidentSearchInput');
                    if (customSearchInput) {
                        customSearchInput.addEventListener('input', function() {
                            dt.search(this.value).draw();
                        });
                    }
                    
                    // Setup Zone Filter functionality
                    setupZoneFilter(dt);
                    
                    // Store DataTable instance globally for zone filter access
                    window.currentResidentsDataTable = dt;
                } catch(err) {
                    console.warn('Error moving DataTables buttons:', err);
                }
            }, 100);
        }
    } catch (e) { console.warn('DataTable init failed:', e); }
};

// Setup Zone Filter functionality
function setupZoneFilter(dataTable) {
    try {
        const zoneInput = document.getElementById('zoneFilterInput');
        const clearBtn = document.getElementById('clearZoneFilter');
        const zoneSection = document.querySelector('.zone-filter-section');
        
        if (!zoneInput || !clearBtn || !zoneSection) {
            console.warn('Zone filter elements not found');
            return;
        }
        
        // Custom search function for exact zone matching
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            // Only apply to residents table
            if (settings.nTable.id !== 'residentsTable') {
                return true;
            }
            
            const zoneFilter = zoneInput.value.trim();
            
            // If no zone filter is set, show all rows
            if (!zoneFilter) {
                return true;
            }
            
            // Get the address zone column (index 2: "Address Zone")
            const addressZone = data[2] || '';
            
            // Perform exact zone matching
            return isExactZoneMatch(addressZone, zoneFilter);
        });
        
        // Zone input event handler
        zoneInput.addEventListener('input', function() {
            const value = this.value.trim();
            
            // Update UI state
            updateZoneFilterUI(value, zoneSection, this);
            
            // Redraw table with filter
            dataTable.draw();
            
            // Log for debugging
            console.log(`🔍 Zone filter applied: "${value}"`);
        });
        
        // Clear button handler
        clearBtn.addEventListener('click', function() {
            zoneInput.value = '';
            updateZoneFilterUI('', zoneSection, zoneInput);
            dataTable.draw();
            zoneInput.focus();
            console.log('🧹 Zone filter cleared');
        });
        
        console.log('✅ Zone filter setup completed');
        
    } catch (error) {
        console.error('❌ Error setting up zone filter:', error);
    }
}

// Check if address zone exactly matches the filter
function isExactZoneMatch(addressZone, zoneFilter) {
    if (!addressZone || !zoneFilter) return false;
    
    const normalizedAddress = addressZone.toLowerCase().trim();
    const normalizedFilter = zoneFilter.toLowerCase().trim();
    
    // Handle different zone formats:
    // "Zone 1" -> matches "1"
    // "Purok 2" -> matches "2" 
    // "Zone 3A" -> matches "3a" or "3"
    // "1" -> matches "1"
    
    // Extract zone number from address using regex
    const addressZoneMatch = normalizedAddress.match(/(?:zone|purok)\s*(\d+[a-z]?)|^(\d+[a-z]?)$/i);
    const addressZoneNum = addressZoneMatch ? (addressZoneMatch[1] || addressZoneMatch[2]) : normalizedAddress;
    
    // Extract zone number from filter
    const filterZoneMatch = normalizedFilter.match(/(?:zone|purok)\s*(\d+[a-z]?)|^(\d+[a-z]?)$/i);
    const filterZoneNum = filterZoneMatch ? (filterZoneMatch[1] || filterZoneMatch[2]) : normalizedFilter;
    
    // Exact match comparison
    const isMatch = addressZoneNum === filterZoneNum;
    
    // Debug logging for troubleshooting
    if (window.zoneFilterDebug) {
        console.log(`Zone match check: "${addressZone}" (${addressZoneNum}) vs "${zoneFilter}" (${filterZoneNum}) = ${isMatch}`);
    }
    
    return isMatch;
}

// Update zone filter UI state
function updateZoneFilterUI(filterValue, zoneSection, zoneInput) {
    if (filterValue) {
        zoneSection.classList.add('has-active-filter');
        zoneInput.classList.add('active');
    } else {
        zoneSection.classList.remove('has-active-filter');
        zoneInput.classList.remove('active');
    }
}

// Toggle zone filter debugging
function toggleZoneFilterDebug() {
    window.zoneFilterDebug = !window.zoneFilterDebug;
    console.log(`Zone filter debugging: ${window.zoneFilterDebug ? 'ON' : 'OFF'}`);
    return window.zoneFilterDebug;
}

// Expose zone filter functions globally for testing
window.toggleZoneFilterDebug = toggleZoneFilterDebug;
window.isExactZoneMatch = isExactZoneMatch;

// Custom export handler for residents table
function handleCustomExport(action, dataTable) {
    try {
        if (!dataTable) {
            console.warn('DataTable instance not available for export');
            return;
        }
        
        switch (action) {
            case 'excel':
                // Trigger Excel export
                if (dataTable.button && dataTable.button('.buttons-excel').length > 0) {
                    dataTable.button('.buttons-excel').trigger();
                } else {
                    // Fallback: create simple Excel export
                    exportTableToExcel('residentsTable', 'Residents');
                }
                break;
                
            case 'pdf':
                // Trigger PDF export
                if (dataTable.button && dataTable.button('.buttons-pdf').length > 0) {
                    dataTable.button('.buttons-pdf').trigger();
                } else {
                    // Fallback: create enhanced PDF export with proper alignment
                    exportBarangayResidentsTableToPDF('residentsTable', 'Barangay_Residents');
                }
                break;
                
            case 'print':
                // Trigger print export
                if (dataTable.button && dataTable.button('.buttons-print').length > 0) {
                    dataTable.button('.buttons-print').trigger();
                } else {
                    // Fallback: create simple print with enhanced data extraction
                    printBarangayResidentsTable('residentsTable', 'Barangay_Residents');
                }
                break;
                
            default:
                console.warn('Unknown export action:', action);
        }
    } catch (error) {
        console.error('Error in custom export:', error);
        showError('Export failed. Please try again.');
    }
}

// Fallback export functions
// Clean Excel export function
function exportCleanTableToExcel(tableId, filename) {
    try {
        const table = document.getElementById(tableId);
        if (!table) {
            showError('Table not found for export');
            return;
        }
        
        const config = EXPORT_CONFIG;
        const currentDate = new Date().toLocaleString();
        const dateStr = new Date().toISOString().split('T')[0];
        
        // Extract clean table data (excluding action buttons)
        const cleanData = extractCleanTableData(table);
        
        if (cleanData.length === 0) {
            showError('No data to export');
            return;
        }
        
        // Create header rows
        const headerRows = [
            [config.header.title],
            [config.header.subtitle],
            [`${config.header.address} | ${config.header.contact}`],
            [`${filename.replace(/_/g, ' ').toUpperCase()} REPORT`],
            [`Generated on: ${currentDate}`],
            [], // Empty row for spacing
            [] // Another empty row
        ];
        
        // Combine header and clean table data
        const finalData = [...headerRows, ...cleanData];
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        
        // Set column widths for better formatting
        const maxColCount = Math.max(...finalData.map(row => row.length));
        const colWidths = [];
        for (let i = 0; i < maxColCount; i++) {
            colWidths.push({ wch: 15 }); // Default width
        }
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        
        // Generate clean filename
        const cleanFilename = `${filename}_${dateStr}.xlsx`;
        
        // Download the file
        XLSX.writeFile(wb, cleanFilename);
        showSuccess(`Excel file "${cleanFilename}" downloaded successfully!`);
        
    } catch (error) {
        console.error('Excel export error:', error);
        showError('Excel export failed. Please check if all required libraries are loaded.');
    }
}

// Enhanced print function specifically for Barangay Residents table
function printBarangayResidentsTable(tableId, title) {
    try {
        const table = document.getElementById(tableId);
        if (!table) {
            showError('Table not found for printing');
            return;
        }
        
        // Extract table data using enhanced extraction for barangay table
        const cleanData = extractBarangayResidentsTableData(table);
        
        if (cleanData.length === 0) {
            showError('No data found to print');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showError('Popup blocked. Please allow popups to print.');
            return;
        }
        
        // Generate HTML table from extracted data
        let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px;">';
        
        // Add headers
        if (cleanData.length > 0) {
            tableHTML += '<thead><tr>';
            cleanData[0].forEach(header => {
                tableHTML += `<th style="border: 1px solid #ccc; padding: 6px; background: #f5f5f5; font-weight: bold; text-align: center;">${header}</th>`;
            });
            tableHTML += '</tr></thead>';
        }
        
        // Add body rows
        if (cleanData.length > 1) {
            tableHTML += '<tbody>';
            for (let i = 1; i < cleanData.length; i++) {
                tableHTML += '<tr>';
                cleanData[i].forEach(cell => {
                    tableHTML += `<td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${cell}</td>`;
                });
                tableHTML += '</tr>';
            }
            tableHTML += '</tbody>';
        }
        
        tableHTML += '</table>';
        
        const config = EXPORT_CONFIG;
        const currentDate = new Date().toLocaleString();
        
        const cleanHTML = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title} Report</title>
            <style>
                @page { 
                    size: A4 landscape; 
                    margin: 15mm;
                }
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    padding: 0;
                    line-height: 1.4;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .header h1 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                }
                .header p {
                    margin: 0 0 6px 0;
                    font-size: 12px;
                }
                .content {
                    width: 100%;
                    overflow: visible;
                }
                .footer {
                    margin-top: 30px;
                    text-align: right;
                    font-size: 10px;
                    color: #666;
                }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; }
                    .header { page-break-after: avoid; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${config.header.title}</h1>
                <p>${config.header.subtitle}</p>
                <p>${config.header.address} | ${config.header.contact}</p>
                <h2 style="margin: 10px 0 0 0; font-size: 16px;">RESIDENTS REPORT</h2>
            </div>
            <div class="content">
                ${tableHTML}
            </div>
            <div class="footer">
                Generated on: ${currentDate}
            </div>
        </body>
        </html>`;
        
        printWindow.document.write(cleanHTML);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            try {
                printWindow.print();
                setTimeout(() => {
                    printWindow.close();
                }, 1000);
            } catch (e) {
                console.warn('Print failed:', e);
                printWindow.close();
            }
        }, 500);
        
    } catch (error) {
        console.error('Enhanced barangay print error:', error);
        showError('Print failed.');
    }
}

// Extract clean table data specifically for Barangay Residents table
function extractBarangayResidentsTableData(table) {
    if (!table) {
        console.warn('No table provided to extractBarangayResidentsTableData');
        return [];
    }
    
    const data = [];
    
    // Get headers from thead
    const headers = [];
    const headerCells = table.querySelectorAll('thead th');
    if (headerCells.length > 0) {
        headerCells.forEach((th, index) => {
            // Exclude action columns and no-export columns
            if (!th.classList.contains('no-export') && 
                !th.textContent.toLowerCase().includes('action') &&
                index < 14) { // Limit to first 14 columns
                headers.push(th.textContent.trim() || `Column ${index + 1}`);
            }
        });
    } else {
        // Fallback headers if no thead
        const defaultHeaders = [
            'Name', 'Age', 'Address/Zone', 'Household #', 'Gender', 
            'Household Status', 'House Material', 'Terrain', 'Family Members', 
            'Monthly Income', 'Aid History', 'Evacuee History', 'Employment Status', 'Remarks'
        ];
        headers.push(...defaultHeaders);
    }
    
    if (headers.length > 0) {
        data.push(headers);
    }
    
    // Get data rows from tbody
    const tableBody = table.querySelector('tbody');
    if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(tr => {
            if (tr.style.display !== 'none' && !tr.classList.contains('hidden')) {
                const row = [];
                const cells = tr.querySelectorAll('td');
                let cellCount = 0;
                cells.forEach((td, index) => {
                    // Exclude action columns and no-export columns
                    if (!td.classList.contains('no-export') && cellCount < 14) {
                        // Clean the text content and remove HTML tags
                        let cellText = td.textContent.trim();
                        
                        // Handle special cases for status badges
                        if (td.innerHTML.includes('badge')) {
                            // Extract text from badge elements
                            const badge = td.querySelector('.badge, [class*="badge"]');
                            if (badge) {
                                cellText = badge.textContent.trim();
                            }
                        }
                        
                        if (!cellText || cellText === '') {
                            cellText = 'N/A';
                        }
                        row.push(cellText);
                        cellCount++;
                    }
                });
                if (row.length > 0) {
                    data.push(row);
                }
            }
        });
    }
    
    console.log('Extracted barangay residents data:', data.length, 'rows');
    return data;
}

// Enhanced PDF export function specifically for Barangay Residents table
function exportBarangayResidentsTableToPDF(tableId, title) {
    try {
        const table = document.getElementById(tableId);
        if (!table) {
            showError('Table not found for PDF export');
            return;
        }
        
        // Try to use jsPDF for automatic download with better formatting
        if (typeof window.jsPDF !== 'undefined') {
            generateBarangayResidentsPDF(table, title);
            return;
        }
        
        // Fallback to standard export
        exportTableToPDF(tableId, title);
        
    } catch (error) {
        console.error('Enhanced PDF export error:', error);
        showError('PDF export failed.');
    }
}

// Generate PDF specifically for barangay residents with enhanced alignment
function generateBarangayResidentsPDF(table, title) {
    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const config = EXPORT_CONFIG;
        const currentDate = new Date().toLocaleString();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add centered header with proper spacing
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(config.header.title, pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(config.header.subtitle, pageWidth / 2, 28, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`${config.header.address} | ${config.header.contact}`, pageWidth / 2, 34, { align: 'center' });
        
        doc.setFont(undefined, 'bold');
        doc.text('RESIDENTS REPORT', pageWidth / 2, 42, { align: 'center' });
        
        // Get clean table data with enhanced extraction
        const cleanData = extractBarangayResidentsTableData(table);
        
        if (cleanData.length > 0) {
            // Add table using autoTable with proper centering and alignment
            if (doc.autoTable) {
                doc.autoTable({
                    head: [cleanData[0]],
                    body: cleanData.slice(1),
                    startY: 50,
                    styles: { 
                        fontSize: 7, 
                        cellPadding: 2,
                        halign: 'center',
                        valign: 'middle',
                        overflow: 'linebreak',
                        cellWidth: 'wrap'
                    },
                    headStyles: { 
                        fillColor: [241, 245, 249], 
                        textColor: [30, 41, 59], 
                        fontStyle: 'bold',
                        halign: 'center',
                        valign: 'middle'
                    },
                    columnStyles: {
                        // Apply center alignment to all columns dynamically
                        ...Array.from({ length: 15 }, (_, i) => ({ [i]: { halign: 'center' } }))
                            .reduce((acc, style) => ({ ...acc, ...style }), {})
                    },
                    theme: 'grid',
                    tableWidth: 'auto',
                    margin: { left: 10, right: 10 },
                    showHead: 'everyPage',
                    pageBreak: 'auto'
                });
            } else {
                // Simple centered text table if autoTable not available
                let yPos = 50;
                cleanData.forEach((row, index) => {
                    if (yPos > pageHeight - 40) {
                        doc.addPage();
                        yPos = 20;
                    }
                    const rowText = row.slice(0, 8).join(' | '); // Show first 8 columns
                    doc.setFontSize(index === 0 ? 8 : 7);
                    doc.setFont(undefined, index === 0 ? 'bold' : 'normal');
                    
                    // Center the text
                    const textWidth = doc.getTextWidth(rowText);
                    const xPos = (pageWidth - textWidth) / 2;
                    doc.text(rowText, xPos, yPos);
                    yPos += 5;
                });
            }
        }
        
        // Add footer
        const finalY = doc.autoTable ? doc.autoTable.previous.finalY + 20 : 160;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${currentDate}`, pageWidth - 10, finalY, { align: 'right' });
        
        // Add centered signature section
        const sigY = finalY + 25;
        const sigWidth = 60;
        const totalSigWidth = sigWidth * 3 + 40;
        const startX = (pageWidth - totalSigWidth) / 2;
        
        doc.text('Prepared by:', startX, sigY);
        doc.line(startX, sigY + 2, startX + sigWidth, sigY + 2);
        
        doc.text('Verified by:', startX + sigWidth + 20, sigY);
        doc.line(startX + sigWidth + 20, sigY + 2, startX + sigWidth * 2 + 20, sigY + 2);
        
        doc.text('Approved by:', startX + sigWidth * 2 + 40, sigY);
        doc.line(startX + sigWidth * 2 + 40, sigY + 2, startX + sigWidth * 3 + 40, sigY + 2);
        
        // Generate filename and download
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${title}_${dateStr}.pdf`;
        
        doc.save(filename);
        showSuccess(`PDF file "${filename}" downloaded successfully!`);
        
    } catch (error) {
        console.error('Enhanced jsPDF generation failed:', error);
        // Fallback to regular export method
        exportTableToPDF('residentsTable', title);
    }
}

// Backward compatibility wrapper
function exportTableToExcel(tableId, filename) {
    exportCleanTableToExcel(tableId, filename);
}

// Generate standard export HTML for print and PDF exports
function generateStandardExportHTML(title, contentHTML, options = {}) {
    const config = EXPORT_CONFIG;
    const currentDate = new Date().toLocaleString();
    const reportTitle = options.reportTitle || title.toUpperCase();
    const includeSignatures = options.includeSignatures || false;
    
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
            @page { 
                size: A4; 
                margin: 15mm;
                @top-left { content: none !important; }
                @top-center { content: none !important; }
                @top-right { content: none !important; }
                @bottom-left { content: none !important; }
                @bottom-center { content: none !important; }
                @bottom-right { content: none !important; }
            }
            body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                padding: 0;
                line-height: 1.4;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .header h1 {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: bold;
            }
            .header p {
                margin: 0 0 6px 0;
                font-size: 12px;
            }
            .header .report-title {
                margin: 10px 0 0 0;
                font-size: 16px;
                font-weight: bold;
            }
            .content {
                width: 100%;
                overflow: visible;
            }
            .footer {
                margin-top: 30px;
                text-align: right;
                font-size: 10px;
                color: #666;
            }
            .signatures {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
                gap: 40px;
            }
            .signature-block {
                text-align: center;
                min-width: 150px;
            }
            .signature-line {
                border-bottom: 1px solid #333;
                margin-bottom: 8px;
                height: 40px;
            }
            .signature-label {
                font-size: 12px;
                font-weight: bold;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 12px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f5f5f5;
                font-weight: bold;
                text-align: center;
            }
            td {
                text-align: center;
            }
            .no-export,
            .action-buttons,
            .edit-btn,
            .delete-btn,
            button {
                display: none !important;
            }
            @media print {
                body { -webkit-print-color-adjust: exact !important; }
                .header { page-break-after: avoid; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; }
                .no-export,
                .action-buttons,
                .edit-btn,
                .delete-btn,
                button {
                    display: none !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${config.header.title}</h1>
            <p>${config.header.subtitle}</p>
            <p>${config.header.address} | ${config.header.contact}</p>
            <div class="report-title">${reportTitle}</div>
        </div>
        <div class="content">
            ${contentHTML}
        </div>
        <div class="footer">
            Generated on: ${currentDate}
        </div>
        ${includeSignatures ? `
        <div class="signatures">
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Prepared by</div>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Verified by</div>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Approved by</div>
            </div>
        </div>` : ''}
    </body>
    </html>`;
}


// Automatic PDF download function using jsPDF or DataTables pdfHtml5
function exportTableToPDF(tableId, title) {
    try {
        const table = document.getElementById(tableId);
        if (!table) {
            showError('Table not found for PDF export');
            return;
        }
        
        // Try to use DataTables PDF export if available
        if (window.jQuery && $.fn.dataTable.isDataTable(`#${tableId}`)) {
            const dt = $(`#${tableId}`).DataTable();
            const pdfButton = dt.button('.buttons-pdf');
            
            if (pdfButton && pdfButton.length > 0) {
                // Use DataTables built-in PDF export (automatically downloads)
                pdfButton.trigger();
                return;
            }
        }
        
        // Fallback: Try jsPDF if available
        if (typeof window.jsPDF !== 'undefined') {
            generateJSPDF(table, title);
            return;
        }
        
        // Final fallback: Print dialog method
        generatePrintToPDF(table, title);
        
    } catch (error) {
        console.error('PDF export error:', error);
        showError('PDF export failed.');
    }
}

// Generate PDF using jsPDF library (automatically downloads with proper alignment)
function generateJSPDF(table, title) {
    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const config = EXPORT_CONFIG;
        const currentDate = new Date().toLocaleString();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add centered header with proper spacing
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(config.header.title, pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(config.header.subtitle, pageWidth / 2, 28, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`${config.header.address} | ${config.header.contact}`, pageWidth / 2, 34, { align: 'center' });
        
        doc.setFont(undefined, 'bold');
        doc.text(`${title.replace(/_/g, ' ').toUpperCase()} REPORT`, pageWidth / 2, 42, { align: 'center' });
        
        // Get clean table data
        const cleanData = extractCleanTableData(table);
        
        if (cleanData.length > 0) {
            // Add table using autoTable with proper centering and alignment
            if (doc.autoTable) {
                doc.autoTable({
                    head: [cleanData[0]],
                    body: cleanData.slice(1),
                    startY: 50,
                    styles: { 
                        fontSize: 8, 
                        cellPadding: 3,
                        halign: 'center',
                        valign: 'middle',
                        overflow: 'linebreak',
                        cellWidth: 'wrap'
                    },
                    headStyles: { 
                        fillColor: [241, 245, 249], 
                        textColor: [30, 41, 59], 
                        fontStyle: 'bold',
                        halign: 'center',
                        valign: 'middle'
                    },
                    columnStyles: {
                        // Apply center alignment to all columns
                        0: { halign: 'center' },
                        1: { halign: 'center' },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center' },
                        5: { halign: 'center' },
                        6: { halign: 'center' },
                        7: { halign: 'center' },
                        8: { halign: 'center' },
                        9: { halign: 'center' }
                    },
                    theme: 'grid',
                    tableWidth: 'auto',
                    margin: { left: 15, right: 15 },
                    showHead: 'everyPage',
                    pageBreak: 'auto'
                });
            } else {
                // Simple centered text table if autoTable not available
                let yPos = 50;
                cleanData.forEach((row, index) => {
                    if (yPos > pageHeight - 40) {
                        doc.addPage();
                        yPos = 20;
                    }
                    const rowText = row.join(' | ');
                    doc.setFontSize(index === 0 ? 9 : 8);
                    doc.setFont(undefined, index === 0 ? 'bold' : 'normal');
                    
                    // Center the text
                    const textWidth = doc.getTextWidth(rowText);
                    const xPos = (pageWidth - textWidth) / 2;
                    doc.text(rowText, xPos, yPos);
                    yPos += 6;
                });
            }
        }
        
        // Add footer
        const finalY = doc.autoTable ? doc.autoTable.previous.finalY + 15 : 160;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${currentDate}`, pageWidth - 15, finalY, { align: 'right' });
        
        // Add centered signature section
        const sigY = finalY + 25;
        const sigWidth = 60;
        const totalSigWidth = sigWidth * 3 + 40; // 3 signatures + gaps
        const startX = (pageWidth - totalSigWidth) / 2;
        
        doc.text('Prepared by:', startX, sigY);
        doc.line(startX, sigY + 2, startX + sigWidth, sigY + 2);
        
        doc.text('Verified by:', startX + sigWidth + 20, sigY);
        doc.line(startX + sigWidth + 20, sigY + 2, startX + sigWidth * 2 + 20, sigY + 2);
        
        doc.text('Approved by:', startX + sigWidth * 2 + 40, sigY);
        doc.line(startX + sigWidth * 2 + 40, sigY + 2, startX + sigWidth * 3 + 40, sigY + 2);
        
        // Generate filename and download
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${title}_${dateStr}.pdf`;
        
        doc.save(filename);
        showSuccess(`PDF file "${filename}" downloaded successfully!`);
        
    } catch (error) {
        console.error('jsPDF generation failed:', error);
        generatePrintToPDF(table, title);
    }
}

// Fallback: Print-to-PDF method
function generatePrintToPDF(table, title) {
    try {
        const cleanTableHTML = cleanTableDataForExport(table);
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showError('Popup blocked. Please allow popups to export PDF.');
            return;
        }
        
        const cleanHTML = generateCleanExportHTML(
            `${title} PDF Export`,
            cleanTableHTML,
            { 
                reportTitle: `${title.replace(/_/g, ' ').toUpperCase()} REPORT`
            }
        );
        
        printWindow.document.write(cleanHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Automatically trigger print dialog
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                console.warn('Print dialog failed:', e);
            }
        }, 500);
        
        showSuccess('PDF export window opened! Use Ctrl+P and select "Save as PDF" to download.');
        
    } catch (error) {
        console.error('Print-to-PDF generation failed:', error);
        showError('PDF export failed.');
    }
}

// Clean print function
function printTable(tableId, title) {
    try {
        const table = document.getElementById(tableId);
        if (!table) {
            showError('Table not found for printing');
            return;
        }
        
        // Clean table data first
        const cleanTableHTML = cleanTableDataForExport(table);
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showError('Popup blocked. Please allow popups to print.');
            return;
        }
        
        const cleanHTML = generateCleanExportHTML(
            `${title} Print`,
            cleanTableHTML,
            { 
                reportTitle: `${title.replace(/_/g, ' ').toUpperCase()} REPORT`
            }
        );
        
        printWindow.document.write(cleanHTML);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            try {
                printWindow.print();
                setTimeout(() => {
                    printWindow.close();
                }, 1000);
            } catch (e) {
                console.warn('Print failed:', e);
                printWindow.close();
            }
        }, 500);
        
    } catch (error) {
        console.error('Print error:', error);
        showError('Print failed.');
    }
}

document.getElementById("addResidentForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    // Check if user is loaded
    if (!loggedInUserData || !loggedInUserData.username) {
        console.error("User data not loaded properly!");
        alert("Please login again.");
        submitButton.disabled = false;
        return;
    }

    // Now safe to get current barangay
    const currentBarangay = loggedInUserData.username.replace('barangay_', '');

    // Then collect form fields
    const nameInput = document.getElementById("name");
    const ageInput = document.getElementById("age");
    const addressZoneInput = document.getElementById("addressZone");
    const householdNumberInput = document.getElementById("householdNumber");
    const genderInput = document.getElementById("gender");
    const householdStatusInput = document.getElementById("householdStatus");
    const familyMembersInput = document.getElementById("familyMembers");
    const evacueeHistoryInput = document.getElementById("evacueeHistory");
    const studentCheckbox = document.getElementById("student");
    const workingCheckbox = document.getElementById("working");
    const monthlyIncomeInput = document.getElementById("monthlyIncome");
    const remarksInput = document.getElementById("remarks");

    if (!nameInput || !ageInput || !addressZoneInput || !householdNumberInput || !familyMembersInput || !evacueeHistoryInput || !studentCheckbox || !workingCheckbox || !monthlyIncomeInput || !genderInput || !householdStatusInput) {
        console.error("Missing form fields!");
        alert("Form is incomplete. Please refresh the page.");
        submitButton.disabled = false;
        return;
    }

    // Normalize name into first/last + sort key
    const fullName = (nameInput.value || '').trim();
    const parts = fullName.split(/\s+/);
    const lastName = parts.length > 1 ? parts[parts.length - 1] : fullName;
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';

    const residentData = {
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        lastNameLower: lastName.toLowerCase(),
        age: ageInput.value,
        addressZone: addressZoneInput.value,
        householdNumber: householdNumberInput.value,
        barangay: currentBarangay,
        isStudent: studentCheckbox.checked,
        isWorking: workingCheckbox.checked,
        monthlyIncome: studentCheckbox.checked ? 0 : (workingCheckbox.checked ? monthlyIncomeInput.value : null),
        gender: genderInput.value,
        householdStatus: householdStatusInput.value,
        houseMaterial: document.getElementById("houseMaterial").value,
        barangayTerrain: document.getElementById("barangayTerrain").value,
        familyMembers: familyMembersInput.value,
        aidHistory: document.getElementById("aidHistory").value,
        evacueeHistory: evacueeHistoryInput.value,
        remarks: remarksInput ? remarksInput.value : ''
    };

    try {
        await addResidentToFirestore(residentData);
        showResidentSuccessModal(residentData);
        closeAddResidentModal();
        loadResidentsForBarangay(currentBarangay); 
    } catch (error) {
        console.error("Error adding resident: ", error);
        showError("Failed to add resident. Please try again.");
    } finally {
        submitButton.disabled = false;
    }
});

// Open the Edit Resident Modal


// Handle Edit Form Submission
document.getElementById("editResidentForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const docId = document.getElementById("editResidentId").value;

    try {
        const isWorking = document.getElementById("editWorking").checked;
        const isStudent = document.getElementById("editStudent").checked;
        
        const fullName = (document.getElementById("editName").value || '').trim();
        const parts = fullName.split(/\s+/);
        const lastName = parts.length > 1 ? parts[parts.length - 1] : fullName;
        const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
        
        // Debug log to check remarks value being saved
        const remarksValue = document.getElementById("editRemarks").value;
        console.log('Saving remarks:', remarksValue);
        
        await updateDoc(doc(db, "residents", docId), {
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            lastNameLower: lastName.toLowerCase(),
            age: Number(document.getElementById("editAge").value),
            addressZone: document.getElementById("editAddressZone").value,
            householdNumber: String(document.getElementById("editHouseholdNumber").value),
            houseMaterial: document.getElementById("editHouseMaterial").value,
            barangayTerrain: document.getElementById("editBarangayTerrain").value,
            gender: document.getElementById("editGender").value,
            householdStatus: document.getElementById("editHouseholdStatus").value,
            familyMembers: Number(document.getElementById("editFamilyMembers").value),
            monthlyIncome: isStudent ? 0 : 
                (isWorking ? (document.getElementById("editMonthlyIncome").value === "" ? null : Number(document.getElementById("editMonthlyIncome").value)) : null),
            aidHistory: document.getElementById("editAidHistory").value,
            evacueeHistory: Number(document.getElementById("editEvacueeHistory").value),
            isStudent: isStudent,
            isWorking: isWorking,
            remarks: document.getElementById("editRemarks").value,
        });

        // Show success modal
        if (window.Swal) {
            await Swal.fire({
                title: 'Resident Updated Successfully!',
                text: 'The resident information has been updated successfully.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#3b82f6'
            });
        } else {
            showSuccess('Resident updated successfully!');
        }
        
        // Close edit modal
        const editModal = document.getElementById("editResidentModal");
        if (editModal) {
            editModal.classList.add("hidden");
            editModal.style.display = "none";
        }
        
        // Refresh the residents table
        const barangayName = loggedInUserData.username.replace("barangay_", "");
        loadResidentsForBarangay(barangayName);

    } catch (err) {
        console.error("Error updating resident:", err);
        if (window.Swal) {
            await Swal.fire({
                title: 'Update Failed',
                text: 'Failed to update resident. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#dc2626'
            });
        } else {
            alert("Failed to update resident.");
        }
    }
});




// Navigation Sections



function showSection(sectionId) {
    console.log('[showSection] switching to', sectionId);
    // Always hide residents modal when switching sections
    const residentsModal = document.getElementById('viewResidentsModal');
    if (residentsModal) {
        residentsModal.classList.add('hidden');
        residentsModal.style.display = 'none';
        if (sectionId === "deliveryScheduling") {
        console.log("[showSection] calling loadAllDeliveriesForAdmin()");
        loadAllDeliveriesForAdmin();
    }
}
    // Hide any other modals to avoid overlays
    document.querySelectorAll('.modal').forEach(m => { m.classList.add('hidden'); });

    // Ensure dashboard container and main content are visible
    const dash = document.getElementById('dashboardContainer');
    if (dash) { dash.classList.remove('hidden'); dash.style.display = 'flex'; }
    const main = document.querySelector('.main-content');
    if (main) { main.style.display = 'block'; main.style.width = '100%'; }

    // Clean up listeners from previous section
    if (window.App.currentSection && window.App.currentSection !== sectionId) {
        window.App.clearListeners(window.App.currentSection);
    }

    // Hide all sections, then show target only
    document.querySelectorAll('.section').forEach(sec => { sec.classList.add('hidden'); sec.style.display = 'none'; });
    const target = document.getElementById(sectionId);
    if (!target) {
        console.warn('[showSection] target not found:', sectionId);
        return;
    }
    target.classList.remove('hidden');
    target.style.display = 'block';
    console.log('[showSection] target visible? hidden=', target.classList.contains('hidden'), 'display=', getComputedStyle(target).display, 'innerHTML length=', (target.innerHTML||'').length);

    // MSWD Delivery Scheduling
    if (sectionId === "deliveryScheduling" && loggedInUserData?.role === "mswd") {
        // Unhide any descendants that may still be hidden
        target.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
        // Enforce visibility for key containers
        target.style.visibility = 'visible';
        target.style.opacity = '1';
        target.querySelectorAll('.card, .table-container, table').forEach(el => {
            el.style.display = 'block';
            el.style.visibility = 'visible';
        });
        
        if (typeof loadBarangayDropdown === "function") loadBarangayDropdown();
        if (typeof loadAllDeliveriesForAdmin === "function") loadAllDeliveriesForAdmin();
        
        // Initialize inventory display and event listeners
        setTimeout(async () => {
            // Debug original form structure before any modifications
            const barangaySelect = document.getElementById('barangaySelect');
            const deliveryDate = document.getElementById('deliveryDate');
            const deliveryDetails = document.getElementById('deliveryDetails');
            
            console.log('Initial form check - Before updateInventoryDisplay:', {
                barangaySelect: !!barangaySelect,
                deliveryDate: !!deliveryDate,
                deliveryDetails: !!deliveryDetails,
                barangaySelectDisplay: barangaySelect ? getComputedStyle(barangaySelect).display : 'N/A',
                deliveryDateDisplay: deliveryDate ? getComputedStyle(deliveryDate).display : 'N/A'
            });
            
            await updateInventoryDisplay();
            setupInventoryEventListeners();
            
            // Debug form structure after modifications
            console.log('Final form check - After updateInventoryDisplay:', {
                barangaySelect: !!barangaySelect,
                deliveryDate: !!deliveryDate,
                deliveryDetails: !!deliveryDetails,
                barangaySelectDisplay: barangaySelect ? getComputedStyle(barangaySelect).display : 'N/A',
                deliveryDateDisplay: deliveryDate ? getComputedStyle(deliveryDate).display : 'N/A'
            });
        }, 100);
        
        // Bring section into view
    }

    // Barangay: ensure residents list is (re)loaded when opening Manage Residents
    if (sectionId === "residentManagement" && loggedInUserData?.role === 'barangay') {
        const barangayName = loggedInUserData.username?.replace('barangay_', '') || '';
        if (barangayName) {
            try { loadResidentsForBarangay(barangayName); } catch(e) { console.warn('Failed to load residents:', e); }
        }
        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_) {}
    }

    // Barangay Delivery Status
    if (sectionId === "deliveryStatus" && loggedInUserData?.role === "barangay") {
        if (typeof loadBarangayDeliveries === "function") loadBarangayDeliveries(loggedInUserData.username);
    }

    // MSWD Track Goods
    if (sectionId === 'trackGoods' && loggedInUserData?.role === 'mswd') {
        // Refresh totals without triggering DOMContentLoaded (which causes loading screen)
        try {
            // Call the refresh function directly instead of triggering DOMContentLoaded
            if (typeof refreshTotals === 'function') {
                refreshTotals();
            }
            
            // Reinitialize custom item modal to ensure it works
            if (typeof reinitializeCustomItemModal === 'function') {
                reinitializeCustomItemModal();
            }
            
            // Update form labels to remove availability info (Track Relief Goods should show simple labels)
            if (typeof updateFormLabelsWithInventory === 'function') {
                console.log('🔄 Track Goods section: Updating form labels to simple format');
                setTimeout(() => updateFormLabelsWithInventory(), 100); // Small delay to ensure DOM is ready
            }
        } catch(error) {
            console.log('Track goods refresh error:', error);
        }
    }

    // Statistics
    if (sectionId === "statistics") {
        if (loggedInUserData?.role === "mswd") {
            document.getElementById("mswdStatisticsContainer").classList.remove("hidden");
            document.getElementById("barangayStatisticsContainer").classList.add("hidden");
            if (typeof window.loadBarangayPriorityChart === "function") {
                window.loadBarangayPriorityChart(db, getDocs, collection);
            }
            if (typeof window.setupStatsExports === 'function') window.setupStatsExports('barangay');
        } else if (loggedInUserData?.role === "barangay") {
            document.getElementById("mswdStatisticsContainer").classList.add("hidden");
            document.getElementById("barangayStatisticsContainer").classList.remove("hidden");
            const barangayName = loggedInUserData.username.replace("barangay_", "");
            if (typeof window.loadResidentPriorityChart === "function") {
                window.loadResidentPriorityChart(db, getDocs, collection, query, where, barangayName);
            }
            if (typeof window.setupStatsExports === 'function') window.setupStatsExports('resident');
        }
        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_) {}
    }

    // MSWD Account Requests
    if (sectionId === "accountRequests" && loggedInUserData?.role === "mswd") {
        if (typeof loadAccountRequests === "function") {
            loadAccountRequests();
        }
    }
    
    // Track current section
    window.App.currentSection = sectionId;
}
window.showSection = showSection;





// ==== Change Password ====
window.showChangePassword = function() {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '100000';
    const cs = getComputedStyle(modal);
    console.log('[showChangePassword] modal display', cs.display, 'opacity', cs.opacity);
};

(function setupChangePassword(){
    const form = document.getElementById('changePasswordForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        if (newPassword !== confirmNewPassword) {
            showError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
                showError('Password must be at least 6 characters long.');
                return;
            }
            try {
                await changePassword(currentPassword, newPassword);
            showSuccess('Password updated.');
            document.getElementById('changePasswordModal').classList.add('hidden');
            form.reset();
        } catch (err) {
            showError(mapAuthError(err));
        }
    });
})();

// Handle approval form submission
document.addEventListener('DOMContentLoaded', function() {
    const approveForm = document.getElementById('approveAccountForm');
    if (approveForm) {
        approveForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const requestId = document.getElementById('approveRequestId').value;
            const barangayName = document.getElementById('approveBarangayName').value;
            const terrain = document.getElementById('approveTerrain').value;
            const password = document.getElementById('approvePassword').value;
            
            if (!terrain) {
                alert('Please select a terrain type');
                return;
            }
            
            if (!password || password.length < 6) {
                alert('Please set a password (at least 6 characters)');
                return;
            }
            
            // Disable submit button to prevent double submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span><span>Approving...</span>';
            
            try {
                const success = await processApproval(requestId, barangayName, terrain, password);
                if (success) {
                    closeApprovalModal();
                    loadAccountRequests(); // Refresh the table
                }
            } catch (error) {
                console.error('Error in form submission:', error);
                alert('Error processing approval: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }
});

// Enhanced Mutually Exclusive Checkbox Handler (works for Add + Edit)
function handleEmploymentStatus(prefix = "") {
  const studentId = prefix === "edit" ? "editStudent" : "student";
  const workingId = prefix === "edit" ? "editWorking" : "working";
  const incomeId = prefix === "edit" ? "editMonthlyIncome" : "monthlyIncome";
  
  const student = document.getElementById(studentId);
  const working = document.getElementById(workingId);
  const income = document.getElementById(incomeId);
  
  if (!student || !working || !income) return;
  
  // Make checkboxes mutually exclusive
  if (student.checked && working.checked) {
    // If both are checked, uncheck the other one based on which was clicked last
    if (event && event.target === student) {
      working.checked = false;
    } else if (event && event.target === working) {
      student.checked = false;
    }
  }
  
  // Handle income field based on employment status
  if (working.checked && !student.checked) {
    income.disabled = false;
    income.required = true;
    income.placeholder = "Enter monthly income (PHP)";
  } else {
    income.disabled = true;
    income.required = false;
    income.value = "";
    income.placeholder = "Only available when 'Working' is selected";
  }
  
  // Update visual feedback for checkboxes
  updateCheckboxContainers(prefix);
}

// Update checkbox container styling based on state
function updateCheckboxContainers(prefix = "") {
  const studentId = prefix === "edit" ? "editStudent" : "student";
  const workingId = prefix === "edit" ? "editWorking" : "working";
  
  const studentElement = document.getElementById(studentId);
  const workingElement = document.getElementById(workingId);
  
  if (!studentElement || !workingElement) return;
  
  const studentContainer = studentElement.closest('.checkbox-container');
  const workingContainer = workingElement.closest('.checkbox-container');
  
  if (studentContainer) {
    studentContainer.style.borderColor = studentElement.checked ? '#2563eb' : '#d1d5db';
    studentContainer.style.background = studentElement.checked ? '#eff6ff' : 'white';
  }
  
  if (workingContainer) {
    workingContainer.style.borderColor = workingElement.checked ? '#2563eb' : '#d1d5db';
    workingContainer.style.background = workingElement.checked ? '#eff6ff' : 'white';
  }
}

// Add event listeners for enhanced checkbox functionality
document.addEventListener('DOMContentLoaded', function() {
  const studentCheckbox = document.getElementById("student");
  const workingCheckbox = document.getElementById("working");
  const incomeField = document.getElementById("monthlyIncome");
  
  if (studentCheckbox && workingCheckbox && incomeField) {
    // Add mutually exclusive behavior
    studentCheckbox.addEventListener("change", function(event) {
      window.event = event; // Store event for handleEmploymentStatus
      if (this.checked) {
        workingCheckbox.checked = false;
      }
      handleEmploymentStatus("");
    });
    
    workingCheckbox.addEventListener("change", function(event) {
      window.event = event; // Store event for handleEmploymentStatus
      if (this.checked) {
        studentCheckbox.checked = false;
      }
      handleEmploymentStatus("");
    });
    
    // Initialize the state
    handleEmploymentStatus("");
  }
  
  // Also add listeners for edit form
  const editStudentCheckbox = document.getElementById("editStudent");
  const editWorkingCheckbox = document.getElementById("editWorking");
  const editIncomeField = document.getElementById("editMonthlyIncome");
  
  if (editStudentCheckbox && editWorkingCheckbox && editIncomeField) {
    editStudentCheckbox.addEventListener("change", () => toggleIncomeField("edit"));
    editWorkingCheckbox.addEventListener("change", () => toggleIncomeField("edit"));
  }
});

// Toggle income field function for edit form
function toggleIncomeField(prefix) {
  if (prefix === "edit") {
    handleEmploymentStatus("edit");
  } else {
    handleEmploymentStatus("");
  }
}

// ===== Enhanced Double-Click Prevention System =====
function addDoubleClickPrevention(button, asyncFunction, options = {}) {
  const {
    loadingText = 'Processing...',
    cooldown = 1500,
    showSuccess = true,
    showError = true,
    preventMultiple = true
  } = options;
  
  if (!button || typeof asyncFunction !== 'function') {
    console.warn('addDoubleClickPrevention: Invalid button or function');
    return;
  }
  
  // Store original state
  const originalText = button.textContent;
  const originalHTML = button.innerHTML;
  const originalDisabled = button.disabled;
  let isProcessing = false;
  
  // Create a unique identifier for this button
  const buttonId = button.id || `btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Global processing tracker to prevent multiple simultaneous operations
  if (!window.processingButtons) {
    window.processingButtons = new Set();
  }
  
  button.addEventListener('click', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent processing if already processing this button
    if (isProcessing) {
      console.log('Button click ignored: already processing');
      return;
    }
    
    // Prevent multiple operations globally if enabled
    if (preventMultiple && window.processingButtons.size > 0) {
      showWarning('Please wait for the current operation to complete.');
      return;
    }
    
    // Mark as processing
    isProcessing = true;
    window.processingButtons.add(buttonId);
    
    // Update button state
    button.disabled = true;
    button.style.opacity = '0.7';
    button.style.cursor = 'not-allowed';
    
    // Show loading state
    if (loadingText) {
      if (button.querySelector('.btn-icon')) {
        const icon = button.querySelector('.btn-icon');
        const text = button.querySelector('.btn-text') || button.querySelector('span:last-child');
        if (icon) icon.innerHTML = '<span class="material-icons">hourglass_empty</span>';
        if (text) text.textContent = loadingText;
      } else {
        button.innerHTML = `<span style="display: flex; align-items: center; gap: 8px;"><span class="material-icons">hourglass_empty</span><span>${loadingText}</span></span>`;
      }
    }
    
    try {
      const result = await asyncFunction();
      
      // Show success message if enabled and result is successful
      if (showSuccess && result !== false) {
        // Success message will be shown by the async function itself
        console.log('Operation completed successfully');
      }
    } catch (error) {
      console.error('Button action failed:', error);
      
      // Show error message if enabled
      if (showError) {
        const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
        showError(`Operation failed: ${errorMessage}`);
      }
    } finally {
      // Reset button state after cooldown
      setTimeout(() => {
        isProcessing = false;
        window.processingButtons.delete(buttonId);
        
        if (button && !button.parentNode?.querySelector === undefined) { // Check if button still exists
          button.disabled = originalDisabled;
          button.style.opacity = '';
          button.style.cursor = '';
          button.innerHTML = originalHTML;
        }
      }, cooldown);
    }
  });
  
  // Store prevention data for cleanup if needed
  button._preventionData = {
    id: buttonId,
    isProcessing: () => isProcessing,
    cleanup: () => {
      window.processingButtons?.delete(buttonId);
      isProcessing = false;
    }
  };
}

// Enhanced form submission prevention
function addFormSubmissionPrevention(form, asyncHandler, options = {}) {
  if (!form || typeof asyncHandler !== 'function') {
    console.warn('addFormSubmissionPrevention: Invalid form or handler');
    return;
  }
  
  const {
    cooldown = 2000,
    resetOnSuccess = true,
    showValidationErrors = true
  } = options;
  
  let isSubmitting = false;
  const formId = form.id || `form-${Date.now()}`;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) {
      console.log('Form submission ignored: already submitting');
      return;
    }
    
    // Basic form validation
    const requiredFields = form.querySelectorAll('[required]');
    const emptyFields = Array.from(requiredFields).filter(field => !field.value.trim());
    
    if (emptyFields.length > 0 && showValidationErrors) {
      const fieldNames = emptyFields.map(field => field.labels?.[0]?.textContent || field.name || field.placeholder || 'Unknown field').join(', ');
      showError(`Please fill in all required fields: ${fieldNames}`);
      emptyFields[0].focus();
      return;
    }
    
    isSubmitting = true;
    
    // Disable form controls
    const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
    const formInputs = form.querySelectorAll('input, textarea, select, button');
    
    submitButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.7';
      const originalText = btn.textContent;
      btn.dataset.originalText = originalText;
      if (btn.querySelector('span:last-child')) {
        btn.querySelector('span:last-child').textContent = 'Submitting...';
      } else {
        btn.innerHTML = '<span class="material-icons">hourglass_empty</span><span>Submitting...</span>';
      }
    });
    
    formInputs.forEach(input => {
      if (input.type !== 'submit') {
        input.disabled = true;
        input.style.opacity = '0.7';
      }
    });
    
    try {
      const result = await asyncHandler(new FormData(form));
      
      if (result !== false && resetOnSuccess) {
        form.reset();
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      const errorMessage = error?.message || 'Form submission failed. Please try again.';
      showError(errorMessage);
    } finally {
      setTimeout(() => {
        isSubmitting = false;
        
        // Re-enable form controls
        submitButtons.forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '';
          const originalText = btn.dataset.originalText || 'Submit';
          if (btn.querySelector('span:last-child')) {
            btn.querySelector('span:last-child').textContent = originalText.replace(/.*\s/, '') || 'Submit';
          } else {
            btn.innerHTML = `<span class="btn-icon">Submit</span><span>${originalText}</span>`;
          }
        });
        
        formInputs.forEach(input => {
          if (input.type !== 'submit') {
            input.disabled = false;
            input.style.opacity = '';
          }
        });
      }, cooldown);
    }
  });
  
  return {
    isSubmitting: () => isSubmitting,
    cleanup: () => { isSubmitting = false; }
  };
}

// Setup barangay-specific buttons after login
function setupBarangayButtons() {
  console.log('Setting up barangay buttons...');
  
  // Setup barangay delivery history button
  const deliveryHistoryBtn = document.getElementById('viewDeliveryHistoryBtn');
  console.log('Delivery history button found:', !!deliveryHistoryBtn);
  if (deliveryHistoryBtn) {
    console.log('Setting up delivery history button event listener');
    // Remove any existing listeners first
    deliveryHistoryBtn.replaceWith(deliveryHistoryBtn.cloneNode(true));
    const newBtn = document.getElementById('viewDeliveryHistoryBtn');
    newBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('Delivery history button clicked!');
      try {
        await showDeliveryHistory();
      } catch (error) {
        console.error('Error showing delivery history:', error);
        showError('Failed to load delivery history: ' + error.message);
      }
    });
  } else {
    console.warn('Delivery history button not found during setup');
    // Try to find it after a short delay
    setTimeout(() => {
      const laterBtn = document.getElementById('viewDeliveryHistoryBtn');
      if (laterBtn) {
        console.log('Found delivery history button on retry');
        laterBtn.addEventListener('click', async function(e) {
          e.preventDefault();
          await showDeliveryHistory();
        });
      }
    }, 500);
  }
}

// ===== Goods Inventory UI (MSWD) =====
document.addEventListener('DOMContentLoaded', async function() {
  // Load totals if Track Goods section exists
  async function refreshTotals() {
    try {
      // Fetch totals directly from Firestore
      const totalsRef = doc(db, 'inventory', 'totals');
      const snap = await getDoc(totalsRef);
      const totals = snap.exists() ? snap.data() : { rice: 0, biscuits: 0, canned: 0, shirts: 0 };
      const safe = (v) => (typeof v === 'number' ? v : 0);
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
      
      // Update basic items
      set('totalRice', safe(totals.rice));
      set('totalBiscuits', safe(totals.biscuits));
      set('totalCanned', safe(totals.canned));
      set('totalShirts', safe(totals.shirts));
      
      // Handle custom items
      let customItemsTotal = 0;
      const totalsItemsList = document.getElementById('totalsItemsList');
      console.log('Checking custom items:', {
        totalsItemsList: !!totalsItemsList,
        customItemsExists: !!totals.customItems,
        customItemsCount: totals.customItems ? Object.keys(totals.customItems).length : 0,
        customItems: totals.customItems
      });
      
      if (totalsItemsList && totals.customItems) {
        // Remove existing custom item displays
        const existingCustom = totalsItemsList.querySelectorAll('[data-custom-item]');
        console.log(`Removing ${existingCustom.length} existing custom items`);
        existingCustom.forEach(item => item.remove());
        
        // Add custom items to the list
        Object.entries(totals.customItems).forEach(([key, item]) => {
          console.log(`Adding custom item to totals: ${item.name} (${item.unit}) - Qty: ${item.quantity}`);
          const customDiv = document.createElement('div');
          customDiv.className = 'totals-item';
          customDiv.setAttribute('data-custom-item', key);
          customDiv.innerHTML = `
            <span class="item-name">${item.name} (${item.unit})</span>
            <span class="item-total">${safe(item.quantity)}</span>
          `;
          totalsItemsList.appendChild(customDiv);
          customItemsTotal += safe(item.quantity);
        });
        
        console.log(`Custom items total: ${customItemsTotal}`);
      } else {
        console.log('No custom items to display or totalsItemsList not found');
      }
      
      // Calculate overall total including custom items
      const basicTotal = safe(totals.rice) + safe(totals.biscuits) + safe(totals.canned) + safe(totals.shirts);
      const overallTotal = basicTotal + customItemsTotal;
      set('totalOverall', overallTotal);
      
      // Update global inventory for other functions
      window.currentInventory = totals;
      console.log('Updated global currentInventory:', window.currentInventory);
      
    } catch (e) { 
      console.warn('Failed loading inventory totals', e);
    }
  }
  
  // Setup inventory management buttons
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) {
    historyBtn.addEventListener('click', showInventoryHistory);
  }
  
  const newBatchBtn = document.getElementById('newBatchBtn');
  if (newBatchBtn) {
    // Store original text for reset
    newBatchBtn._originalText = newBatchBtn.textContent;
    newBatchBtn._originalHTML = newBatchBtn.innerHTML;
    
    newBatchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showNewBatchModal();
    });
  }
  
  const summaryBtn = document.getElementById('summaryBtn');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', generateSummaryReport);
  }
  
  // Barangay-specific buttons are set up after login in setupBarangayButtons()
  
  // Setup delivery form event listener with enhanced prevention
  const deliveryForm = document.getElementById('deliveryForm');
  if (deliveryForm) {
    addFormSubmissionPrevention(deliveryForm, async (formData) => {
      return await handleScheduleDelivery();
    }, {
      cooldown: 2000,
      resetOnSuccess: true,
      showValidationErrors: true
    });
  }

  const goodsForm = document.getElementById('goodsForm');
  if (goodsForm) {
    await refreshTotals();
    // expose for external refresh without rebinding listeners
    window.refreshInventoryTotals = refreshTotals;
    if (!goodsForm.dataset.boundSubmit) {
      goodsForm.dataset.boundSubmit = '1';
    let isSubmittingInventory = false;
    goodsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmittingInventory || goodsForm.dataset.submitting === '1') return; // prevent double submit
      isSubmittingInventory = true;
      goodsForm.dataset.submitting = '1';
      const submitBtn = goodsForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.7'; }
      // disable inputs to avoid value changes mid-flight
      const inputs = goodsForm.querySelectorAll('input, textarea, select');
      inputs.forEach(i => { i.disabled = true; });
      // Collect basic inventory items
      const delta = {
        rice: Number(document.getElementById('invRice')?.value || 0),
        biscuits: Number(document.getElementById('invBiscuits')?.value || 0),
        canned: Number(document.getElementById('invCanned')?.value || 0),
        shirts: Number(document.getElementById('invShirts')?.value || 0),
      };
      
      // Collect custom items
      const customItems = {};
      const customInputs = goodsForm.querySelectorAll('input[data-item]');
      customInputs.forEach(input => {
        const key = input.getAttribute('data-item');
        const value = Number(input.value || 0);
        if (value > 0) {
          customItems[key] = value;
        }
      });
      
      // Validate that at least one item has a quantity > 0
      const hasBasicItems = delta.rice > 0 || delta.biscuits > 0 || delta.canned > 0 || delta.shirts > 0;
      const hasCustomItems = Object.keys(customItems).length > 0;
      
      if (!hasBasicItems && !hasCustomItems) {
        showError('Please enter quantities for at least one item before submitting.');
        // Re-enable form immediately since we're not processing
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
        inputs.forEach(i => { i.disabled = false; });
        isSubmittingInventory = false;
        goodsForm.dataset.submitting = '0';
        return; // Exit early, don't process the submission
      }
      
      try {
        // Use atomic transaction to update both basic and custom items
        const totalsRef = doc(db, 'inventory', 'totals');
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(totalsRef);
          const current = snap.exists() ? snap.data() : { rice: 0, biscuits: 0, canned: 0, shirts: 0 };
          
          // Update basic items
          const updated = {
            rice: (current.rice || 0) + Number(delta.rice || 0),
            biscuits: (current.biscuits || 0) + Number(delta.biscuits || 0),
            canned: (current.canned || 0) + Number(delta.canned || 0),
            shirts: (current.shirts || 0) + Number(delta.shirts || 0),
            updatedAt: serverTimestamp()
          };
          
          // Update custom items (ensure we never set undefined)
          if (current.customItems) {
            updated.customItems = { ...current.customItems }; // Clone existing custom items
          }
          
          if (Object.keys(customItems).length > 0) {
            if (!updated.customItems) {
              updated.customItems = {};
            }
            
            Object.entries(customItems).forEach(([key, value]) => {
              if (updated.customItems[key]) {
                updated.customItems[key].quantity = (updated.customItems[key].quantity || 0) + value;
              }
            });
          }
          
          // Check for negative values
          if (updated.rice < 0 || updated.biscuits < 0 || updated.canned < 0 || updated.shirts < 0) {
            throw new Error('INSUFFICIENT_INVENTORY');
          }
          
          transaction.set(totalsRef, updated, { merge: true });
        });
        
        // Prepare items for logging (including custom items)
        const allItems = {
          rice: Number(delta.rice || 0),
          biscuits: Number(delta.biscuits || 0),
          canned: Number(delta.canned || 0),
          shirts: Number(delta.shirts || 0),
          ...customItems
        };
        
        // Log the transaction
        await logInventoryTransaction({
          action: 'stock-in',
          type: 'manual',
          items: allItems,
          user: loggedInUserData?.username || 'Unknown',
          description: 'Manual stock addition' + (Object.keys(customItems).length > 0 ? ' (including custom items)' : '')
        });
        showSuccess('Inventory updated successfully! Reloading page...');
        goodsForm.reset();
        await refreshTotals();
        
        // Auto-reload the page after 1.5 seconds
        setTimeout(() => {
          location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        showError('Failed to update inventory.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
        inputs.forEach(i => { i.disabled = false; });
        isSubmittingInventory = false;
        goodsForm.dataset.submitting = '0';
      }
    });
    }
  }
});

// ===== Admin-Controlled Terrain System =====
// Terrain is now set by admin when approving barangay accounts
// No hardcoded profiles needed - terrain comes from user account data

// Function to auto-populate terrain based on barangay (for logged-in barangay users)
function autoPopulateTerrainForBarangay() {
    if (loggedInUserData && loggedInUserData.role === 'barangay') {
        // Get terrain from the user's account data (set by admin during approval)
        const terrain = loggedInUserData.terrain || 'Lowland'; // Default to Lowland if not set
        
        // Update Add Resident form terrain display
        updateTerrainDisplay('barangayTerrain', terrain);
        
        // Update Edit Resident form terrain display  
        updateTerrainDisplay('editBarangayTerrain', terrain);
    }
}

// Helper function to update terrain display with badge styling
function updateTerrainDisplay(fieldPrefix, terrain) {
    const hiddenInput = document.getElementById(fieldPrefix);
    
    if (hiddenInput) {
        // Set the hidden input value for form submission
        hiddenInput.value = terrain;
        
        // Update the terrain display for Add Resident modal
        if (fieldPrefix === 'barangayTerrain') {
            const terrainDisplay = document.getElementById('barangayTerrainDisplay');
            const terrainValue = terrainDisplay?.querySelector('.terrain-value');
            
            if (terrainValue) {
                terrainValue.textContent = terrain;
                
                // Remove existing terrain classes
                terrainDisplay.classList.remove('highland', 'lowland');
                
                // Add appropriate class for styling
                const terrainLower = terrain.toLowerCase();
                if (terrainLower === 'highland') {
                    terrainDisplay.classList.add('highland');
                } else if (terrainLower === 'lowland') {
                    terrainDisplay.classList.add('lowland');
                }
            }
        }
        
        // Handle other terrain displays (like edit modal) with badge structure
        const badge = document.getElementById(fieldPrefix + 'Badge');
        if (badge) {
            const terrainLower = terrain.toLowerCase();
            badge.textContent = terrain;
            
            // Remove existing terrain classes
            badge.classList.remove('highland', 'lowland');
            
            // Add appropriate class for styling
            if (terrainLower === 'highland') {
                badge.classList.add('highland');
            } else if (terrainLower === 'lowland') {
                badge.classList.add('lowland');
            }
        }
        
        // Update the note
        const note = document.querySelector('.terrain-note');
        if (note) {
            note.textContent = `Terrain (${terrain}) was set by admin when your account was approved`;
        }
    }
}


// ===== Standardized A4 Single-Page Print Helpers =====
function buildA4PrintHTML({ title = 'RELIEF GOODS DELIVERY RECEIPT', subtitle = 'Municipal Social Welfare and Development Office', bodyHTML = '', footerHTML = '' }) {
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
      /* A4 single page setup */
      @page { size: A4; margin: 12mm; }
      html, body { height: 100%; }
      body { font-family: Arial, Helvetica, sans-serif; color:#111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { display: grid; grid-template-rows: auto 1fr auto; min-height: calc(297mm - 24mm); }
      .header { text-align: center; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
      .title { font-size: 16px; font-weight: 700; letter-spacing: .3px; }
      .subtitle { font-size: 11px; color: #555; margin-top: 2px; }
      .content { padding: 10px 2px; }
      .footer { font-size: 10px; color: #666; text-align: left; padding-top: 8px; border-top: 1px solid #e5e7eb; }
      /* Tables */
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
      th { background: #f5f5f5; }
      /* Utility */
      .section { margin-bottom: 10px; }
      .muted { color:#6b7280; }
      .grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .sig-row { display:flex; justify-content: space-between; gap: 24px; margin-top: 24px; }
      .sig { width: 45%; text-align:center; }
      .sig .line { border-bottom: 1px solid #333; height: 36px; margin-bottom: 6px; }
      .small { font-size: 11px; }
      /* Ensure single page: hide overflow if any */
      @media print { .page { overflow: hidden; } }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle}</div>
      </div>
      <div class="content">${bodyHTML}</div>
      <div class="footer">${footerHTML}</div>
    </div>
  </body>
  </html>`;
}

function openPrintA4(html) {
  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to print.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); } catch(_){} }, 400);
}

// ===== CLEAN STANDARDIZED EXPORT SYSTEM =====
// Universal export configuration for consistent formatting across all formats
const EXPORT_CONFIG = {
  // Common header information
  header: {
    title: 'RELIEF GOODS DELIVERY RECEIPT',
    subtitle: 'Municipal Social Welfare and Development Office',
    address: 'LGU Polangui, Polangui, Albay',
    contact: '0945 357 0566'
  },
  // Consistent styling for all export formats
  styles: {
    pageMargins: [20, 40, 20, 30],
    fontSize: {
      title: '18px',
      subtitle: '14px',
      address: '12px',
      body: '12px',
      footer: '10px'
    },
    colors: {
      headerText: '#1e293b',
      bodyText: '#374151',
      borderColor: '#e5e7eb',
      headerBg: '#f8fafc'
    }
  },
  // Common page settings
  pageSettings: {
    orientation: 'landscape',
    size: 'A4',
    margins: '12mm'
  }
};

// Clean table data by removing action buttons and unwanted elements
function cleanTableDataForExport(table) {
  if (!table) return '';
  
  // Clone the table to avoid modifying the original
  const tableClone = table.cloneNode(true);
  
  // Remove all unwanted elements comprehensively
  const unwantedSelectors = [
    '.no-export',
    '.action-buttons', 
    '.edit-btn', 
    '.delete-btn', 
    'button', 
    '.btn',
    '.dataTables_wrapper > div:first-child',
    '.dataTables_info',
    '.dataTables_paginate', 
    '.dataTables_length',
    '.dataTables_filter',
    'input[type="search"]',
    '.sorting_asc',
    '.sorting_desc',
    '.sorting'
  ];
  
  unwantedSelectors.forEach(selector => {
    const elements = tableClone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  // Remove action columns more thoroughly
  const allRows = tableClone.querySelectorAll('tr');
  allRows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    cells.forEach(cell => {
      const cellText = cell.textContent.toLowerCase().trim();
      const hasButton = cell.querySelector('button, .btn, .edit-btn, .delete-btn');
      const isActionColumn = cellText.includes('action') || 
                            cellText.includes('edit') || 
                            cellText.includes('delete') ||
                            cellText === '' && hasButton;
      
      if (hasButton || isActionColumn) {
        cell.remove();
      }
    });
  });
  
  // Clean up any remaining button-related attributes and classes
  const allElements = tableClone.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove button-related classes
    const classes = ['btn', 'button', 'edit-btn', 'delete-btn', 'action-btn', 'no-export'];
    classes.forEach(className => {
      el.classList.remove(className);
    });
    
    // Remove event handlers and button attributes
    el.removeAttribute('onclick');
    el.removeAttribute('onmouseenter');
    el.removeAttribute('onmouseleave');
    el.removeAttribute('data-id');
    
    // Clean up any remaining unwanted text content
    if (el.textContent) {
      const text = el.textContent.trim();
      if (text === 'Edit' || text === 'Delete' || text === 'Action') {
        el.textContent = '';
      }
    }
  });
  
  // Remove empty rows that might have been created
  const emptyRows = tableClone.querySelectorAll('tr');
  emptyRows.forEach(row => {
    if (!row.textContent.trim() || row.children.length === 0) {
      row.remove();
    }
  });
  
  return tableClone.outerHTML;
};

// Extract clean table data as array for Excel export
function extractCleanTableData(table) {
  if (!table) return [];
  
  const data = [];
  
  // Get headers (excluding action columns)
  const headers = [];
  const headerCells = table.querySelectorAll('thead th');
  headerCells.forEach(th => {
    if (!th.classList.contains('no-export') && 
        !th.textContent.toLowerCase().includes('action')) {
      headers.push(th.textContent.trim());
    }
  });
  if (headers.length > 0) data.push(headers);
  
  // Get data rows (excluding action columns)
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(tr => {
    if (tr.style.display !== 'none') { // Only visible rows
      const row = [];
      const cells = tr.querySelectorAll('td');
      cells.forEach((td, index) => {
        if (!td.classList.contains('no-export') && 
            !td.querySelector('button') &&
            !td.textContent.toLowerCase().includes('edit') &&
            !td.textContent.toLowerCase().includes('delete') &&
            index < headers.length) { // Don't exceed header count
          row.push(td.textContent.trim());
        }
      });
      if (row.length > 0) data.push(row);
    }
  });
  
  return data;
}

// Generate clean, print-optimized HTML structure without duplicates
function generateCleanExportHTML(title, cleanTableData, options = {}) {
  const config = EXPORT_CONFIG;
  const currentDate = new Date().toLocaleString();
  
  // Clean the title to avoid duplications and sanitize
  const cleanTitle = title.replace(/\s+(Report|Export|Print)\s*$/i, '').replace(/[\u{1F3AF}\u{1F4CA}\u{1F4CB}\u{2705}\u{274C}\u{26A0}\u{FE0F}\u{2139}\u{1F504}\u{1F4A1}\u{1F9F9}\u{1F5D1}\u{1F5FE}\u{2795}\u{1F4D0}\u{1F527}\u{1F518}\u{1F4C4}\u{1F504}\u{1F195}\u{1F4E6}\u{1F522}\u{2139}]/gu, '').trim();
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${cleanTitle} Report</title>
  <style>
    @page { 
      size: A4 landscape; 
      margin: 15mm;
      /* Remove default headers/footers to prevent duplication */ 
      @top-left { content: none !important; }
      @top-center { content: none !important; }
      @top-right { content: none !important; }
      @bottom-left { content: none !important; }
      @bottom-center { content: none !important; }
      @bottom-right { content: none !important; }
    }
    * {
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: auto;
      margin: 0;
      padding: 0;
      overflow: visible;
    }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      color: #1e293b;
      background: white;
      line-height: 1.4;
      font-size: 12px;
      page-break-inside: auto;
    }
    .document-container {
      width: 100%;
      max-width: none;
      padding: 0;
      margin: 0;
      min-height: auto;
      height: auto;
    }
    .document-header {
      text-align: center;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 20px;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    .main-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin: 0 0 6px 0;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    .office-info {
      font-size: 11px;
      color: #475569;
      margin: 0 0 8px 0;
    }
    .report-title {
      font-size: 13px;
      font-weight: 600;
      margin: 8px 0 0 0;
      color: #1e293b;
    }
    .content {
      margin: 0;
      width: 100%;
      overflow: visible;
      page-break-inside: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      font-size: 10px;
      page-break-inside: auto;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: center;
      vertical-align: middle;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: bold;
      color: #1e293b !important;
      font-size: 10px;
      page-break-after: avoid;
    }
    tr {
      page-break-inside: avoid;
    }
    /* Prevent orphaned rows */
    tbody tr {
      page-break-inside: avoid;
    }
    .document-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      margin-top: 20px;
      font-size: 9px;
      color: #475569;
      page-break-inside: avoid;
      page-break-before: avoid;
    }
    .date-generated {
      text-align: right;
      margin-bottom: 15px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      gap: 30px;
      page-break-inside: avoid;
      page-break-before: avoid;
    }
    .signature-box {
      text-align: center;
      flex: 1;
    }
    .signature-line {
      border-bottom: 1px solid #1e293b;
      height: 25px;
      margin-bottom: 6px;
    }
    .signature-label {
      font-size: 9px;
      font-weight: bold;
      color: #1e293b;
    }
    /* Hide unwanted elements completely */
    .no-export, 
    button, 
    .btn, 
    .action-buttons, 
    .edit-btn, 
    .delete-btn,
    .dataTables_wrapper,
    .dataTables_info,
    .dataTables_paginate,
    .dataTables_length,
    .dataTables_filter,
    [class*="dataTable"],
    script,
    noscript {
      display: none !important;
      visibility: hidden !important;
    }
    @media print { 
      html, body {
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        margin: 15mm !important;
        /* Completely suppress browser headers/footers */
        @top-left { content: '' !important; }
        @top-center { content: '' !important; }
        @top-right { content: '' !important; }
        @bottom-left { content: '' !important; }
        @bottom-center { content: '' !important; }
        @bottom-right { content: '' !important; }
      }
      .document-container {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
      }
      /* Hide all unwanted elements in print */
      .no-export, 
      button, 
      .btn, 
      .action-buttons, 
      .edit-btn, 
      .delete-btn,
      .dataTables_wrapper,
      .dataTables_info,
      .dataTables_paginate,
      .dataTables_length,
      .dataTables_filter,
      [class*="dataTable"],
      script,
      noscript {
        display: none !important;
        visibility: hidden !important;
      }
      /* Ensure table headers repeat on each page */
      thead {
        display: table-header-group !important;
      }
      tbody {
        display: table-row-group !important;
      }
      /* Prevent page breaks in inappropriate places */
      .document-header {
        page-break-after: avoid !important;
      }
      .signature-section {
        page-break-before: avoid !important;
        page-break-inside: avoid !important;
      }
      /* Ensure single page layout when possible */
      .document-container {
        page-break-after: auto;
        page-break-inside: auto;
      }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <div class="document-header">
      <div class="main-title">${config.header.title}</div>
      <div class="subtitle">${config.header.subtitle}</div>
      <div class="office-info">${config.header.address} | ${config.header.contact}</div>
      ${options.reportTitle ? `<div class="report-title">${options.reportTitle}</div>` : ''}
    </div>
    
    <div class="content">
      ${cleanTableData}
    </div>
    
    <div class="document-footer">
      <div class="date-generated">Generated on: ${currentDate}</div>
      ${options.includeSignatures !== false ? `
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Prepared by</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Verified by</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Approved by</div>
        </div>
      </div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

// ===== Statistics Export/Print Helpers =====
function setupStatsExports(type) {
  try {
    if (type === 'barangay') {
      const excelBtn = document.getElementById('exportBarangayExcelBtn');
      const pdfBtn = document.getElementById('exportBarangayPDFBtn');
      const printBtn = document.getElementById('printBarangayStatsBtn');
      bindStatsButtons(excelBtn, pdfBtn, printBtn, 'barangay');
    } else {
      const excelBtn = document.getElementById('exportResidentExcelBtn');
      const pdfBtn = document.getElementById('exportResidentPDFBtn');
      const printBtn = document.getElementById('printResidentStatsBtn');
      bindStatsButtons(excelBtn, pdfBtn, printBtn, 'resident');
    }
  } catch(_) {}
}

function bindStatsButtons(excelBtn, pdfBtn, printBtn, scope) {
  const chartCanvasId = scope === 'barangay' ? 'barangayPriorityChart' : 'residentPriorityChart';
  const legendId = scope === 'barangay' ? 'barangayLegend' : 'residentLegend';
  const listId = scope === 'barangay' ? 'topBarangaysList' : 'topResidentsList';

  if (excelBtn) {
    excelBtn.onclick = () => exportStatsTableToExcel(listId, scope === 'barangay' ? 'Barangay Priority' : 'Resident Priority');
  }
  if (pdfBtn) {
    pdfBtn.onclick = () => exportStatsToPDF(chartCanvasId, listId, scope === 'barangay' ? 'Barangay Priority' : 'Resident Priority');
  }
  if (printBtn) {
    printBtn.onclick = () => printStats(chartCanvasId, listId, scope === 'barangay' ? 'Barangay Priority' : 'Resident Priority');
  }
}

function exportStatsTableToExcel(listContainerId, title) {
  const container = document.getElementById(listContainerId);
  if (!container) return;
  // Build a simple table from the list content for export
  const tempTable = document.createElement('table');
  const rows = container.querySelectorAll('li');
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>${title}</th><th>Value</th></tr>`;
  tempTable.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach(li => {
    const name = li.querySelector('.pl-name')?.textContent || '';
    const value = li.querySelector('.pl-value')?.textContent || '';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${value}</td>`;
    tbody.appendChild(tr);
  });
  tempTable.appendChild(tbody);

  if (window.jQuery) {
    const $ = window.jQuery;
    $(tempTable).DataTable({
      dom: 'Bfrtip',
      buttons: [ { extend: 'excelHtml5', title } ],
      destroy: true
    });
    // Trigger the button programmatically
    $(tempTable).DataTable().button('.buttons-excel').trigger();
    $(tempTable).DataTable().destroy();
  }
}

function exportStatsToPDF(chartCanvasId, listContainerId, title) {
  // Use print pipeline with PDF button from DataTables or fallback to window.print with media
  printStats(chartCanvasId, listContainerId, title, true);
}

function printStats(chartCanvasId, listContainerId, title, pdf = false) {
  const chartCanvas = document.getElementById(chartCanvasId);
  const listContainer = document.getElementById(listContainerId);
  if (!chartCanvas || !listContainer) return;

  const style = ``;

  // Build a simple table from the list content
  const tableHtml = (() => {
    const rows = listContainer.querySelectorAll('li');
    let h = '<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody>';
    rows.forEach(li => {
      const name = li.querySelector('.pl-name')?.textContent || '';
      const value = li.querySelector('.pl-value')?.textContent || '';
      h += `<tr><td>${name}</td><td>${value}</td></tr>`;
    });
    h += '</tbody></table>';
    return h;
  })();

  // Clone chart as image
  const dataUrl = chartCanvas.toDataURL('image/png');
  const html = `
    <h1>${title}</h1>
    <div class="grid">
      <div class="chart-wrap"><img src="${dataUrl}" style="max-width:700px;width:100%;"/></div>
      <div class="list-wrap">${tableHtml}</div>
    </div>`;

  const pageHTML = buildA4PrintHTML({
    title: title || 'RELIEF GOODS DELIVERY RECEIPT',
    subtitle: 'Municipal Social Welfare and Development Office',
    bodyHTML: html,
    footerHTML: `<div>Generated on ${new Date().toLocaleString()}</div>`
  });
  openPrintA4(pageHTML);
}

// ✅ Event Delegation for Edit + Delete buttons in residents table
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.getAttribute("data-id");
    const ref = doc(db, "residents", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("Resident not found.");
      return;
    }
    const r = snap.data();
    // Fill edit form
    document.getElementById("editResidentId").value = id;
    document.getElementById("editName").value = r.name || "";
    document.getElementById("editAge").value = r.age || "";
    document.getElementById("editAddressZone").value = r.addressZone || "";
    document.getElementById("editHouseholdNumber").value = r.householdNumber || "";
    document.getElementById("editHouseMaterial").value = r.houseMaterial || "Concrete";
    
    // Auto-populate terrain based on admin-set terrain in user account
    const terrain = loggedInUserData?.terrain || r.barangayTerrain || 'Lowland';
    updateTerrainDisplay('editBarangayTerrain', terrain);
    document.getElementById("editFamilyMembers").value = r.familyMembers || "";
    document.getElementById("editGender").value = r.gender || "Male";
    document.getElementById("editHouseholdStatus").value = r.householdStatus || "Poor";
    document.getElementById("editMonthlyIncome").value = r.monthlyIncome ?? "";
    document.getElementById("editAidHistory").value = r.aidHistory || "";
    document.getElementById("editEvacueeHistory").value = r.evacueeHistory || "";
    document.getElementById("editRemarks").value = r.remarks || "";
    document.getElementById("editStudent").checked = r.isStudent || false;
    document.getElementById("editWorking").checked = r.isWorking || false;
    toggleIncomeField("edit");
    
    // Show edit modal with proper styling
    const editModal = document.getElementById("editResidentModal");
    if (editModal) {
        editModal.classList.remove("hidden");
        editModal.style.display = "flex";
        editModal.style.visibility = "visible";
        editModal.style.opacity = "1";
        editModal.style.pointerEvents = "auto";
    }
  }

  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.getAttribute("data-id");
    
    // Show confirmation modal
    let confirmed = false;
    if (window.Swal) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to delete this resident? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });
      confirmed = result.isConfirmed;
    } else {
      confirmed = confirm("Are you sure you want to delete this resident?");
    }
    
    if (confirmed) {
      try {
        await deleteDoc(doc(db, "residents", id));
        
        // Show success modal
        if (window.Swal) {
          await Swal.fire({
            title: 'Resident Deleted Successfully!',
            text: 'The resident has been permanently removed from the system.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6'
          });
        } else {
          showSuccess('Resident deleted successfully!');
        }
        
        // Refresh the residents table
        const barangayName = loggedInUserData.username.replace("barangay_", "");
        loadResidentsForBarangay(barangayName);
      } catch (error) {
        console.error('Error deleting resident:', error);
        if (window.Swal) {
          await Swal.fire({
            title: 'Delete Failed',
            text: 'Failed to delete resident. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc2626'
          });
        } else {
          alert('Failed to delete resident. Please try again.');
        }
      }
    }
  }
});




function viewBarangayStats(barangayName) {
    // Switch to Priority Statistics section
    showSection("priorityStatistics");

    // Load stats for the clicked barangay
    if (typeof loadPriorityStatistics === "function") {
        loadPriorityStatistics(barangayName);
    }
}


// ===============================
// Residents Modal (Independent)
// ===============================
// removed alternate modal loader/openers to avoid duplication

// Expose functions globally for HTML onclick calls
window.updateDeliveryStatus = updateDeliveryStatus;
window.confirmReceiveDelivery = confirmReceiveDelivery;
window.getDeliveryItemsSummary = getDeliveryItemsSummary;

// Old approveRequest and declineRequest functions removed - using new versions with terrain selection

async function viewBarangay(barangayId, barangayName) {
    try {
        console.log('[viewBarangay] Redirecting to viewRes.html for', barangayName, 'id:', barangayId);
        
        // Show original loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = document.querySelector('.loading-text');
        const loadingSubtitle = document.querySelector('.loading-subtitle');
        
        if (loadingScreen) {
            if (loadingText) {
                loadingText.textContent = `Loading ${barangayName} residents...`;
            }
            if (loadingSubtitle) {
                loadingSubtitle.textContent = 'Please wait...';
            }
            loadingScreen.classList.remove('hidden', 'fade-out');
            loadingScreen.style.display = 'flex';
            loadingScreen.style.opacity = '1';
            loadingScreen.style.visibility = 'visible';
        }
        
        // Redirect to viewRes.html with barangay data as URL parameters
        const params = new URLSearchParams({
            barangay: barangayName,
            id: barangayId
        });
        
        console.log('[viewBarangay] Redirecting to viewres.html with params:', params.toString());
        
        // Use setTimeout to ensure loading message shows before redirect
        setTimeout(() => {
            // Hide loading screen before redirect
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
            }
            
            // Redirect after fade out animation
            setTimeout(() => {
                window.location.href = `viewres.html?${params.toString()}`;
            }, 300);
        }, 1000);
        
    } catch (error) {
        console.error("Error redirecting to residents view:", error);
        if (window.Swal) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to open residents view. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } else {
            showError("Failed to open residents view. Please try again.");
        }
    }
}

// Expose viewBarangay function globally
window.viewBarangay = viewBarangay;

// Function to load residents for the modal
async function loadResidentsForModal(barangayName) {
    try {
        const residentsRef = collection(db, "residents");
        const q = query(residentsRef, where("barangay", "==", barangayName));
        const snapshot = await getDocs(q);
        
        const tableBody = document.getElementById("viewResidentsTableBody");
        if (!tableBody) {
            console.warn("View residents table body not found");
            return;
        }
        
        tableBody.innerHTML = "";
        
        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="15" class="no-residents-message" style="text-align: center; padding: 2rem;">
                        <div class="empty-state">
                            <div class="empty-icon" style="font-size: 3rem; margin-bottom: 1rem;">No Data</div>
                            <h4 style="color: #6b7280; margin-bottom: 0.5rem;">No Residents Found</h4>
                            <p style="color: #9ca3af; margin: 0;">No residents are currently registered in ${barangayName}.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }
        
        const rowsData = [];
        snapshot.forEach((docSnap) => {
            const resident = docSnap.data();
            rowsData.push(resident);
        });

        // Sort by last name A–Z
        function lastNameOf(fullName = '') {
            const parts = String(fullName).trim().split(/\s+/);
            return parts.length ? parts[parts.length - 1].toLowerCase() : '';
        }
        rowsData.sort((a,b) => lastNameOf(a.name).localeCompare(lastNameOf(b.name)));

        rowsData.forEach((resident) => {
            const row = document.createElement('tr');
            row.className = 'resident-row';
            const values = [
    resident.name || "N/A",
    resident.age || "N/A",
    resident.addressZone || "N/A",
    resident.householdNumber || "N/A",
    resident.gender || "N/A",
    resident.householdStatus || "N/A",
    resident.houseMaterial || "N/A",
    resident.barangayTerrain || "N/A",
    resident.familyMembers || "N/A",
    resident.monthlyIncome || "N/A",
    resident.aidHistory || "N/A",
    resident.evacueeHistory || "N/A",
    (resident.isStudent ? 'Student' : (resident.isWorking ? 'Working' : 'N/A')),
    resident.remarks || "N/A"
];

            values.forEach((val, idx) => {
                const td = document.createElement('td');
                td.textContent = String(val);
                if (idx === 3) {
                    const wrap = document.createElement('div');
                    wrap.className = 'resident-household';
                    const span = document.createElement('span');
                    span.className = 'household-text';
                    span.textContent = String(val);
                    wrap.appendChild(span);
                    td.textContent = '';
                    td.appendChild(wrap);
                }
                row.appendChild(td);
            });
            let status = 'None'; let statusClass = 'status-none';
            if (resident.isStudent && resident.isWorking) { status = 'Student & Working'; statusClass = 'status-both'; }
            else if (resident.isStudent) { status = 'Student'; statusClass = 'status-student'; }
            else if (resident.isWorking) { status = 'Working'; statusClass = 'status-working'; }
            const statusTd = document.createElement('td');
            const wrap = document.createElement('div'); wrap.className = 'resident-status';
            const badge = document.createElement('span'); badge.className = 'status-badge ' + statusClass;
            const txt = document.createElement('span'); txt.className = 'status-text'; txt.textContent = status;
            badge.appendChild(txt); wrap.appendChild(badge); statusTd.appendChild(wrap); row.appendChild(statusTd);
            tableBody.appendChild(row);
        });
        
        // Setup search functionality
        setupResidentSearch();
        
        // Enhanced close button click handling
        const modal = document.getElementById('viewResidentsModal');
        const closeButton = modal ? modal.querySelector('.close') : null;
        if (closeButton) {
            // Remove existing event listeners to avoid duplicates
            const newCloseButton = closeButton.cloneNode(true);
            closeButton.parentNode.replaceChild(newCloseButton, closeButton);
            
            // Add comprehensive event listeners for all interaction types
            ['click', 'touchstart', 'mousedown'].forEach(eventType => {
                newCloseButton.addEventListener(eventType, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    console.log('Close button triggered via:', eventType);
                    
                    // Close the modal
                    try {
                        closeViewResidentsModal();
                    } catch (err) {
                        console.warn('closeViewResidentsModal function not found, using fallback');
                        if (modal) {
                            modal.classList.add('hidden');
                            modal.style.display = 'none';
                        }
                    }
                }, { passive: false, capture: true });
            });
            
            // Additional pointer events for better cross-device compatibility
            newCloseButton.style.cssText += `
                cursor: pointer !important;
                pointer-events: auto !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
            `;
        }

        // Initialize DataTable for modal if available
        try {
            if (window.jQuery && $('#viewResidentsTable').length) {
                if ($.fn.dataTable.isDataTable('#viewResidentsTable')) {
                    $('#viewResidentsTable').DataTable().destroy();
                }
                const dt = $('#viewResidentsTable').DataTable({
                    order: [[0, 'asc']],
                    dom: 't', // Only show table - no search, info, or pagination
                    paging: false, // Disable pagination completely
                    info: false, // Remove "Showing X to Y of Z entries"
                    searching: true // Enable DataTable search for custom filtering
                });
                
                // Setup manual export functionality since we removed DataTables buttons
                window.residentTableData = dt;
                
                // Store DataTable instance globally for modal zone filter access
                window.currentModalResidentsDataTable = dt;
                
                // Set up our custom export buttons
                setTimeout(() => {
                    // Wire up compact static export buttons for the modal
                    setupStaticExportButtons();
                    setupInfiniteScrollForResidents();
                    
                    // Setup zone filter functionality for modal (after DataTable is ready)
                    setupModalZoneFilter();
                }, 100);
            }
        } catch (e) { console.warn('DataTable init (modal) failed:', e); }
        
    } catch (error) {
        console.error("Error loading residents for modal:", error);
        showError("Failed to load residents. Please try again.");
    }
}

// Setup resident search functionality
function setupResidentSearch() {
    console.log('Setting up resident search functionality...');
    const searchInput = document.getElementById('residentSearchInput');
    if (!searchInput) {
        console.warn('Resident search input not found!');
        return;
    }
    
    console.log('Search input found, attaching event listeners');
    
    // Clear any existing event listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    // Add enhanced search functionality
    let searchTimeout;
    newSearchInput.addEventListener('input', function(e) {
        const searchTerm = this.value.toLowerCase().trim();
        console.log('Search term:', searchTerm);
        
        // Clear previous timeout to debounce search
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            // Get the DataTable instance
            const dataTable = window.currentModalResidentsDataTable;
            if (dataTable) {
                // Use DataTable's built-in search (same approach as main page)
                dataTable.search(searchTerm).draw();
                console.log(`🔍 Modal search applied: "${searchTerm}"`);
            } else {
                console.warn('⚠️ Modal DataTable not found for search');
            }
        }, 100); // Debounce by 100ms for better performance
    });
    
    // Add keyup and paste events for better responsiveness
    ['keyup', 'paste'].forEach(eventType => {
        newSearchInput.addEventListener(eventType, function(e) {
            // Trigger input event after a short delay for paste events
            setTimeout(() => {
                this.dispatchEvent(new Event('input'));
            }, 10);
        });
    });
    
    // Focus enhancement
    newSearchInput.addEventListener('focus', function() {
        this.style.borderColor = '#3b82f6';
        this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    });
    
    newSearchInput.addEventListener('blur', function() {
        this.style.borderColor = '#e5e7eb';
        this.style.boxShadow = 'none';
    });
    
    console.log('Resident search functionality setup complete!');
}

// Setup zone filter functionality for modal using DataTable filtering
function setupModalZoneFilter() {
    try {
        console.log('🔧 Setting up modal zone filter...');
        
        const zoneInput = document.getElementById('modalZoneFilterInput');
        const clearBtn = document.getElementById('clearModalZoneFilter');
        const zoneSection = document.querySelector('.modal-zone-filter');
        const dataTable = window.currentModalResidentsDataTable;
        
        if (!zoneInput || !clearBtn || !zoneSection) {
            console.warn('⚠️ Modal zone filter elements not found');
            return;
        }
        
        if (!dataTable) {
            console.warn('⚠️ Modal DataTable instance not found');
            return;
        }
        
        // Add custom search function for exact zone matching (same as main page)
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            // Only apply to modal residents table
            if (settings.nTable.id !== 'viewResidentsTable') {
                return true;
            }
            
            const zoneFilter = zoneInput.value.trim();
            
            // If no zone filter is set, show all rows
            if (!zoneFilter) {
                return true;
            }
            
            // Get the address zone column (index 2: "Address Zone")
            const addressZone = data[2] || '';
            
            // Perform exact zone matching using the same function as main page
            return isExactZoneMatch(addressZone, zoneFilter);
        });
        
        // Zone input event handler
        zoneInput.addEventListener('input', function() {
            const value = this.value.trim();
            
            // Update UI state
            updateModalZoneFilterUI(value, zoneSection, this);
            
            // Redraw DataTable with filter (same as main page)
            dataTable.draw();
            
            console.log(`🔍 Modal zone filter applied: "${value}"`);
        });
        
        // Clear button handler
        clearBtn.addEventListener('click', function() {
            zoneInput.value = '';
            updateModalZoneFilterUI('', zoneSection, zoneInput);
            
            // Redraw DataTable to clear filter (same as main page)
            dataTable.draw();
            
            zoneInput.focus();
            console.log('🧹 Modal zone filter cleared');
        });
        
        console.log('✅ Modal zone filter setup completed');
        
    } catch (error) {
        console.error('❌ Error setting up modal zone filter:', error);
    }
}

// Note: Modal now uses DataTable's built-in filtering system
// Combined filtering is handled automatically by DataTable when both
// global search and custom zone filter are applied together

// Update modal zone filter UI state
function updateModalZoneFilterUI(filterValue, zoneSection, zoneInput) {
    if (filterValue) {
        zoneSection.classList.add('has-active-filter');
        zoneInput.classList.add('active');
    } else {
        zoneSection.classList.remove('has-active-filter');
        zoneInput.classList.remove('active');
    }
}

// Close view residents modal
function closeViewResidentsModal() {
    const modal = document.getElementById('viewResidentsModal');
    if (modal) {
        // Clean up modal zone filter to prevent duplicates
        cleanupModalZoneFilter();
        
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    }
}

// Clean up modal zone filter when closing modal
function cleanupModalZoneFilter() {
    try {
        // Remove modal-specific DataTable search functions to prevent duplicates
        if ($.fn.dataTable && $.fn.dataTable.ext && $.fn.dataTable.ext.search) {
            // Remove all search functions that apply to viewResidentsTable
            $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(searchFn) {
                // Test if this search function applies to modal table by checking a dummy call
                try {
                    const testResult = searchFn({ nTable: { id: 'viewResidentsTable' } }, [], 0);
                    // If it returned a boolean, it's likely our modal filter - remove it
                    return typeof testResult !== 'boolean';
                } catch (e) {
                    // Keep the function if we can't test it
                    return true;
                }
            });
        }
        
        // Clear global reference
        if (window.currentModalResidentsDataTable) {
            delete window.currentModalResidentsDataTable;
        }
        
        console.log('🧹 Modal zone filter cleaned up');
    } catch (error) {
        console.error('❌ Error cleaning up modal zone filter:', error);
    }
}

// Helper function to get resident status icon
function getResidentStatusIcon(status) {
    switch (status.toLowerCase()) {
        case 'student': return '🎓';
        case 'working': return '💼';
        case 'student & working': return '🎓💼';
        default: return '❓';
    }
}

// ==========================================
// ✅ ACCOUNT REQUESTS MANAGEMENT (Fresh Implementation)
// ==========================================

// Load and display account requests
async function loadAccountRequests() {
    try {
        const requestsTableBody = document.getElementById('requestsTableBody');
        if (!requestsTableBody) {
            console.error('Requests table body not found');
            return;
        }
        
        // Show loading state
        requestsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading requests...</td></tr>';
        
        // Query pending requests from Firebase
        const requestsQuery = query(
            collection(db, 'accountRequests'),
            where('status', '==', 'pending')
        );
        
        const querySnapshot = await getDocs(requestsQuery);
        
        // Clear loading state
        requestsTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            requestsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #666;">No pending account requests</td></tr>';
            return;
        }
        
        // Build table rows
        querySnapshot.forEach((doc) => {
            const request = doc.data();
            const requestId = doc.id;
            
            // Format date
            let dateRequested = 'Unknown';
            if (request.dateRequested && request.dateRequested.toDate) {
                dateRequested = request.dateRequested.toDate().toLocaleDateString();
            }
            
            // Create table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(request.barangayName || 'Unknown')}</td>
                <td>${escapeHtml(request.email || 'No email')}</td>
                <td>${escapeHtml(request.contact || 'No contact')}</td>
                <td style="max-width: 200px; word-wrap: break-word;">${escapeHtml(request.message || 'No message')}</td>
                <td>${dateRequested}</td>
                <td>
                    <button onclick="openApprovalModal('${requestId}', '${escapeHtml(request.barangayName)}', '${escapeHtml(request.email)}', '${escapeHtml(request.contact)}')" 
                            class="action-button primary-btn">
                        <span class="material-icons">check</span>
                        <span>Approve</span>
                    </button>
                    <button onclick="openDeclineModal('${requestId}')" class="action-button decline-btn">
                        <span class="material-icons">close</span>
                        <span>Decline</span>
                    </button>
                </td>
            `;
            
            requestsTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading account requests:', error);
        const requestsTableBody = document.getElementById('requestsTableBody');
        if (requestsTableBody) {
            requestsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error loading requests</td></tr>';
        }
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Open approval modal with terrain and password selection
function openApprovalModal(requestId, barangayName, email, contact) {
    // Store data for form processing
    window.currentRequestData = {
        id: requestId,
        barangayName: barangayName,
        email: email,
        contact: contact
    };
    
    // Populate form fields
    document.getElementById('approveRequestId').value = requestId;
    document.getElementById('approveBarangayName').value = barangayName;
    document.getElementById('approveEmail').value = email;
    document.getElementById('approveContact').value = contact;
    
    // Clear previous selections
    document.getElementById('approveTerrain').value = '';
    document.getElementById('approvePassword').value = '';
    
    // Show modal
    const modal = document.getElementById('approveAccountModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

// Close approval modal
function closeApprovalModal() {
    const modal = document.getElementById('approveAccountModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    
    // Clear form
    const form = document.getElementById('approveAccountForm');
    if (form) {
        form.reset();
    }
    
    // Clear stored data
    window.currentRequestData = null;
}

// Process account approval
async function processApproval(requestId, barangayName, terrain, password) {
    try {
        // Store current admin session info BEFORE any Firebase operations
        const currentAdminUser = auth.currentUser;
        const adminEmail = currentAdminUser?.email;
        console.log('Preserving admin session for:', adminEmail);
        
        // Create email and username
        const cleanBarangayName = barangayName.toLowerCase().replace(/\s+/g, '');
        const email = `${cleanBarangayName}@example.com`;
        const username = `barangay_${cleanBarangayName}`;
        
        // Check if account already exists (check both email and username)
        const emailCheck = await getDocs(
            query(collection(db, 'users'), where('email', '==', email))
        );
        
        const usernameCheck = await getDocs(
            query(collection(db, 'users'), where('username', '==', username))
        );
        
        const barangayNameCheck = await getDocs(
            query(collection(db, 'users'), where('barangayName', '==', barangayName))
        );
        
        if (!emailCheck.empty || !usernameCheck.empty || !barangayNameCheck.empty) {
            alert(`An account with this barangay name already exists!\n\nPlease use a different barangay name.`);
            return false;
        }
        
        console.log('Duplicate check passed - creating unique account');
        console.log('Account details:', { email, username, barangayName });
        
        // Create Firebase Auth user using SECONDARY app instance to preserve admin session
        let userId = null;
        try {
            // Import Firebase modules for secondary app
            const { initializeApp, deleteApp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
            const { getAuth, createUserWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
            
            // Create secondary app instance
            const secondaryAppConfig = {
                apiKey: auth.app.options.apiKey,
                authDomain: auth.app.options.authDomain,
                projectId: auth.app.options.projectId,
                storageBucket: auth.app.options.storageBucket,
                messagingSenderId: auth.app.options.messagingSenderId,
                appId: auth.app.options.appId
            };
            
            const secondaryApp = initializeApp(secondaryAppConfig, 'secondary-account-creation');
            const secondaryAuth = getAuth(secondaryApp);
            
        console.log('Creating account with secondary auth instance');
            
            // Create user with secondary auth (won't affect main session)
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            userId = userCredential.user.uid;
            
            console.log('Account created successfully:', userId);
            
            // Important: Sign out from secondary auth and clean up
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);
            
            console.log('Secondary auth cleaned up');
            
        } catch (authError) {
            console.error('Error creating account with secondary auth:', authError);
            throw new Error('Failed to create user account: ' + authError.message);
        }
        
        // Create user document in Firestore
        await addDoc(collection(db, 'users'), {
            uid: userId,
            username: username,
            email: email,
            role: 'barangay',
            barangayName: barangayName,
            terrain: terrain,
            contact: window.currentRequestData.contact,
            approved: true,
            dateApproved: serverTimestamp(),
            createdAt: serverTimestamp(),
            isFirstLogin: true
        });
        
        // Update request status
        await updateDoc(doc(db, 'accountRequests', requestId), {
            status: 'approved',
            dateApproved: serverTimestamp(),
            approvedTerrain: terrain
        });
        
        // Verify admin session is still intact
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.email !== adminEmail) {
            console.warn('⚠️ Admin session may have been affected, attempting to restore...');
            // Force reload to restore proper session state
            window.location.reload();
            return false;
        }
        
        console.log('Admin session preserved successfully:', currentUser.email);
        
        // Show success modal instead of alert (display canonical login username)
        showAccountSuccessModal(username, email, password, terrain);
        
        return true;
        
    } catch (error) {
        console.error('Error approving account:', error);
        
        // Check if admin session was lost during error
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.email !== adminEmail) {
            console.error('❌ Admin session lost due to error, reloading page...');
            alert('Account creation failed and admin session was affected. Page will reload.');
            window.location.reload();
            return false;
        }
        
        alert('Error creating account: ' + error.message);
        return false;
    }
}

// Variables to track decline operation
let pendingDeclineId = null;

// Open decline confirmation modal
function openDeclineModal(requestId) {
    pendingDeclineId = requestId;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

// Close decline modal
function closeDeclineModal() {
    pendingDeclineId = null;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Confirm decline and delete request
async function confirmDeclineRequest() {
    if (!pendingDeclineId) return;
    
    try {
        await deleteDoc(doc(db, 'accountRequests', pendingDeclineId));
        alert('Account request declined successfully');
        closeDeclineModal();
        loadAccountRequests(); // Refresh the table
    } catch (error) {
        console.error('Error declining request:', error);
        alert('Error declining request: ' + error.message);
    }
}

// Expose functions globally
window.loadAccountRequests = loadAccountRequests;
window.openApprovalModal = openApprovalModal;
window.closeApprovalModal = closeApprovalModal;
window.closeApproveModal = closeApprovalModal; // Alias for HTML compatibility
window.processApproval = processApproval;
window.openDeclineModal = openDeclineModal;
window.closeDeclineModal = closeDeclineModal;
window.showDeleteModal = openDeclineModal; // Alias for HTML compatibility
window.closeDeleteModal = closeDeclineModal; // Alias for HTML compatibility
window.confirmDelete = confirmDeclineRequest; // Alias for HTML compatibility
window.confirmDeclineRequest = confirmDeclineRequest;

// Account Success Modal Functions
function showAccountSuccessModal(loginUsername, email, password, terrain) {
    // Populate the modal with account details (show canonical username with prefix)
    const usernameDisplay = loginUsername && loginUsername.startsWith('barangay_')
        ? loginUsername
        : `barangay_${String(loginUsername || '').toLowerCase().replace(/\s+/g, '')}`;
    document.getElementById('successBarangayName').textContent = usernameDisplay;
    document.getElementById('successEmail').textContent = email;
    document.getElementById('successPassword').textContent = password;
    document.getElementById('successTerrain').textContent = terrain;
    
    // Show the modal
    const modal = document.getElementById('accountSuccessModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.style.pointerEvents = 'auto';
    }
}

function closeAccountSuccessModal() {
    const modal = document.getElementById('accountSuccessModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        modal.style.pointerEvents = 'none';
    }
    
    // Refresh the account requests table
    if (typeof loadAccountRequests === 'function') {
        loadAccountRequests();
    }
}

// Expose functions globally
window.showAccountSuccessModal = showAccountSuccessModal;
window.closeAccountSuccessModal = closeAccountSuccessModal;

// Function to clean up duplicate barangay accounts
window.cleanupDuplicateBarangays = async function() {
    try {
        console.log('Starting duplicate barangay cleanup...');
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'barangay'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log('No barangay accounts found');
            return;
        }
        
        // Group documents by barangay name
        const barangayGroups = new Map();
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const barangayName = data.username?.replace('barangay_', '') || data.barangayName;
            
            if (!barangayGroups.has(barangayName)) {
                barangayGroups.set(barangayName, []);
            }
            
            barangayGroups.get(barangayName).push({
                id: doc.id,
                data: data,
                createdAt: data.createdAt || data.dateApproved || null
            });
        });
        
        let duplicatesFound = 0;
        let duplicatesRemoved = 0;
        
        // Check each group for duplicates
        for (const [barangayName, docs] of barangayGroups) {
            if (docs.length > 1) {
                duplicatesFound += docs.length - 1;
                console.log(`Found ${docs.length} duplicates for: ${barangayName}`);
                
                // Sort by creation date (keep the oldest one)
                docs.sort((a, b) => {
                    if (!a.createdAt) return 1;
                    if (!b.createdAt) return -1;
                    return a.createdAt.toDate() - b.createdAt.toDate();
                });
                
                // Keep the first (oldest) and remove the rest
                for (let i = 1; i < docs.length; i++) {
                    const docToDelete = docs[i];
                    console.log(`Removing duplicate: ${barangayName} (ID: ${docToDelete.id})`);
                    
                    try {
                        await deleteDoc(doc(db, 'users', docToDelete.id));
                        duplicatesRemoved++;
                    } catch (error) {
                        console.error(`Error removing duplicate ${docToDelete.id}:`, error);
                    }
                }
            }
        }
        
        if (duplicatesFound === 0) {
            alert('No duplicates found! All barangay accounts are unique.');
        } else {
            alert(`Cleanup complete!\n\nDuplicates found: ${duplicatesFound}\nDuplicates removed: ${duplicatesRemoved}\n\nThe barangay list should now show unique entries only.`);
        }
        
        console.log('Duplicate cleanup completed');
        
    } catch (error) {
        console.error('Error during cleanup:', error);
        alert('Error during cleanup: ' + error.message);
    }
};

// Debug function to check Account Requests functionality
window.debugAccountRequests = function() {
    console.log('Debugging Account Requests functionality...');
    
    // Check if section exists
    const accountRequestsSection = document.getElementById('accountRequests');
    console.log('Section exists:', !!accountRequestsSection);
    console.log('Section display:', accountRequestsSection ? getComputedStyle(accountRequestsSection).display : 'N/A');
    console.log('Section hidden class:', accountRequestsSection ? accountRequestsSection.classList.contains('hidden') : 'N/A');
    
    // Check if table exists
    const requestsTable = document.getElementById('requestsTable');
    const requestsTableBody = document.getElementById('requestsTableBody');
    console.log('Table exists:', !!requestsTable);
    console.log('Table body exists:', !!requestsTableBody);
    console.log('Table body innerHTML length:', requestsTableBody ? requestsTableBody.innerHTML.length : 0);
    
    // Check if functions exist
    console.log('loadAccountRequests function exists:', typeof loadAccountRequests === 'function');
    console.log('openApprovalModal function exists:', typeof openApprovalModal === 'function');
    
    // Check user role
    console.log('Current user role:', loggedInUserData?.role);
    console.log('Is MSWD user:', loggedInUserData?.role === 'mswd');
    
    // Try to call loadAccountRequests
    if (typeof loadAccountRequests === 'function') {
            console.log('Calling loadAccountRequests...');
        loadAccountRequests();
    }
};

// Test function to create sample account requests (for debugging)
window.createSampleAccountRequest = async function() {
    try {
        const sampleRequest = {
            barangayName: 'Sample Barangay',
            email: 'sample.barangay@gmail.com',
            contact: '09123456789',
            message: 'We would like to request an account for our barangay to manage our residents and relief goods distribution.',
            status: 'pending',
            dateRequested: serverTimestamp()
        };
        
        await addDoc(collection(db, 'accountRequests'), sampleRequest);
        alert('Sample account request created successfully!');
        
        // Refresh table if we are on the account requests section
        if (typeof loadAccountRequests === 'function') {
            loadAccountRequests();
        }
    } catch (error) {
        console.error('Error creating sample request:', error);
        alert('Error creating sample request: ' + error.message);
    }
};

// Success modal functions for resident addition
function showResidentSuccessModal(residentData) {
    const modal = document.getElementById('residentSuccessModal');
    if (modal) {
        // Populate the summary with resident data
        document.getElementById('summaryName').textContent = residentData.name || '-';
        document.getElementById('summaryAge').textContent = residentData.age || '-';
        document.getElementById('summaryAddress').textContent = residentData.addressZone || '-';
        document.getElementById('summaryHousehold').textContent = residentData.householdNumber || '-';
        
        // Show the modal
        modal.classList.remove('hidden');
    }
}

function closeResidentSuccessModal() {
    const modal = document.getElementById('residentSuccessModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function addAnotherResident() {
    closeResidentSuccessModal();
    // Clear the form and show the add resident modal again
    document.getElementById('addResidentForm').reset();
    showAddResidentModal();
}


// Logout function is handled by the main window.logout function above
// Removed duplicate to prevent conflicts

// ✅ Enhanced showChangePassword function
function showChangePassword() {
    const modal = document.getElementById("changePasswordModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
        modal.style.pointerEvents = "auto";
        
        // Focus on first input for better UX
        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="password"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }
}

window.showChangePassword = showChangePassword;
window.showAddResidentModal = showAddResidentModal;
window.closeAddResidentModal = closeAddResidentModal;
window.showResidentSuccessModal = showResidentSuccessModal;
window.closeResidentSuccessModal = closeResidentSuccessModal;
window.addAnotherResident = addAnotherResident;

// ✅ Enhanced closeChangePasswordModal function
function closeChangePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
        modal.style.pointerEvents = "none";
        
        // Reset form
        const form = document.getElementById("changePasswordForm");
        if (form) {
            form.reset();
        }
        
        // Clear validation states
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('error', 'success');
        });
    }
}

window.closeChangePasswordModal = closeChangePasswordModal;

// ✅ Enhanced password validation and UX
document.addEventListener('DOMContentLoaded', function() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            validatePasswordStrength(this.value);
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch();
        });
    }
});

// Password strength validation
function validatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-fill');
    const strengthText = document.querySelector('.password-strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    // Remove existing classes
    strengthBar.className = 'password-strength-fill';
    
    if (strength <= 25) {
        strengthBar.classList.add('password-strength-weak');
        feedback = 'Weak';
    } else if (strength <= 50) {
        strengthBar.classList.add('password-strength-fair');
        feedback = 'Fair';
    } else if (strength <= 75) {
        strengthBar.classList.add('password-strength-good');
        feedback = 'Good';
    } else {
        strengthBar.classList.add('password-strength-strong');
        feedback = 'Strong';
    }
    
    strengthText.textContent = feedback;
}

// Password match validation
function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const confirmInput = document.getElementById('confirmNewPassword');
    
    if (confirmPassword && newPassword !== confirmPassword) {
        confirmInput.classList.add('error');
        confirmInput.classList.remove('success');
    } else if (confirmPassword && newPassword === confirmPassword) {
        confirmInput.classList.remove('error');
        confirmInput.classList.add('success');
    } else {
        confirmInput.classList.remove('error', 'success');
    }
}

// Modal functions are now handled by global functions in main.html
// Remove duplicate declarations to avoid conflicts


// Modal functions are handled by global functions in main.html

// Toggle barangay delivery details is implemented below at line ~4004

// Print barangay delivery receipt is implemented below at line ~4024

// ===== INVENTORY HISTORY & BATCH MANAGEMENT =====

// Enhanced inventory history modal with professional styling
async function showInventoryHistory() {
    try {
        const modal = document.getElementById('historyModal');
        if (!modal) return;
        
        // Setup filters after modal is shown
        setTimeout(() => {
            setupHistoryFilters();
        }, 100);
        
        // Load history data
        const logs = await getInventoryLogs();
        const historyBody = document.getElementById('inventoryHistoryBody');
        if (!historyBody) return;
        
        // Clear existing data
        historyBody.innerHTML = '';
        
        if (logs.length === 0) {
            // Load simple sample data if no real data exists
            loadSimpleInventoryHistoryData();
        } else {
            logs.forEach(log => {
                const row = document.createElement('tr');
                const createdAt = log.createdAt?.toDate ? log.createdAt.toDate() : new Date();
                
                // Format items display (names only, no quantities)
                let itemsDisplay = '';
                if (log.items) {
                    const items = [];
                    if (log.items.rice) items.push('Rice');
                    if (log.items.biscuits) items.push('Biscuits');
                    if (log.items.canned) items.push('Canned');
                    if (log.items.shirts) items.push('Shirts');
                    // Include any custom item names if present (without quantities)
                    if (log.items.customItems && typeof log.items.customItems === 'object') {
                        Object.keys(log.items.customItems).forEach(key => items.push(key));
                    }
                    itemsDisplay = items.join(', ');
                }
                
                // Enhanced row with professional styling
                const typeClass = log.action === 'stock-in' ? 'stock-in' : 'delivery';
                const typeText = log.action === 'stock-in' ? 'Stock In' : 'Delivery';
                
                row.innerHTML = `
                    <td>${createdAt.toLocaleString()}</td>
                    <td><span class=\"type-badge ${typeClass}\">${typeText}</span></td>
                    <td>${itemsDisplay || 'N/A'}</td>
                    <td>-</td>
                    <td>${log.user || 'System'}</td>
                    <td>${log.id || 'N/A'}</td>
                `;
                historyBody.appendChild(row);
            });
        }
        
        // Show modal with enhanced styling
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading inventory history:', error);
        // Load simple sample data on error
        loadSimpleInventoryHistoryData();
        const modal = document.getElementById('historyModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            setTimeout(() => {
                setupHistoryFilters();
            }, 100);
        }
    }
}

// Show new batch modal with custom modal instead of prompt
function showNewBatchModal() {
    // Set button to processing state
    const newBatchBtn = document.getElementById('newBatchBtn');
    if (newBatchBtn) {
        newBatchBtn.disabled = true;
        newBatchBtn.innerHTML = '<span class="material-icons">hourglass_empty</span><span class="btn-text">Processing...</span>';
    }
    
    showReliefOperationModal();
}

// Custom Relief Operation Modal - Modern Professional Design
function showReliefOperationModal() {
    const defaultName = 'Relief Operation ' + new Date().toLocaleDateString();
    
    const modalHTML = `
        <div id="reliefOperationModal" class="message-modal" style="animation: modalFadeIn 0.3s ease-out;">
            <div class="message-modal-overlay"></div>
            <div style="
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                max-width: 420px;
                width: 90vw;
                overflow: hidden;
                position: relative;
                z-index: 1;
                animation: modalContentSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
                <!-- Modern Header without Close Button -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 24px 24px 20px;
                    position: relative;
                ">
                    <div style="text-align: center; color: white;">
                        <h3 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: white; letter-spacing: 0.5px;">
                            New Relief Operation
                        </h3>
                    </div>
                </div>

                <!-- Content Area -->
                <div style="padding: 32px 24px 24px;">
                    <p style="
                        margin: 0 0 20px 0; 
                        color: #6b7280; 
                        font-size: 0.95rem; 
                        text-align: center;
                        line-height: 1.5;
                    ">
                        Enter a name for the new relief operation:
                    </p>
                    
                    <div style="position: relative; margin-bottom: 32px;">
                        <input type="text" id="reliefOperationNameInput" 
                               value="${defaultName}" 
                               style="
                                   width: 100%; 
                                   padding: 16px 20px; 
                                   border: 2px solid #f3f4f6; 
                                   border-radius: 12px; 
                                   font-size: 1rem; 
                                   outline: none; 
                                   transition: all 0.3s ease;
                                   background: #fafbfc;
                                   color: #374151;
                                   font-weight: 500;
                                   box-sizing: border-box;
                               "
                               onkeypress="if(event.key==='Enter') confirmReliefOperation()"
                               onfocus="
                                   this.style.borderColor='#667eea';
                                   this.style.background='white';
                                   this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';
                               "
                               onblur="
                                   this.style.borderColor='#f3f4f6';
                                   this.style.background='#fafbfc';
                                   this.style.boxShadow='none';
                               "
                               placeholder="Relief Operation Name">
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 12px;">
                        <button onclick="closeReliefOperationModal()" style="
                            flex: 1;
                            background: #f8fafc;
                            color: #64748b;
                            border: 2px solid #e2e8f0;
                            padding: 14px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 0.95rem;
                        " onmouseover="
                            this.style.background='#f1f5f9';
                            this.style.borderColor='#cbd5e1';
                            this.style.transform='translateY(-1px)';
                        " onmouseout="
                            this.style.background='#f8fafc';
                            this.style.borderColor='#e2e8f0';
                            this.style.transform='translateY(0)';
                        ">
                            Cancel
                        </button>
                        
                        <button onclick="confirmReliefOperation()" style="
                            flex: 1;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 14px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            justify-content: center;
                            font-size: 0.95rem;
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                        " onmouseover="
                            this.style.transform='translateY(-2px)';
                            this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.4)';
                        " onmouseout="
                            this.style.transform='translateY(0)';
                            this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';
                        ">
                            <span class="material-icons" style="font-size: 18px;">check</span>
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes modalContentSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
        </style>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('reliefOperationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on input field
    setTimeout(() => {
        const input = document.getElementById('reliefOperationNameInput');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

function closeReliefOperationModal() {
    const modal = document.getElementById('reliefOperationModal');
    if (modal) {
        modal.remove();
    }
    
    // Reset button state when modal is closed (for cancel)
    const newBatchBtn = document.getElementById('newBatchBtn');
    if (newBatchBtn && newBatchBtn._originalHTML) {
        newBatchBtn.disabled = false;
        newBatchBtn.innerHTML = newBatchBtn._originalHTML;
    }
}

function confirmReliefOperation() {
    const input = document.getElementById('reliefOperationNameInput');
    const name = input ? input.value.trim() : '';
    
    if (name) {
        closeReliefOperationModal();
        startNewReliefOperation(name);
    } else {
        // Show error if name is empty
        input.style.borderColor = '#ef4444';
        input.focus();
    }
}

// Start new relief operation
async function startNewReliefOperation(name) {
    try {
        const periodLabel = new Date().toLocaleDateString();
        
        // Clear custom items from the UI before starting new batch
        console.log('🧹 Clearing custom items before starting new relief operation...');
        clearCustomItems();
        
        await startNewBatch(name, periodLabel);
        showSuccess('New relief operation started. Inventory and custom items have been reset.');
        
        // Auto refresh after successful operation
        setTimeout(() => {
            window.location.reload();
        }, 2000); // 2 seconds delay to show success message
        
    } catch (error) {
        console.error('Error starting new relief operation:', error);
        showError('Failed to start new relief operation.');
    }
}

// Generate summary report
async function generateSummaryReport() {
    try {
        let activeBatch, logs, totals;
        
        try {
            activeBatch = await getActiveBatch();
        } catch (e) {
            console.warn('Failed to get active batch:', e);
            activeBatch = { id: 'default', name: 'Current Operation', periodLabel: new Date().toLocaleDateString() };
        }
        
        try {
            logs = await getInventoryLogs({ batchId: activeBatch.id });
        } catch (e) {
            console.warn('Failed to get inventory logs:', e);
            logs = [];
        }
        
        try {
            totals = await getInventoryTotals();
        } catch (e) {
            console.warn('Failed to get inventory totals:', e);
            totals = { rice: 0, biscuits: 0, canned: 0, shirts: 0 };
        }
        
        // Create summary data including custom items
        let stockIn = { rice: 0, biscuits: 0, canned: 0, shirts: 0 };
        let deliveries = { rice: 0, biscuits: 0, canned: 0, shirts: 0 };
        let customStockIn = {};
        let customDeliveries = {};
        
        logs.forEach(log => {
            if (log.action === 'stock-in' && log.items) {
                // Process basic items
                stockIn.rice += Number(log.items.rice || 0);
                stockIn.biscuits += Number(log.items.biscuits || 0);
                stockIn.canned += Number(log.items.canned || 0);
                stockIn.shirts += Number(log.items.shirts || 0);
                
                // Process custom items from stock-in logs
                if (log.customItems) {
                    Object.entries(log.customItems).forEach(([itemKey, quantity]) => {
                        if (!customStockIn[itemKey]) customStockIn[itemKey] = 0;
                        customStockIn[itemKey] += Number(quantity || 0);
                    });
                }
            } else if (log.action === 'delivery' && log.items) {
                // Process basic items
                deliveries.rice += Number(log.items.rice || 0);
                deliveries.biscuits += Number(log.items.biscuits || 0);
                deliveries.canned += Number(log.items.canned || 0);
                deliveries.shirts += Number(log.items.shirts || 0);
                
                // Process custom items from delivery logs
                if (log.customItems) {
                    Object.entries(log.customItems).forEach(([itemKey, quantity]) => {
                        if (!customDeliveries[itemKey]) customDeliveries[itemKey] = 0;
                        customDeliveries[itemKey] += Number(quantity || 0);
                    });
                }
            }
        });
        
        // Build custom items rows for current inventory
        let customInventoryRows = '';
        if (totals.customItems) {
            Object.entries(totals.customItems).forEach(([key, item]) => {
                const displayName = item.name || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                const unit = item.unit || '';
                const quantity = item.quantity || 0;
                customInventoryRows += `<tr><td>${displayName}${unit ? ` (${unit})` : ''}</td><td>${quantity}</td></tr>`;
            });
        }
        
        // Build custom items rows for stock received
        let customStockReceivedRows = '';
        Object.entries(customStockIn).forEach(([key, quantity]) => {
            if (quantity > 0) {
                const displayName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                customStockReceivedRows += `<tr><td>${displayName}</td><td>${quantity}</td></tr>`;
            }
        });
        
        // Build custom items rows for deliveries made
        let customDeliveryRows = '';
        Object.entries(customDeliveries).forEach(([key, quantity]) => {
            if (quantity > 0) {
                const displayName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                customDeliveryRows += `<tr><td>${displayName}</td><td>${quantity}</td></tr>`;
            }
        });
        
        // Create summary HTML using standardized template with custom items
        const summaryHtml = `
            <div class="section">
                <div class="grid-2">
                    <table>
                        <tr><th>Operation:</th><td>${activeBatch.name}</td></tr>
                        <tr><th>Period:</th><td>${activeBatch.periodLabel}</td></tr>
                        <tr><th>Total Transactions:</th><td>${logs.length}</td></tr>
                    </table>
                    <div></div>
                </div>
            </div>
            
            <div class="section">
                <div class="small" style="font-weight:700;margin-bottom:6px;">Current Inventory</div>
                <table>
                    <tr><th>Item</th><th>Current Stock</th></tr>
                    <tr><td>Rice (sacks)</td><td>${totals.rice || 0}</td></tr>
                    <tr><td>Biscuits (boxes)</td><td>${totals.biscuits || 0}</td></tr>
                    <tr><td>Canned Goods (boxes)</td><td>${totals.canned || 0}</td></tr>
                    <tr><td>Shirts (packs)</td><td>${totals.shirts || 0}</td></tr>
                    ${customInventoryRows}
                </table>
            </div>
            
            <div class="section">
                <div class="grid-2">
                    <div>
                        <div class="small" style="font-weight:700;margin-bottom:6px;">Stock Received</div>
                        <table>
                            <tr><th>Item</th><th>Total Received</th></tr>
                            <tr><td>Rice (sacks)</td><td>${stockIn.rice}</td></tr>
                            <tr><td>Biscuits (boxes)</td><td>${stockIn.biscuits}</td></tr>
                            <tr><td>Canned Goods (boxes)</td><td>${stockIn.canned}</td></tr>
                            <tr><td>Shirts (packs)</td><td>${stockIn.shirts}</td></tr>
                            ${customStockReceivedRows}
                        </table>
                    </div>
                    <div>
                        <div class="small" style="font-weight:700;margin-bottom:6px;">Deliveries Made</div>
                        <table>
                            <tr><th>Item</th><th>Total Delivered</th></tr>
                            <tr><td>Rice (sacks)</td><td>${deliveries.rice}</td></tr>
                            <tr><td>Biscuits (boxes)</td><td>${deliveries.biscuits}</td></tr>
                            <tr><td>Canned Goods (boxes)</td><td>${deliveries.canned}</td></tr>
                            <tr><td>Shirts (packs)</td><td>${deliveries.shirts}</td></tr>
                            ${customDeliveryRows}
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Use standardized A4 template for printing
        const pageHTML = buildA4PrintHTML({
            title: 'RELIEF OPERATION SUMMARY REPORT',
            subtitle: 'Municipal Social Welfare and Development Office',
            bodyHTML: summaryHtml,
            footerHTML: `<div class="small">This is an official summary report. Generated on ${new Date().toLocaleString()}.</div>`
        });
        
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            // Popup blocked - fallback to download as HTML file
            const blob = new Blob([pageHTML], { type: 'text/html' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Relief_Summary_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSuccess('Summary report downloaded as HTML file.');
            return;
        }
        
        try {
            printWindow.document.write(pageHTML);
            printWindow.document.close();
            printWindow.focus();
            
            // Wait a bit for content to load, then print
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } catch (docError) {
            printWindow.close();
            throw new Error('Failed to write to print window: ' + docError.message);
        }
        
    } catch (error) {
        console.error('Error generating summary report:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to generate summary report.';
        if (error.message.includes('popup') || error.message.includes('blocked')) {
            errorMessage = 'Popup blocked. Please allow popups for this site and try again.';
        } else if (error.message.includes('print window')) {
            errorMessage = 'Cannot open print window. Please check your browser settings.';
        } else if (error.message.includes('document')) {
            errorMessage = 'Browser security settings prevent opening the report. Please try downloading it instead.';
        }
        
        showError(errorMessage);
    }
}

// Show delivery history for barangays
async function showDeliveryHistory() {
    try {
        if (!loggedInUserData || loggedInUserData.role !== 'barangay') {
            showError('Access denied. Barangay users only.');
            return;
        }
        
        const modal = document.getElementById('deliveryHistoryModal');
        if (!modal) {
            showError('Delivery history modal not found.');
            return;
        }
        
        // Get all deliveries for this barangay
        const deliveries = await getDeliveries(loggedInUserData.username);
        const historyBody = document.getElementById('deliveryHistoryTableBody');
        if (!historyBody) {
            showError('History table body not found.');
            return;
        }
        
        // Clear existing data
        historyBody.innerHTML = '';
        
        if (deliveries.length === 0) {
            historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No delivery history found.</td></tr>';
        } else {
            // Filter for received/completed deliveries
            const completedDeliveries = deliveries.filter(d => d.status === 'Received' || d.status === 'Delivered');
            
            if (completedDeliveries.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No completed deliveries yet.</td></tr>';
            } else {
                completedDeliveries.forEach(delivery => {
                    const row = document.createElement('tr');
                    
                    // Safely handle dates
                    const deliveryDate = safeToDate(delivery.deliveryDate);
                    const updatedAt = safeToDate(delivery.updatedAt);
                    const preferredTime = delivery.preferredTime || 'Anytime';
                    
                    // Format items received including custom items
                    let itemsReceived = 'N/A';
                    if (delivery.goods) {
                        const items = [];
                        if (delivery.goods.rice) items.push(`${delivery.goods.rice} Rice`);
                        if (delivery.goods.biscuits) items.push(`${delivery.goods.biscuits} Biscuits`);
                        if (delivery.goods.canned) items.push(`${delivery.goods.canned} Canned`);
                        if (delivery.goods.shirts) items.push(`${delivery.goods.shirts} Shirts`);
                        
                        // Add custom items to the display
                        if (delivery.customItems) {
                            Object.entries(delivery.customItems).forEach(([itemName, quantity]) => {
                                if (quantity > 0) {
                                    const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1).replace(/([A-Z])/g, ' $1');
                                    items.push(`${quantity} ${displayName}`);
                                }
                            });
                        }
                        
                        itemsReceived = items.length > 0 ? items.join('<br>') : 'No items specified';
                    }
                    
                    // Details with notes (full text)
                    let detailsDisplay = delivery.details || 'No details';
                    if (delivery.notes) {
                        detailsDisplay += `<br><small class="notes-text">${delivery.notes}</small>`;
                    }
                    
                    row.innerHTML = `
                        <td>
                            <div class="date-info">
                                <span class="date-text">${deliveryDate.toLocaleDateString()}</span>
                                <span class="time-text">${preferredTime}</span>
                            </div>
                        </td>
                        <td><div class="items-content">${itemsReceived}</div></td>
                        <td><span class="status-badge status-${delivery.status?.toLowerCase().replace(' ', '-')}">${delivery.status}</span></td>
                        <td><div class="details-content">${detailsDisplay}</div></td>
                        <td>${updatedAt.toLocaleDateString()}</td>
                    `;
                    historyBody.appendChild(row);
                });
            }
        }
        
        // Initialize DataTable for delivery history with export buttons
        try {
            if (window.jQuery && $('#deliveryHistoryTable').length) {
                // Ensure table has proper structure before initializing DataTable
                const table = document.getElementById('deliveryHistoryTable');
                if (!table) {
                    console.warn('Delivery history table not found');
                    return;
                }
                
                // Check if table has proper thead and tbody
                let thead = table.querySelector('thead');
                let tbody = table.querySelector('tbody');
                
                if (!thead) {
                    console.warn('Table missing thead, creating one');
                    thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    ['Date & Time', 'Items & Quantity', 'Status', 'Details & Notes', 'Received At'].forEach(headerText => {
                        const th = document.createElement('th');
                        th.textContent = headerText;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.insertBefore(thead, table.firstChild);
                }
                
                if (!tbody) {
                    console.warn('Table missing tbody, creating one');
                    tbody = document.createElement('tbody');
                    tbody.id = 'deliveryHistoryTableBody';
                    table.appendChild(tbody);
                }
                
                // Destroy existing DataTable if it exists
                if ($.fn.dataTable.isDataTable('#deliveryHistoryTable')) {
                    $('#deliveryHistoryTable').DataTable().destroy();
                    // Clear any residual DataTable classes and data
                    $('#deliveryHistoryTable').removeClass('dataTable');
                    $('#deliveryHistoryTable tbody tr').each(function() {
                        // Remove DataTable-specific attributes that might cause conflicts
                        $(this).removeAttr('role').removeAttr('data-dt-row').removeAttr('data-dt-column');
                        $(this).find('td, th').removeAttr('role').removeAttr('data-dt-row').removeAttr('data-dt-column').removeAttr('tabindex');
                    });
                }
                
                // Ensure all rows have consistent cell count
                const headerCellCount = thead.querySelectorAll('th').length;
                const bodyRows = tbody.querySelectorAll('tr');
                bodyRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const currentCellCount = cells.length;
                    
                    // Add empty cells if row has fewer cells than header
                    for (let i = currentCellCount; i < headerCellCount; i++) {
                        const emptyCell = document.createElement('td');
                        emptyCell.textContent = '-';
                        row.appendChild(emptyCell);
                    }
                    
                    // Remove excess cells if row has more cells than header
                    for (let i = currentCellCount - 1; i >= headerCellCount; i--) {
                        if (cells[i]) {
                            cells[i].remove();
                        }
                    }
                });
                
                // Final check: ensure table is valid for DataTable initialization
                if (headerCellCount === 0) {
                    console.warn('Table has no headers, skipping DataTable initialization');
                    return;
                }
                
                if (tbody.children.length === 0) {
                    // Add a placeholder row if tbody is empty
                    const emptyRow = document.createElement('tr');
                    for (let i = 0; i < headerCellCount; i++) {
                        const emptyCell = document.createElement('td');
                        emptyCell.textContent = i === 0 ? 'No data available' : '-';
                        emptyRow.appendChild(emptyCell);
                    }
                    tbody.appendChild(emptyRow);
                }
                
                const dt = $('#deliveryHistoryTable').DataTable({
                    order: [[0, 'desc']], // Most recent first
                    dom: 'Brt', // Only Buttons, seaRch (hidden), and Table - no info, no pagination
                    scrollY: '400px',
                    scrollCollapse: true,
                    paging: false, // Disable pagination
                    info: false,   // Disable info text
                    searching: false, // Disable built-in search (we'll use custom)
                    autoWidth: false,
                    deferRender: true,
                    processing: false,
                    columnDefs: [
                        { targets: '_all', className: 'dt-center' },
                        { targets: 0, type: 'date' }
                    ],
                    buttons: (function() {
                        try {
                            return [
                                { 
                                    extend: 'excelHtml5', 
                                    title: 'Delivery History - ' + new Date().toLocaleDateString(), 
                                    text: 'Excel',
                                    className: 'export-btn excel-btn',
                                    exportOptions: { 
                                        columns: function(idx, data, node) {
                                            return $(node).hasClass('no-export') ? false : true;
                                        }
                                    }
                                },
                                { 
                                    extend: 'pdfHtml5', 
                                    title: 'Delivery History Report', 
                                    text: 'PDF',
                                    className: 'export-btn pdf-btn',
                                    pageSize: 'A4',
                                    customize: function (doc) {
                                        try {
                                            doc.pageMargins = [20, 40, 20, 30];
                                            if (doc.styles) {
                                                doc.styles.tableHeader = { bold: true, fillColor: '#f5f5f5' };
                                            }
                                            if (doc.content) {
                                                doc.content.unshift({ 
                                                    text: 'DELIVERY HISTORY REPORT', 
                                                    style: { bold: true, fontSize: 16 }, 
                                                    alignment: 'center', 
                                                    margin: [0,0,0,8] 
                                                });
                                                doc.content.unshift({ 
                                                    text: 'Municipal Social Welfare and Development Office', 
                                                    alignment: 'center', 
                                                    fontSize: 12, 
                                                    margin: [0,0,0,15] 
                                                });
                                                doc.content.push({ 
                                                    text: 'Generated on: ' + new Date().toLocaleString(), 
                                                    alignment: 'right', 
                                                    fontSize: 8, 
                                                    margin: [0,10,0,0] 
                                                });
                                            }
                                        } catch(err) {
                                            console.warn('PDF customization failed:', err);
                                        }
                                    },
                                    exportOptions: { 
                                        columns: function(idx, data, node) {
                                            return $(node).hasClass('no-export') ? false : true;
                                        }
                                    }
                                },
                                { 
                                    extend: 'print', 
                                    title: 'Delivery History Report', 
                                    text: 'Print',
                                    className: 'export-btn print-btn',
                                    customize: function (win) {
                                        try {
                                            if (win && win.document && win.document.body) {
                                                const body = win.document.body;
                                                const content = body.innerHTML;
                                                const wrapper = `
                                                    <div class="print-page">
                                                        <div class="print-header">
                                                            <div class="print-title">DELIVERY HISTORY REPORT</div>
                                                            <div class="print-subtitle">Municipal Social Welfare and Development Office</div>
                                                            <div class="print-date">Generated on: ${new Date().toLocaleString()}</div>
                                                        </div>
                                                        <div class="print-content">${content}</div>
                                                    </div>
                                                `;
                                                body.innerHTML = wrapper;
                                                
                                                // Enhanced print styles
                                                const style = win.document.createElement('style');
                                                style.innerHTML = `
                                                    .print-header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                                                    .print-title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                                                    .print-subtitle { font-size: 14px; color: #666; margin-bottom: 8px; }
                                                    .print-date { font-size: 10px; color: #888; }
                                                    table { width: 100% !important; border-collapse: collapse; }
                                                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                                    th { background-color: #f5f5f5; font-weight: bold; }
                                                `;
                                                if (win.document.head) {
                                                    win.document.head.appendChild(style);
                                                }
                                            }
                                        } catch(e) { 
                                            console.warn('Print customization failed:', e); 
                                        }
                                    },
                                    exportOptions: { 
                                        columns: function(idx, data, node) {
                                            return $(node).hasClass('no-export') ? false : true;
                                        }
                                    }
                                }
                            ];
                        } catch(err) {
                            console.warn('Button configuration failed:', err);
                            return []; // Return empty buttons array as fallback
                        }
                    })()
                });
                
                // Enhanced toolbar setup for delivery history
                setTimeout(() => {
                    try {
                        const wrapper = document.getElementById('deliveryHistoryTable').closest('.dataTables_wrapper');
                        const btns = wrapper ? wrapper.querySelector('.dt-buttons') : null;
                        const filter = wrapper ? wrapper.querySelector('.dataTables_filter') : null;
                        const info = wrapper ? wrapper.querySelector('.dataTables_info') : null;
                        const paginate = wrapper ? wrapper.querySelector('.dataTables_paginate') : null;
                        const historySearchSection = document.getElementById('historySearchSection');
                        
                        // Hide DataTable's built-in search, info, and pagination
                        if (filter) filter.style.display = 'none';
                        if (info) info.style.display = 'none';
                        if (paginate) paginate.style.display = 'none';
                        
                        // Move export buttons to our custom search section
                        if (btns && historySearchSection) {
                            // Prevent duplicating buttons on reloads
                            if (historySearchSection.dataset.dtMoved === '1') {
                                return;
                            }
                            
                            // Remove any existing button container to avoid duplicates
                            const existingBtns = historySearchSection.querySelector('.dt-buttons');
                            if (existingBtns && existingBtns !== btns) {
                                existingBtns.remove();
                            }
                            
                            // Insert buttons after the search section
                            const searchSection = historySearchSection.querySelector('.search-section');
                            if (searchSection) {
                                historySearchSection.insertBefore(btns, searchSection.nextSibling);
                            } else {
                                historySearchSection.appendChild(btns);
                            }

                            // Style the export buttons
                            btns.style.cssText = `
                                display: flex !important;
                                gap: 8px !important;
                                margin: 12px 0 16px 0 !important;
                                flex-wrap: wrap !important;
                                justify-content: flex-start !important;
                            `;
                            
                            // Style individual buttons
                            btns.querySelectorAll('a, button').forEach((btn, index) => {
                                btn.style.cssText = `
                                    background: ${index === 0 ? '#16a34a' : index === 1 ? '#dc2626' : '#7c3aed'} !important;
                                    color: white !important;
                                    border: none !important;
                                    padding: 8px 16px !important;
                                    border-radius: 6px !important;
                                    text-decoration: none !important;
                                    font-size: 0.875rem !important;
                                    font-weight: 500 !important;
                                    transition: all 0.3s ease !important;
                                    cursor: pointer !important;
                                `;
                                
                                // Add hover effects
                                btn.addEventListener('mouseenter', function() {
                                    this.style.transform = 'translateY(-2px)';
                                    this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                });
                                
                                btn.addEventListener('mouseleave', function() {
                                    this.style.transform = 'translateY(0)';
                                    this.style.boxShadow = 'none';
                                });
                            });

                            // Mark as moved to avoid future duplication
                            historySearchSection.dataset.dtMoved = '1';
                        }
                        
                        // Setup custom date search functionality
                        setupDeliveryHistoryDateSearch();
                        
                    } catch(err) {
                        console.warn('Error setting up delivery history interface:', err);
                    }
                }, 100);
            }
        } catch (e) {
            console.error('DataTable init (delivery history) failed:', e);
            // Fallback: Create a basic table without DataTable features if initialization fails
            try {
                const table = document.getElementById('deliveryHistoryTable');
                if (table) {
                    // Ensure basic table functionality even without DataTables
                    console.log('Using fallback table functionality');
                    
                    // Add basic export functionality without DataTables
                    const historySearchSection = document.getElementById('historySearchSection');
                    if (historySearchSection && !historySearchSection.querySelector('.fallback-export-buttons')) {
                        const exportContainer = document.createElement('div');
                        exportContainer.className = 'fallback-export-buttons';
                        exportContainer.style.cssText = 'margin: 12px 0 16px 0; display: flex; gap: 8px;';
                        
                        // Simple print button fallback
                        const printBtn = document.createElement('button');
                        printBtn.textContent = 'Print';
                        printBtn.className = 'export-btn print-btn';
                        printBtn.style.cssText = `
                            background: #7c3aed !important;
                            color: white !important;
                            border: none !important;
                            padding: 8px 16px !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                        `;
                        printBtn.onclick = function() {
                            try {
                                const printContent = generateStandardExportHTML(
                                    'Delivery History Report',
                                    table.outerHTML,
                                    { reportTitle: 'DELIVERY HISTORY REPORT', includeSignatures: true }
                                );
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                    printWindow.document.write(printContent);
                                    printWindow.document.close();
                                    printWindow.focus();
                                    setTimeout(() => {
                                        printWindow.print();
                                        printWindow.close();
                                    }, 200);
                                }
                            } catch(err) {
                                console.error('Fallback print failed:', err);
                                alert('Print functionality is temporarily unavailable.');
                            }
                        };
                        
                        exportContainer.appendChild(printBtn);
                        historySearchSection.appendChild(exportContainer);
                    }
                }
            } catch(fallbackError) {
                console.error('Fallback table setup also failed:', fallbackError);
            }
        }
        
        // Show modal
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error in showDeliveryHistory:', error);
        showError('Failed to load delivery history: ' + error.message);
    }
}

// Enhanced date filter functionality with awesome features
function applySimpleDateFilter() {
    console.log('Applying date filter...');
    try {
        const fromDate = document.getElementById('historyFromDate').value;
        const toDate = document.getElementById('historyToDate').value;
        
        console.log('Filter dates:', { fromDate, toDate });
        
        const table = document.getElementById('deliveryHistoryTable');
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;
        let totalRows = rows.length;
        
        // Add visual feedback
        const applyBtn = document.querySelector('#deliveryHistoryModal .apply-btn');
        let originalText = '<span class="material-icons">filter_list</span> Apply Filter';
        if (applyBtn) {
            originalText = applyBtn.innerHTML;
            applyBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Filtering...';
            applyBtn.disabled = true;
        }
        
        // Add smooth animation delay
        setTimeout(() => {
            rows.forEach((row, index) => {
                let showRow = true;
                
                // Skip empty state rows
                if (row.querySelector('td[colspan]')) {
                    return;
                }
                
                // Date filtering with enhanced logic
                if (fromDate || toDate) {
                    const dateCell = row.querySelector('td:first-child .date-text');
                    if (dateCell) {
                        const rowDateText = dateCell.textContent.trim();
                        
                        // Try multiple date formats
                        let rowDate;
                        try {
                            // Handle MM/DD/YYYY format
                            if (rowDateText.includes('/')) {
                                const parts = rowDateText.split('/');
                                if (parts.length === 3) {
                                    rowDate = new Date(parts[2], parts[0] - 1, parts[1]);
                                }
                            } else {
                                rowDate = new Date(rowDateText);
                            }
                            
                            if (rowDate && !isNaN(rowDate.getTime())) {
                                if (fromDate) {
                                    const filterFromDate = new Date(fromDate);
                                    if (rowDate < filterFromDate) {
                                        showRow = false;
                                    }
                                }
                                
                                if (toDate && showRow) {
                                    const filterToDate = new Date(toDate);
                                    filterToDate.setHours(23, 59, 59, 999); // Include full day
                                    if (rowDate > filterToDate) {
                                        showRow = false;
                                    }
                                }
                            } else {
                                showRow = false;
                            }
                        } catch (e) {
                            showRow = false;
                        }
                    } else {
                        showRow = false;
                    }
                }
                
                // Smooth show/hide animation
                if (showRow) {
                    row.style.display = '';
                    row.style.opacity = '0';
                    row.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        row.style.transition = 'all 0.3s ease';
                        row.style.opacity = '1';
                        row.style.transform = 'translateY(0)';
                    }, index * 50);
                    
                    visibleCount++;
                } else {
                    row.style.transition = 'all 0.3s ease';
                    row.style.opacity = '0';
                    row.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        row.style.display = 'none';
                    }, 300);
                }
            });
            
            // Update filter status with awesome feedback
            setTimeout(() => {
                if (applyBtn) {
                    applyBtn.innerHTML = originalText;
                    applyBtn.disabled = false;
                }
                
                // Show awesome filter results
                showFilterResults(visibleCount, totalRows, fromDate, toDate);
                
            }, 500);
            
        }, 100);
        
    } catch (error) {
        console.error('Filter error:', error);
        const applyBtn = document.querySelector('.apply-btn');
        applyBtn.innerHTML = '<span class="material-icons">filter_list</span> Apply Filter';
        applyBtn.disabled = false;
    }
}

function clearSimpleDateFilter() {
    try {
        // Add visual feedback
        const clearBtn = document.querySelector('#deliveryHistoryModal .clear-btn');
        let originalText = '<span class="material-icons">clear</span> Clear Filter';
        if (clearBtn) {
            originalText = clearBtn.innerHTML;
            clearBtn.innerHTML = '<span class="material-icons">refresh</span> Clearing...';
            clearBtn.disabled = true;
        }
        
        // Clear filter inputs with animation
        const fromDate = document.getElementById('historyFromDate');
        const toDate = document.getElementById('historyToDate');
        
        fromDate.style.transition = 'all 0.3s ease';
        toDate.style.transition = 'all 0.3s ease';
        fromDate.style.transform = 'scale(0.95)';
        toDate.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            fromDate.value = '';
            toDate.value = '';
            fromDate.style.transform = 'scale(1)';
            toDate.style.transform = 'scale(1)';
        }, 150);
        
        // Show all rows with staggered animation
        const table = document.getElementById('deliveryHistoryTable');
        const rows = table.querySelectorAll('tbody tr');
        
        setTimeout(() => {
            rows.forEach((row, index) => {
                if (!row.querySelector('td[colspan]')) {
                    row.style.display = '';
                    row.style.opacity = '0';
                    row.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        row.style.transition = 'all 0.3s ease';
                        row.style.opacity = '1';
                        row.style.transform = 'translateY(0)';
                    }, index * 30);
                }
            });
            
            // Remove any filter status
            removeFilterStatus();
            
            // Reset button
            setTimeout(() => {
                if (clearBtn) {
                    clearBtn.innerHTML = originalText;
                    clearBtn.disabled = false;
                }
                
                // Show success feedback
                showClearSuccess(rows.length);
            }, 500);
            
        }, 200);
        
    } catch (error) {
        console.error('Clear filter error:', error);
        const clearBtn = document.querySelector('.clear-btn');
        clearBtn.innerHTML = '<span class="material-icons">clear</span> Clear Filter';
        clearBtn.disabled = false;
    }
}

// Awesome filter results display
function showFilterResults(visibleCount, totalRows, fromDate, toDate) {
    // Remove existing status
    removeFilterStatus();
    
    // Create filter status element
    const filterStatus = document.createElement('div');
    filterStatus.id = 'filterStatus';
    filterStatus.className = 'filter-status-awesome';
    
    let dateRangeText = '';
    if (fromDate && toDate) {
        dateRangeText = ` from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`;
    } else if (fromDate) {
        dateRangeText = ` from ${new Date(fromDate).toLocaleDateString()}`;
    } else if (toDate) {
        dateRangeText = ` until ${new Date(toDate).toLocaleDateString()}`;
    }
    
    filterStatus.innerHTML = `
        <div class="filter-status-content">
            <span class="material-icons">filter_alt</span>
            <span class="filter-text">
                Showing <strong>${visibleCount}</strong> of <strong>${totalRows}</strong> deliveries${dateRangeText}
            </span>
            ${visibleCount === 0 ? '<span class="no-results">No deliveries found in this date range</span>' : ''}
        </div>
    `;
    
    // Insert after filter section
    const filterSection = document.querySelector('.simple-filter-section');
    filterSection.parentNode.insertBefore(filterStatus, filterSection.nextSibling);
    
    // Animate in
    setTimeout(() => {
        filterStatus.style.opacity = '1';
        filterStatus.style.transform = 'translateY(0)';
    }, 100);
}

function showClearSuccess(totalRows) {
    // Create temporary success message
    const successMsg = document.createElement('div');
    successMsg.className = 'clear-success-msg';
    successMsg.innerHTML = `
        <span class="material-icons">check_circle</span>
        <span>Filter cleared! Showing all ${totalRows} deliveries</span>
    `;
    
    const filterSection = document.querySelector('.simple-filter-section');
    filterSection.appendChild(successMsg);
    
    // Animate and remove
    setTimeout(() => {
        successMsg.style.opacity = '1';
        successMsg.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transform = 'translateY(-20px)';
        setTimeout(() => successMsg.remove(), 300);
    }, 2000);
}

function removeFilterStatus() {
    const existingStatus = document.getElementById('filterStatus');
    if (existingStatus) {
        existingStatus.style.opacity = '0';
        existingStatus.style.transform = 'translateY(-20px)';
        setTimeout(() => existingStatus.remove(), 300);
    }
}

// Setup awesome real-time filtering
function setupDeliveryHistoryDateSearch() {
    console.log('Setting up delivery history date search...');
    
    // Add real-time filtering on date input changes
    const fromDateInput = document.getElementById('historyFromDate');
    const toDateInput = document.getElementById('historyToDate');
    
    console.log('Date inputs found:', { fromDateInput: !!fromDateInput, toDateInput: !!toDateInput });
    
    if (fromDateInput && toDateInput) {
        // Add real-time filtering with debounce
        let filterTimeout;
        
        const handleDateChange = () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(() => {
                if (fromDateInput.value || toDateInput.value) {
                    applySimpleDateFilter();
                }
            }, 500); // 500ms debounce
        };
        
        fromDateInput.addEventListener('change', handleDateChange);
        toDateInput.addEventListener('change', handleDateChange);
        
        // Add visual feedback on focus
        [fromDateInput, toDateInput].forEach(input => {
            input.addEventListener('focus', function() {
                this.style.borderColor = '#3b82f6';
                this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            });
            
            input.addEventListener('blur', function() {
                this.style.borderColor = '#d1d5db';
                this.style.boxShadow = 'none';
            });
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Enter to apply filter
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const modal = document.getElementById('deliveryHistoryModal');
                if (modal && !modal.classList.contains('hidden')) {
                    e.preventDefault();
                    applySimpleDateFilter();
                }
            }
            
            // Escape to clear filter
            if (e.key === 'Escape') {
                const modal = document.getElementById('deliveryHistoryModal');
                if (modal && !modal.classList.contains('hidden')) {
                    if (fromDateInput.value || toDateInput.value) {
                        e.preventDefault();
                        clearSimpleDateFilter();
                    }
                }
            }
        });
    }
}

// Enhanced close delivery history modal function
function closeDeliveryHistoryModal() {
    const modal = document.getElementById('deliveryHistoryModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        // Reset search inputs
        const fromDateInput = document.getElementById('historyFromDate');
        const toDateInput = document.getElementById('historyToDate');
        if (fromDateInput) fromDateInput.value = '';
        if (toDateInput) toDateInput.value = '';
        
        // Show all rows
        const table = document.getElementById('deliveryHistoryTable');
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                row.style.display = '';
            });
        }
        
        // Reset DataTable moved flag
        const historySearchSection = document.getElementById('historySearchSection');
        if (historySearchSection) {
            historySearchSection.dataset.dtMoved = '0';
        }
    }
}

// Clear date filter function
function clearHistoryDateFilter() {
    const searchInput = document.getElementById('historySearchInput');
    if (searchInput) {
        searchInput.value = '';
        // Trigger the input event to show all rows
        searchInput.dispatchEvent(new Event('input'));
    }
}

// Export functions for delivery history
function exportDeliveryHistoryToExcel() {
    try {
        const table = document.getElementById('deliveryHistoryTable');
        const rows = table.querySelectorAll('tbody tr:not([style*="display: none"])');
        
        if (rows.length === 0) {
            showError('No data to export');
            return;
        }
        
        let csvContent = 'Date & Time,Items & Quantity,Status,Details & Notes,Received At\n';
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = [];
            
            cells.forEach(cell => {
                let cellText = cell.textContent.trim();
                // Escape quotes and wrap in quotes if contains comma
                if (cellText.includes(',') || cellText.includes('"')) {
                    cellText = '"' + cellText.replace(/"/g, '""') + '"';
                }
                rowData.push(cellText);
            });
            
            csvContent += rowData.join(',') + '\n';
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `delivery_history_${new Date().toLocaleDateString().replace(/\//g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('Excel file downloaded successfully!');
    } catch (error) {
        console.error('Excel export error:', error);
        showError('Failed to export Excel file');
    }
}

function exportDeliveryHistoryToPDF() {
    try {
        // Try to use DataTable's PDF export if available
        const dt = $('#deliveryHistoryTable').DataTable();
        if (dt && dt.button) {
            const pdfButton = dt.button('.buttons-pdf');
            if (pdfButton.length > 0) {
                pdfButton.trigger();
                showSuccess('PDF export initiated!');
                return;
            }
        }
        
        // Fallback: show message
        showError('PDF export not available. Please use Print option instead.');
    } catch (error) {
        console.error('PDF export error:', error);
        showError('PDF export failed. Please use Print option instead.');
    }
}

function printDeliveryHistory() {
    try {
        const table = document.getElementById('deliveryHistoryTable');
        const rows = table.querySelectorAll('tbody tr:not([style*="display: none"])');
        
        if (rows.length === 0) {
            showError('No data to print');
            return;
        }
        
        // Create print window
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleString();
        
        let tableHTML = '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
        tableHTML += '<thead><tr style="background: #f5f5f5;">';
        tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Date & Time</th>';
        tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Items & Quantity</th>';
        tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Status</th>';
        tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Details & Notes</th>';
        tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Received At</th>';
        tableHTML += '</tr></thead><tbody>';
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            tableHTML += '<tr>';
            cells.forEach(cell => {
                tableHTML += `<td style="border: 1px solid #ddd; padding: 6px;">${cell.textContent.trim()}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        
        const printContent = generateStandardExportHTML(
            'Delivery History Report',
            tableHTML,
            { 
                reportTitle: 'DELIVERY HISTORY REPORT',
                includeSignatures: true 
            }
        );
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        
        showSuccess('Print dialog opened!');
    } catch (error) {
        console.error('Print error:', error);
        showError('Failed to print delivery history');
    }
}

// Make functions globally available
window.closeDeliveryHistoryModal = closeDeliveryHistoryModal;
window.clearHistoryDateFilter = clearHistoryDateFilter;
window.exportDeliveryHistoryToExcel = exportDeliveryHistoryToExcel;
window.exportDeliveryHistoryToPDF = exportDeliveryHistoryToPDF;
window.printDeliveryHistory = printDeliveryHistory;
window.applySimpleDateFilter = applySimpleDateFilter;
window.clearSimpleDateFilter = clearSimpleDateFilter;

// Helper function to safely convert various date formats to Date object
function safeToDate(dateInput) {
    if (!dateInput) return new Date();
    
    // Firestore Timestamp with toDate() method
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
        return dateInput.toDate();
    }
    
    // Already a Date object
    if (dateInput instanceof Date) {
        return dateInput;
    }
    
    // String or number that can be converted to Date
    try {
        return new Date(dateInput);
    } catch (error) {
        console.warn('Failed to convert date:', dateInput, error);
        return new Date();
    }
}

// Setup static export buttons in residents modal
function setupStaticExportButtons() {
    console.log('Setting up static export buttons...');
    
    // Call the resident export buttons setup
    setupResidentExportButtons();
    
    // Helper function to get table data for export
    function getTableDataForExport() {
        const rows = [];
        const table = document.getElementById('viewResidentsTable');
        if (!table) return rows;
        
        // Get headers
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
            headers.push(th.textContent.trim());
        });
        rows.push(headers);
        
        // Get visible rows (respecting search filter)
        table.querySelectorAll('tbody tr').forEach(tr => {
            if (tr.style.display !== 'none') {
                const row = [];
                tr.querySelectorAll('td').forEach(td => {
                    row.push(td.textContent.trim());
                });
                rows.push(row);
            }
        });
        
        return rows;
    }
    
    // Helper function to export to Excel (CSV format)
    function exportToExcel() {
        try {
            const data = getTableDataForExport();
            if (data.length === 0) {
                showError('No data to export');
                return;
            }
            
            const csvContent = data.map(row => 
                row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
            ).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'residents_export.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Excel export error:', error);
            showError('Failed to export to Excel');
        }
    }
    
    // Setup export buttons for resident management
    function setupResidentExportButtons() {
        console.log('Setting up resident export buttons...');
        const excelBtn = document.getElementById('exportResidentsExcelBtn');
        const pdfBtn = document.getElementById('exportResidentsPDFBtn');
        const printBtn = document.getElementById('printResidentsBtn');
        
        console.log('Found buttons:', { excelBtn: !!excelBtn, pdfBtn: !!pdfBtn, printBtn: !!printBtn });
        
        if (excelBtn) {
            excelBtn.removeEventListener('click', exportResidentsToExcel); // Remove existing listener
            excelBtn.addEventListener('click', exportResidentsToExcel);
            excelBtn.style.pointerEvents = 'auto';
            excelBtn.style.cursor = 'pointer';
        }
        if (pdfBtn) {
            pdfBtn.removeEventListener('click', exportResidentsToPDF); // Remove existing listener
            pdfBtn.addEventListener('click', exportResidentsToPDF);
            pdfBtn.style.pointerEvents = 'auto';
            pdfBtn.style.cursor = 'pointer';
        }
        if (printBtn) {
            printBtn.removeEventListener('click', printResidentsTable); // Remove existing listener
            printBtn.addEventListener('click', printResidentsTable);
            printBtn.style.pointerEvents = 'auto';
            printBtn.style.cursor = 'pointer';
        }
    }
    
    // Export residents to Excel (Clean Version)
    function exportResidentsToExcel() {
        try {
            console.log('Exporting to Excel...');
            const table = document.getElementById('viewResidentsTable');
            if (!table) {
                showError('No table found for export');
                return;
            }
            
            const barangayName = document.getElementById('viewResidentsTitle')?.textContent || 'Residents';
            exportCleanTableToExcel('viewResidentsTable', `${barangayName}_Residents`);
            
        } catch (error) {
            console.error('Excel export error:', error);
            showError('Failed to export to Excel: ' + error.message);
        }
    }
    
    // Export residents to PDF (Clean Version with automatic download)
    function exportResidentsToPDF() {
        try {
            console.log('Exporting to PDF...');
            const table = document.getElementById('viewResidentsTable');
            if (!table) {
                showError('No table found for PDF export');
                return;
            }
            
            const title = document.getElementById('viewResidentsTitle')?.textContent || 'Residents';
            const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '');
            
            // Try to use DataTables PDF export first (automatic download)
            if (window.jQuery && $.fn.dataTable.isDataTable('#viewResidentsTable')) {
                const dt = $('#viewResidentsTable').DataTable();
                const pdfButton = dt.button('.buttons-pdf');
                
                if (pdfButton && pdfButton.length > 0) {
                    console.log('Using DataTables PDF export');
                    pdfButton.trigger();
                    showSuccess('PDF download initiated!');
                    return;
                }
            }
            
            // Try jsPDF if available (automatic download)
            if (typeof window.jsPDF !== 'undefined') {
                console.log('Using jsPDF for automatic download');
                generateResidentsPDF(table, cleanTitle);
                return;
            }
            
            // Fallback: enhanced export function with better PDF handling
            exportTableToPDF('viewResidentsTable', `${cleanTitle}_Residents`);
            
        } catch (error) {
            console.error('PDF export error:', error);
            showError('Failed to export to PDF: ' + error.message);
        }
    }
    
    // Generate PDF using jsPDF for automatic download
    function generateResidentsPDF(table, title) {
        try {
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const config = EXPORT_CONFIG;
            const currentDate = new Date().toLocaleString();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Add centered header with proper spacing
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(config.header.title, pageWidth / 2, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.text(config.header.subtitle, pageWidth / 2, 28, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`${config.header.address} | ${config.header.contact}`, pageWidth / 2, 34, { align: 'center' });
            
            doc.setFont(undefined, 'bold');
            doc.text(`${title.toUpperCase()} REPORT`, pageWidth / 2, 42, { align: 'center' });
            
            // Get clean table data with better extraction
            const cleanData = extractViewResidentsTableData(table);
            
            if (cleanData.length > 0) {
                // Add table using autoTable with proper centering and alignment
                if (doc.autoTable) {
                    doc.autoTable({
                        head: [cleanData[0]],
                        body: cleanData.slice(1),
                        startY: 50,
                        styles: { 
                            fontSize: 8, 
                            cellPadding: 3,
                            halign: 'center',
                            valign: 'middle',
                            overflow: 'linebreak',
                            cellWidth: 'wrap',
                            minCellHeight: 8
                        },
                        headStyles: { 
                            fillColor: [241, 245, 249], 
                            textColor: [30, 41, 59], 
                            fontStyle: 'bold',
                            halign: 'center',
                            valign: 'middle',
                            fontSize: 9,
                            cellPadding: 4
                        },
                        columnStyles: {
                            // Apply center alignment to all columns with specific widths
                            0: { halign: 'center', cellWidth: 'auto' },
                            1: { halign: 'center', cellWidth: 'auto' },
                            2: { halign: 'center', cellWidth: 'auto' },
                            3: { halign: 'center', cellWidth: 'auto' },
                            4: { halign: 'center', cellWidth: 'auto' },
                            5: { halign: 'center', cellWidth: 'auto' },
                            6: { halign: 'center', cellWidth: 'auto' },
                            7: { halign: 'center', cellWidth: 'auto' },
                            8: { halign: 'center', cellWidth: 'auto' },
                            9: { halign: 'center', cellWidth: 'auto' },
                            10: { halign: 'center', cellWidth: 'auto' },
                            11: { halign: 'center', cellWidth: 'auto' },
                            12: { halign: 'center', cellWidth: 'auto' },
                            13: { halign: 'center', cellWidth: 'auto' },
                            14: { halign: 'center', cellWidth: 'auto' }
                        },
                        theme: 'grid',
                        tableWidth: 'auto',
                        margin: { left: 15, right: 15, top: 10, bottom: 10 },
                        showHead: 'everyPage',
                        pageBreak: 'auto',
                        tableLineColor: [203, 213, 225],
                        tableLineWidth: 0.5
                    });
                } else {
                    // Simple centered text table if autoTable not available
                    let yPos = 50;
                    cleanData.forEach((row, index) => {
                        if (yPos > pageHeight - 40) {
                            doc.addPage();
                            yPos = 20;
                        }
                        const rowText = row.slice(0, 8).join(' | '); // Show first 8 columns
                        doc.setFontSize(index === 0 ? 8 : 7);
                        doc.setFont(undefined, index === 0 ? 'bold' : 'normal');
                        
                        // Center the text
                        const textWidth = doc.getTextWidth(rowText);
                        const xPos = (pageWidth - textWidth) / 2;
                        doc.text(rowText, xPos, yPos);
                        yPos += 5;
                    });
                }
            }
            
            // Add footer
            const finalY = doc.autoTable ? doc.autoTable.previous.finalY + 20 : 160;
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated on: ${currentDate}`, pageWidth - 10, finalY, { align: 'right' });
            
            // Add centered signature section
            const sigY = finalY + 25;
            const sigWidth = 60;
            const totalSigWidth = sigWidth * 3 + 40;
            const startX = (pageWidth - totalSigWidth) / 2;
            
            doc.text('Prepared by:', startX, sigY);
            doc.line(startX, sigY + 2, startX + sigWidth, sigY + 2);
            
            doc.text('Verified by:', startX + sigWidth + 20, sigY);
            doc.line(startX + sigWidth + 20, sigY + 2, startX + sigWidth * 2 + 20, sigY + 2);
            
            doc.text('Approved by:', startX + sigWidth * 2 + 40, sigY);
            doc.line(startX + sigWidth * 2 + 40, sigY + 2, startX + sigWidth * 3 + 40, sigY + 2);
            
            // Generate filename and download
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `${title}_${dateStr}.pdf`;
            
            doc.save(filename);
            showSuccess(`PDF file "${filename}" downloaded successfully!`);
            
        } catch (error) {
            console.error('jsPDF generation failed:', error);
            // Fallback to regular export method
            exportTableToPDF('viewResidentsTable', title);
        }
    }
    
    // Extract clean table data specifically for View Residents modal
    function extractViewResidentsTableData(table) {
        if (!table) {
            console.warn('No table provided to extractViewResidentsTableData');
            return [];
        }
        
        const data = [];
        
        // Get headers from thead
        const headers = [];
        const headerCells = table.querySelectorAll('thead th');
        if (headerCells.length === 0) {
            // If no thead, try to get headers from first row
            const firstRow = table.querySelector('tbody tr:first-child');
            if (firstRow) {
                const cells = firstRow.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (index < 15) { // Include 15 columns to get Status column
                        headers.push(`Column ${index + 1}`);
                    }
                });
            }
        } else {
            headerCells.forEach((th, index) => {
                if (index < 15 && !th.classList.contains('no-export')) { // Include Status column but exclude actions
                    const headerText = th.textContent.trim() || `Column ${index + 1}`;
                    if (!headerText.toLowerCase().includes('action')) {
                        headers.push(headerText);
                    }
                }
            });
        }
        
        if (headers.length > 0) {
            data.push(headers);
        }
        
        // Get data rows from tbody
        const tableBody = table.querySelector('tbody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr:not(.no-residents-message)');
            rows.forEach(tr => {
                // Check if row is visible and not hidden
                const isVisible = tr.style.display !== 'none' && 
                                !tr.classList.contains('hidden') &&
                                tr.offsetParent !== null; // Additional visibility check
                
                if (isVisible || tr.style.display === '') {
                    const row = [];
                    const cells = tr.querySelectorAll('td');
                    cells.forEach((td, index) => {
                        if (index < 15 && !td.classList.contains('no-export')) { // Include Status column
                            // Clean the text content more thoroughly
                            let cellText = td.textContent.trim();
                            
                            // Handle special cases - status badges, etc.
                            if (td.querySelector('.badge')) {
                                const badge = td.querySelector('.badge');
                                cellText = badge.textContent.trim();
                            }
                            
                            // Remove action button text from cells
                            if (td.querySelector('button')) {
                                cellText = cellText.replace(/\s*(Edit|Delete|Action)\s*/g, '').trim();
                            }
                            
                            if (!cellText || cellText === '') {
                                cellText = 'N/A';
                            }
                            
                            // Only add if it's not an action column
                            const isActionCell = td.querySelector('button, .edit-btn, .delete-btn') && 
                                                cellText.toLowerCase().includes('edit') || 
                                                cellText.toLowerCase().includes('delete');
                            
                            if (!isActionCell) {
                                row.push(cellText);
                            }
                        }
                    });
                    if (row.length > 0) {
                        data.push(row);
                    }
                }
            });
        }
        
        console.log('Extracted view residents data:', data.length, 'rows', headers.length, 'columns');
        return data;
    }
    
    // Print residents table (Clean Version)
    function printResidentsTable() {
        try {
            console.log('Printing table...');
            const table = document.getElementById('viewResidentsTable');
            if (!table) {
                showError('No table found for printing');
                return;
            }
            
            const title = document.getElementById('viewResidentsTitle')?.textContent || 'Residents';
            const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
            
            // Use enhanced print function with proper content extraction
            printViewResidentsTable('viewResidentsTable', cleanTitle);
            
        } catch (error) {
            console.error('Print error:', error);
            showError('Failed to print table');
        }
    }
    
    // Enhanced print function specifically for View Residents table
    function printViewResidentsTable(tableId, title) {
        try {
            const table = document.getElementById(tableId);
            if (!table) {
                showError('Table not found for printing');
                return;
            }
            
            // Extract table data using the specific function
            const cleanData = extractViewResidentsTableData(table);
            
            if (cleanData.length === 0) {
                showError('No data found to print');
                return;
            }
            
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showError('Popup blocked. Please allow popups to print.');
                return;
            }
            
            // Generate HTML table from extracted data
            let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px;">';
            
            // Add headers
            if (cleanData.length > 0) {
                tableHTML += '<thead><tr>';
                cleanData[0].forEach(header => {
                    tableHTML += `<th style="border: 1px solid #ccc; padding: 6px; background: #f5f5f5; font-weight: bold; text-align: center;">${header}</th>`;
                });
                tableHTML += '</tr></thead>';
            }
            
            // Add body rows
            if (cleanData.length > 1) {
                tableHTML += '<tbody>';
                for (let i = 1; i < cleanData.length; i++) {
                    tableHTML += '<tr>';
                    cleanData[i].forEach(cell => {
                        tableHTML += `<td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${cell}</td>`;
                    });
                    tableHTML += '</tr>';
                }
                tableHTML += '</tbody>';
            }
            
            tableHTML += '</table>';
            
            const config = EXPORT_CONFIG;
            const currentDate = new Date().toLocaleString();
            
            const cleanHTML = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title} Report</title>
                <style>
                    @page { 
                        size: A4 landscape; 
                        margin: 15mm;
                        @top-left { content: none !important; }
                        @top-center { content: none !important; }
                        @top-right { content: none !important; }
                        @bottom-left { content: none !important; }
                        @bottom-center { content: none !important; }
                        @bottom-right { content: none !important; }
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0;
                        padding: 0;
                        line-height: 1.4;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0 0 8px 0;
                        font-size: 18px;
                    }
                    .header p {
                        margin: 0 0 6px 0;
                        font-size: 12px;
                    }
                    .content {
                        width: 100%;
                        overflow: visible;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: right;
                        font-size: 10px;
                        color: #666;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact !important; }
                        .header { page-break-after: avoid; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${config.header.title}</h1>
                    <p>${config.header.subtitle}</p>
                    <p>${config.header.address} | ${config.header.contact}</p>
                    <h2 style="margin: 10px 0 0 0; font-size: 16px;">${title.toUpperCase()} REPORT</h2>
                </div>
                <div class="content">
                    ${tableHTML}
                </div>
                <div class="footer">
                    Generated on: ${currentDate}
                </div>
            </body>
            </html>`;
            
            printWindow.document.write(cleanHTML);
            printWindow.document.close();
            printWindow.focus();
            
            setTimeout(() => {
                try {
                    printWindow.print();
                    setTimeout(() => {
                        printWindow.close();
                    }, 1000);
                } catch (e) {
                    console.warn('Print failed:', e);
                    printWindow.close();
                }
            }, 500);
            
        } catch (error) {
            console.error('Enhanced print error:', error);
            showError('Print failed.');
        }
    }
    
    // Excel Export Button
    const excelBtn = document.getElementById('exportResidentsExcelBtn');
    if (excelBtn) {
        // Remove existing listeners
        const newExcelBtn = excelBtn.cloneNode(true);
        excelBtn.parentNode.replaceChild(newExcelBtn, excelBtn);
        
        newExcelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Excel export button clicked');
            exportResidentsToExcel();
        });
    }
    
    // PDF Export Button
    const pdfBtn = document.getElementById('exportResidentsPDFBtn');
    if (pdfBtn) {
        // Remove existing listeners
        const newPdfBtn = pdfBtn.cloneNode(true);
        pdfBtn.parentNode.replaceChild(newPdfBtn, pdfBtn);
        
        newPdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('PDF export button clicked');
            exportResidentsToPDF();
        });
    }
    
    // Print Button
    const printBtn = document.getElementById('printResidentsBtn');
    if (printBtn) {
        // Remove existing listeners
        const newPrintBtn = printBtn.cloneNode(true);
        printBtn.parentNode.replaceChild(newPrintBtn, printBtn);
        
        newPrintBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Print button clicked');
            printResidentsTable();
        });
    }
    
    console.log('Static export buttons setup complete');
}

// Function to confirm and receive delivery
async function confirmReceiveDelivery(deliveryId, deliveryData) {
    try {
        // Show confirmation dialog
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Confirm Delivery Receipt',
                html: `
                    <div style="text-align: left; margin: 15px 0;">
                        <p><strong>Are you sure you want to mark this delivery as received?</strong></p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${deliveryData.deliveryDate?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Items:</strong></p>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                ${deliveryData.goods?.rice ? `<li>Rice: ${deliveryData.goods.rice} sacks</li>` : ''}
                                ${deliveryData.goods?.biscuits ? `<li>Biscuits: ${deliveryData.goods.biscuits} boxes</li>` : ''}
                                ${deliveryData.goods?.canned ? `<li>Canned Goods: ${deliveryData.goods.canned} boxes</li>` : ''}
                                ${deliveryData.goods?.shirts ? `<li>Shirts: ${deliveryData.goods.shirts} packs</li>` : ''}
                            </ul>
                            <p style="margin: 5px 0;"><strong>Details:</strong> ${deliveryData.details || 'No description'}</p>
                        </div>
                        <p style="color: #059669; font-size: 0.9em;">
                            This will update the delivery status to "Received" and notify the admin.
                        </p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Mark as Received',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#6b7280',
                background: '#ffffff',
                color: '#1f2937',
                allowOutsideClick: false,
                didOpen: (popup) => {
                    popup.style.borderTop = '6px solid #16a34a';
                }
            });

            if (result.isConfirmed) {
                await updateDeliveryStatus(deliveryId, 'Received');
                
                await Swal.fire({
                    title: 'Delivery Received!',
                    text: 'The delivery has been marked as received and the admin has been notified.',
                    icon: 'success',
                    confirmButtonText: 'Continue',
                    confirmButtonColor: '#16a34a',
                    timer: 3000,
                    timerProgressBar: true
                });
            }
        } else {
            // Fallback for browsers without SweetAlert
            const confirmed = confirm(
                `Mark this delivery as received?\n\n` +
                `Date: ${deliveryData.deliveryDate?.toDate?.()?.toLocaleDateString() || 'N/A'}\n` +
                `Items: ${getDeliveryItemsSummary(deliveryData.goods)}\n` +
                `Details: ${deliveryData.details || 'No description'}`
            );
            
            if (confirmed) {
                await updateDeliveryStatus(deliveryId, 'Received');
                alert('Delivery marked as received!');
            }
        }
    } catch (error) {
        console.error('Error confirming delivery receipt:', error);
        if (window.Swal) {
            await Swal.fire({
                title: 'Error',
                text: 'Failed to mark delivery as received. Please try again.',
                icon: 'error',
                confirmButtonColor: '#dc2626'
            });
        } else {
            alert('Failed to mark delivery as received. Please try again.');
        }
    }
}

// Helper function to get delivery items summary
function getDeliveryItemsSummary(goods) {
    if (!goods) return 'No items specified';
    
    const items = [];
    if (goods.rice > 0) items.push(`${goods.rice} Rice`);
    if (goods.biscuits > 0) items.push(`${goods.biscuits} Biscuits`);
    if (goods.canned > 0) items.push(`${goods.canned} Canned`);
    if (goods.shirts > 0) items.push(`${goods.shirts} Shirts`);
    
    return items.length > 0 ? items.join(', ') : 'No items specified';
}

// Toggle barangay delivery details expansion (similar to admin)
function toggleBarangayDeliveryDetails(deliveryId) {
    const detailsRow = document.getElementById(`barangay-details-row-${deliveryId}`);
    const mainRow = detailsRow?.previousElementSibling;
    const indicator = mainRow?.querySelector('.expand-indicator');
    
    if (detailsRow && mainRow) {
        const isExpanding = detailsRow.classList.contains('hidden');
        detailsRow.classList.toggle('hidden');
        
        // Rotate the indicator and add visual feedback
        if (indicator) {
            indicator.style.transform = isExpanding ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        
        // Add visual feedback to the main row
        if (isExpanding) {
            mainRow.classList.add('row-expanded');
            detailsRow.style.display = 'table-row';
        } else {
            mainRow.classList.remove('row-expanded');
            detailsRow.style.display = 'none';
        }
    }
}

// Print receipt for barangay delivery
function printBarangayDeliveryReceipt(deliveryId, deliveryData) {
    const barangayName = loggedInUserData?.username?.replace('barangay_', '') || 'Unknown Barangay';
    
    // Safely handle dates
    const deliveryDate = safeToDate(deliveryData.deliveryDate);
    const receivedDate = safeToDate(deliveryData.updatedAt);
    
    // Format goods list including custom items
    const goodsList = [];
    if (deliveryData.goods) {
        if (deliveryData.goods.rice > 0) goodsList.push(`Rice: ${deliveryData.goods.rice} sacks`);
        if (deliveryData.goods.biscuits > 0) goodsList.push(`Biscuits: ${deliveryData.goods.biscuits} boxes`);
        if (deliveryData.goods.canned > 0) goodsList.push(`Canned Goods: ${deliveryData.goods.canned} boxes`);
        if (deliveryData.goods.shirts > 0) goodsList.push(`Shirts: ${deliveryData.goods.shirts} packs`);
    }
    
    // Add custom items to goods list
    if (deliveryData.customItems) {
        Object.entries(deliveryData.customItems).forEach(([itemName, quantity]) => {
            if (quantity > 0) {
                const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1).replace(/([A-Z])/g, ' $1');
                goodsList.push(`${displayName}: ${quantity}`);
            }
        });
    }
    
    const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Delivery Receipt - ${barangayName}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 600px; 
                    margin: 20px auto; 
                    padding: 20px;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .receipt-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                    margin-bottom: 5px;
                }
                .receipt-subtitle {
                    color: #666;
                    font-size: 16px;
                }
                .info-section {
                    margin-bottom: 25px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 5px 0;
                    border-bottom: 1px dotted #ccc;
                }
                .info-label {
                    font-weight: bold;
                    color: #333;
                }
                .info-value {
                    color: #666;
                }
                .items-section {
                    margin-bottom: 25px;
                }
                .items-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                }
                .item {
                    padding: 8px 15px;
                    margin: 5px 0;
                    background: #e0f2fe;
                    border-left: 4px solid #0ea5e9;
                    border-radius: 4px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
                .signature-section {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                }
                .signature-box {
                    text-align: center;
                    width: 200px;
                }
                .signature-line {
                    border-bottom: 1px solid #333;
                    margin-bottom: 5px;
                    height: 40px;
                }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="receipt-title">RELIEF GOODS DELIVERY RECEIPT</div>
                <div class="receipt-subtitle">Municipal Social Welfare and Development Office</div>
            </div>
            
            <div class="info-section">
                <div class="info-row">
                    <span class="info-label">Receipt ID:</span>
                    <span class="info-value">${deliveryId.substring(0, 8).toUpperCase()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Barangay:</span>
                    <span class="info-value">${barangayName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Delivery Date:</span>
                    <span class="info-value">${deliveryDate.toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Received Date:</span>
                    <span class="info-value">${receivedDate.toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${deliveryData.status || 'Pending'}</span>
                </div>
            </div>
            
            <div class="info-section">
                <div class="info-row">
                    <span class="info-label">Description:</span>
                </div>
                <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px;">
                    ${deliveryData.details || 'No description provided'}
                </div>
            </div>
            
            <div class="items-section">
                <div class="items-title">Items Received</div>
                ${goodsList.length > 0 ? 
                    goodsList.map(item => `<div class="item">• ${item}</div>`).join('') : 
                    '<div class="item">No specific items listed</div>'
                }
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div>MSWD Representative</div>
                    <div style="font-size: 11px; color: #999;">Signature over Printed Name</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div>Barangay Representative</div>
                    <div style="font-size: 11px; color: #999;">Signature over Printed Name</div>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an official receipt for relief goods delivery.</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Keep this receipt for your records.</p>
            </div>
        </body>
        </html>
    `;
    
// Open in new window using standardized A4 template
    const pageHTML = buildA4PrintHTML({
        title: 'RELIEF GOODS DELIVERY RECEIPT',
        subtitle: 'Municipal Social Welfare and Development Office',
        bodyHTML: `
            <div class="section">
                <div class="grid-2">
                    <table>
                        <tr><th>Receipt ID:</th><td>${deliveryId.substring(0, 8).toUpperCase()}</td></tr>
                        <tr><th>Barangay:</th><td>${barangayName}</td></tr>
                        <tr><th>Delivery Date:</th><td>${deliveryDate.toLocaleDateString()}</td></tr>
                        <tr><th>Received Date:</th><td>${receivedDate.toLocaleDateString()}</td></tr>
                        <tr><th>Status:</th><td>${deliveryData.status || 'Pending'}</td></tr>
                    </table>
                    <div class="section">
                        <div class="small muted">Description:</div>
                        <div style="margin-top:6px; padding:10px; background:#fff; border:1px solid #e5e7eb; border-radius:4px; min-height:60px;">${deliveryData.details || 'No description provided'}</div>
                    </div>
                </div>
            </div>
            <div class="section">
                <div class="small" style="font-weight:700;margin-bottom:6px;">Items Received</div>
                <div>${goodsList.length > 0 ? goodsList.map(item => `<div class="small">• ${item}</div>`).join('') : '<div class="small muted">No specific items listed</div>'}</div>
            </div>
            <div class="sig-row">
                <div class="sig"><div class="line"></div><div>MSWD Representative</div><div class="muted small">Signature over Printed Name</div></div>
                <div class="sig"><div class="line"></div><div>Barangay Representative</div><div class="muted small">Signature over Printed Name</div></div>
            </div>
        `,
        footerHTML: `<div class="small">This is an official receipt for relief goods delivery. Generated on ${new Date().toLocaleString()}.</div>`
    });
    openPrintA4(pageHTML);
}

// Infinite Scroll for Residents Modal
function setupInfiniteScrollForResidents() {
    const tableContainer = document.querySelector('.residents-modal-content .table-container');
    if (!tableContainer) return;
    
    let isLoading = false;
    let currentPage = 1;
    const itemsPerPage = 20;
    
    // Add smooth scrolling
    tableContainer.style.scrollBehavior = 'smooth';
    
    tableContainer.addEventListener('scroll', function() {
        if (isLoading) return;
        
        const scrollTop = this.scrollTop;
        const scrollHeight = this.scrollHeight;
        const clientHeight = this.clientHeight;
        
        // Load more when within 100px of bottom
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            isLoading = true;
            showLoadingIndicator();
            
            // Simulate loading more residents (replace with actual data fetching)
            setTimeout(() => {
                loadMoreResidents();
                hideLoadingIndicator();
                isLoading = false;
            }, 1000);
        }
    });
}

function showLoadingIndicator() {
    const tableBody = document.getElementById('viewResidentsTableBody');
    if (!tableBody || document.getElementById('loadingIndicator')) return;
    
    const loadingRow = document.createElement('tr');
    loadingRow.id = 'loadingIndicator';
    loadingRow.innerHTML = `
        <td colspan="100%" style="text-align: center; padding: 2rem; color: #64748b;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <div style="width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>Loading more residents...</span>
            </div>
        </td>
    `;
    
    tableBody.appendChild(loadingRow);
    
    // Add CSS animation if not exists
    if (!document.getElementById('spinAnimation')) {
        const style = document.createElement('style');
        style.id = 'spinAnimation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

function loadMoreResidents() {
    // Placeholder function - in real implementation, this would fetch more data
    const tableBody = document.getElementById('viewResidentsTableBody');
    if (!tableBody) return;
    
    // Show completion message
    const completionRow = document.createElement('tr');
    completionRow.innerHTML = `
        <td colspan="100%" style="text-align: center; padding: 1rem; color: #16a34a; font-weight: 500;">
            All residents loaded
        </td>
    `;
    
    tableBody.appendChild(completionRow);
    
    // Remove completion message after 2 seconds
    setTimeout(() => {
        if (completionRow.parentNode) {
            completionRow.remove();
        }
    }, 2000);
}

// Enhanced History Modal Functions
function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear filters when closing
        clearHistoryFilters();
        
        // No auto refresh - just close the modal
    }
}

function clearHistoryFilters() {
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    const typeFilter = document.getElementById('typeFilter');
    
    if (fromDate) fromDate.value = '';
    if (toDate) toDate.value = '';
    if (typeFilter) typeFilter.value = '';
    
    // Just reload the table data without reopening modal
    loadInventoryHistoryData();
    
    // Show all rows
    const tableBody = document.getElementById('inventoryHistoryBody');
    if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.style.display = '';
        });
    }
}

function setupHistoryFilters() {
    const applyBtn = document.getElementById('applyHistoryFilter');
    const clearBtn = document.getElementById('clearHistoryFilter');
    
    // Remove existing event listeners to prevent duplicates
    if (applyBtn) {
        applyBtn.removeEventListener('click', applyHistoryFilters);
        applyBtn.addEventListener('click', applyHistoryFilters);
    }
    
    if (clearBtn) {
        clearBtn.removeEventListener('click', clearHistoryFilters);
        clearBtn.addEventListener('click', clearHistoryFilters);
    }
    
    // Set default date range (last 30 days) only if empty
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    
    if (fromDate && toDate && !fromDate.value && !toDate.value) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        fromDate.value = thirtyDaysAgo.toISOString().split('T')[0];
        toDate.value = today.toISOString().split('T')[0];
    }
}

function applyHistoryFilters() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    const tableBody = document.getElementById('inventoryHistoryBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        let showRow = true;
        const cells = row.querySelectorAll('td');
        
        if (cells.length > 0) {
            const dateCell = cells[0].textContent;
            const typeCell = cells[1].textContent;
            
            // Date filtering
            if (fromDate || toDate) {
                const rowDate = new Date(dateCell);
                if (fromDate && rowDate < new Date(fromDate)) showRow = false;
                if (toDate && rowDate > new Date(toDate + ' 23:59:59')) showRow = false;
            }
            
            // Type filtering
            if (typeFilter && !typeCell.toLowerCase().includes(typeFilter.toLowerCase())) {
                showRow = false;
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

// Safe loader to refresh Inventory History table without reopening the modal
async function loadInventoryHistoryData() {
    try {
        const historyBody = document.getElementById('inventoryHistoryBody');
        if (!historyBody) return;

        // Fetch latest logs
        const logs = await getInventoryLogs();

        // Rebuild table content
        historyBody.innerHTML = '';
        logs.forEach(log => {
            const row = document.createElement('tr');
            const createdAt = log.createdAt?.toDate ? log.createdAt.toDate() : new Date();

            // Build item names only (no quantities)
            let itemsDisplay = '';
            if (log.items) {
                const items = [];
                if (log.items.rice) items.push('Rice');
                if (log.items.biscuits) items.push('Biscuits');
                if (log.items.canned) items.push('Canned');
                if (log.items.shirts) items.push('Shirts');
                if (log.items.customItems && typeof log.items.customItems === 'object') {
                    Object.keys(log.items.customItems).forEach(key => items.push(key));
                }
                itemsDisplay = items.join(', ');
            }

            const typeClass = log.action === 'stock-in' ? 'stock-in' : 'delivery';
            const typeText = log.action === 'stock-in' ? 'Stock In' : 'Delivery';

            row.innerHTML = `
                <td>${createdAt.toLocaleString()}</td>
                <td><span class="type-badge ${typeClass}">${typeText}</span></td>
                <td>${itemsDisplay || 'N/A'}</td>
                <td>-</td>
                <td>${log.user || 'System'}</td>
                <td>${log.id || 'N/A'}</td>
            `;
            historyBody.appendChild(row);
        });

        // Re-apply any active filters
        applyHistoryFilters();
    } catch (e) {
        console.warn('loadInventoryHistoryData fallback failed:', e);
    }
}

// Enhanced showInventoryHistory function (merged with original)
// This function is already defined above - removing duplicate

// Simple inventory history data loading (back to original)
function loadSimpleInventoryHistoryData() {
    const tableBody = document.getElementById('inventoryHistoryBody');
    if (!tableBody) return;
    
    // Clear existing data
    tableBody.innerHTML = '';
    
    // Simple sample data without dropdown complexity
    const sampleData = [
        {
            date: '2025-01-02 14:30',
            type: 'Stock In',
            item: 'Rice (sacks)',
            qty: 50,
            user: 'admin_mswd',
            txnId: 'STK001'
        },
        {
            date: '2025-01-02 15:45',
            type: 'Delivery',
            item: 'Biscuits (boxes)',
            qty: 25,
            user: 'barangay_saba',
            txnId: 'DEL001'
        },
        {
            date: '2025-01-01 10:15',
            type: 'Stock In',
            item: 'Canned Goods (boxes)',
            qty: 30,
            user: 'admin_mswd',
            txnId: 'STK002'
        },
        {
            date: '2025-01-01 16:20',
            type: 'Delivery',
            item: 'Shirts (packs)',
            qty: 15,
            user: 'barangay_mayon',
            txnId: 'DEL002'
        },
        {
            date: '2024-12-31 09:00',
            type: 'Stock In',
            item: 'Rice (sacks)',
            qty: 100,
            user: 'admin_mswd',
            txnId: 'STK003'
        }
    ];
    
    sampleData.forEach(item => {
        const row = document.createElement('tr');
        const typeClass = item.type.toLowerCase().replace(' ', '-');
        
        row.innerHTML = `
            <td>${item.date}</td>
            <td><span class="type-badge ${typeClass}">${item.type}</span></td>
            <td>${item.item}</td>
            <td>${item.qty}</td>
            <td>${item.user}</td>
            <td>${item.txnId}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Dropdown functionality removed - back to simple version

// Expose functions globally
window.showInventoryHistory = showInventoryHistory;
window.closeHistoryModal = closeHistoryModal;
window.showNewBatchModal = showNewBatchModal;
window.closeReliefOperationModal = closeReliefOperationModal;
window.confirmReliefOperation = confirmReliefOperation;
window.generateSummaryReport = generateSummaryReport;
window.showDeliveryHistory = showDeliveryHistory;
window.handleScheduleDelivery = handleScheduleDelivery;
window.updateDeliveryStatus = updateDeliveryStatus;
window.toggleDeliveryDetails = toggleDeliveryDetails;
window.toggleBarangayDeliveryDetails = toggleBarangayDeliveryDetails;
window.printBarangayDeliveryReceipt = printBarangayDeliveryReceipt;
window.setupInfiniteScrollForResidents = setupInfiniteScrollForResidents;
window.clearCustomItems = clearCustomItems;


// --- Custom Items: Modal + Save + Dynamic Form Injection ---
// Open/Close modal with better error checking

// Clear all custom items from form, display, and data structures
function clearCustomItems() {
console.log('Clearing all custom items...');
    
    try {
        // 1. Clear custom item input fields from the form
        const customInputs = document.querySelectorAll('[data-custom-key]');
        console.log(`Removing ${customInputs.length} custom item inputs from form`);
        customInputs.forEach(item => {
            item.remove();
        });
        
        // 2. Clear custom items from Current Totals display
        const totalsItemsList = document.getElementById('totalsItemsList');
        if (totalsItemsList) {
            const existingCustom = totalsItemsList.querySelectorAll('[data-custom-item]');
            console.log(`Removing ${existingCustom.length} custom items from Current Totals display`);
            existingCustom.forEach(item => item.remove());
        }
        
        // 3. Clear custom items from global currentInventory
        if (window.currentInventory && window.currentInventory.customItems) {
            console.log('Clearing custom items from global currentInventory');
            delete window.currentInventory.customItems;
        }
        
        // 4. Clear custom item inputs from delivery scheduling if present
        const deliveryCustomContainer = document.querySelector('#deliveryForm [data-custom-delivery-items-container]');
        if (deliveryCustomContainer) {
            console.log('Removing custom items container from delivery form');
            deliveryCustomContainer.remove();
        } else {
            // Fallback: remove individual custom items if container not found
            const deliveryCustomInputs = document.querySelectorAll('#deliveryForm [data-custom-delivery-item]');
            console.log(`Found ${deliveryCustomInputs.length} custom inputs in delivery form`);
            deliveryCustomInputs.forEach(formGroup => {
                const itemKey = formGroup.getAttribute('data-custom-delivery-item');
                console.log(`Removing custom delivery input: ${itemKey}`);
                formGroup.remove();
            });
        }
        
        // 5. Update form labels to reflect cleared custom items
        if (typeof updateFormLabelsWithInventory === 'function') {
            updateFormLabelsWithInventory();
        }
        
        console.log('Custom items cleared successfully');
        
    } catch (error) {
        console.error('Error clearing custom items:', error);
    }
}

// Initialize custom item functionality with retry mechanism
function initializeCustomItemModal() {
    console.log('Initializing custom item modal...');
    
    const addBtn = document.getElementById('addCustomItemBtn');
    const modal = document.getElementById('customItemModal');
    const cancelBtn = document.getElementById('cancelCustomItemBtn');
    const saveBtn = document.getElementById('saveCustomItemBtn');
    
    console.log('Elements found:', {
        addBtn: !!addBtn,
        modal: !!modal,
        cancelBtn: !!cancelBtn,
        saveBtn: !!saveBtn
    });
    
    // Add Custom Item button - simple click handler
    if (addBtn && modal) {
        console.log('Adding click event to custom item button');
        
        // Remove any existing listeners first
        addBtn.replaceWith(addBtn.cloneNode(true));
        const newAddBtn = document.getElementById('addCustomItemBtn');
        
        newAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Custom item button clicked');
            
            // Show modal
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            
            console.log('Modal should be visible now');
            
            const nameInput = document.getElementById('customItemName');
            if (nameInput) {
                // Small delay to ensure modal is visible before focusing
                setTimeout(() => {
                    nameInput.focus();
                    console.log('Focused on name input');
                }, 100);
            }
        });
        
        console.log('Custom item button event listener attached successfully');
    } else {
        console.error('Missing elements for custom item modal:', {
            addBtn: !!addBtn,
            modal: !!modal
        });
    }
    
    // Cancel button (simple click, no prevention needed)
    if (cancelBtn) {
        console.log('Adding click event to cancel button');
        cancelBtn.addEventListener('click', () => { 
            console.log('Cancel button clicked');
            closeCustomModal(); 
        });
    }
    
    // Click outside modal to close
    if (modal) {
        console.log('Adding outside click event to modal');
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) {
                console.log('🔘 Clicked outside modal, closing');
                closeCustomModal();
            }
        });
    }
    
    // Save Custom Item button with double-click prevention
    if (saveBtn) {
        console.log('✅ Adding double-click prevention to save button');
        addDoubleClickPrevention(saveBtn, async () => {
            return await saveCustomItem();
        }, {
            loadingText: 'Saving...',
            cooldown: 1500,
            showSuccess: false, // saveCustomItem will show its own success message
            showError: true,
            preventMultiple: true
        });
    }
}

// Initialize on DOM ready with retry mechanism
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - initializing custom item modal');
    initializeCustomItemModal();
    
    // When page loads, ensure custom items are added to the form
    loadAndRenderCustomItems();
});

// Also initialize when the track goods section is shown (in case elements load later)
function reinitializeCustomItemModal() {
    console.log('🔄 Reinitializing custom item modal');
    setTimeout(() => {
        initializeCustomItemModal();
    }, 100);
}

// Make reinitializeCustomItemModal globally available
window.reinitializeCustomItemModal = reinitializeCustomItemModal;

// Close modal helper
function closeCustomModal() {
    console.log('🔘 Closing custom item modal');
    const modal = document.getElementById('customItemModal');
    const err = document.getElementById('customItemError');
    
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
        console.log('✅ Modal hidden');
    }
    
    if (err) { 
        err.style.display = 'none'; 
        err.textContent = ''; 
    }
    
    // Clear fields
    const fields = ['customItemName','customUnitType','customInitialQty'];
    fields.forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.value = ''; 
    });
}

// Make closeCustomModal globally available
window.closeCustomModal = closeCustomModal;

// Save custom item
async function saveCustomItem() {
    const nameEl = document.getElementById('customItemName');
    const unitEl = document.getElementById('customUnitType');
    const qtyEl = document.getElementById('customInitialQty');
    const errEl = document.getElementById('customItemError');
    
    // Hide any existing error messages
    if (errEl) {
        errEl.style.display = 'none';
        errEl.textContent = '';
    }
    
    // Validate required elements exist
    if (!nameEl || !unitEl || !qtyEl) {
        console.error('Required form elements not found');
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = 'Form elements missing. Please refresh the page.';
        }
        return false;
    }
    
    const name = nameEl.value.trim();
    const unit = unitEl.value.trim();
    const qty = Number(qtyEl.value) || 0;
    
    // Validate required fields
    if (!name) {
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = 'Please enter an item name.';
        }
        return false;
    }
    
    if (!unit) {
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = 'Please enter a unit type.';
        }
        return false;
    }
    
    // Sanitize key
    const key = name.replace(/\s+/g,'_').toLowerCase();
    
    try {
        // Check existing inventory in Firestore
        const current = await getInventoryTotals();
        if ((current && current[key]) || (current && current.customItems && current.customItems[key])) {
            if (errEl) {
                errEl.style.display = 'block';
                errEl.textContent = 'An item with this name already exists.';
            }
            return false;
        }
        
        // Call firebase helper to add
        const newItem = await addCustomItem(name, unit, qty);
        
        // Append to form
        appendCustomItemToForm(key, newItem);
        
        // Refresh inventory display and totals
        await updateInventoryDisplay();
        
        // Refresh totals to show the new custom item
        if (typeof window.refreshInventoryTotals === 'function') {
            console.log('🔄 Refreshing inventory totals after adding custom item');
            await window.refreshInventoryTotals();
        }
        
        // Show success message
        showSuccess(`Custom item "${name}" added successfully!`);
        
        // Close modal
        closeCustomModal();
        
        return true; // Success
        
    } catch (e) {
        console.error('Failed to add custom item', e);
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = e.message || 'Failed to add item.';
        }
        return false; // Failure
    }
}

// Append a custom item input to the main form row (same row as Rice, Biscuits, etc.)
function appendCustomItemToForm(key, itemObj) {
    // Try to find the main form-row first (where Rice, Biscuits, etc. are)
    const mainFormRow = document.querySelector('#goodsForm .form-row');
    const customContainer = document.getElementById('customItemsContainer');
    
    // Prefer adding to the main form-row if it exists, otherwise use customItemsContainer
    const targetContainer = mainFormRow || customContainer;
    
    if (!targetContainer) {
        console.warn('No suitable container found for custom items');
        return;
    }
    
    // Check if this item already exists
    if (document.getElementById(`goodsCustom_${key}`)) {
        console.log(`Custom item ${key} already exists, skipping`);
        return; // Item already exists, don't add duplicate
    }
    
    console.log(`Adding custom item to form: ${itemObj.name} (${itemObj.unit})`);
    
    // Create structure exactly like existing inventory inputs (Rice, Biscuits, etc.)
    const row = document.createElement('div');
    row.className = 'form-group'; // Use form-group directly, not form-row
    row.setAttribute('data-custom-key', key);
    row.innerHTML = `
        <label for="goodsCustom_${key}">${itemObj.name} (${itemObj.unit})</label>
        <input type="number" id="goodsCustom_${key}" name="goodsCustom_${key}" data-item="${key}" data-unit="${itemObj.unit}" min="0" value="0">
    `;
    
    targetContainer.appendChild(row);
    console.log(`✅ Custom item ${key} added to ${targetContainer === mainFormRow ? 'main form row' : 'custom container'}`);
    
    // Attach listeners for label updates if needed
    const input = row.querySelector('input');
    if (input) {
        input.addEventListener('input', updateFormLabelsWithInventory);
        input.addEventListener('blur', updateFormLabelsWithInventory);
        input.addEventListener('keyup', updateFormLabelsWithInventory);
        console.log(`✅ Event listeners attached to ${key} input`);
    }
}

// Load custom items from Firestore and render them
async function loadAndRenderCustomItems() {
    try {
        console.log('🔄 Loading custom items from Firestore...');
        const totals = await getInventoryTotals();
        const customs = (totals && totals.customItems) ? totals.customItems : {};
        
        console.log('📋 Found custom items:', customs);
        console.log(`🔢 Number of custom items: ${Object.keys(customs).length}`);
        
        Object.entries(customs).forEach(([key, item]) => {
            // ensure not already present
            if (!document.getElementById('goodsCustom_' + key)) {
                console.log(`➕ Loading custom item: ${item.name} (${key})`);
                appendCustomItemToForm(key, item);
            } else {
                console.log(`ℹ️ Custom item ${key} already exists in form`);
            }
        });
        
        // Ensure label updater handles dynamic items too
        updateFormLabelsWithInventory();
        
        // Refresh totals to ensure they show up
        if (typeof window.refreshInventoryTotals === 'function') {
            console.log('🔄 Refreshing totals after loading custom items');
            await window.refreshInventoryTotals();
        }
        
        console.log('✅ Custom items loading complete');
    } catch (e) {
        console.error('❌ Failed to load custom items:', e);
    }
}

// Update form labels with inventory quantities (comprehensive version)
function updateFormLabelsWithInventory() {
    // Helper function to extract base name from label text
    function extractBaseName(text) {
        const match = text.match(/^(.*?)(\s*\(|$)/);
        return match ? match[1].trim() : text;
    }
    
    try {
        const currentInv = window.currentInventory || {};
        
        // Determine which section we're in to show appropriate labels
        const isDeliveryScheduling = document.getElementById('deliveryScheduling') && 
            !document.getElementById('deliveryScheduling').classList.contains('hidden');
        const isTrackGoods = document.getElementById('trackGoods') && 
            !document.getElementById('trackGoods').classList.contains('hidden');
            
        console.log('🏷️ updateFormLabelsWithInventory called:', {
            isDeliveryScheduling,
            isTrackGoods,
            currentInvKeys: Object.keys(currentInv),
            customItemsCount: currentInv.customItems ? Object.keys(currentInv.customItems).length : 0,
            deliverySchedulingElement: !!document.getElementById('deliveryScheduling'),
            deliverySchedulingHidden: document.getElementById('deliveryScheduling')?.classList.contains('hidden'),
            trackGoodsElement: !!document.getElementById('trackGoods'),
            trackGoodsHidden: document.getElementById('trackGoods')?.classList.contains('hidden')
        });
        
        // Handle built-in inventory inputs (rice, biscuits, canned, shirts)
        const builtInInputs = {
            'goodsRice': { item: 'rice', label: 'Rice (sacks)' },
            'goodsBiscuits': { item: 'biscuits', label: 'Biscuits (boxes)' },
            'goodsCanned': { item: 'canned', label: 'Canned Goods (boxes)' },
            'goodsShirts': { item: 'shirts', label: 'Shirts (packs)' }
        };
        
        Object.entries(builtInInputs).forEach(([inputId, config]) => {
            const input = document.getElementById(inputId);
            const label = input?.parentElement?.querySelector('label');
            if (input && label) {
                const totalStock = currentInv[config.item] || 0;
                const requested = Number(input.value) || 0;
                const remaining = Math.max(0, totalStock - requested);
                
                // Different label formats based on section
                if (isTrackGoods) {
                    // Simple format for Track Relief Goods (just show quantity)
                    label.innerHTML = `${config.label}`;
                } else if (isDeliveryScheduling) {
                    // Detailed format for Delivery Scheduling (show stock info)
                    let color = '#10b981';
                    let statusText = `Available: ${totalStock}`;
                    
                    if (requested > 0) {
                        if (requested > totalStock) {
                            color = '#ef4444';
                            statusText = `Exceeds by ${requested - totalStock}! Available: ${totalStock}`;
                        } else if (remaining === 0) {
                            color = '#9ca3af';
                            statusText = `Remaining: 0 (Total: ${totalStock})`;
                        } else if (remaining <= 10) {
                            color = '#f59e0b';
                            statusText = `Remaining: ${remaining} of ${totalStock}`;
                        } else {
                            color = '#10b981';
                            statusText = `Remaining: ${remaining} of ${totalStock}`;
                        }
                    }
                    
                    // Only show inventory hint if we have valid inventory data
                    if (totalStock > 0 || requested > 0) {
                        label.innerHTML = `${config.label} <span style="color:${color}; font-weight:600; font-size:0.85em;">(${statusText})</span>`;
                    } else {
                        // Show just the base label if inventory data isn't loaded yet
                        label.innerHTML = `${config.label}`;
                    }
                } else {
                    // Default simple format
                    label.innerHTML = `${config.label}`;
                }
            }
        });
        
        // Handle dynamic custom inputs with data-item attribute
        document.querySelectorAll('input[data-item]').forEach(input => {
            const key = input.getAttribute('data-item');
            const unit = input.getAttribute('data-unit') || '';
            const label = input.parentElement?.querySelector('label');
            
            if (label && key) {
                const totalStock = (currentInv.customItems && currentInv.customItems[key]) 
                    ? (currentInv.customItems[key].quantity || 0) 
                    : (currentInv[key] || 0);
                    
                const requested = Number(input.value) || 0;
                const remaining = Math.max(0, totalStock - requested);
                const baseName = extractBaseName(label.textContent);
                
                // Different label formats based on section
                if (isTrackGoods) {
                    // Simple format for Track Relief Goods (just show item name and unit)
                    console.log(`🎯 Track Goods: Setting simple label for ${baseName}: "${baseName} (${unit})"`);
                    label.innerHTML = `${baseName} (${unit})`;
                } else if (isDeliveryScheduling) {
                    // Detailed format for Delivery Scheduling (show stock info)
                    let color = '#10b981';
                    let statusText = `Available: ${totalStock}`;
                    
                    if (requested > 0) {
                        if (requested > totalStock) {
                            color = '#ef4444';
                            statusText = `Exceeds by ${requested - totalStock}! Available: ${totalStock}`;
                        } else if (remaining === 0) {
                            color = '#9ca3af';
                            statusText = `Remaining: 0 (Total: ${totalStock})`;
                        } else if (remaining <= 10) {
                            color = '#f59e0b';
                            statusText = `Remaining: ${remaining} of ${totalStock}`;
                        } else {
                            color = '#10b981';
                            statusText = `Remaining: ${remaining} of ${totalStock}`;
                        }
                    }
                    
                    // Only show inventory hint if we have valid inventory data
                    if (totalStock > 0 || requested > 0) {
                        label.innerHTML = `${baseName} (${unit}) <span style="color:${color}; font-weight:600; font-size:0.85em;">(${statusText})</span>`;
                    } else {
                        // Show just the base label if inventory data isn't loaded yet
                        label.innerHTML = `${baseName} (${unit})`;
                    }
                } else {
                    // Default simple format
                    label.innerHTML = `${baseName} (${unit})`;
                }
            }
        });
        
    } catch (error) {
        console.error('Error in updateFormLabelsWithInventory:', error);
    }
}
