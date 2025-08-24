import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TokenBuyPage.css"; // You can leave this or customize based on your design

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';

const TokenBuyPage = () => {
  const [amount, setAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [tokens, setTokens] = useState(0);
  const [alertMessage, setAlertMessage] = useState(""); // For custom alert message
  const navigate = useNavigate(); // Used to navigate on success/failure

  // Reset previous messages when new request is made
  const resetMessages = () => {
    setMessage("");
    setError(null);
    setAlertMessage(""); // Reset custom alert message
  };

  // Ensure that the amount is positive and valid
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
      setAlertMessage(""); // Reset alert after 5 seconds
    }, 5000);
  };

  const handleTokenPurchase = async () => {
    if (amount <= 0) {
      showAlert("Please enter a valid positive amount.");
      return;
    }

    resetMessages(); // Reset previous messages before making request
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/token/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokens: amount }),
        credentials: 'include', // Include credentials if needed (like cookies)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to purchase tokens");
      }

      const data = await response.json();
      setMessage(data.message); // Show the response message
      setTokens(data.tokens); // Update the tokens with the actual value from response
      showAlert(data.message); // Show success alert message
    } catch (err) {
      setError(err.message); // Show error if any
      showAlert(err.message); // Show error alert message
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    resetMessages(); // Reset previous messages before making request
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/token/apply-coupon?couponCode=${couponCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include credentials (cookies with JWT) in the request
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to apply coupon");
      }
  
      const data = await response.json();
      setTokens(data.tokens); // Directly set tokens to the new value received from coupon (not adding to previous)
      setMessage(`Coupon applied! Now you have total ${data.tokens} tokens.`);
  
      // Only show the success message (no need for alert)
    } catch (err) {
      setError(err.message); // Show error if any
      showAlert(err.message); // Show error alert message
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="token-buy-page">
      <div className="plan-card">
        <h2>Buy Tokens</h2>

        {/* Token Purchase */}
        <div className="plan-form">
          <label htmlFor="amount">Amount:</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={handleAmountChange}  // Using handleAmountChange to restrict negative values
            placeholder="Enter the amount of tokens"
          />
        </div>

        <button
          className="btn success"
          onClick={handleTokenPurchase}
          disabled={loading}
          style={{ marginBottom: "20px" }}
        >
          {loading ? "Processing..." : "Buy Tokens"}
        </button>

        {/* Coupon Section */}
        <div className="plan-form">
          <input
            id="couponCode"
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code (if any)"
          />
        </div>

        <button
          className="btn primary"
          onClick={handleApplyCoupon}
          disabled={loading}
        >
          {loading ? "Applying..." : "Apply Coupon"}
        </button>

        {/* Display message and token count */}
        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error">{error}</div>}

        {/* Custom Alert */}
        {alertMessage && (
          <div className="custom-alert">
            <span>{alertMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenBuyPage;
