import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";

const API_BASE = import.meta.env.REACT_APP_API_URL || "http://localhost:8080";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed | already_verified
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const verifiedFlag = searchParams.get("verified");

    // If already marked as verified, skip backend call
    if (verifiedFlag === "true") {
      setStatus("already_verified");
      return;
    }

    // Only call backend if we have a session_id
    if (sessionId) {
      fetch(`${API_BASE}/payment/verify-session?session_id=${sessionId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.payment_status === "paid") {
            setStatus("success");

            // Replace session_id with custom "verified" flag in URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("session_id");
            newParams.set("verified", "true");
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}?${newParams}`
            );
          } else {
            setStatus("failed");
          }
        })
        .catch(() => setStatus("failed"));
    }
  }, [searchParams]);

  return (
    <div className="success-page">
      {status === "verifying" && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Verifying your payment...</p>
        </div>
      )}

      {status === "success" && (
        <div className="result success">
          <div className="checkmark">✓</div>
          <h2>Payment Verified</h2>
          <p>Your tokens have been updated successfully 🎉</p>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
        </div>
      )}

      {status === "already_verified" && (
        <div className="result already-verified">
          <div className="checkmark subtle">✓</div>
          <h2>Payment Already Verified</h2>
          <p>Your tokens have already been added 🎉</p>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
        </div>
      )}

      {status === "failed" && (
        <div className="result failed">
          <div className="cross">✕</div>
          <h2>Payment Failed</h2>
          <p>We couldn’t verify your payment. Please contact support.</p>
          <button onClick={() => navigate("/")}>Return Home</button>
        </div>
      )}
    </div>
  );
}

export default SuccessPage;
