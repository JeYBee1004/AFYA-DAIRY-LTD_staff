const { createClient } = window.supabase;

const supabaseUrl = 'https://nowlgjwlsaotkcniiswy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd2xnandsc2FvdGtjbmlpc3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjQ3ODMsImV4cCI6MjA2OTgwMDc4M30.b0qzgGVWqxRIoEK485QX1pnXFqIPziG7jIr0vyj1L1U'; 

const supabaseClient = createClient(supabaseUrl, supabaseKey);

let isLoading = false;
let isSigningIn = false; 

/**
 * antiInspect.js
 * Combines:
 *  - disable context menu (right click)
 *  - disable common devtools/view-source shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 *  - detect devtools by viewport changes and act (warn/block)
 *
 * NOTE: This only deters casual users. Does NOT prevent inspection by determined users.
 */

(function antiInspect(window, document) {
  'use strict';

  // CONFIG: choose 'warn' or 'block' or 'log' when DevTools detected
  const ON_DETECT_ACTION = 'block'; // 'block' | 'warn' | 'log'
  const CHECK_INTERVAL_MS = 500; // how often to check for devtools open
  const SIZE_THRESHOLD = 160; // px difference threshold likely when devtools is open

  // small helper to replace page content
  function blockPage(message) {
    try {
      document.head.innerHTML = '';
      document.body.innerHTML = `
        <div style="height:100vh;display:flex;align-items:center;justify-content:center;
                    font-family:Arial, sans-serif;text-align:center;padding:20px;">
          <div>
            <h1 style="margin:0 0 10px 0;">Access restricted</h1>
            <p style="margin:0 0 20px 0;">${message}</p>
          </div>
        </div>`;
      // optionally prevent further JS
      Object.freeze(document.body);
    } catch (e) {
      // fallback: redirect to blank page
      window.location.href = 'about:blank';
    }
  }

  // 1) Disable context menu (right-click)
  function disableContextMenu() {
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      // optional visible feedback:
      // alert("Right-click is disabled on this page.");
      return false;
    }, { passive: false });
  }

  // 2) Disable selection and copy (optional)
  function disableSelectionAndCopy() {
    // prevent text selection and copy shortcuts
    document.addEventListener('selectstart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('copy', (e) => e.preventDefault(), { passive: false });
  }

  // 3) Disable common devtools & view-source keyboard shortcuts
  function disableDevtoolsShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Normalize key name for cross-browser consistency
      const key = e.key || e.keyCode;

      // F12
      if (key === 'F12' || key === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / J / C  (DevTools)
      if (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C' || key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (view-source)
      if (e.ctrlKey && (key === 'U' || key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+K (Firefox console), Ctrl+Shift+S (some browsers)
      if (e.ctrlKey && e.shiftKey && (key === 'K' || key === 'k' || key === 'S' || key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { passive: false });
  }

  // 4) Detect DevTools using outer/inner dimension heuristic + visibility
  function startDevtoolsDetector(onDetect) {
    let lastState = { open: false, orientation: null };

    function check() {
      const widthDiff  = Math.abs(window.outerWidth - window.innerWidth);
      const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
      const isOpen = widthDiff > SIZE_THRESHOLD || heightDiff > SIZE_THRESHOLD;

      // If devtools open state changed
      if (isOpen !== lastState.open) {
        lastState.open = isOpen;
        lastState.orientation = (widthDiff > heightDiff) ? 'vertical' : 'horizontal';
        if (isOpen) onDetect({ orientation: lastState.orientation, widthDiff, heightDiff });
      }
    }

    // also try to detect when developer tools are undocked (window.onfocus/blur sometimes helps)
    window.addEventListener('resize', check);
    window.addEventListener('focus', check);
    window.addEventListener('blur', check);

    // periodic check for browsers that don't trigger events
    const id = setInterval(check, CHECK_INTERVAL_MS);

    // return a stop function
    return function stop() {
      clearInterval(id);
      window.removeEventListener('resize', check);
      window.removeEventListener('focus', check);
      window.removeEventListener('blur', check);
    };
  }

  // 5) Action to take when DevTools detected (based on config)
  function handleDevtoolsDetected(info) {
    const msg = `Developer tools detected (${info.orientation || 'unknown'}). Page access restricted.`;
    if (ON_DETECT_ACTION === 'log') {
      console.warn(msg, info);
    } else if (ON_DETECT_ACTION === 'warn') {
      // show a banner/warn but do not remove content
      try {
        const banner = document.createElement('div');
        banner.textContent = 'Warning: Developer tools detected. Some actions may be disabled.';
        banner.style = 'position:fixed;top:0;left:0;right:0;padding:10px;text-align:center;background:#ffcc00;z-index:99999;font-family:Arial,sans-serif;';
        document.documentElement.appendChild(banner);
        setTimeout(() => banner.remove(), 5000);
      } catch (e) { /* ignore */ }
      console.warn(msg, info);
    } else {
      // block
      blockPage('Developer tools are not allowed on this page. Please close them and reload.');
      console.warn(msg, info);
    }
  }

  // Initialize everything
  function init() {
    try {
      disableContextMenu();
      disableSelectionAndCopy();
      disableDevtoolsShortcuts();
      startDevtoolsDetector(handleDevtoolsDetected);

      // defensive: detect if console opened by timing a debugger statement (best-effort & not guaranteed)
      // we won't call debugger; because it will pause script. Instead we measure console behavior:
      (function detectByConsoleTiming() {
        const start = Date.now();
        // some consoles delay or change timing of console.log; not reliable but harmless
        console.log('%c', 'font-size:1px'); // no-op
        const elapsed = Date.now() - start;
        if (elapsed > 1000) {
          handleDevtoolsDetected({ orientation: 'timing', elapsed });
        }
      }());
    } catch (e) {
      // fail silently - do not break the host page
      console.error('antiInspect init error', e);
    }
  }

  // run when DOM ready; keep robust if script is loaded late
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }

}(window, document));


// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkExistingSession();
});

