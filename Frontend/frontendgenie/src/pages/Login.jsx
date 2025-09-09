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


// Login.jsx - Mobile Fixed Version
import React, { useState, useEffect } from 'react';
import './Login.css';
import './Background.css';
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.REACT_APP_API_URL;
const loginWithGoogle = apiUrl + "/oauth2/authorization/google";

// Enhanced helper functions for mobile compatibility
const saveUser = (payload) => {
  try {
    const user = payload?.user ?? payload;
    if (!user) return;
    const { password, ...safe } = user;
    
    // Multiple storage approaches for mobile compatibility
    localStorage.setItem("user", JSON.stringify(safe));
    sessionStorage.setItem("user", JSON.stringify(safe));
    
    // Set a cookie as backup for mobile Safari
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `user=${encodeURIComponent(JSON.stringify(safe))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    return true;
  } catch (error) {
    console.error('Failed to save user:', error);
    return false;
  }
};

const getUser = () => {
  try {
    // Try localStorage first
    let userData = localStorage.getItem("user");
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Try sessionStorage
    userData = sessionStorage.getItem("user");
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Try cookie as last resort
    const cookies = document.cookie.split(';');
    const userCookie = cookies.find(cookie => cookie.trim().startsWith('user='));
    if (userCookie) {
      const cookieValue = userCookie.split('=')[1];
      return JSON.parse(decodeURIComponent(cookieValue));
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
};

const broadcastAuthChange = () => {
  // Multiple event dispatching for better compatibility
  window.dispatchEvent(new Event("auth-changed"));
  window.dispatchEvent(new CustomEvent("user-login", { detail: { timestamp: Date.now() } }));
  
  // Force storage event for components listening to storage changes
  const userData = getUser();
  if (userData) {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user',
      newValue: JSON.stringify(userData),
      url: window.location.href
    }));
  }
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
  },
  spinner: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
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

  // Enhanced fetch function for mobile compatibility
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            // Mobile Safari specific headers
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
          },
          credentials: 'include',
          mode: 'cors', // Explicitly set CORS mode
        });

        if (response.ok) {
          return response;
        }
        
        // If not successful, throw to trigger retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed:`, error);
        
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, attempt login
      const loginRes = await fetchWithRetry(`${apiUrl}/user/login`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const loginData = await loginRes.json();
      
      if (loginData) {
        // Save user data immediately
        const saveSuccess = saveUser(loginData);
        if (!saveSuccess) {
          throw new Error('Failed to save user data');
        }

        // Verify the session immediately with /user/me
        try {
          const meRes = await fetchWithRetry(`${apiUrl}/user/me`, {
            method: 'GET',
          });
          
          const meData = await meRes.json();
          if (meData && meData.id) {
            // Re-save with fresh data
            saveUser(meData);
            
            // Broadcast auth change multiple times for reliability
            broadcastAuthChange();
            
            // Small delay then broadcast again
            setTimeout(() => {
              broadcastAuthChange();
            }, 100);
            
            setWelcome({ open: true, name: meData.name || meData.email || 'Traveler' });
            
            setTimeout(() => {
              setIsLoading(false);
              
              // Final broadcast before redirect
              broadcastAuthChange();
              
              // For mobile, use a more aggressive redirect strategy
              if (/Mobi|Android/i.test(navigator.userAgent)) {
                // Mobile: use window.location.href for better compatibility
                window.location.href = '/';
              } else {
                // Desktop: use navigate with fallback
                try {
                  navigate('/');
                  // Force refresh after navigation on mobile
                  setTimeout(() => {
                    if (/Mobi|Android/i.test(navigator.userAgent)) {
                      window.location.reload();
                    }
                  }, 100);
                } catch {
                  window.location.href = '/';
                }
              }
            }, 1400);
            
            return;
          }
        } catch (verifyError) {
          console.warn('Session verification failed, but login succeeded:', verifyError);
        }
        
        // If verification failed but login succeeded, still proceed
        setWelcome({ open: true, name: loginData.name || loginData.email || 'Traveler' });
        broadcastAuthChange();
        
        setTimeout(() => {
          setIsLoading(false);
          broadcastAuthChange();
          window.location.href = '/';
        }, 1400);
        
      } else {
        throw new Error('No user data received from login');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.message.includes('404')) {
        errorMessage = 'Login service unavailable. Please try again later.';
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMessage = 'Invalid email or password.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setErrorBox({ open: true, message: errorMessage });
    }
  };

  // Enhanced OAuth success detection for mobile
  useEffect(() => {
    const checkOAuthSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      
      const oauthSuccess = urlParams.get('oauth') === 'success' || 
                          urlParams.get('success') === 'true' ||
                          hashParams.get('oauth') === 'success' ||
                          hashParams.get('success') === 'true';
      
      const isOAuthRedirect = window.location.pathname.includes('/oauth') || 
                              window.location.search.includes('code=') ||
                              window.location.hash.includes('access_token') ||
                              window.location.search.includes('state=');
      
      if (oauthSuccess || isOAuthRedirect) {
        setIsLoading(true);
        
        try {
          // Multiple attempts with longer delays for mobile
          let userData = null;
          let attempts = 0;
          const maxAttempts = 5; // Increased for mobile
          
          while (!userData && attempts < maxAttempts) {
            attempts++;
            console.log(`OAuth verification attempt ${attempts}/${maxAttempts}`);
            
            try {
              const res = await fetchWithRetry(`${apiUrl}/user/me`, {
                method: 'GET',
              });
              
              userData = await res.json();
              
              if (userData && userData.id) {
                console.log('OAuth user data received:', userData.email || userData.name);
                break;
              }
            } catch (fetchError) {
              console.warn(`Attempt ${attempts} failed:`, fetchError);
            }
            
            // Progressive delay increase for mobile
            if (attempts < maxAttempts) {
              const delay = attempts * 1000; // 1s, 2s, 3s, 4s
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          if (userData && userData.id) {
            const saveSuccess = saveUser(userData);
            if (!saveSuccess) {
              throw new Error('Failed to save OAuth user data');
            }
            
            // Multiple broadcasts for OAuth success
            broadcastAuthChange();
            setTimeout(() => broadcastAuthChange(), 100);
            setTimeout(() => broadcastAuthChange(), 500);
            
            setWelcome({ open: true, name: userData.name || userData.email || 'Traveler' });
            
            setTimeout(() => {
              setIsLoading(false);
              broadcastAuthChange();
              
              // Clean URL
              const cleanUrl = window.location.origin + window.location.pathname;
              window.history.replaceState({}, document.title, '/');
              
              // Force redirect for OAuth
              window.location.href = '/';
            }, 1400);
            
            return;
          } else {
            console.error('OAuth login failed - no valid user data after', maxAttempts, 'attempts');
            setErrorBox({ open: true, message: 'OAuth login verification failed. Please try regular login.' });
          }
        } catch (error) {
          console.error('OAuth verification error:', error);
          setErrorBox({ open: true, message: 'OAuth login failed. Please try again or use regular login.' });
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Delay OAuth check slightly for mobile
    const checkDelay = /Mobi|Android/i.test(navigator.userAgent) ? 1000 : 500;
    setTimeout(checkOAuthSuccess, checkDelay);
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

  // Local keyframes
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
    ${styles.spinner}
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
                  Logging in...
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

            {/* Google Login Button */}
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
              {errorBox.message || 'Username or password mismatch'}
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