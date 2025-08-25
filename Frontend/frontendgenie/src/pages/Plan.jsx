import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';

const TokenBuyPage = () => {
  const [amount, setAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [discountCoupon, setDiscountCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [tokens, setTokens] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, false = not authenticated, true = authenticated
  const [userInfo, setUserInfo] = useState(null);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First check localStorage for user data
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setIsAuthenticated(false);
        return;
      }

      const userData = JSON.parse(storedUser);
      setUserInfo(userData);
      setTokens(userData.tokens || 0);

      // Also verify with API (similar to your Plan.jsx pattern)
      const response = await fetch(`${API_BASE}/token/balance`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setTokens(data.tokens || userData.tokens || 0);
        
        // Update localStorage with fresh token data
        const updatedUser = { ...userData, tokens: data.tokens };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
      } else {
        // API call failed but we have localStorage data - might be network issue
        setIsAuthenticated(true); // Still authenticated based on localStorage
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Check if we at least have localStorage data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUserInfo(userData);
        setTokens(userData.tokens || 0);
      } else {
        setIsAuthenticated(false);
      }
    }
  };

  const handleLogin = () => {
    // Navigate to login page - using window.location like in Plan.jsx
    window.location.href = '/login';
  };

  // Predefined discount coupons (frontend validation)
  const discountCoupons = {
    "SAVE10": { discount: 10, description: "10% off on total amount", color: "#3b82f6", emoji: "💎" },
    "SAVE20": { discount: 20, description: "20% off on total amount", color: "#8b5cf6", emoji: "🎯" },
    "WELCOME": { discount: 15, description: "15% welcome discount", color: "#10b981", emoji: "🌟" },
    "STUDENT": { discount: 25, description: "25% student discount", color: "#f59e0b", emoji: "🎓" }
  };

  const resetMessages = () => {
    setMessage("");
    setError(null);
    setAlertMessage("");
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value < 0) {
      showAlert("Amount cannot be negative.");
      return;
    }
    setAmount(value);
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => {
      setAlertMessage("");
    }, 5000);
  };

  const handleDiscountCoupon = () => {
    if (!discountCoupon.trim()) {
      showAlert("Please enter a discount coupon code.");
      return;
    }

    const coupon = discountCoupons[discountCoupon.toUpperCase()];
    if (coupon) {
      setDiscount(coupon.discount);
      setDiscountApplied(true);
      showAlert(`Discount coupon applied! You get ${coupon.discount}% off.`);
    } else {
      setDiscount(0);
      setDiscountApplied(false);
      showAlert("Invalid discount coupon code.");
    }
  };

  const removeDiscount = () => {
    setDiscount(0);
    setDiscountApplied(false);
    setDiscountCoupon("");
    showAlert("Discount coupon removed.");
  };

  const calculateTotal = () => {
    const subtotal = amount * 1; // 1 TK per token
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const handleTokenPurchase = async () => {
    if (amount <= 0) {
      showAlert("Please enter a valid positive amount.");
      return;
    }

    resetMessages();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/token/add?tokens=${amount}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to purchase tokens");
      }

      const data = await response.json();
      setMessage(data.message);
      setTokens(data.tokens);
      
      // Update localStorage like in Plan.jsx
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = { ...userData, tokens: data.tokens };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
      }
      
      showAlert(data.message);
    } catch (err) {
      setError(err.message);
      showAlert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    resetMessages();
    setLoading(true);
    try {
      const payload = {
        couponCode: couponCode
      };

      const response = await fetch(`${API_BASE}/token/apply-coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to apply coupon");
      }

      const data = await response.json();
      setTokens(data.tokens);
      setMessage(`Coupon applied! Now you have total ${data.tokens} tokens.`);
      
      // Update localStorage like in Plan.jsx
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = { ...userData, tokens: data.tokens };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
      }
    } catch (err) {
      setError(err.message);
      showAlert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (amount <= 0) {
      showAlert("Please enter a valid amount before proceeding to payment.");
      return;
    }
    showAlert(`Redirecting to payment for ${calculateTotal().toFixed(2)} TK`);
  };

  const CouponCard = ({ code, info, onClick }) => (
    <div 
      className="coupon-card"
      onClick={() => onClick(code)}
      style={{
        background: `linear-gradient(135deg, ${info.color}15, ${info.color}08)`,
        border: `1px solid ${info.color}40`,
        borderRadius: '16px',
        padding: '16px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: `0 4px 20px ${info.color}10, inset 0 1px 0 ${info.color}20`
      }}
    >
      {/* 3D Background Pattern */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle, ${info.color}10 0%, transparent 70%)`,
        transform: 'rotate(45deg)',
        pointerEvents: 'none'
      }} />
      
      {/* Coupon Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '1.5rem',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}>
            {info.emoji}
          </div>
          <div style={{
            background: info.color,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            boxShadow: `0 2px 8px ${info.color}40`
          }}>
            {info.discount}% OFF
          </div>
        </div>
        
        <div style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#e9edf1',
          marginBottom: '4px',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}>
          {code}
        </div>
        
        <div style={{
          fontSize: '0.85rem',
          color: '#9aa5b1',
          lineHeight: 1.3
        }}>
          {info.description}
        </div>
      </div>
      
      {/* Hover Glow Effect */}
      <div className="coupon-glow" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${info.color}20, transparent)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        borderRadius: '16px'
      }} />
    </div>
  );

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="plan-page plan-scrollfix">
        <div className="plan-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px',
            animation: 'spin 1s linear infinite'
          }}>
            ⚡
          </div>
          <h3 style={{ color: '#ec4899', marginBottom: '10px' }}>
            Loading...
          </h3>
          <p style={{ color: '#9aa5b1' }}>
            Checking authentication status
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show login required screen if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="plan-page plan-scrollfix">
        <div className="plan-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #ec4899, #db2777)',
            margin: '-24px -24px 40px -24px',
            padding: '40px 24px',
            borderRadius: '14px 14px 0 0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(219,39,119,0.9))',
              backdropFilter: 'blur(10px)'
            }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '20px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}>
                🔐
              </div>
              <h2 style={{ 
                margin: 0,
                fontSize: '2.2rem',
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                marginBottom: '8px'
              }}>
                Authentication Required
              </h2>
              <p style={{ 
                margin: 0, 
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.9)'
              }}>
                Please log in to purchase tokens
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(15,18,24,0.8), rgba(26,31,39,0.6))',
            borderRadius: '16px',
            padding: '40px 30px',
            border: '1px solid rgba(236,72,153,0.2)',
            backdropFilter: 'blur(10px)',
            marginBottom: '30px'
          }}>
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '16px'
            }}>
              💰✨🪙
            </div>
            
            <h3 style={{
              color: '#e9edf1',
              fontSize: '1.5rem',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Ready to Buy Tokens?
            </h3>
            
            <p style={{
              color: '#9aa5b1',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '0',
              maxWidth: '400px',
              margin: '0 auto 24px auto'
            }}>
              Access our secure token purchase system with exclusive discounts, 
              special coupons, and instant delivery to your account.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '30px',
              maxWidth: '500px',
              margin: '0 auto 30px auto'
            }}>
              <div style={{
                background: 'rgba(236,72,153,0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(236,72,153,0.2)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎯</div>
                <div style={{ color: '#e9edf1', fontSize: '0.9rem', fontWeight: '600' }}>
                  Instant Delivery
                </div>
                <div style={{ color: '#9aa5b1', fontSize: '0.8rem' }}>
                  Tokens added immediately
                </div>
              </div>
              
              <div style={{
                background: 'rgba(16,185,129,0.1)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(16,185,129,0.2)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎫</div>
                <div style={{ color: '#e9edf1', fontSize: '0.9rem', fontWeight: '600' }}>
                  Discount Coupons
                </div>
                <div style={{ color: '#9aa5b1', fontSize: '0.8rem' }}>
                  Save up to 25% off
                </div>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              padding: '16px 40px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(236,72,153,0.4)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.05)';
              e.target.style.boxShadow = '0 12px 35px rgba(236,72,153,0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0px) scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(236,72,153,0.4)';
            }}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>
              🚀 Login to Continue
            </span>
          </button>

          <p style={{
            color: '#9aa5b1',
            fontSize: '0.9rem',
            marginTop: '20px',
            fontStyle: 'italic'
          }}>
            New user? Create an account during the login process
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-page plan-scrollfix">
      <div className="plan-card">
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ec4899, #db2777)',
          margin: '-24px -24px 32px -24px',
          padding: '24px',
          borderRadius: '14px 14px 0 0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(219,39,119,0.9))',
            backdropFilter: 'blur(10px)'
          }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ 
              margin: 0,
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              💰 Buy Tokens
            </h2>
            <p style={{ 
              margin: '8px 0 0 0', 
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              🪙 1 Token = 1 TK | Secure & Instant Purchase
            </p>
          </div>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '32px',
          marginBottom: '24px'
        }}>
          
          {/* Left Column - Token Purchase & Price */}
          <div className="day-card">
            <div className="day-head">
              <h4>🪙 Purchase Tokens</h4>
            </div>
            
            <div className="day-content">
              <div className="plan-form" style={{ marginBottom: '20px' }}>
                <label style={{ color: '#9aa5b1', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Number of Tokens:
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  style={{
                    fontSize: '1.1rem',
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: '600'
                  }}
                />
              </div>

              {/* Price Breakdown */}
              {amount > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(15,18,24,0.6), rgba(26,31,39,0.8))',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(236,72,153,0.2)',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#ec4899', 
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    💳 Price Details
                  </h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#9aa5b1' }}>Tokens ({amount})</span>
                    <span style={{ color: '#e9edf1', fontWeight: '600' }}>{amount} TK</span>
                  </div>
                  
                  {discountApplied && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '8px',
                      color: '#2ecc71'
                    }}>
                      <span>Discount ({discount}%)</span>
                      <span>-{((amount * discount) / 100).toFixed(2)} TK</span>
                    </div>
                  )}
                  
                  <div style={{
                    borderTop: '1px solid rgba(236,72,153,0.3)',
                    paddingTop: '12px',
                    marginTop: '12px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#ec4899'
                    }}>
                      <span>Total Amount:</span>
                      <span>{calculateTotal().toFixed(2)} TK</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="btn primary"
                  onClick={handlePayment}
                  style={{ width: '100%', fontSize: '1rem' }}
                >
                  💳 Proceed to Payment
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Combined Coupons */}
          <div className="day-card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            {/* Header */}
            <div className="day-head">
              <h4 style={{ fontSize: '1.1rem' }}>
                🎫 Coupon Center
              </h4>
              <div className="chip">Save & Earn</div>
            </div>
            
            <div className="day-content" style={{ padding: '16px' }}>
              {/* Discount Coupon Input */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#ec4899', 
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  🎯 Discount Coupon
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={discountCoupon}
                    onChange={(e) => setDiscountCoupon(e.target.value)}
                    placeholder="Enter discount code"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '2px solid #2a2f38',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0f1216, #1a1f27)',
                      color: '#e9edf1',
                      outline: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <button
                    className="btn primary"
                    onClick={handleDiscountCoupon}
                    style={{ 
                      padding: '10px 16px', 
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ec4899, #db2777)',
                      boxShadow: '0 3px 12px rgba(236,72,153,0.4)'
                    }}
                  >
                    Apply
                  </button>
                  {discountApplied && (
                    <button
                      onClick={removeDiscount}
                      style={{
                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        boxShadow: '0 3px 12px rgba(220,53,69,0.4)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Available Coupons - Compact 4-in-a-row */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#9aa5b1', 
                  fontWeight: '600',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  ✨ Click to Apply ✨
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '8px'
                }}>
                  {Object.entries(discountCoupons).map(([code, info]) => (
                    <div 
                      key={code}
                      className="coupon-card-compact"
                      onClick={() => setDiscountCoupon(code)}
                      style={{
                        background: `linear-gradient(135deg, ${info.color}12, ${info.color}06)`,
                        border: `1px solid ${info.color}30`,
                        borderRadius: '10px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: `0 2px 8px ${info.color}08`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1rem' }}>{info.emoji}</span>
                        <div>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: '#e9edf1'
                          }}>
                            {code}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        background: info.color,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        {info.discount}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Coupon */}
              <div style={{ 
                borderTop: '1px solid rgba(236,72,153,0.2)',
                paddingTop: '16px'
              }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#f59e0b', 
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  🎁 Special Coupon
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter special code"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '2px solid #2a2f38',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0f1216, #1a1f27)',
                      color: '#e9edf1',
                      outline: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <button
                    className="btn primary"
                    onClick={handleApplyCoupon}
                    disabled={loading}
                    style={{ 
                      padding: '10px 16px', 
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      boxShadow: '0 3px 12px rgba(245,158,11,0.4)'
                    }}
                  >
                    {loading ? "..." : "Apply"}
                  </button>
                </div>
                
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#9aa5b1', 
                  fontStyle: 'italic',
                  background: 'linear-gradient(135deg, rgba(26,31,39,0.4), rgba(15,18,24,0.6))',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(236,72,153,0.1)',
                  textAlign: 'center'
                }}>
                  💡 Get bonus tokens & exclusive benefits
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Row */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {message && (
            <div className="success-msg" style={{ flex: 1 }}>
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="error" style={{ flex: 1 }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* Custom Alert */}
        {alertMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(16,18,22,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(236,72,153,0.3)',
            color: '#e9edf1',
            padding: '16px 20px',
            borderRadius: '12px',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'fadeInUp 0.3s ease-out'
          }}>
            {alertMessage}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-2px) rotateX(5deg); }
        }
        
        .coupon-card-compact:hover {
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 0 4px 20px rgba(236,72,153,0.2) !important;
          border-color: rgba(236,72,153,0.5) !important;
        }
        
        .coupon-card-compact:active {
          transform: translateY(0px) scale(0.98) !important;
        }
        
        .plan-form input:focus {
          border-color: #ec4899 !important;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.2) !important;
          background: linear-gradient(135deg, #1a1f27, #2a2f38) !important;
        }
        
        .day-content input:focus {
          border-color: #ec4899 !important;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.2) !important;
          background: linear-gradient(135deg, #1a1f27, #2a2f38) !important;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(236,72,153,0.4);
        }
        
        .btn:active {
          transform: translateY(0px);
        }
        
        @media (max-width: 1024px) {
          .plan-card > div:first-of-type {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          
          .coupon-card {
            grid-column: span 2;
          }
        }
        
        @media (max-width: 768px) {
          .plan-card > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
          
          .day-head h4 {
            font-size: 1rem !important;
          }
          
          .coupon-card {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TokenBuyPage;