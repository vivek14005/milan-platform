import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavedVendorsPage.css";

const tokenFromStorage = () =>
  localStorage.getItem("milan_token") || sessionStorage.getItem("milan_token");

export default function SavedVendorsPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [removedAny, setRemovedAny] = useState(false);

  const goHome = () => {
    // Refresh the homepage's saved-heart state after removing a vendor.
    if (removedAny) window.location.assign("/");
    else navigate("/");
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const token = tokenFromStorage();
      if (!token) {
        setError("Please sign in to see your saved vendors.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/saved-vendors", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(response.status === 401
            ? "Your session has expired. Please sign in again."
            : data.detail || "Unable to load your saved vendors.");
        }
        setSaved(Array.isArray(data.vendors) ? data.vendors : []);
        setError("");
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const removeSaved = async (vendorId) => {
    const token = tokenFromStorage();
    if (!token || !vendorId) return;
    setRemoving(vendorId);
    setError("");
    try {
      const response = await fetch(`/api/saved-vendors/${vendorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not remove this vendor.");
      }
      setSaved((items) => items.filter((item) => Number(item?.vendor?.id) !== Number(vendorId)));
      setRemovedAny(true);
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="mi-saved-page">
      <header className="mi-saved-topbar">
        <button className="mi-saved-logo" type="button" onClick={goHome}>
          Milan<span>•</span>
        </button>
        <button className="mi-saved-back" type="button" onClick={goHome}>
          ← Back to home
        </button>
      </header>

      <main className="mi-saved-main">
        <div className="mi-saved-heading">
          <p className="mi-saved-kicker">YOUR MILAN SHORTLIST</p>
          <h1>Only the ones <em>you love.</em></h1>
          <p>All the wedding professionals you saved, together in one place.</p>
        </div>

        {error && <p className="mi-saved-error" role="alert">{error}</p>}

        {loading ? (
          <p className="mi-saved-loading" role="status">Gathering your favourites...</p>
        ) : saved.length === 0 ? (
          <section className="mi-saved-empty">
            <div className="mi-saved-heart" aria-hidden="true">♡</div>
            <p className="mi-saved-kicker">A BEAUTIFUL LIST BEGINS HERE</p>
            <h2>Your favourites are<br /><em>waiting to be found.</em></h2>
            <p>Explore wedding professionals and save the ones that feel right for your day.</p>
            <button type="button" onClick={goHome}>Explore wedding services <span>↗</span></button>
          </section>
        ) : (
          <>
            <div className="mi-saved-count">{saved.length} saved {saved.length === 1 ? "professional" : "professionals"}</div>
            <div className="mi-saved-grid">
              {saved.map((item) => {
                const vendor = item?.vendor || {};
                const location = [vendor.area, vendor.district, vendor.state].filter(Boolean).join(", ");
                return (
                  <article className="mi-saved-card" key={item?.saved_id || vendor.id}>
                    <div className="mi-saved-card-icon" aria-hidden="true">✦</div>
                    <p className="mi-saved-card-category">{vendor.category || "Wedding professional"}</p>
                    <h2>{vendor.business_name || "Milan Vendor"}</h2>
                    <p className="mi-saved-card-location">{location || "India"}</p>
                    <div className="mi-saved-card-actions">
                      <button type="button" onClick={() => vendor.id && navigate(`/vendors/${vendor.id}`)} disabled={!vendor.id}>
                        View vendor ↗
                      </button>
                      <button type="button" className="mi-saved-remove" disabled={removing === vendor.id || !vendor.id}
                        onClick={() => removeSaved(vendor.id)}>
                        {removing === vendor.id ? "Removing..." : "Remove"}
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
