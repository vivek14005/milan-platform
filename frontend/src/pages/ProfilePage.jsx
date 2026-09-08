import MilanLoveLetter from "./MilanLoveLetter";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

const API_URL = "http://127.0.0.1:8000";

function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    state: "",
    district: "",
    area: "",
    pincode: "",
  });

  const getToken = () =>
    localStorage.getItem("milan_token") ||
    sessionStorage.getItem("milan_token");

  const getStorage = () =>
    localStorage.getItem("milan_token")
      ? localStorage
      : sessionStorage;

  const loadProfile = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load profile."
        );
      }

      setUser(data);

      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        state: data.state || "",
        district: data.district || "",
        area: data.area || "",
        pincode: data.pincode || "",
      });

      getStorage().setItem(
        "milan_user",
        JSON.stringify(data)
      );
    } catch (err) {
      setError(
        err.message || "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      setError("Please login again.");
      return;
    }

    if (!formData.full_name.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone.trim())) {
      setError(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    if (
      formData.pincode.trim() &&
      !/^\d{6}$/.test(formData.pincode.trim())
    ) {
      setError(
        "PIN code must be a valid 6-digit number."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            state: formData.state.trim(),
            district: formData.district.trim(),
            area: formData.area.trim(),
            pincode: formData.pincode.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          "Unable to update profile."
        );
      }

      setUser(data.user);

      getStorage().setItem(
        "milan_user",
        JSON.stringify(data.user)
      );

      setSuccess(
        "Profile updated successfully!"
      );
    } catch (err) {
      setError(
        err.message ||
        "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;

    setFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      address: user.address || "",
      state: user.state || "",
      district: user.district || "",
      area: user.area || "",
      pincode: user.pincode || "",
    });

    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="premium-profile-page">
        <div className="profile-loading-card">
          Loading your Milan profile...
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="login-required">

        <div className="login-required-card">

          <h2>Please login first</h2>

          <p>
            Login to access your Milan profile.
          </p>

          <button
            type="button"
            className="back-home-btn"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

        </div>

      </div>
    );
  }
  const displayName =
    user.full_name || "Milan User";
  const profileFields = [
    formData.full_name,
    formData.phone,
    formData.address,
    formData.state,
    formData.district,
    formData.area,
    formData.pincode,
  ];

  const completedFields = profileFields.filter(
    (field) =>
      field &&
      field.toString().trim() !== ""
  ).length;

  const profileCompletion = Math.round(
    (completedFields / profileFields.length) * 100
  );

  return (
    <div className="premium-profile-page">

      <header className="premium-profile-header">

        <div>
          <span className="profile-eyebrow">
            MY ACCOUNT
          </span>

          <h1>
            Profile Information
          </h1>

          <p>
            View and update your personal details.
          </p>
        </div>

        <button
          type="button"
          className="profile-home-btn"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </header>


      <div className="premium-profile-layout">

        {/* LEFT SIDE */}

        <aside className="premium-profile-sidebar">
          <MilanLoveLetter userName={formData.full_name} />

          <h2>
            {displayName}
          </h2>

          <p className="profile-sidebar-email">
            {user.email}
          </p>

          <span className="profile-customer-badge">
            {user.role === "vendor"
              ? "Vendor"
              : "Customer"}
          </span>
          <div className="profile-user-id-box">
            <span>User ID</span>

            <strong>
              {user.user_id}
            </strong>
          </div>


          {/* PROFILE COMPLETION */}

          <div className="profile-completion-card">

            <div className="profile-completion-top">

              <span>
                Profile Completion
              </span>

              <strong>
                {profileCompletion}%
              </strong>

            </div>


            <div className="profile-completion-track">

              <div
                className="profile-completion-fill"
                style={{
                  width: `${profileCompletion}%`,
                }}
              />

            </div>


            <p>
              {profileCompletion === 100
                ? "Your profile is complete. You're all set with Milan ♡"
                : profileCompletion >= 70
                  ? "Almost there — complete a few more details."
                  : "Add a few more details to complete your profile."}
            </p>

          </div>

        </aside>


        {/* RIGHT SIDE */}

        <main className="premium-profile-main">

          <form
            className="premium-profile-form"
            onSubmit={handleSave}
          >

            <div className="profile-form-grid">

              {/* FULL NAME */}

              <div className="premium-field">

                <label>
                  Full Name
                </label>

                <div className="premium-input-wrap">

                  <span>
                    ♙
                  </span>

                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div className="premium-field">

                <label>
                  Email Address
                </label>

                <div className="premium-input-wrap disabled">

                  <span>
                    ✉
                  </span>

                  <input
                    type="email"
                    value={user.email}
                    disabled
                  />

                </div>

                <small>
                  Email cannot be changed right now.
                </small>

              </div>


              {/* PHONE */}

              <div className="premium-field">

                <label>
                  Phone Number
                </label>

                <div className="premium-input-wrap">

                  <span>
                    ☎
                  </span>

                  <input
                    type="tel"
                    name="phone"
                    maxLength="10"
                    value={formData.phone}
                    onChange={handleChange}

                  />

                </div>

              </div>


              {/* ADDRESS */}

              <div className="premium-field premium-field-full">

                <label>
                  Address
                </label>

                <div className="premium-input-wrap">

                  <span>
                    📍
                  </span>

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House number, street, landmark"

                  />

                </div>

              </div>


              {/* STATE */}

              <div className="premium-field">

                <label>
                  State
                </label>

                <div className="premium-input-wrap">

                  <span>
                    ▣
                  </span>

                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}

                  />

                </div>

              </div>


              {/* DISTRICT */}

              <div className="premium-field">

                <label>
                  District / City
                </label>

                <div className="premium-input-wrap">

                  <span>
                    ▦
                  </span>

                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}

                  />

                </div>

              </div>


              {/* AREA */}

              <div className="premium-field">

                <label>
                  Area / Locality
                </label>

                <div className="premium-input-wrap">

                  <span>
                    ◫
                  </span>

                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}

                  />

                </div>

              </div>


              {/* PIN */}

              <div className="premium-field">

                <label>
                  PIN Code
                </label>

                <div className="premium-input-wrap">

                  <span>
                    ⌖
                  </span>

                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    maxLength="6"

                  />

                </div>

              </div>

            </div>


            <div className="profile-form-footer">

              <button
                type="button"
                className="profile-cancel-premium"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save-premium"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "▣ Save Changes"}
              </button>

            </div>

          </form>


          {error && (
            <div className="profile-alert error">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="profile-alert success">

              <div className="profile-alert-icon">
                ✓
              </div>

              <div>
                <strong>
                  Profile updated successfully!
                </strong>

                <span>
                  Your changes have been saved.
                </span>
              </div>

            </div>
          )}

        </main>

      </div>

    </div >
  );
}

export default ProfilePage;