function setupEventListeners() {
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupForm').addEventListener('submit', handleSignUp);
}

// Tab switching
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tab + '-content').classList.add('active');

    hideMessage();
}

// Password toggle
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Password validation
function showPasswordHint() {
    document.getElementById('passwordHint').classList.add('show');
}
function hidePasswordHint() {
    setTimeout(() => {
        document.getElementById('passwordHint').classList.remove('show');
    }, 200);
}
function validatePassword() {
    const password = document.getElementById('signup-password').value;
    const isValid = password.length >= 6;
    const input = document.getElementById('signup-password');
    input.style.borderColor = password && !isValid ? '#ef4444' : '#cbd5e1';
    return isValid;
}
function validatePasswordMatch() {
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm-password').value;
    const input = document.getElementById('signup-confirm-password');
    input.style.borderColor = confirm && password !== confirm ? '#ef4444' : '#cbd5e1';
    return password === confirm;
}

async function handleSignIn(e) {
    e.preventDefault();
    if (isLoading) return;

    const email = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!email || !password) {
        showMessage('error', 'Please enter your email and password');
        return;
    }

    isSigningIn = true; // Set flag to indicate active sign-in
    setLoading(true, 'signinBtn', 'Signing in...');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showMessage('error', error.message);
            setLoading(false, 'signinBtn', 'Sign In');
            isSigningIn = false;
            return;
        }

        // Get user profile from profiles table
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.warn('Profile not found, user may need to complete setup');
        }

        showMessage('success', `Welcome back${profile ? ', ' + profile.full_name : ''}!`);

    } catch (err) {
        console.error('Sign in error:', err);
        showMessage('error', 'Something went wrong. Please try again.');
        setLoading(false, 'signinBtn', 'Sign In');
        isSigningIn = false;
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    if (isLoading) return;

    const fullName = document.getElementById('signup-fullname').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const role = document.getElementById('signup-role').value;

    if (!fullName || !username || !email || !password || !confirmPassword || !role) {
        showMessage('error', 'Please fill in all fields');
        return;
    }
    if (!validatePassword()) {
        showMessage('error', 'Password must be at least 6 characters');
        return;
    }
    if (password !== confirmPassword) {
        showMessage('error', 'Passwords do not match');
        return;
    }

    isSigningIn = true; // Set flag to indicate active sign-up
    setLoading(true, 'signupBtn', 'Creating account...');

    try {
        // Sign up with Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    full_name: fullName,
                    username: username,
                    role: role
                }
            }
        });

        if (error) {
            showMessage('error', error.message);
            setLoading(false, 'signupBtn', 'Create Account');
            isSigningIn = false;
            return;
        }

        // Create profile record
        if (data.user) {
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    full_name: fullName,
                    username: username,
                    email: email,
                    role: role,
                    created_at: new Date().toISOString()
                }]);

            if (profileError) {
                console.warn('Profile creation failed:', profileError);
            }
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
            // Email confirmation required
            showMessage('success', 'Account created successfully! Please check your email to verify your account.');
            document.getElementById('signupForm').reset();
            setTimeout(() => switchTab('signin'), 3000);
            isSigningIn = false;
        } else if (data.session) {
            // Auto sign-in successful (no email confirmation required)
            showMessage('success', 'Account created and signed in successfully!');
        }

    } catch (err) {
        console.error('Sign up error:', err);
        showMessage('error', 'Something went wrong. Please try again.');
        isSigningIn = false;
    } finally {
        setLoading(false, 'signupBtn', 'Create Account');
    }
}

// Utility functions
function setLoading(loading, buttonId, text) {
    isLoading = loading;
    const button = document.getElementById(buttonId);
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
        button.textContent = text;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        button.textContent = text;
    }
}

function showMessage(type, text) {
    const message = document.getElementById('message');
    message.className = `message ${type} show`;
    message.textContent = text;
    setTimeout(hideMessage, 5000);
}
function hideMessage() {
    document.getElementById('message').classList.remove('show');
}

// ✅ Only checks session (no redirect)
async function checkExistingSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            console.log('Existing session found. User is already signed in.');
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

// ✅ Redirect only after actual sign in/up
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);

    if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user);
        if (isSigningIn) {
            isSigningIn = false; // reset flag
            setTimeout(() => {
                window.location.href = 'staff.html';
            }, 500);
        }
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        isSigningIn = false;
    }
});

