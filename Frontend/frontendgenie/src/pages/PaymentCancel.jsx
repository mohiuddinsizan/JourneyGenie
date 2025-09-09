import React from "react";
import { Link } from "react-router-dom";
import "./PaymentCancel.css";

const PaymentCancel = () => (
  <div className="cancel-page">
    <div className="cancel-card">
      <div className="cancel-icon">⚠️</div>
      <h2>Payment Cancelled</h2>
      <p>
        Your payment was not completed. This may be due to a declined card or
        cancellation during checkout.
      </p>
      <div className="cancel-actions">
        <Link to="/payment">
          <button className="retry-btn">Try Again</button>
        </Link>
        <Link to="/" className="home-link">
          Back to Home
        </Link>
      </div>
    </div>
  </div>
);

export default PaymentCancel;
