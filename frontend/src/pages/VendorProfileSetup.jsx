import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const serviceCategories = [
  "Marriage Hall",
  "Catering",
  "Decoration",
  "Photography",
  "DJ & Music",
  "Makeup & Beauty",
];

function VendorProfileSetup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    business_name: "",
    category: "",
    phone: "",
    address: "",
    state: "",
    district: "",
    area: "",
    pincode: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [areaQuery, setAreaQuery] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState([]);

  const [statesLoading, setStatesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [areaLoading, setAreaLoading] = useState(false);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  // =====================================================
  // HANDLE NORMAL INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };


  // =====================================================
  // LOAD STATES
  // =====================================================

  const loadStates = async () => {
    if (states.length > 0) return;

    try {
      setStatesLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/locations/states`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load states."
        );
      }

      setStates(
        (data.states || []).filter(
          (item) =>
            item &&
            item.toUpperCase() !== "NA"
        )
      );
    } catch (err) {
      setError(
        err.message || "Unable to load states."
      );
    } finally {
      setStatesLoading(false);
    }
  };


  // =====================================================
  // STATE CHANGE -> LOAD DISTRICTS
  // =====================================================

  const handleStateChange = async (e) => {
    const selectedState = e.target.value;

    setFormData((previous) => ({
      ...previous,
      state: selectedState,
      district: "",
      area: "",
      pincode: "",
    }));

    setDistricts([]);
    setAreaQuery("");
    setAreaSuggestions([]);
    setShowAreaSuggestions(false);
    setError("");
    setSuccess("");

    if (!selectedState) return;

    try {
      setDistrictsLoading(true);

      const response = await fetch(
        `${API_URL}/locations/districts?state=${encodeURIComponent(
          selectedState
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load districts."
        );
      }

      setDistricts(data.districts || []);
    } catch (err) {
      setError(
        err.message ||
        "Unable to load districts for this state."
      );
    } finally {
      setDistrictsLoading(false);
    }
  };


  // =====================================================
  // DISTRICT CHANGE
  // =====================================================

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;

    setFormData((previous) => ({
      ...previous,
      district: selectedDistrict,
      area: "",
      pincode: "",
    }));

    setAreaQuery("");
    setAreaSuggestions([]);
    setShowAreaSuggestions(false);
    setError("");
    setSuccess("");
  };


  // =====================================================
  // SEARCH AREA INSIDE SELECTED STATE + DISTRICT
  // =====================================================

  const handleAreaSearch = async (e) => {
    const value = e.target.value;

    setAreaQuery(value);

    setFormData((previous) => ({
      ...previous,
      area: "",
      pincode: "",
    }));

    setError("");
    setSuccess("");

    if (!formData.state) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      setError("Please select your state first.");
      return;
    }

    if (!formData.district) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      setError("Please select your district / city first.");
      return;
    }

    if (value.trim().length < 2) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      return;
    }

    try {
      setAreaLoading(true);

      const response = await fetch(
        `${API_URL}/locations/search?q=${encodeURIComponent(
          value.trim()
        )}&state=${encodeURIComponent(
          formData.state
        )}&district=${encodeURIComponent(
          formData.district
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to search areas."
        );
      }

      setAreaSuggestions(
        Array.isArray(data.locations)
          ? data.locations
          : []
      );

      setShowAreaSuggestions(true);
    } catch (err) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      setError(
        err.message || "Unable to search areas."
      );
    } finally {
      setAreaLoading(false);
    }
  };


  // =====================================================
  // SELECT AREA -> AUTO-FILL PINCODE
  // =====================================================

  const handleAreaSelect = (location) => {
    setAreaQuery(location.area);

    setFormData((previous) => ({
      ...previous,
      state: location.state,
      district: location.district,
      area: location.area,
      pincode: location.pincode,
    }));

    setAreaSuggestions([]);
    setShowAreaSuggestions(false);
    setError("");
    setSuccess("");
  };


  // =====================================================
  // HANDLE SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) {
      setError(
        "Please login again before creating your vendor profile."
      );
      return;
    }


    // ===================================================
    // REQUIRED FIELD VALIDATION
    // ===================================================

    if (!formData.business_name.trim()) {
      setError(
        "Please enter your business name."
      );
      return;
    }

    if (!formData.category) {
      setError(
        "Please select the wedding service you provide."
      );
      return;
    }

    if (!formData.phone.trim()) {
      setError(
        "Please enter your business phone number."
      );
      return;
    }

    if (
      !formData.pincode.trim() ||
      !formData.state ||
      !formData.district ||
      !formData.area
    ) {
      setError(
        "Please select your state, district and area. Pincode will fill automatically."
      );
      return;
    }


    // ===================================================
    // PHONE VALIDATION
    // ===================================================

    const cleanPhone =
      formData.phone.trim();

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }


    // ===================================================
    // PINCODE VALIDATION
    // ===================================================

    const cleanPincode =
      formData.pincode.trim();

    if (
      !/^[1-9][0-9]{5}$/.test(cleanPincode)
    ) {
      setError(
        "Please enter a valid 6-digit Indian pincode."
      );
      return;
    }


    // ===================================================
    // CREATE VENDOR PROFILE
    // ===================================================

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/vendors`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            business_name:
              formData.business_name.trim(),

            category:
              formData.category,

            phone:
              cleanPhone,

            address:
              formData.address.trim() || null,

            state:
              formData.state.trim() || null,

            district:
              formData.district.trim() || null,

            area:
              formData.area.trim() || null,

            pincode:
              cleanPincode || null,

            description:
              formData.description.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let errorMessage =
          "Unable to create vendor profile.";

        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        }

        if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((item) => item.msg)
            .join(" ");
        }

        throw new Error(errorMessage);
      }


      // =================================================
      // SUCCESS
      // =================================================

      setSuccess(
        "Vendor profile created successfully!"
      );

      setTimeout(() => {
        navigate("/vendor-dashboard");
      }, 1000);

    } catch (err) {
      setError(
        err.message ||
        "Unable to create vendor profile."
      );
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "50px 20px",
        background:
          "linear-gradient(180deg, #fffafa 0%, #fff4f7 100%)",
      }}
    >

      {/* BACK TO HOME */}
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Back to Milan home page"
        style={{
          position: "fixed",
          top: "22px",
          right: "24px",
          zIndex: 100,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          minHeight: "38px",
          padding: "8px 14px",
          border: "1px solid #efd6df",
          borderRadius: "999px",
          background: "#ffffff",
          color: "#c72d63",
          boxShadow: "0 8px 24px rgba(104,43,65,0.08)",
          fontFamily: "inherit",
          fontSize: "12px",
          fontWeight: "800",
          cursor: "pointer",
        }}
      >
        ← Back to Home
      </button>

      <div
        style={{
          width: "min(820px, 100%)",
          margin: "0 auto",
          padding: "40px",
          background: "#ffffff",
          borderRadius: "28px",
          border: "1px solid #efdce3",
          boxShadow:
            "0 20px 60px rgba(104,43,65,0.10)",
        }}
      >

        {/* =============================================
            HEADER
        ============================================= */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              marginBottom: "14px",
              padding: "8px 16px",
              borderRadius: "20px",
              background: "#fff0f5",
              color: "#c72d63",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.5px",
            }}
          >
            ✨ Grow Your Business With Milan
          </span>

          <h1
            style={{
              margin: "0 0 12px",
              color: "#2b2024",
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "42px",
              lineHeight: "1.1",
            }}
          >
            Let's Build Your
            <span
              style={{
                color: "#cf2b62",
              }}
            >
              {" "}Business Profile
            </span>
          </h1>

          <p
            style={{
              maxWidth: "570px",
              margin: "0 auto",
              color: "#756b70",
              fontSize: "14px",
              lineHeight: "1.7",
            }}
          >
            Join Milan and connect with couples looking for
            trusted wedding professionals like you.
          </p>
        </div>


        {/* =============================================
            ERROR
        ============================================= */}

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "13px 15px",
              background: "#fff0f1",
              color: "#b42338",
              borderRadius: "12px",
              border: "1px solid #ffd6da",
            }}
          >
            ⚠ {error}
          </div>
        )}


        {/* =============================================
            SUCCESS
        ============================================= */}

        {success && (
          <div
            style={{
              marginBottom: "20px",
              padding: "13px 15px",
              background: "#e9f8ef",
              color: "#18763c",
              borderRadius: "12px",
              border: "1px solid #ccebd7",
            }}
          >
            ✓ {success}
          </div>
        )}


        {/* =============================================
            FORM
        ============================================= */}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "20px",
          }}
        >


          {/* BUSINESS NAME */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              Business Name *
            </label>

            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="Example: Royal Wedding Palace"
              required
              style={inputStyle}
            />
          </div>


          {/* SERVICE CATEGORY */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              What service do you provide? *
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">
                Select Service Category
              </option>

              {serviceCategories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>


          {/* PHONE */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              Business Phone *
            </label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                const value =
                  e.target.value.replace(
                    /\D/g,
                    ""
                  );

                setFormData((previous) => ({
                  ...previous,
                  phone: value,
                }));

                setError("");
              }}
              placeholder="10-digit mobile number"
              maxLength="10"
              inputMode="numeric"
              required
              style={inputStyle}
            />
          </div>


          {/* ADDRESS */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              Address
            </label>

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Business address"
              style={inputStyle}
            />
          </div>


          {/* STATE */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              State *
            </label>

            <select
              name="state"
              value={formData.state}
              onFocus={loadStates}
              onChange={handleStateChange}
              disabled={statesLoading}
              required
              style={inputStyle}
            >
              <option value="">
                {statesLoading
                  ? "Loading states..."
                  : "Select State"}
              </option>

              {states.map((stateName) => (
                <option
                  key={stateName}
                  value={stateName}
                >
                  {stateName}
                </option>
              ))}
            </select>
          </div>


          {/* DISTRICT */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              District / City *
            </label>

            <select
              name="district"
              value={formData.district}
              onChange={handleDistrictChange}
              disabled={
                !formData.state ||
                districtsLoading
              }
              required
              style={{
                ...inputStyle,
                background:
                  !formData.state ||
                    districtsLoading
                    ? "#f8f5f6"
                    : "#ffffff",
              }}
            >
              <option value="">
                {districtsLoading
                  ? "Loading districts..."
                  : formData.state
                    ? "Select District / City"
                    : "Select State First"}
              </option>

              {districts.map((districtName) => (
                <option
                  key={districtName}
                  value={districtName}
                >
                  {districtName}
                </option>
              ))}
            </select>
          </div>


          {/* AREA / LOCALITY */}

          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              Area / Locality *
            </label>

            <input
              type="text"
              value={areaQuery}
              onChange={handleAreaSearch}
              onFocus={() => {
                if (areaSuggestions.length > 0) {
                  setShowAreaSuggestions(true);
                }
              }}
              disabled={
                !formData.state ||
                !formData.district
              }
              placeholder={
                !formData.state
                  ? "Select state first"
                  : !formData.district
                    ? "Select district first"
                    : "Type your area / locality"
              }
              autoComplete="off"
              required
              style={{
                ...inputStyle,
                background:
                  !formData.state ||
                    !formData.district
                    ? "#f8f5f6"
                    : "#ffffff",
              }}
            />

            {showAreaSuggestions && (
              <div
                style={{
                  position: "absolute",
                  top: "76px",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  maxHeight: "260px",
                  overflowY: "auto",
                  background: "#ffffff",
                  border: "1px solid #ead9df",
                  borderRadius: "12px",
                  boxShadow:
                    "0 16px 35px rgba(104,43,65,0.15)",
                }}
              >
                {areaLoading ? (
                  <div
                    style={{
                      padding: "13px",
                      color: "#756b70",
                      fontSize: "12px",
                    }}
                  >
                    Searching areas...
                  </div>
                ) : areaSuggestions.length > 0 ? (
                  areaSuggestions.map(
                    (location, index) => (
                      <button
                        type="button"
                        key={`${location.pincode}-${location.area}-${index}`}
                        onClick={() =>
                          handleAreaSelect(location)
                        }
                        style={{
                          width: "100%",
                          padding: "12px 13px",
                          border: "none",
                          borderBottom:
                            "1px solid #f2e7eb",
                          background: "#ffffff",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            color: "#34282d",
                            fontSize: "13px",
                            marginBottom: "3px",
                          }}
                        >
                          {location.area}
                        </strong>

                        <span
                          style={{
                            color: "#81757a",
                            fontSize: "11px",
                          }}
                        >
                          {location.district},{" "}
                          {location.state}
                          {" • "}
                          {location.pincode}
                        </span>
                      </button>
                    )
                  )
                ) : (
                  <div
                    style={{
                      padding: "13px",
                      color: "#756b70",
                      fontSize: "12px",
                    }}
                  >
                    No matching areas found.
                  </div>
                )}
              </div>
            )}
          </div>


          {/* PINCODE AUTO-FILLED */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              Pincode *
            </label>

            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              readOnly
              placeholder="Auto-filled after area selection"
              required
              style={{
                ...inputStyle,
                background: "#f8f5f6",
                cursor: "not-allowed",
              }}
            />
          </div>


          {/* DESCRIPTION */}

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#544a4f",
              }}
            >
              About Your Business
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell couples about your business, experience and services..."
              rows="5"
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "120px",
              }}
            />
          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            style={{
              gridColumn: "1 / -1",
              minHeight: "48px",
              border: "none",
              borderRadius: "28px",
              background:
                "linear-gradient(135deg, #d52c64, #b71d51)",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "14px",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading
                  ? 0.7
                  : 1,
              marginTop: "5px",
            }}
          >
            {loading
              ? "Creating Profile..."
              : "Create Vendor Profile"}
          </button>

        </form>

      </div>

    </div>
  );
}


// =========================================================
// COMMON INPUT STYLE
// =========================================================

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box",
  padding: "11px 13px",

  border:
    "1px solid #ead9df",

  borderRadius: "11px",

  outline: "none",

  background: "#ffffff",
  color: "#2b2024",

  fontFamily: "inherit",
  fontSize: "14px",
};


export default VendorProfileSetup;