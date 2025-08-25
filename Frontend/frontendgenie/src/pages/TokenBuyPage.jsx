import React, { useState } from "react";

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
  // const navigate = useNavigate(); // Uncomment when using with React Router

  // Predefined discount coupons (frontend validation)
  const discountCoupons = {
    "SAVE10": { discount: 10, description: "10% off on total amount" },
    "SAVE20": { discount: 20, description: "20% off on total amount" },
    "WELCOME": { discount: 15, description: "15% welcome discount" },
    "STUDENT": { discount: 25, description: "25% student discount" }
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
    // For demo purposes - in real app, navigate to payment page
    showAlert(`Redirecting to payment for ${calculateTotal().toFixed(2)} TK`);
    // navigate('/payment', { 
    //   state: { 
    //     amount: amount, 
    //     total: calculateTotal(),
    //     discount: discount,
    //     tokens: amount 
    //   } 
    // });
  };

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
              <h4>
                <span style={{color: 'initial'}}>🪙</span>
                Purchase Tokens
              </h4>
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

          {/* Right Column - Coupons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Discount Coupon */}
            <div className="day-card" style={{ flex: 1 }}>
              <div className="day-head">
                <h4 style={{ fontSize: '1.1rem' }}>
                  <span style={{color: 'initial'}}>🎫</span>
                  Discount Coupon
                </h4>
                <div className="chip">Save Money</div>
              </div>
              
              <div className="day-content">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={discountCoupon}
                      onChange={(e) => setDiscountCoupon(e.target.value)}
                      placeholder="Enter discount code"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #2a2f38',
                        borderRadius: '8px',
                        background: '#0f1216',
                        color: '#e9edf1',
                        outline: 'none'
                      }}
                    />
                    <button
                      className="btn primary"
                      onClick={handleDiscountCoupon}
                      style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                    >
                      Apply
                    </button>
                    {discountApplied && (
                      <button
                        onClick={removeDiscount}
                        style={{
                          background: '#dc3545',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Available Coupons - Compact Display */}
                <div style={{ 
                  background: 'rgba(26,31,39,0.5)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  border: '1px solid rgba(236,72,153,0.1)'
                }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#ec4899', 
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Available Codes:
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '6px',
                    fontSize: '0.8rem'
                  }}>
                    {Object.entries(discountCoupons).map(([code, info]) => (
                      <div key={code} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        color: '#9aa5b1'
                      }}>
                        <span style={{ color: '#e9edf1', fontWeight: '600' }}>{code}</span>
                        <span style={{ color: '#2ecc71' }}>{info.discount}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Special Coupon */}
            <div className="day-card" style={{ flex: 1 }}>
              <div className="day-head">
                <h4 style={{ fontSize: '1.1rem' }}>
                  <span style={{color: 'initial'}}>🎁</span>
                  Special Coupon
                </h4>
                <div className="chip">Bonus Tokens</div>
              </div>
              
              <div className="day-content">
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter special code"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #2a2f38',
                        borderRadius: '8px',
                        background: '#0f1216',
                        color: '#e9edf1',
                        outline: 'none'
                      }}
                    />
                    <button
                      className="btn primary"
                      onClick={handleApplyCoupon}
                      disabled={loading}
                      style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                    >
                      {loading ? "..." : "Apply"}
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#9aa5b1', 
                  fontStyle: 'italic',
                  background: 'rgba(26,31,39,0.3)',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(236,72,153,0.1)'
                }}>
                  💡 Special coupons provide bonus tokens or exclusive benefits
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
        
        .plan-form input:focus {
          border-color: #ec4899 !important;
          box-shadow: 0 0 0 2px rgba(236,72,153,0.1);
        }
        
        @media (max-width: 1024px) {
          .plan-card > div:first-of-type {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          
          .day-card .day-content > div:first-child > div {
            flex-direction: column;
            gap: 8px;
          }
        }
        
        @media (max-width: 768px) {
          .plan-card > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
          
          .day-head h4 {
            font-size: 1rem !important;
          }
          
          .day-number {
            width: 32px !important;
            height: 32px !important;
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TokenBuyPage;