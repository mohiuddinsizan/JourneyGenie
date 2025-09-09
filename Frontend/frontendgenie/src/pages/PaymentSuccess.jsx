import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';

function SuccessPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id"); // 👈 Stripe injected this
    if (sessionId) {
      fetch(`${API_BASE}/payment/verify-session?session_id=${sessionId}`,{
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.payment_status === "paid") {
            alert("✅ Payment confirmed, tokens updated!");
          } else {
            alert("❌ Payment not successful.");
          }
        });
    }
  }, [searchParams]);

  return <h1>Payment confirmation in progress...</h1>;
}

export default SuccessPage;
