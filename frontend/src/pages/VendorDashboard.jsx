import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VendorDashboard.css";

const API_URL = "http://127.0.0.1:8000";

function VendorDashboard() {
  const navigate = useNavigate();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // NEW: enquiry filter
  const [activeFilter, setActiveFilter] = useState("all");
  // Vendor notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const loadNotifications = async () => {
    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;

      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : []
      );
      setUnreadCount(Number(data.unread_count || 0));
    } catch (err) {
      console.error("Vendor notifications error:", err);
    }
  };

  const markNotificationRead = async (notification) => {
    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) return;

    if (!notification.is_read) {
      try {
        await fetch(
          `${API_URL}/notifications/${notification.id}/read`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (err) {
        console.error("Unable to mark notification as read:", err);
      }
    }

    setNotificationOpen(false);
    await loadNotifications();

    if (notification.notification_type === "new_enquiry") {
      navigate("/vendor-dashboard");
      return;
    }

    if (
      notification.notification_type === "verification_approved" ||
      notification.notification_type === "verification_rejected"
    ) {
      navigate("/vendor-verification");
    }
  };

  const markAllNotificationsRead = async () => {
    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) return;

    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      await loadNotifications();
    } catch (err) {
      console.error("Unable to mark all notifications as read:", err);
    }
  };



  // =====================================================
  // LOAD VENDOR ENQUIRIES
  // =====================================================

  useEffect(() => {
    const loadEnquiries = async () => {
      const token =
        localStorage.getItem("milan_token") ||
        sessionStorage.getItem("milan_token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/enquiries/vendor`,
          {
            method: "GET",

            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
            "Unable to load vendor enquiries."
          );
        }

        setEnquiries(data.enquiries || []);
      } catch (err) {
        setError(
          err.message ||
          "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEnquiries();
    loadNotifications();

    const notificationTimer = window.setInterval(
      loadNotifications,
      30000
    );

    return () => window.clearInterval(notificationTimer);
  }, [navigate]);


  // =====================================================
  // UPDATE ENQUIRY STATUS
  // =====================================================

  const updateEnquiryStatus = async (
    enquiryId,
    newStatus
  ) => {
    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/enquiries/${enquiryId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to update enquiry status."
        );
      }

      setEnquiries((previous) =>
        previous.map((item) =>
          item.id === enquiryId
            ? {
              ...item,
              status: data.enquiry.status,
            }
            : item
        )
      );
    } catch (err) {
      setError(
        err.message ||
        "Unable to update enquiry."
      );
    }
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="vendor-dashboard-message">
        Loading vendor dashboard...
      </div>
    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="vendor-dashboard-message">

        <h2>
          Unable to load dashboard
        </h2>

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </div>
    );
  }


  // =====================================================
  // COUNTS
  // =====================================================

  const pendingCount = enquiries.filter(
    (item) =>
      item.status?.toLowerCase() === "pending"
  ).length;

  const acceptedCount = enquiries.filter(
    (item) =>
      item.status?.toLowerCase() === "accepted"
  ).length;

  const rejectedCount = enquiries.filter(
    (item) =>
      item.status?.toLowerCase() === "rejected"
  ).length;


  // =====================================================
  // FILTER ENQUIRIES
  // =====================================================

  const filteredEnquiries = enquiries.filter(
    (enquiry) => {
      if (activeFilter === "all") {
        return true;
      }

      return (
        enquiry.status?.toLowerCase() ===
        activeFilter
      );
    }
  );


  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="vendor-dashboard-page">

      <div className="vendor-dashboard-shell">


        {/* ================= HEADER ================= */}

        <div className="vendor-dashboard-header">

          <div>

            <span className="vendor-dashboard-eyebrow">
              MILAN VENDOR
            </span>

            <h1>
              Vendor Dashboard
            </h1>

            <p>
              Manage customer enquiries and wedding leads.
            </p>

          </div>


          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="vendor-dashboard-home-btn"
              onClick={() => navigate("/vendor-verification")}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#ffffff",
                borderColor: "transparent",
              }}
            >
              ✓ Get Verified
            </button>

            <button
              type="button"
              className="vendor-dashboard-home-btn"
              onClick={() => navigate("/")}
            >
              ← Back to Home
            </button>
          </div>

        </div>


        {/* ================= STATS ================= */}

        <div className="vendor-dashboard-stats">

          <div className="vendor-stat-card">

            <span>
              Total Enquiries
            </span>

            <strong>
              {enquiries.length}
            </strong>

          </div>


          <div className="vendor-stat-card">

            <span>
              Pending
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>


          <div className="vendor-stat-card">

            <span>
              New Leads
            </span>

            <strong>
              {enquiries.length}
            </strong>

          </div>

        </div>


        {/* ================= ENQUIRIES ================= */}

        <div className="vendor-enquiries-section">

          <div className="vendor-section-heading">

            <div>

              <span>
                RECENT LEADS
              </span>

              <h2>
                Customer Enquiries
              </h2>

            </div>


            <p>
              {enquiries.length} received
            </p>

          </div>


          {/* =================================================
              FILTER BUTTONS
          ================================================= */}

          <div className="vendor-enquiry-filters">

            <button
              type="button"
              className={
                activeFilter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("all")
              }
            >
              All
              <span>{enquiries.length}</span>
            </button>


            <button
              type="button"
              className={
                activeFilter === "pending"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("pending")
              }
            >
              Pending
              <span>{pendingCount}</span>
            </button>


            <button
              type="button"
              className={
                activeFilter === "accepted"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("accepted")
              }
            >
              Accepted
              <span>{acceptedCount}</span>
            </button>


            <button
              type="button"
              className={
                activeFilter === "rejected"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("rejected")
              }
            >
              Rejected
              <span>{rejectedCount}</span>
            </button>

          </div>


          {/* ================= NO ENQUIRIES ================= */}

          {enquiries.length === 0 ? (

            <div className="vendor-empty-state">

              <div className="vendor-empty-icon">
                ♡
              </div>

              <h3>
                No enquiries yet
              </h3>

              <p>
                New customer enquiries will appear here.
              </p>

            </div>

          ) : filteredEnquiries.length === 0 ? (

            /* ================= NO FILTER RESULTS ================= */

            <div className="vendor-empty-state">

              <div className="vendor-empty-icon">
                ♡
              </div>

              <h3>
                No {activeFilter} enquiries
              </h3>

              <p>
                There are currently no enquiries
                in this category.
              </p>

            </div>

          ) : (

            /* ================= ENQUIRY CARDS ================= */

            <div className="vendor-enquiry-grid">

              {filteredEnquiries.map((enquiry) => (

                <article
                  key={enquiry.id}
                  className="vendor-enquiry-card"
                >


                  {/* CUSTOMER */}

                  <div className="vendor-enquiry-top">

                    <div className="vendor-customer-avatar">

                      {enquiry.customer_name
                        ?.charAt(0)
                        .toUpperCase() || "C"}

                    </div>


                    <div className="vendor-enquiry-customer">

                      <h3>
                        {enquiry.customer_name}
                      </h3>

                      <span>
                        Wedding Lead
                      </span>

                    </div>


                    <span
                      className={`vendor-status-badge status-${enquiry.status?.toLowerCase() || "pending"}`}
                    >
                      {enquiry.status || "pending"}
                    </span>

                  </div>


                  {/* DETAILS */}

                  <div className="vendor-enquiry-details">

                    <div>

                      <span className="vendor-detail-icon">
                        ☎
                      </span>

                      <p>

                        <small>
                          Phone
                        </small>

                        <strong>
                          {enquiry.phone}
                        </strong>

                      </p>

                    </div>


                    <div>

                      <span className="vendor-detail-icon">
                        📅
                      </span>

                      <p>

                        <small>
                          Wedding Date
                        </small>

                        <strong>
                          {enquiry.wedding_date ||
                            "Not provided"}
                        </strong>

                      </p>

                    </div>

                  </div>


                  {/* MESSAGE */}

                  <div className="vendor-enquiry-message">

                    <small>
                      Customer Message
                    </small>

                    <p>
                      {enquiry.message ||
                        "No message provided."}
                    </p>

                  </div>


                  {/* ================= ACCEPT / REJECT ================= */}

                  {enquiry.status?.toLowerCase() ===
                    "pending" && (

                      <div className="vendor-status-actions">

                        <button
                          type="button"
                          className="vendor-accept-btn"
                          onClick={() =>
                            updateEnquiryStatus(
                              enquiry.id,
                              "accepted"
                            )
                          }
                        >
                          ✓ Accept
                        </button>


                        <button
                          type="button"
                          className="vendor-reject-btn"
                          onClick={() =>
                            updateEnquiryStatus(
                              enquiry.id,
                              "rejected"
                            )
                          }
                        >
                          ✕ Reject
                        </button>

                      </div>

                    )}


                  {/* ================= ACTIONS ================= */}

                  <div className="vendor-enquiry-actions">

                    <button
                      type="button"
                      className="vendor-contact-btn"
                      onClick={() => {
                        window.location.href =
                          `tel:${enquiry.phone}`;
                      }}
                    >
                      ☎ Contact Customer
                    </button>


                    <button
                      type="button"
                      className="vendor-view-btn"
                    >
                      View Details
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default VendorDashboard;