import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavedVendorsPage.css";

const API_URL = "http://127.0.0.1:8000";

const getMilanToken = () =>
  localStorage.getItem("milan_token") ||
  sessionStorage.getItem("milan_token");

function SavedVendorsPage() {
  const navigate = useNavigate();

  const [savedVendors, setSavedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingIds, setRemovingIds] = useState([]);

  const loadSavedVendors = async () => {
    const token = getMilanToken();

    if (!token) {
      setSavedVendors([]);
      setError("Please login with your customer account to view saved vendors.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/saved-vendors`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your login session has expired. Please login again.");
        }

        if (response.status === 403) {
          throw new Error("Saved Vendors is available for customer accounts only.");
        }

        throw new Error(data.detail || "Unable to load saved vendors.");
      }

      setSavedVendors(
        Array.isArray(data.vendors)
          ? data.vendors
          : []
      );
    } catch (err) {
      console.error("Unable to load saved vendors:", err);
      setSavedVendors([]);
      setError(err.message || "Unable to load saved vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedVendors();
  }, []);

  const removeSavedVendor = async (vendorId) => {
    const token = getMilanToken();
    const numericVendorId = Number(vendorId);

    if (!token || !numericVendorId) {
      setError("Please login again to update saved vendors.");
      return;
    }

    try {
      setRemovingIds((current) =>
        current.includes(numericVendorId)
          ? current
          : [...current, numericVendorId]
      );

      const response = await fetch(
        `${API_URL}/saved-vendors/${numericVendorId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Unable to remove saved vendor.");
      }

      setSavedVendors((current) =>
        current.filter(
          (item) => Number(item?.vendor?.id) !== numericVendorId
        )
      );
    } catch (err) {
      console.error("Unable to remove saved vendor:", err);
      setError(err.message || "Unable to remove saved vendor.");
    } finally {
      setRemovingIds((current) =>
        current.filter((id) => id !== numericVendorId)
      );
    }
  };

  return (
    <div className="saved-vendors-page">
      <header className="saved-vendors-topbar">
        <button
          type="button"
          className="saved-back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

        <div className="saved-brand">
          <span className="saved-brand-heart">♥</span>
          <span>Milan</span>
        </div>
      </header>

      <main className="saved-vendors-shell">
        <section className="saved-vendors-hero">
          <span className="saved-vendors-eyebrow">YOUR SHORTLIST</span>
          <h1>Saved Wedding Vendors</h1>
          <p>
            Keep your favourite wedding professionals in one place and return
            whenever you are ready to plan the next step.
          </p>
        </section>

        {loading && (
          <div className="saved-state-card">
            <div className="saved-state-icon">♥</div>
            <h2>Loading your saved vendors...</h2>
          </div>
        )}

        {!loading && error && (
          <div className="saved-state-card saved-error-card">
            <div className="saved-state-icon">!</div>
            <h2>Unable to show saved vendors</h2>
            <p>{error}</p>
            <button type="button" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        )}

        {!loading && !error && savedVendors.length === 0 && (
          <div className="saved-state-card">
            <div className="saved-state-icon">♡</div>
            <h2>No saved vendors yet</h2>
            <p>
              Explore Milan vendors and tap the Save button on the ones you love.
            </p>
            <button type="button" onClick={() => navigate("/")}>
              Explore Vendors
            </button>
          </div>
        )}

        {!loading && !error && savedVendors.length > 0 && (
          <>
            <div className="saved-vendors-summary">
              <div>
                <strong>{savedVendors.length}</strong>
                <span>
                  {savedVendors.length === 1
                    ? "Saved Vendor"
                    : "Saved Vendors"}
                </span>
              </div>
              <p>Your wedding shortlist is ready whenever you are.</p>
            </div>

            <div className="saved-vendors-grid">
              {savedVendors.map((item) => {
                const vendor = item?.vendor || {};
                const vendorId = Number(vendor.id);
                const removing = removingIds.includes(vendorId);

                return (
                  <article className="saved-vendor-card" key={item.saved_id || vendorId}>
                    <div className="saved-vendor-card-top">
                      <div className="saved-vendor-icon">
                        {vendor.category === "Marriage Hall" && "🏰"}
                        {vendor.category === "Decoration" && "🌺"}
                        {vendor.category === "Photography" && "📸"}
                        {vendor.category === "Catering" && "🍽️"}
                        {vendor.category === "DJ & Music" && "🎵"}
                        {vendor.category === "Makeup & Beauty" && "💄"}
                        {[
                          "Marriage Hall",
                          "Decoration",
                          "Photography",
                          "Catering",
                          "DJ & Music",
                          "Makeup & Beauty",
                        ].includes(vendor.category) === false && "💍"}
                      </div>

                      <div className="saved-vendor-title">
                        <span className="saved-vendor-category">
                          {vendor.category || "Wedding Vendor"}
                        </span>

                        <h2>
                          {vendor.business_name || "Milan Vendor"}

                          {vendor.is_verified && (
                            <span
                              className="saved-vendor-name-verified"
                              title="Verified by Milan"
                              aria-label="Verified by Milan"
                            >
                              ✓
                            </span>
                          )}
                        </h2>
                      </div>

                      {vendor.is_verified && (
                        <span className="saved-vendor-status verified">
                          ✓ Verified by Milan
                        </span>
                      )}
                    </div>

                    <div className="saved-vendor-location">
                      <span>📍</span>
                      <div>
                        <small>Serving Location</small>
                        <strong>
                          {vendor.area ? `${vendor.area}, ` : ""}
                          {vendor.district ? `${vendor.district}, ` : ""}
                          {vendor.state || ""}
                        </strong>
                      </div>
                    </div>

                    {vendor.description && (
                      <p className="saved-vendor-description">
                        {vendor.description}
                      </p>
                    )}

                    <div className="saved-vendor-actions">
                      <button
                        type="button"
                        className="saved-view-button"
                        onClick={() => navigate(`/vendors/${vendorId}`)}
                      >
                        View Details <span>→</span>
                      </button>

                      <button
                        type="button"
                        className="saved-remove-button"
                        disabled={removing}
                        onClick={() => removeSavedVendor(vendorId)}
                      >
                        {removing ? "Removing..." : "♥ Remove Saved"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default SavedVendorsPage;
