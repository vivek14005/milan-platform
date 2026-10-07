import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./VendorPackagesPage.css";


const API_URL = "/api";


const emptyForm = {
  name: "",
  price: "",
  description: "",
  features: "",
  is_active: true,
};


const getMilanToken = () =>
  localStorage.getItem("milan_token") ||
  sessionStorage.getItem("milan_token");


function VendorPackagesPage() {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // =======================================================
  // LOAD VENDOR PACKAGES
  // =======================================================

  const loadPackages = async () => {
    const token = getMilanToken();

    if (!token) {
      setError("Please login with your vendor account.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/vendor-packages/me`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your login session has expired. Please login again."
          );
        }

        if (response.status === 404) {
          throw new Error(
            "Please create your vendor profile before adding packages."
          );
        }

        throw new Error(
          data.detail ||
          "Unable to load your packages."
        );
      }

      setPackages(
        Array.isArray(data.packages)
          ? data.packages
          : []
      );
    } catch (err) {
      console.error(
        "Unable to load vendor packages:",
        err
      );

      setPackages([]);
      setError(
        err.message ||
        "Unable to load your packages."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadPackages();
  }, []);


  // =======================================================
  // FORM CHANGE
  // =======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox"
        ? checked
        : value,
    }));

    setError("");
    setSuccess("");
  };


  // =======================================================
  // RESET FORM
  // =======================================================

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setError("");
  };


  // =======================================================
  // CREATE OR UPDATE PACKAGE
  // =======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getMilanToken();

    if (!token) {
      setError(
        "Please login again before saving a package."
      );
      return;
    }

    const packageName = formData.name.trim();
    const packagePrice = Number(formData.price);

    if (packageName.length < 2) {
      setError(
        "Package name must be at least 2 characters."
      );
      return;
    }

    if (
      formData.price === "" ||
      Number.isNaN(packagePrice) ||
      packagePrice < 0
    ) {
      setError(
        "Please enter a valid package price."
      );
      return;
    }

    const features = formData.features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    if (features.length > 20) {
      setError(
        "A package can contain up to 20 features."
      );
      return;
    }

    const requestBody = {
      name: packageName,
      price: packagePrice,

      description:
        formData.description.trim() || null,

      features,
      is_active: formData.is_active,
    };

    const isEditing = Boolean(editingId);

    const requestUrl = isEditing
      ? `${API_URL}/vendor-packages/${editingId}`
      : `${API_URL}/vendor-packages`;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        requestUrl,
        {
          method: isEditing
            ? "PUT"
            : "POST",

          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(requestBody),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to save package."
        );
      }

      setSuccess(
        isEditing
          ? "Package updated successfully."
          : "Package created successfully."
      );

      resetForm();
      await loadPackages();
    } catch (err) {
      console.error(
        "Unable to save package:",
        err
      );

      setError(
        err.message ||
        "Unable to save package."
      );
    } finally {
      setSaving(false);
    }
  };


  // =======================================================
  // EDIT PACKAGE
  // =======================================================

  const startEditing = (vendorPackage) => {
    setEditingId(vendorPackage.id);

    setFormData({
      name: vendorPackage.name || "",

      price:
        vendorPackage.price === null ||
          vendorPackage.price === undefined
          ? ""
          : String(vendorPackage.price),

      description:
        vendorPackage.description || "",

      features: Array.isArray(
        vendorPackage.features
      )
        ? vendorPackage.features.join("\n")
        : "",

      is_active:
        vendorPackage.is_active !== false,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // =======================================================
  // ACTIVE / INACTIVE
  // =======================================================

  const togglePackageStatus = async (
    vendorPackage
  ) => {
    const token = getMilanToken();

    if (!token) {
      setError("Please login again.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/vendor-packages/${vendorPackage.id}`,
        {
          method: "PUT",

          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            is_active: !vendorPackage.is_active,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to update package status."
        );
      }

      setSuccess(
        vendorPackage.is_active
          ? "Package hidden from customers."
          : "Package is now visible to customers."
      );

      await loadPackages();
    } catch (err) {
      setError(
        err.message ||
        "Unable to update package status."
      );
    }
  };


  // =======================================================
  // DELETE PACKAGE
  // =======================================================

  const deletePackage = async (
    packageId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this package?"
    );

    if (!confirmed) return;

    const token = getMilanToken();

    if (!token) {
      setError("Please login again.");
      return;
    }

    try {
      setDeletingId(packageId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/vendor-packages/${packageId}`,
        {
          method: "DELETE",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to delete package."
        );
      }

      if (editingId === packageId) {
        resetForm();
      }

      setSuccess(
        "Package deleted successfully."
      );

      await loadPackages();
    } catch (err) {
      setError(
        err.message ||
        "Unable to delete package."
      );
    } finally {
      setDeletingId(null);
    }
  };


  // =======================================================
  // PAGE
  // =======================================================

  return (
    <div className="vendor-packages-page">

      <header className="vendor-packages-topbar">
        <button
          type="button"
          className="vendor-packages-logo"
          onClick={() => navigate("/")}
        >
          Milan<span>•</span>
        </button>

        <div className="vendor-packages-nav">
          <button
            type="button"
            onClick={() =>
              navigate("/vendor-dashboard")
            }
          >
            Dashboard
          </button>

          <button
            type="button"
            className="active"
          >
            My Packages
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </header>


      <main className="vendor-packages-main">

        <section className="vendor-packages-heading">
          <p>YOUR SERVICES & PRICING</p>

          <h1>
            Create packages couples
            <em> can understand.</em>
          </h1>

          <span>
            Add clear pricing and service details so
            customers can choose the right package before
            sending an enquiry.
          </span>
        </section>


        <div className="vendor-packages-layout">

          {/* FORM */}

          <section className="vendor-package-form-card">
            <div className="vendor-package-form-heading">
              <span>
                {editingId
                  ? "EDIT PACKAGE"
                  : "NEW PACKAGE"}
              </span>

              <h2>
                {editingId
                  ? "Update Package"
                  : "Build Your Package"}
              </h2>

              <p>
                You can create up to four packages.
              </p>
            </div>


            {error && (
              <div className="vendor-package-message error">
                {error}
              </div>
            )}

            {success && (
              <div className="vendor-package-message success">
                {success}
              </div>
            )}


            <form onSubmit={handleSubmit}>

              <label>
                Package Name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Example: Classic Wedding Package"
                  maxLength={100}
                  required
                />
              </label>


              <label>
                Package Price
                <div className="vendor-package-price-input">
                  <span>₹</span>

                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="35000"
                    min="0"
                    max="100000000"
                    required
                  />
                </div>
              </label>


              <label>
                Package Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what makes this package suitable for couples..."
                  rows="4"
                  maxLength={2000}
                />
              </label>


              <label>
                Included Services
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  placeholder={
                    "Enter one service per line\nExample:\nFull wedding day service\nBasic decoration setup\nProfessional team"
                  }
                  rows="7"
                />

                <small>
                  Add one feature on each line.
                </small>
              </label>


              <label className="vendor-package-active-field">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />

                <span>
                  <strong>
                    Visible to customers
                  </strong>

                  <small>
                    Customers can select this package
                    while sending an enquiry.
                  </small>
                </span>
              </label>


              <div className="vendor-package-form-actions">
                <button
                  type="submit"
                  className="vendor-package-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Package"
                      : "Create Package"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="vendor-package-cancel"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                )}
              </div>

            </form>
          </section>


          {/* PACKAGE LIST */}

          <section className="vendor-package-list-section">

            <div className="vendor-package-list-heading">
              <div>
                <span>YOUR PACKAGES</span>
                <h2>Service Collection</h2>
              </div>

              <strong>
                {packages.length}/4
              </strong>
            </div>


            {loading && (
              <div className="vendor-package-state">
                Loading your packages...
              </div>
            )}


            {!loading &&
              !error &&
              packages.length === 0 && (
                <div className="vendor-package-empty">
                  <div>₹</div>

                  <h3>
                    No packages created yet
                  </h3>

                  <p>
                    Create your first package to show
                    customers your services and starting
                    price.
                  </p>
                </div>
              )}


            {!loading &&
              packages.length > 0 && (
                <div className="vendor-package-grid">

                  {packages.map(
                    (vendorPackage) => (
                      <article
                        className={`vendor-package-card ${vendorPackage.is_active
                            ? ""
                            : "inactive"
                          }`}
                        key={vendorPackage.id}
                      >

                        <div className="vendor-package-card-top">
                          <span>
                            {vendorPackage.is_active
                              ? "AVAILABLE"
                              : "HIDDEN"}
                          </span>

                          <strong>
                            ₹
                            {Number(
                              vendorPackage.price || 0
                            ).toLocaleString("en-IN")}
                          </strong>
                        </div>


                        <h3>
                          {vendorPackage.name}
                        </h3>


                        {vendorPackage.description && (
                          <p className="vendor-package-description">
                            {vendorPackage.description}
                          </p>
                        )}


                        {Array.isArray(
                          vendorPackage.features
                        ) &&
                          vendorPackage.features.length > 0 && (
                            <ul>
                              {vendorPackage.features.map(
                                (feature, index) => (
                                  <li
                                    key={`${vendorPackage.id}-${index}`}
                                  >
                                    <span>✓</span>
                                    {feature}
                                  </li>
                                )
                              )}
                            </ul>
                          )}


                        <div className="vendor-package-card-actions">

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                vendorPackage
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              togglePackageStatus(
                                vendorPackage
                              )
                            }
                          >
                            {vendorPackage.is_active
                              ? "Hide"
                              : "Show"}
                          </button>

                          <button
                            type="button"
                            className="delete"
                            disabled={
                              deletingId ===
                              vendorPackage.id
                            }
                            onClick={() =>
                              deletePackage(
                                vendorPackage.id
                              )
                            }
                          >
                            {deletingId ===
                              vendorPackage.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

          </section>

        </div>

      </main>

    </div>
  );
}


export default VendorPackagesPage;