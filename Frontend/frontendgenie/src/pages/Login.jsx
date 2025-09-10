// // Login.jsx
// import React, { useState, useEffect } from 'react';
// import './Login.css';
// import './Background.css';
// import { useNavigate } from "react-router-dom";


// const apiUrl = import.meta.env.REACT_APP_API_URL;
// const loginWithGoogle = apiUrl + "/oauth2/authorization/google";

// const styles = {
//   googleButton: {
//     width: '100%',
//     padding: '14px 20px',
//     background: 'rgba(26, 31, 39, 0.9)',
//     border: '1px solid rgba(255, 255, 255, 0.15)',
//     borderRadius: '12px',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: '12px',
//     transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//     backdropFilter: 'blur(12px)',
//     WebkitBackdropFilter: 'blur(12px)',
//     position: 'relative',
//     overflow: 'hidden',
//     textDecoration: 'none',
//   },
//   googleIcon: {
//     width: '20px',
//     height: '20px',
//     borderRadius: '2px',
//   },
//   googleText: {
//     color: '#e9edf1',
//     fontWeight: '600',
//     fontSize: '15px',
//   }
// };

// const Login = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({ email: '', password: '' });


//   // Overlays
//   const [welcome, setWelcome] = useState({ open: false, name: '' });
//   const [errorBox, setErrorBox] = useState({ open: false, message: '' });

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await fetch(`${apiUrl}/user/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify(formData)
//       });

//       if (res.ok) {
//         const user = await res.json();

//         const { password, ...safeUser } = user || {};
//         localStorage.setItem('user', JSON.stringify(safeUser));

//         setWelcome({ open: true, name: user?.name || 'Traveler' });
//         setTimeout(() => {
//           window.location.replace('/');
//         }, 1400);
//       } else {
//         let msg = 'Username or password mismatch';
//         try {
//           const text = (await res.text())?.trim();
//           if (text) msg = text;
//         } catch { }
//         setErrorBox({ open: true, message: msg });
//       }
//     } catch (err) {
//       console.error('Login error:', err);
//       setErrorBox({ open: true, message: 'Username / Password is wrong. Please try again.' });
//     }
//   };

//   useEffect(() => {
//     const starsContainer = document.getElementById('stars');
//     if (starsContainer) {
//       for (let i = 0; i < 100; i++) {
//         const star = document.createElement('div');
//         star.className = 'star';
//         star.style.left = Math.random() * 100 + '%';
//         star.style.top = Math.random() * 60 + '%';
//         star.style.animationDelay = Math.random() * 3 + 's';
//         starsContainer.appendChild(star);
//       }
//     }
//     return () => {
//       if (starsContainer) starsContainer.innerHTML = '';
//     };
//   }, []);

//   // Local keyframes used by both success and error overlays
//   const localCss = `
//     @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
//     @keyframes popIn { 0% { transform: scale(.95); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
//     @keyframes bar { 0% { width: 0 } 100% { width: 100% } }
//     @keyframes shake {
//       0%, 100% { transform: translateX(0) }
//       20% { transform: translateX(-6px) }
//       40% { transform: translateX(6px) }
//       60% { transform: translateX(-4px) }
//       80% { transform: translateX(4px) }
//     }
//   `;

//   // ESC to close error
//   useEffect(() => {
//     const onKey = (e) => { if (e.key === 'Escape') setErrorBox({ open: false, message: '' }); };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, []);

//   return (
//     <div className="login-page">
//       {/* local animation keyframes */}
//       <style>{localCss}</style>

//       <div className="background"></div>
//       <div className="stars" id="stars"></div>

//       <div className="login-container">
//         <div className="login-form-box">
//           <h2 className="login-title">Login</h2>
//           <form onSubmit={handleSubmit}>
//             <div className="input-group">
//               <input
//                 type="email"
//                 name="email"
//                 placeholder="Email"
//                 className="input-field"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 required
//                 autoComplete="email"
//               />
//             </div>
//             <div className="input-group">
//               <input
//                 type="password"
//                 name="password"
//                 placeholder="Password"
//                 className="input-field"
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 required
//                 autoComplete="current-password"
//               />
//             </div>

//             <button type="submit" className="login-button">Login</button>

//             <button
//               type="button"
//               className="register-nav-button"
//               onClick={() => navigate("/register")}
//             >
//               Create New Account
//             </button>

//             {/* Google Login Button */}
//             <a href={loginWithGoogle} style={{ marginTop: '16px', textDecoration: 'none' }}>
//               <div style={styles.googleButton}>
//                 <img
//                   src="https://developers.google.com/identity/images/g-logo.png"
//                   alt="Google"
//                   style={styles.googleIcon}
//                 />
//                 <span style={styles.googleText}>Continue with Google</span>
//               </div>
//             </a>

//           </form>
//         </div>
//       </div>

//       {/* ✅ Welcome overlay */}
//       {welcome.open && (
//         <div
//           style={{
//             position: 'fixed',
//             inset: 0,
//             background: 'rgba(0,0,0,0.45)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 2000,
//             animation: 'fadeIn .2s ease-out',
//           }}
//         >
//           <div
//             style={{
//               width: 'min(420px, 92%)',
//               background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
//               borderRadius: 16,
//               padding: 24,
//               boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
//               animation: 'popIn .25s ease-out',
//               textAlign: 'center',
//             }}
//           >
//             <div
//               style={{
//                 width: 64, height: 64, borderRadius: '50%',
//                 margin: '0 auto 12px',
//                 background: '#ec4899',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 color: '#fff', fontSize: 30,
//                 boxShadow: '0 8px 16px rgba(236, 72, 153, .35)'
//               }}
//             >
//               ✓
//             </div>
//             <h3 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22 }}>Welcome, {welcome.name}!</h3>
//             <p className="muted" style={{ margin: 0 }}>What about a new journey ? </p>

//             {/* Progress bar */}
//             <div
//               style={{
//                 height: 6, borderRadius: 999, background: '#fce7f3',
//                 marginTop: 16, overflow: 'hidden',
//               }}
//             >
//               <div
//                 style={{
//                   height: '100%', background: '#ec4899',
//                   width: 0, animation: 'bar 1.2s linear forwards',
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ❌ Error overlay (cool + on-theme) */}
//       {errorBox.open && (
//         <div
//           onClick={() => setErrorBox({ open: false, message: '' })}
//           style={{
//             position: 'fixed',
//             inset: 0,
//             background: 'rgba(0,0,0,0.5)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 2100,
//             animation: 'fadeIn .2s ease-out',
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               width: 'min(420px, 92%)',
//               background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
//               borderRadius: 16,
//               padding: 24,
//               boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
//               textAlign: 'center',
//               animation: 'popIn .25s ease-out, shake .4s ease-out',
//             }}
//           >
//             <div
//               style={{
//                 width: 64, height: 64, borderRadius: '50%',
//                 margin: '0 auto 12px',
//                 background: '#ef4444',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 color: '#fff', fontSize: 28,
//                 boxShadow: '0 10px 18px rgba(239, 68, 68, .35)'
//               }}
//             >
//               !
//             </div>
//             <h3 style={{ margin: '0 0 6px', color: '#991b1b', fontSize: 21 }}>
//               Login failed
//             </h3>
//             <p className="muted" style={{ margin: 0, color: '#7f1d1d' }}>
//               {errorBox.message || 'Username or password mismatch'}
//             </p>

