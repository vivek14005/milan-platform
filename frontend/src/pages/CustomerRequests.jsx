import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerRequests.css";

const getToken = () =>
  localStorage.getItem("milan_token") || sessionStorage.getItem("milan_token");

export default function CustomerRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Please log in to view your requests.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/enquiries/customer/me", {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Your session has expired. Please log in again."
          : data.detail || "Unable to load your requests.");
      }
      setRequests(Array.isArray(data.enquiries) ? data.enquiries : []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load your requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    const refresh = () => {
      if (document.visibilityState === "visible") loadRequests();
    };
    const timer = window.setInterval(refresh, 20000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadRequests]);

  const statusLabel = (status) => {
    const value = status?.toString().toLowerCase() || "pending";
    if (value === "accepted") return "Accepted by vendor";
    if (value === "rejected") return "Rejected by vendor";
    return "Waiting for vendor";
  };

  return (
    <main className="milan-requests-page">
      <header className="milan-requests-topbar">
        <button type="button" onClick={() => navigate("/")}>← Back to Milan</button>
        <span>Milan<span className="milan-requests-dot">•</span></span>
      </header>
      <div className="milan-requests-content">
        <p className="milan-requests-kicker">YOUR WEDDING REQUESTS</p>
        <h1>Request Vendors</h1>
        <p className="milan-requests-intro">
          See every request you sent and the vendor’s latest response.
        </p>

        {loading ? (
          <p role="status">Loading your requests...</p>
        ) : error ? (
          <div className="milan-requests-empty" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadRequests}>Try again</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="milan-requests-empty">
            <h2>No requests sent yet</h2>
            <p>Explore a wedding vendor and send your first request.</p>
            <button type="button" onClick={() => navigate("/")}>Explore vendors →</button>
          </div>
        ) : (
          <div className="milan-requests-list">
            {requests.map((request) => {
              const status = request.status?.toString().toLowerCase() || "pending";
              const vendor = request.vendor || {};
              return (
                <article className="milan-request-card" key={request.id}>
                  <div>
                    <p className="milan-request-category">{vendor.category || "Wedding professional"}</p>
                    <h2>{vendor.business_name || "Milan vendor"}</h2>
                    {request.package_name && (
                      <p className="milan-request-package">
                        Package: <strong>{request.package_name}</strong>
                      </p>
                    )}
                    {request.wedding_date && <p>Wedding date: {request.wedding_date}</p>}
                    {request.message && <p className="milan-request-message">“{request.message}”</p>}

                    <div className="milan-request-card-actions">
                      {vendor.id && (
                        <button type="button" className="milan-request-vendor-link"
                          onClick={() => navigate(`/vendors/${vendor.id}`)}>
                          View vendor →
                        </button>
                      )}

                      {status === "accepted" && (
                        <button
                          type="button"
                          className="milan-request-conversation-button"
                          onClick={() =>
                            navigate(`/booking-conversation/${request.id}`)
                          }
                        >
                          💬 Continue Conversation
                        </button>
                      )}
                    </div>
                  </div>
                  <span className={`milan-request-status status-${status}`}>
                    {statusLabel(status)}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
