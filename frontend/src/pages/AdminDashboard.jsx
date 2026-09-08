import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_URL = "http://127.0.0.1:8000";

const getToken = () =>
  localStorage.getItem("milan_token") ||
  sessionStorage.getItem("milan_token");

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const documentLabels = {
  identity_proof: "Identity Proof",
  self_photo: "Vendor Self Photo",
  gst_certificate: "GST Certificate",
  electricity_bill: "Electricity Bill",
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [adminProfile, setAdminProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    total_requests: 0,
    pending: 0,
    approved_total: 0,
    rejected_total: 0,
    approved_today: 0,
    rejected_today: 0,
    reviewed_today: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const loadNotifications = async () => {
    const token = getToken();
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
      console.error("Admin notifications error:", err);
    }
  };

  const markNotificationRead = async (notification) => {
    const token = getToken();
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

    if (
      notification.notification_type === "verification_submitted" &&
      notification.verification_id
    ) {
      setStatusFilter("pending");
      await loadRequests("pending");
      await openRequest(notification.verification_id);
    }
  };

  const markAllNotificationsRead = async () => {
    const token = getToken();
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

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    state: "",
    district: "",
    area: "",
    pincode: "",
  });

  const openEditProfile = () => {
    setProfileForm({
      full_name: adminProfile?.full_name || "",
      phone: adminProfile?.phone || "",
      address: adminProfile?.address || "",
      state: adminProfile?.state || "",
      district: adminProfile?.district || "",
      area: adminProfile?.area || "",
      pincode: adminProfile?.pincode || "",
    });
    setError("");
    setActionMessage("");
    setEditProfileOpen(true);
  };

  const saveAdminProfile = async () => {
    const token = getToken();

    if (!token) {
      setError("Admin session not found. Please login again.");
      return;
    }

    if (!profileForm.full_name.trim()) {
      setError("Admin name is required.");
      return;
    }

    if (!profileForm.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      setProfileSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profileForm.full_name.trim(),
          phone: profileForm.phone.trim(),
          address: profileForm.address.trim() || null,
          state: profileForm.state.trim() || null,
          district: profileForm.district.trim() || null,
          area: profileForm.area.trim() || null,
          pincode: profileForm.pincode.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Unable to update admin profile.");
      }

      setAdminProfile(data.admin || data);
      setEditProfileOpen(false);
      setActionMessage("Admin profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update admin profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const loadAdminDashboard = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const [profileResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/admin/profile`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/admin/dashboard-stats`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const profileData = await profileResponse.json().catch(() => ({}));
      const statsData = await statsResponse.json().catch(() => ({}));

      if (profileResponse.ok) {
        setAdminProfile(profileData.admin || profileData);
      }

      if (statsResponse.ok) {
        setDashboardStats((current) => ({
          ...current,
          ...(statsData.stats || {}),
        }));
        setRecentActivity(
          Array.isArray(statsData.recent_activity)
            ? statsData.recent_activity
            : []
        );
      }
    } catch (err) {
      console.error("Admin dashboard summary error:", err);
    }
  };

  const loadRequests = async (status = statusFilter) => {
    const token = getToken();

    if (!token) {
      setError("Admin session not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const query =
        status === "all"
          ? ""
          : `?status=${encodeURIComponent(status)}`;

      const response = await fetch(
        `${API_URL}/admin/verifications${query}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your admin session has expired. Please login again.");
        }

        if (response.status === 403) {
          throw new Error("Admin access required.");
        }

        throw new Error(
          data.detail || "Unable to load verification requests."
        );
      }

      setRequests(
        Array.isArray(data.verifications)
          ? data.verifications
          : Array.isArray(data.items)
            ? data.items
            : []
      );
    } catch (err) {
      console.error("Admin verification list error:", err);
      setRequests([]);
      setError(err.message || "Unable to load verification requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    loadAdminDashboard();
    loadNotifications();

    const notificationTimer = window.setInterval(
      loadNotifications,
      30000
    );

    return () => window.clearInterval(notificationTimer);
  }, []);

  const visibleRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    const matchesDate = (item) => {
      if (dateFilter === "all") return true;
      const rawDate = item?.submitted_at || item?.created_at;
      if (!rawDate) return false;

      const submitted = new Date(rawDate);
      if (Number.isNaN(submitted.getTime())) return false;

      if (dateFilter === "today") {
        return submitted.toDateString() === now.toDateString();
      }

      const diffDays = (now.getTime() - submitted.getTime()) / 86400000;
      if (dateFilter === "7days") return diffDays >= 0 && diffDays <= 7;
      if (dateFilter === "30days") return diffDays >= 0 && diffDays <= 30;
      return true;
    };

    return requests
      .filter((item) => {
        const vendor = item?.vendor || {};
        if (!query) return true;

        const searchable = [
          vendor.business_name,
          vendor.category,
          vendor.full_name,
          vendor.owner_name,
          vendor.phone,
          vendor.email,
          vendor.area,
          vendor.district,
          vendor.state,
          item?.gst_number,
          item?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .filter(matchesDate)
      .sort((a, b) => {
        const aTime = new Date(a?.submitted_at || a?.created_at || 0).getTime();
        const bTime = new Date(b?.submitted_at || b?.created_at || 0).getTime();
        return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [requests, searchQuery, dateFilter, sortOrder]);

  const clearQueueFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setSortOrder("newest");
  };

  const openRequest = async (verificationId) => {
    const token = getToken();

    if (!token) {
      setError("Admin session not found. Please login again.");
      return;
    }

    try {
      setDetailLoading(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/admin/verifications/${verificationId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load verification details."
        );
      }

      setSelectedRequest(data.verification || data);
    } catch (err) {
      console.error("Admin verification detail error:", err);
      setError(err.message || "Unable to load verification details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const approveRequest = async () => {
    if (!selectedRequest?.id) return;

    const token = getToken();

    try {
      setActionLoading(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/admin/verifications/${selectedRequest.id}/approve`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to approve this verification."
        );
      }

      setSelectedRequest(data.verification || selectedRequest);
      setActionMessage("Vendor verification approved successfully.");
      await loadRequests(statusFilter);
      await loadAdminDashboard();
    } catch (err) {
      setError(err.message || "Unable to approve this verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest?.id) return;

    const cleanReason = rejectReason.trim();

    if (!cleanReason) {
      setError("Please enter a rejection reason.");
      return;
    }

    const token = getToken();

    try {
      setActionLoading(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/admin/verifications/${selectedRequest.id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            admin_note: cleanReason,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to reject this verification."
        );
      }

      setSelectedRequest(data.verification || selectedRequest);
      setRejectOpen(false);
      setRejectReason("");
      setActionMessage("Vendor verification rejected.");
      await loadRequests(statusFilter);
      await loadAdminDashboard();
    } catch (err) {
      setError(err.message || "Unable to reject this verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    return requests.reduce(
      (acc, item) => {
        const status = item?.status || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {}
    );
  }, [requests]);

  return (
    <div className="admin-dashboard-page">
      <header className="admin-topbar admin-topbar-redesign">
        <div className="admin-brand">
          <span className="admin-brand-mark">M</span>
          <div>
            <strong>Milan</strong>
            <span>Administration Suite</span>
          </div>
        </div>

        <div className="admin-topbar-center">
          <span className="admin-live-dot"></span>
          <span>Trust & Safety Center</span>
        </div>

        <div className="admin-topbar-actions">
          <div className="milan-notification-wrap">
            <button
              type="button"
              className="milan-notification-bell admin-notification-bell"
              onClick={() => setNotificationOpen((current) => !current)}
              aria-label="Admin notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="milan-notification-count">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="milan-notification-dropdown admin-notification-dropdown">
                <div className="milan-notification-head">
                  <div>
                    <strong>Admin Notifications</strong>
                    <span>{unreadCount} unread</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="milan-notification-list">
                  {notifications.length === 0 ? (
                    <div className="milan-notification-empty">
                      <span>🛡️</span>
                      <strong>No notifications yet</strong>
                      <p>New vendor verification requests will appear here.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 12).map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className={`milan-notification-item ${notification.is_read ? "" : "unread"
                          }`}
                        onClick={() => markNotificationRead(notification)}
                      >
                        <span className="milan-notification-item-icon">🛡️</span>
                        <span className="milan-notification-copy">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <small>
                            {notification.created_at
                              ? new Date(notification.created_at).toLocaleString("en-IN")
                              : ""}
                          </small>
                        </span>
                        {!notification.is_read && (
                          <span className="milan-notification-unread-dot"></span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="admin-back-btn admin-logout-redesign"
            onClick={() => {
              localStorage.removeItem("milan_token");
              localStorage.removeItem("milan_token_type");
              localStorage.removeItem("milan_user");
              sessionStorage.removeItem("milan_token");
              sessionStorage.removeItem("milan_token_type");
              sessionStorage.removeItem("milan_user");
              window.location.href = "/";
            }}
          >
            <span>↗</span> Logout
          </button>
        </div>
      </header>

      <main className="admin-shell">
        <section className="admin-overview admin-overview-redesign">
          <div className="admin-command-grid">
            <aside className="admin-identity-panel">
              <div className="admin-identity-top">
                <div className="admin-profile-avatar admin-profile-avatar-large">
                  {(adminProfile?.full_name || "A").charAt(0).toUpperCase()}
                </div>
                <span className="admin-role-chip">SUPER ADMIN</span>
              </div>

              <h2>{adminProfile?.full_name || "Milan Administrator"}</h2>
              <p className="admin-identity-email">
                {adminProfile?.email || "Admin email"}
              </p>

              <div className="admin-identity-divider"></div>

              <div className="admin-identity-data">
                <div>
                  <span>Phone</span>
                  <strong>{adminProfile?.phone || "Not added"}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>
                    {[
                      adminProfile?.area,
                      adminProfile?.district,
                      adminProfile?.state,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Not added"}
                  </strong>
                </div>
                <div>
                  <span>Address</span>
                  <strong>
                    {[adminProfile?.address, adminProfile?.pincode]
                      .filter(Boolean)
                      .join(" · ") || "Not added"}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="admin-edit-profile-btn admin-edit-profile-redesign"
                onClick={openEditProfile}
              >
                <span>✎</span> Edit Admin Profile
              </button>
            </aside>

            <div className="admin-command-main">
              <div className="admin-command-kicker">
                <span className="admin-live-dot"></span>
                ADMIN CONTROL CENTER
              </div>
              <h1>
                Good day,{" "}
                <em>{adminProfile?.full_name?.split(" ")[0] || "Admin"}.</em>
              </h1>
              <p>
                Keep Milan trusted. Review new partners, validate their
                documents and protect every couple's wedding journey.
              </p>

              <div className="admin-command-today">
                <div className="admin-command-today-title">
                  <span>TODAY'S PERFORMANCE</span>
                  <strong>{dashboardStats.reviewed_today} decisions made</strong>
                </div>
                <div className="admin-command-metrics">
                  <div>
                    <strong>{dashboardStats.approved_today}</strong>
                    <span>Approved</span>
                  </div>
                  <div>
                    <strong>{dashboardStats.rejected_today}</strong>
                    <span>Rejected</span>
                  </div>
                  <div>
                    <strong>{dashboardStats.pending}</strong>
                    <span>Awaiting Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-stat-grid">
            <article className="admin-stat-card">
              <div className="admin-stat-icon">◉</div>
              <div>
                <span>Total Requests</span>
                <strong>{dashboardStats.total_requests}</strong>
                <small>All verification applications</small>
              </div>
            </article>

            <article className="admin-stat-card pending">
              <div className="admin-stat-icon">⌛</div>
              <div>
                <span>Pending</span>
                <strong>{dashboardStats.pending}</strong>
                <small>Waiting for admin review</small>
              </div>
            </article>

            <article className="admin-stat-card approved">
              <div className="admin-stat-icon">✓</div>
              <div>
                <span>Approved</span>
                <strong>{dashboardStats.approved_total}</strong>
                <small>{dashboardStats.approved_today} approved today</small>
              </div>
            </article>

            <article className="admin-stat-card rejected">
              <div className="admin-stat-icon">✕</div>
              <div>
                <span>Rejected</span>
                <strong>{dashboardStats.rejected_total}</strong>
                <small>{dashboardStats.rejected_today} rejected today</small>
              </div>
            </article>
          </div>

          <section className="admin-activity-card">
            <div className="admin-activity-heading">
              <div>
                <span className="admin-eyebrow">RECENT ACTIVITY</span>
                <h2>Your latest verification decisions</h2>
              </div>
              <div className="admin-activity-count">
                {dashboardStats.reviewed_today} actions today
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <div className="admin-activity-empty">
                No tracked admin decisions yet. Your next approve or reject
                action will appear here.
              </div>
            ) : (
              <div className="admin-activity-list">
                {recentActivity.slice(0, 5).map((item) => (
                  <div className="admin-activity-item" key={`activity-${item.id}`}>
                    <div
                      className={`admin-activity-symbol ${item.status || ""}`}
                    >
                      {item.status === "approved" ? "✓" : "✕"}
                    </div>
                    <div className="admin-activity-info">
                      <strong>
                        {item.vendor?.business_name || "Wedding Vendor"}
                      </strong>
                      <span>
                        {item.status === "approved" ? "Approved" : "Rejected"} by{" "}
                        {item.reviewed_by_admin_name ||
                          adminProfile?.full_name ||
                          "Admin"}
                      </span>
                    </div>
                    <time>{formatDate(item.reviewed_at)}</time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="admin-verification-heading">
          <div>
            <span className="admin-eyebrow">VERIFICATION WORKSPACE</span>
            <h2>Partner Review Desk</h2>
            <p>Select an application, inspect its documents and make a final decision.</p>
          </div>
        </section>

        <section className="admin-filter-row">
          {["pending", "approved", "rejected", "all"].map((status) => (
            <button
              type="button"
              key={status}
              className={statusFilter === status ? "active" : ""}
              onClick={() => {
                setStatusFilter(status);
                setSelectedRequest(null);
                setActionMessage("");
                setError("");
              }}
            >
              {status === "pending" && "⏳ "}
              {status === "approved" && "✓ "}
              {status === "rejected" && "✕ "}
              {status === "all" && "◉ "}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </section>

        <section className="admin-queue-tools">
          <div className="admin-search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search vendor, category, city, phone..."
              aria-label="Search verification requests"
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="admin-queue-selects">
            <label>
              <span>Date</span>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
              </select>
            </label>

            <label>
              <span>Sort</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>

            {(searchQuery || dateFilter !== "all" || sortOrder !== "newest") && (
              <button
                type="button"
                className="admin-clear-filters"
                onClick={clearQueueFilters}
              >
                Clear
              </button>
            )}
          </div>

          <div className="admin-result-count">
            <strong>{visibleRequests.length}</strong>
            <span>
              {visibleRequests.length === 1 ? "application" : "applications"} shown
            </span>
          </div>
        </section>

        {actionMessage && (
          <div className="admin-feedback success">✓ {actionMessage}</div>
        )}

        {error && (
          <div className="admin-feedback error">⚠ {error}</div>
        )}

        <div className="admin-layout">
          <section className="admin-request-panel">
            <div className="admin-panel-heading">
              <div>
                <span>REQUEST QUEUE</span>
                <h2>Verification Applications</h2>
              </div>

              <button
                type="button"
                className="admin-refresh-btn"
                onClick={() => {
                  loadRequests(statusFilter);
                  loadAdminDashboard();
                }}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {loading && (
              <div className="admin-empty-state">
                <div>⌛</div>
                <h3>Loading verification requests...</h3>
              </div>
            )}

            {!loading && visibleRequests.length === 0 && (
              <div className="admin-empty-state">
                <div>{requests.length === 0 ? "✓" : "⌕"}</div>
                <h3>
                  {requests.length === 0
                    ? `No ${statusFilter === "all" ? "" : statusFilter} requests`
                    : "No matching applications"}
                </h3>
                <p>
                  {requests.length === 0
                    ? "There is nothing to review in this section right now."
                    : "Try changing the search, date filter or sort options."}
                </p>
                {requests.length > 0 && (
                  <button
                    type="button"
                    className="admin-empty-clear-btn"
                    onClick={clearQueueFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}

            {!loading && visibleRequests.length > 0 && (
              <div className="admin-request-list">
                {visibleRequests.map((item) => {
                  const vendor = item?.vendor || {};
                  const active =
                    Number(selectedRequest?.id) === Number(item?.id);

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`admin-request-card ${active ? "active" : ""}`}
                      onClick={() => openRequest(item.id)}
                    >
                      <div className="admin-request-card-top">
                        <div className="admin-vendor-avatar">
                          {(vendor.business_name || "M")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="admin-request-title">
                          <span>{vendor.category || "Wedding Vendor"}</span>
                          <h3>{vendor.business_name || "Unnamed Vendor"}</h3>
                        </div>

                        <span
                          className={`admin-status-pill ${item.status || ""}`}
                        >
                          {item.status || "unknown"}
                        </span>
                      </div>

                      <div className="admin-request-meta">
                        <span>
                          📍 {vendor.area || vendor.district || vendor.state || "Location unavailable"}
                        </span>
                        <span>
                          🕒 {formatDate(item.submitted_at)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="admin-detail-panel">
            {!selectedRequest && !detailLoading && (
              <div className="admin-detail-empty">
                <div className="admin-detail-empty-icon">🛡️</div>
                <h2>Select a verification request</h2>
                <p>
                  Choose an application from the left to review vendor
                  information and uploaded documents.
                </p>
              </div>
            )}

            {detailLoading && (
              <div className="admin-detail-empty">
                <div className="admin-detail-empty-icon">⌛</div>
                <h2>Loading application...</h2>
              </div>
            )}

            {selectedRequest && !detailLoading && (
              <div className="admin-verification-detail">
                <div className="admin-detail-header">
                  <div>
                    <span className="admin-eyebrow">APPLICATION DETAILS</span>
                    <h2>
                      {selectedRequest.vendor?.business_name || "Milan Vendor"}
                    </h2>
                    <p>
                      Submitted {formatDate(selectedRequest.submitted_at)}
                    </p>
                  </div>

                  <span
                    className={`admin-status-pill ${selectedRequest.status || ""}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>

                <div className="admin-info-grid">
                  <div className="admin-info-card">
                    <span>Owner</span>
                    <strong>
                      {selectedRequest.vendor?.owner_name || "—"}
                    </strong>
                    <small>
                      {selectedRequest.vendor?.owner_email || "—"}
                    </small>
                  </div>

                  <div className="admin-info-card">
                    <span>Business</span>
                    <strong>
                      {selectedRequest.vendor?.business_name || "—"}
                    </strong>
                    <small>
                      {selectedRequest.vendor?.category || "—"}
                    </small>
                  </div>

                  <div className="admin-info-card">
                    <span>Phone</span>
                    <strong>
                      {selectedRequest.vendor?.phone || "—"}
                    </strong>
                    <small>Vendor contact</small>
                  </div>

                  <div className="admin-info-card">
                    <span>Location</span>
                    <strong>
                      {selectedRequest.vendor?.district || "—"}
                    </strong>
                    <small>
                      {[
                        selectedRequest.vendor?.area,
                        selectedRequest.vendor?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </small>
                  </div>
                </div>

                <div className="admin-gst-box">
                  <div>
                    <span>GST STATUS</span>
                    <strong>
                      {selectedRequest.has_gst
                        ? "GST Registered"
                        : "No GST Registration"}
                    </strong>
                  </div>

                  <div>
                    <span>GST NUMBER</span>
                    <strong>
                      {selectedRequest.gst_number || "Not applicable"}
                    </strong>
                  </div>
                </div>

                <div className="admin-documents-section">
                  <div className="admin-section-heading">
                    <span>DOCUMENTS</span>
                    <h3>Uploaded Verification Files</h3>
                  </div>

                  <div className="admin-document-grid">
                    {(selectedRequest.documents || []).map((document) => {
                      const fileUrl = document.file_url?.startsWith("http")
                        ? document.file_url
                        : `${API_URL}${document.file_url}`;

                      return (
                        <article
                          className="admin-document-card"
                          key={document.id || document.document_type}
                        >
                          <div className="admin-document-icon">📄</div>

                          <div className="admin-document-copy">
                            <span>
                              {documentLabels[document.document_type] ||
                                document.document_type}
                            </span>
                            <strong>
                              {document.original_filename || "Uploaded file"}
                            </strong>
                          </div>

                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        </article>
                      );
                    })}
                  </div>

                  {(selectedRequest.documents || []).length === 0 && (
                    <div className="admin-no-documents">
                      No uploaded documents found.
                    </div>
                  )}
                </div>

                {selectedRequest.admin_note && (
                  <div className="admin-note-box">
                    <span>ADMIN NOTE</span>
                    <p>{selectedRequest.admin_note}</p>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div className="admin-action-bar">
                    <button
                      type="button"
                      className="admin-reject-btn"
                      onClick={() => {
                        setRejectOpen(true);
                        setError("");
                        setActionMessage("");
                      }}
                      disabled={actionLoading}
                    >
                      ✕ Reject
                    </button>

                    <button
                      type="button"
                      className="admin-approve-btn"
                      onClick={() => {
                        setApproveConfirmOpen(true);
                        setError("");
                        setActionMessage("");
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "✓ Approve Verification"}
                    </button>
                  </div>
                )}

                {selectedRequest.status === "approved" && (
                  <div className="admin-final-state approved">
                    ✓ This vendor is verified by Milan.
                  </div>
                )}

                {selectedRequest.status === "rejected" && (
                  <div className="admin-final-state rejected">
                    ✕ This verification request was rejected.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {editProfileOpen && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !profileSaving) {
              setEditProfileOpen(false);
            }
          }}
        >
          <div className="admin-reject-modal admin-profile-edit-modal">
            <span className="admin-eyebrow">ADMIN PROFILE</span>
            <h2>Edit Profile</h2>
            <p>Update your Milan admin contact and address details.</p>

            <div className="admin-profile-form-grid">
              <label>
                <span>Full Name *</span>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      full_name: event.target.value,
                    })
                  }
                  maxLength="100"
                />
              </label>

              <label>
                <span>Phone *</span>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      phone: event.target.value,
                    })
                  }
                  maxLength="20"
                />
              </label>

              <label className="admin-profile-form-wide">
                <span>Address</span>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      address: event.target.value,
                    })
                  }
                  maxLength="255"
                />
              </label>

              <label>
                <span>State</span>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      state: event.target.value,
                    })
                  }
                  maxLength="100"
                />
              </label>

              <label>
                <span>District</span>
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      district: event.target.value,
                    })
                  }
                  maxLength="100"
                />
              </label>

              <label>
                <span>Area</span>
                <input
                  type="text"
                  value={profileForm.area}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      area: event.target.value,
                    })
                  }
                  maxLength="150"
                />
              </label>

              <label>
                <span>Pincode</span>
                <input
                  type="text"
                  value={profileForm.pincode}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      pincode: event.target.value,
                    })
                  }
                  maxLength="10"
                />
              </label>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                disabled={profileSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-approve-btn"
                onClick={saveAdminProfile}
                disabled={profileSaving}
              >
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {approveConfirmOpen && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setApproveConfirmOpen(false);
            }
          }}
        >
          <div className="admin-reject-modal">
            <span className="admin-eyebrow">CONFIRM APPROVAL</span>
            <h2>Approve this vendor?</h2>
            <p>
              Are you sure you want to approve{" "}
              <strong>{selectedRequest?.vendor?.business_name || "this vendor"}</strong>?
              The vendor will receive Milan verified status.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setApproveConfirmOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-approve-btn"
                onClick={async () => {
                  await approveRequest();
                  setApproveConfirmOpen(false);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Approving..." : "Yes, Approve Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectConfirmOpen && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setRejectConfirmOpen(false);
            }
          }}
        >
          <div className="admin-reject-modal">
            <span className="admin-eyebrow">CONFIRM REJECTION</span>
            <h2>Reject this vendor?</h2>
            <p>
              Are you sure you want to reject{" "}
              <strong>{selectedRequest?.vendor?.business_name || "this vendor"}</strong>?
              Please confirm before the final action.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setRejectConfirmOpen(false);
                  setRejectOpen(true);
                }}
                disabled={actionLoading}
              >
                Back
              </button>

              <button
                type="button"
                className="danger"
                onClick={async () => {
                  await rejectRequest();
                  setRejectConfirmOpen(false);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Rejecting..." : "Yes, Reject Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setRejectOpen(false);
            }
          }}
        >
          <div className="admin-reject-modal">
            <span className="admin-eyebrow">REJECTION REASON</span>
            <h2>Reject Verification</h2>
            <p>
              Give the vendor a clear reason so they know what needs to be
              corrected.
            </p>

            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Example: Masked Aadhaar image is unclear. Please upload a readable document."
              rows="5"
              maxLength="500"
            />

            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (!rejectReason.trim()) {
                    setError("Please enter a rejection reason.");
                    return;
                  }
                  setRejectOpen(false);
                  setRejectConfirmOpen(true);
                }}
                disabled={actionLoading}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