//             {/* Error progress bar in red, just for flair */}
//             <div
//               style={{
//                 height: 6, borderRadius: 999, background: '#fee2e2',
//                 marginTop: 16, overflow: 'hidden',
//               }}
//             >
//               <div
//                 style={{
//                   height: '100%', background: '#ef4444',
//                   width: 0, animation: 'bar .9s linear forwards',
//                 }}
//               />
//             </div>

//             <button
//               type="button"
//               className="login-button"
//               style={{ width: 180, marginTop: 14, background: '#991b1b' }}
//               onClick={() => setErrorBox({ open: false, message: '' })}
//             >
//               Try again
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Login;


// Login.jsx - Aggressive Mobile Fix
import React, { useState, useEffect } from 'react';
import './Login.css';
import './Background.css';
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.REACT_APP_API_URL;
const loginWithGoogle = apiUrl + "/oauth2/authorization/google";

// Mobile detection
const isMobile = () => /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini/i.test(navigator.userAgent);

// Ultra-aggressive user saving for mobile
const saveUser = (payload) => {
  try {
    const user = payload?.user ?? payload;
    if (!user || !user.id) {
      console.error('Invalid user data:', user);
      return false;
    }
    
    const { password, ...safe } = user;
    const userString = JSON.stringify(safe);
    
    console.log('Saving user data:', safe.email || safe.name);
    
    // 1. Standard storage
    localStorage.setItem("user", userString);
    sessionStorage.setItem("user", userString);
    
    // 2. Multiple cookie approaches for mobile
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    
    // Primary cookie
    document.cookie = `user=${encodeURIComponent(userString)}; expires=${expires.toUTCString()}; path=/; SameSite=None; Secure`;
    
    // Backup cookies for mobile Safari
    document.cookie = `user_backup=${encodeURIComponent(userString)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = `auth_user=${encodeURIComponent(userString)}; expires=${expires.toUTCString()}; path=/`;
    
    // 3. Window property as ultimate fallback
    window.currentUser = safe;
    window.userLoginTime = Date.now();
    
    // 4. Force a custom event with user data
    window.dispatchEvent(new CustomEvent('user-authenticated', { 
      detail: { user: safe, timestamp: Date.now() } 
    }));
    
    console.log('User saved successfully to all storage methods');
    return true;
  } catch (error) {
    console.error('Failed to save user:', error);
    return false;
  }
};

// Enhanced user retrieval
const getUser = () => {
  try {
    // 1. Try window property first (fastest)
    if (window.currentUser && window.currentUser.id) {
      console.log('User found in window property');
      return window.currentUser;
    }
    
    // 2. Try localStorage
    let userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed && parsed.id) {
        console.log('User found in localStorage');
        return parsed;
      }
    }
    
    // 3. Try sessionStorage
    userData = sessionStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed && parsed.id) {
        console.log('User found in sessionStorage');
        return parsed;
      }
    }
    
    // 4. Try all cookies
    const cookies = document.cookie.split(';');
    for (const cookieName of ['user', 'user_backup', 'auth_user']) {
      const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
      if (cookie) {
        try {
          const cookieValue = cookie.split('=')[1];
          const parsed = JSON.parse(decodeURIComponent(cookieValue));
          if (parsed && parsed.id) {
            console.log(`User found in ${cookieName} cookie`);
            return parsed;
          }
        } catch (e) {
          console.warn(`Failed to parse ${cookieName} cookie:`, e);
        }
      }
    }
    
    console.log('No user data found in any storage method');
    return null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
};

// Super aggressive auth broadcasting
const broadcastAuthChange = () => {
  const events = [
    'auth-changed',
    'user-login', 
    'user-authenticated',
    'login-success',
    'auth-update'
  ];
  
  events.forEach(eventName => {
    window.dispatchEvent(new Event(eventName));
    window.dispatchEvent(new CustomEvent(eventName, { 
      detail: { user: getUser(), timestamp: Date.now() } 
    }));
  });
  
  // Force storage events
  const userData = getUser();
  if (userData) {
    ['storage', 'user-storage-change'].forEach(eventName => {
      window.dispatchEvent(new StorageEvent(eventName, {
        key: 'user',
        newValue: JSON.stringify(userData),
        url: window.location.href
      }));
    });
  }
  
  console.log('Auth change broadcasted with all events');
};

const styles = {
  googleButton: {
    width: '100%',
    padding: '14px 20px',
    background: 'rgba(26, 31, 39, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    position: 'relative',
    overflow: 'hidden',
    textDecoration: 'none',
  },
  googleIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '2px',
  },
  googleText: {
    color: '#e9edf1',
    fontWeight: '600',
    fontSize: '15px',
  }
};

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Overlays
  const [welcome, setWelcome] = useState({ open: false, name: '' });
  const [errorBox, setErrorBox] = useState({ open: false, message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Mobile-optimized fetch
  const mobileSecureFetch = async (url, options = {}) => {
    const fetchOptions = {
      method: 'GET',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Mobile-specific headers
        'X-Requested-With': 'XMLHttpRequest',
        'Access-Control-Allow-Credentials': 'true',
        ...(options.headers || {})
      },
      credentials: 'include',
      mode: 'cors',
    };

    console.log(`Fetching ${url} with options:`, fetchOptions);
    
    try {
      const response = await fetch(url, fetchOptions);
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fetch error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch failed for ${url}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('Starting login process for:', formData.email);

    try {
      // Step 1: Login request
      const loginRes = await mobileSecureFetch(`${apiUrl}/user/login`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const loginData = await loginRes.json();
      console.log('Login response:', loginData);

      if (!loginData || !loginData.id) {
        throw new Error('Invalid login response - no user ID');
      }

      // Step 2: Save user immediately
      const saveSuccess = saveUser(loginData);
      if (!saveSuccess) {
        throw new Error('Failed to save user data to storage');
      }

      // Step 3: Verify session with multiple attempts
      let sessionValid = false;
      let userData = null;
      
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`Session verification attempt ${attempt}/5`);
        
        try {
          const meRes = await mobileSecureFetch(`${apiUrl}/user/me`);
          userData = await meRes.json();
          
          if (userData && userData.id) {
            console.log('Session verified successfully:', userData.email || userData.name);
            sessionValid = true;
            
            // Re-save with verified data
            saveUser(userData);
            break;
          }
        } catch (verifyError) {
          console.warn(`Verification attempt ${attempt} failed:`, verifyError);
        }
        
        if (attempt < 5) {
          const delay = attempt * 1000; // 1s, 2s, 3s, 4s
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Step 4: Proceed based on verification result
      const finalUserData = userData || loginData;
      const userName = finalUserData.name || finalUserData.email || 'Traveler';
      
      if (!sessionValid) {
        console.warn('Session verification failed, but login succeeded. Proceeding...');
      }

      // Step 5: Broadcast auth changes aggressively
      broadcastAuthChange();
      setTimeout(() => broadcastAuthChange(), 100);
      setTimeout(() => broadcastAuthChange(), 500);

      // Step 6: Show welcome and redirect
      setWelcome({ open: true, name: userName });
      
      setTimeout(() => {
        setIsLoading(false);
        broadcastAuthChange();
        
        console.log('Redirecting to home page...');
        
        if (isMobile()) {
          // Mobile: Force hard redirect
          console.log('Mobile detected - using window.location.replace');
          window.location.replace('/');
        } else {
          // Desktop: Try navigate first, fallback to location
          try {
            navigate('/');
            setTimeout(() => window.location.reload(), 200);
          } catch {
            window.location.replace('/');
          }
        }
      }, 1400);

    } catch (err) {
      console.error('Login process failed:', err);
      setIsLoading(false);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.message.includes('401') || err.message.includes('403') || 
          err.message.includes('Unauthorized') || err.message.includes('password')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Login service not found. Please contact support.';
      } else if (err.message.includes('500') || err.message.includes('502') || err.message.includes('503')) {
        errorMessage = 'Server error. Please try again in a few minutes.';
      } else if (err.message.includes('network') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setErrorBox({ open: true, message: errorMessage });
    }
  };

  // Enhanced OAuth detection
  useEffect(() => {
    const checkOAuthSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      
      const isOAuthSuccess = urlParams.get('oauth') === 'success' || 
                            urlParams.get('success') === 'true' ||
                            hashParams.get('oauth') === 'success' ||
                            hashParams.get('success') === 'true';
      
      const isOAuthRedirect = window.location.pathname.includes('/oauth') || 
                              window.location.search.includes('code=') ||
                              window.location.hash.includes('access_token') ||
                              window.location.search.includes('state=') ||
                              document.referrer.includes('google.com') ||
                              document.referrer.includes('oauth');
      
      console.log('OAuth check:', { isOAuthSuccess, isOAuthRedirect, search: window.location.search, hash: window.location.hash });
      
      if (isOAuthSuccess || isOAuthRedirect) {
        console.log('OAuth flow detected, starting verification...');
        setIsLoading(true);
        
        try {
          let userData = null;
          let attempts = 0;
          const maxAttempts = 8; // Even more attempts for OAuth
          
          while (!userData && attempts < maxAttempts) {
            attempts++;
            console.log(`OAuth verification attempt ${attempts}/${maxAttempts}`);
            
            try {
              const res = await mobileSecureFetch(`${apiUrl}/user/me`);
              const data = await res.json();
              
              if (data && data.id) {
                console.log('OAuth user data received:', data.email || data.name);
                userData = data;
                break;
              }
            } catch (fetchError) {
              console.warn(`OAuth attempt ${attempts} failed:`, fetchError);
            }
            
            if (attempts < maxAttempts) {
              const delay = Math.min(attempts * 1000, 5000); // Cap at 5s
              console.log(`OAuth retry delay: ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          if (userData && userData.id) {
            console.log('OAuth login successful!');
            
            const saveSuccess = saveUser(userData);
            if (!saveSuccess) {
              throw new Error('Failed to save OAuth user data');
            }
            
            // Triple broadcast for OAuth
            broadcastAuthChange();
            setTimeout(() => broadcastAuthChange(), 100);
            setTimeout(() => broadcastAuthChange(), 500);
            setTimeout(() => broadcastAuthChange(), 1000);
            
            setWelcome({ open: true, name: userData.name || userData.email || 'Traveler' });
            
            setTimeout(() => {
              setIsLoading(false);
              broadcastAuthChange();
              
              // Clean URL and redirect
              window.history.replaceState({}, document.title, '/');
              console.log('OAuth complete - redirecting...');
              window.location.replace('/');
            }, 1400);
            
            return;
          } else {
            console.error(`OAuth verification failed after ${maxAttempts} attempts`);
            setErrorBox({ 
              open: true, 
              message: `OAuth login verification failed after ${maxAttempts} attempts. Please try regular login or contact support.` 
            });
          }
        } catch (error) {
          console.error('OAuth process error:', error);
          setErrorBox({ 
            open: true, 
            message: 'OAuth login failed due to an error. Please try regular login.' 
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Longer delay for mobile OAuth
    const oauthDelay = isMobile() ? 2000 : 1000;
    console.log(`OAuth check scheduled in ${oauthDelay}ms`);
    setTimeout(checkOAuthSuccess, oauthDelay);
  }, []);

  // Check if already logged in
  useEffect(() => {
    const existingUser = getUser();
    if (existingUser && existingUser.id) {
      console.log('User already logged in:', existingUser.email || existingUser.name);
      // Don't redirect automatically - let them stay on login page if they want
    }
  }, []);

  // Stars effect
  useEffect(() => {
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 60 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
      }
    }
    return () => {
      if (starsContainer) starsContainer.innerHTML = '';
    };
  }, []);

  const localCss = `
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes popIn { 0% { transform: scale(.95); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
    @keyframes bar { 0% { width: 0 } 100% { width: 100% } }
    @keyframes shake {
      0%, 100% { transform: translateX(0) }
      20% { transform: translateX(-6px) }
      40% { transform: translateX(6px) }
      60% { transform: translateX(-4px) }
      80% { transform: translateX(4px) }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // ESC to close error
  useEffect(() => {
    const onKey = (e) => { 
      if (e.key === 'Escape') setErrorBox({ open: false, message: '' }); 
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="login-page">
      <style>{localCss}</style>

      <div className="background"></div>
      <div className="stars" id="stars"></div>

      <div className="login-container">
        <div className="login-form-box">
          <h2 className="login-title">Login</h2>
          
          {/* Debug info for mobile testing */}
          {isMobile() && process.env.NODE_ENV === 'development' && (
            <div style={{
              background: 'rgba(255,255,0,0.1)',
              padding: '8px',
              marginBottom: '16px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666'
            }}>
              Mobile detected - Debug mode active
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="input-field"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="input-field"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading}
              style={{
                position: 'relative',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></span>
                  {isMobile() ? 'Logging in...' : 'Logging in...'}
                </>
              ) : (
                'Login'
              )}
            </button>

            <button
              type="button"
              className="register-nav-button"
              onClick={() => navigate("/register")}
              disabled={isLoading}
            >
              Create New Account
            </button>

            <a 
              href={loginWithGoogle} 
              style={{ 
                marginTop: '16px', 
                textDecoration: 'none',
                pointerEvents: isLoading ? 'none' : 'auto',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <div style={styles.googleButton}>
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  style={styles.googleIcon}
                />
                <span style={styles.googleText}>Continue with Google</span>
              </div>
            </a>
          </form>
        </div>
      </div>

      {/* Welcome overlay */}
      {welcome.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn .2s ease-out',
          }}
        >
          <div
            style={{
              width: 'min(420px, 92%)',
              background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              animation: 'popIn .25s ease-out',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64, height: 64, borderRadius: '50%',
                margin: '0 auto 12px',
                background: '#ec4899',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 30,
                boxShadow: '0 8px 16px rgba(236, 72, 153, .35)'
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22 }}>
              Welcome, {welcome.name}!
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>What about a new journey?</p>

            <div
              style={{
                height: 6, borderRadius: 999, background: '#fce7f3',
                marginTop: 16, overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%', background: '#ec4899',
                  width: 0, animation: 'bar 1.2s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {errorBox.open && (
        <div
          onClick={() => setErrorBox({ open: false, message: '' })}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            animation: 'fadeIn .2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, 92%)',
              background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              textAlign: 'center',
              animation: 'popIn .25s ease-out, shake .4s ease-out',
            }}
          >
            <div
              style={{
                width: 64, height: 64, borderRadius: '50%',
                margin: '0 auto 12px',
                background: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 28,
                boxShadow: '0 10px 18px rgba(239, 68, 68, .35)'
              }}
            >
              !
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#991b1b', fontSize: 21 }}>
              Login failed
            </h3>
            <p style={{ margin: 0, color: '#7f1d1d' }}>
              {errorBox.message}
            </p>

            <div
              style={{
                height: 6, borderRadius: 999, background: '#fee2e2',
                marginTop: 16, overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%', background: '#ef4444',
                  width: 0, animation: 'bar .9s linear forwards',
                }}
              />
            </div>

            <button
              type="button"
              className="login-button"
              style={{ width: 180, marginTop: 14, background: '#991b1b' }}
              onClick={() => setErrorBox({ open: false, message: '' })}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;