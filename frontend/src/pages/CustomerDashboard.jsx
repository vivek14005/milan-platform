import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerDashboard.css";

const API_URL = "http://127.0.0.1:8000";

const getMilanToken = () =>
  localStorage.getItem("milan_token") ||
  sessionStorage.getItem("milan_token");

function CustomerDashboard() {
  const navigate = useNavigate();

  const [savedVendors, setSavedVendors] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const token = getMilanToken();

      if (!token) {
        setError("Please login to view your dashboard.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [savedResponse, enquiryResponse] = await Promise.all([
          fetch(`${API_URL}/saved-vendors`, {
            method: "GET",
            headers,
          }),
          fetch(`${API_URL}/enquiries/customer/me`, {
            method: "GET",
            headers,
          }),
        ]);

        const savedData = await savedResponse.json().catch(() => ({}));
        const enquiryData = await enquiryResponse.json().catch(() => ({}));

        if (!savedResponse.ok) {
          if (savedResponse.status === 401) {
            throw new Error("Your session has expired. Please login again.");
          }

          if (savedResponse.status === 403) {
            throw new Error("Customer dashboard is available for customers only.");
          }

          throw new Error(savedData.detail || "Unable to load saved vendors.");
        }

        if (!enquiryResponse.ok) {
          if (enquiryResponse.status === 401) {
            throw new Error("Your session has expired. Please login again.");
          }

          if (enquiryResponse.status === 403) {
            throw new Error("Customer dashboard is available for customers only.");
          }

          throw new Error(enquiryData.detail || "Unable to load your enquiries.");
        }

        setSavedVendors(
          Array.isArray(savedData?.vendors) ? savedData.vendors : []
        );

        setEnquiries(
          Array.isArray(enquiryData?.enquiries) ? enquiryData.enquiries : []
        );
      } catch (loadError) {
        console.error("Unable to load customer dashboard:", loadError);
        setError(loadError.message || "Unable to load your dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const pendingCount = useMemo(
    () =>
      enquiries.filter(
        (item) => item?.status?.toString().trim().toLowerCase() === "pending"
      ).length,
    [enquiries]
  );

  const acceptedCount = useMemo(
    () =>
      enquiries.filter(
        (item) => item?.status?.toString().trim().toLowerCase() === "accepted"
      ).length,
    [enquiries]
  );

  const recentEnquiries = useMemo(
    () => enquiries.slice(0, 5),
    [enquiries]
  );

  const formatStatus = (status) => {
    const value = status?.toString().trim().toLowerCase() || "pending";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatWeddingDate = (value) => {
    if (!value) return "Not added";

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="customer-dashboard-page">
      <header className="customer-dashboard-topbar">
        <button
          type="button"
          className="customer-dashboard-back"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

        <button
          type="button"
          className="customer-dashboard-brand"
          onClick={() => navigate("/")}
        >
          Milan
        </button>
      </header>

      <main className="customer-dashboard-container">
        <section className="customer-dashboard-hero">
          <p className="customer-dashboard-eyebrow">YOUR MILAN DASHBOARD</p>
          <h1>Your Wedding Journey, All in One Place</h1>
          <p>
            Keep track of your saved vendors and every enquiry you have sent.
          </p>
        </section>

        {loading ? (
          <section className="customer-dashboard-state-card">
            <div className="customer-dashboard-loader" />
            <h2>Loading your dashboard...</h2>
            <p>We are bringing your wedding activity together.</p>
          </section>
        ) : error ? (
          <section className="customer-dashboard-state-card error-state">
            <div className="customer-dashboard-state-icon">!</div>
            <h2>Unable to load dashboard</h2>
            <p>{error}</p>
            <button type="button" onClick={() => navigate("/")}>
              Go to Home
            </button>
          </section>
        ) : (
          <>
            <section className="customer-dashboard-stats">
              <article className="customer-dashboard-stat-card">
                <div className="customer-dashboard-stat-icon">❤️</div>
                <div className="customer-dashboard-stat-value">
                  {savedVendors.length}
                </div>
                <h3>Saved Vendors</h3>
                <p>Wedding professionals you shortlisted</p>
                <button
                  type="button"
                  onClick={() => navigate("/saved-vendors")}
                >
                  View Saved Vendors →
                </button>
              </article>

              <article className="customer-dashboard-stat-card">
                <div className="customer-dashboard-stat-icon">💌</div>
                <div className="customer-dashboard-stat-value">
                  {enquiries.length}
                </div>
                <h3>Total Enquiries</h3>
                <p>All enquiries sent to Milan vendors</p>
              </article>

              <article className="customer-dashboard-stat-card">
                <div className="customer-dashboard-stat-icon">⏳</div>
                <div className="customer-dashboard-stat-value">
                  {pendingCount}
                </div>
                <h3>Pending Enquiries</h3>
                <p>Waiting for a vendor response</p>
              </article>

              <article className="customer-dashboard-stat-card">
                <div className="customer-dashboard-stat-icon">✅</div>
                <div className="customer-dashboard-stat-value">
                  {acceptedCount}
                </div>
                <h3>Accepted Enquiries</h3>
                <p>Vendors who accepted your enquiry</p>
              </article>
            </section>

            <section className="customer-dashboard-content-grid">
              <div className="customer-dashboard-panel customer-enquiries-panel">
                <div className="customer-dashboard-panel-heading">
                  <div>
                    <p>RECENT ACTIVITY</p>
                    <h2>My Enquiries</h2>
                  </div>
                  <span>{enquiries.length} total</span>
                </div>

                {recentEnquiries.length === 0 ? (
                  <div className="customer-dashboard-empty">
                    <div>💌</div>
                    <h3>No enquiries yet</h3>
                    <p>
                      Find a vendor you like and send your first wedding enquiry.
                    </p>
                    <button type="button" onClick={() => navigate("/")}>
                      Explore Vendors
                    </button>
                  </div>
                ) : (
                  <div className="customer-enquiry-list">
                    {recentEnquiries.map((enquiry) => {
                      const vendor = enquiry?.vendor;
                      const status =
                        enquiry?.status?.toString().trim().toLowerCase() ||
                        "pending";

                      return (
                        <article
                          className="customer-enquiry-card"
                          key={enquiry.id}
                        >
                          <div className="customer-enquiry-main">
                            <div className="customer-enquiry-vendor-icon">
                              {vendor?.category === "Photography"
                                ? "📸"
                                : vendor?.category === "Catering"
                                  ? "🍽️"
                                  : vendor?.category === "Decoration"
                                    ? "🌸"
                                    : vendor?.category === "DJ & Music"
                                      ? "🎵"
                                      : vendor?.category === "Makeup & Beauty"
                                        ? "💄"
                                        : "🏛️"}
                            </div>

                            <div className="customer-enquiry-info">
                              <div className="customer-enquiry-title-row">
                                <h3>{vendor?.business_name || "Milan Vendor"}</h3>
                                <span
                                  className={`customer-enquiry-status status-${status}`}
                                >
                                  {formatStatus(status)}
                                </span>
                              </div>

                              <p className="customer-enquiry-category">
                                {vendor?.category || "Wedding Service"}
                              </p>

                              <div className="customer-enquiry-meta">
                                <span>
                                  📅 Wedding: {formatWeddingDate(enquiry.wedding_date)}
                                </span>
                                <span>
                                  📍 {vendor?.area || vendor?.district || "Location"}
                                  {vendor?.district && vendor?.area
                                    ? `, ${vendor.district}`
                                    : ""}
                                </span>
                              </div>

                              {enquiry?.message && (
                                <p className="customer-enquiry-message">
                                  “{enquiry.message}”
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="customer-enquiry-actions">
                            <button
                              type="button"
                              onClick={() =>
                                vendor?.id && navigate(`/vendors/${vendor.id}`)
                              }
                              disabled={!vendor?.id}
                            >
                              View Vendor →
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside className="customer-dashboard-panel customer-saved-preview">
                <div className="customer-dashboard-panel-heading">
                  <div>
                    <p>YOUR SHORTLIST</p>
                    <h2>Saved Vendors</h2>
                  </div>
                </div>

                {savedVendors.length === 0 ? (
                  <div className="customer-dashboard-empty compact-empty">
                    <div>♡</div>
                    <h3>No saved vendors yet</h3>
                    <p>Save vendors you want to compare later.</p>
                  </div>
                ) : (
                  <div className="customer-saved-mini-list">
                    {savedVendors.slice(0, 3).map((item) => {
                      const vendor = item?.vendor;

                      return (
                        <button
                          type="button"
                          className="customer-saved-mini-card"
                          key={item?.saved_id || vendor?.id}
                          onClick={() =>
                            vendor?.id && navigate(`/vendors/${vendor.id}`)
                          }
                        >
                          <span className="customer-saved-mini-icon">♥</span>
                          <span className="customer-saved-mini-copy">
                            <strong>{vendor?.business_name || "Milan Vendor"}</strong>
                            <small>{vendor?.category || "Wedding Service"}</small>
                            <small>
                              {vendor?.district || vendor?.state || "India"}
                            </small>
                          </span>
                          <span className="customer-saved-mini-arrow">→</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  className="customer-dashboard-view-all"
                  onClick={() => navigate("/saved-vendors")}
                >
                  View All Saved Vendors
                </button>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default CustomerDashboard;
