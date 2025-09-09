import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancel = () => (
    <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    }}>
        <h1>Payment Cancelled</h1>
        <p>Your payment was not completed. If you wish to try again, please return to the payment page.</p>
        <Link to="/payment">
            <button style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '20px'
            }}>
                Try Again
            </button>
        </Link>
        <Link to="/" style={{ marginTop: '10px', color: '#007bff', textDecoration: 'underline' }}>
            Back to Home
        </Link>
    </div>
);

export default PaymentCancel;