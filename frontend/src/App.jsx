import VendorProfileSetup from "./pages/VendorProfileSetup";
import VendorDetails from "./pages/VendorDetailsPage";
import VendorDashboard from "./pages/VendorDashboard";
import VendorVerification from "./pages/VendorVerification";
import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

import "./App.css";
import AuthPage from "./auth/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import SavedVendorsPage from "./pages/SavedVendorsPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";


/* =========================================================
   SERVICES
========================================================= */

const services = [
  [
    "🏛️",
    "Marriage Halls",
    "Beautiful venues for your special day",
  ],
  [
    "🍽️",
    "Catering",
    "Delicious food & professional chefs",
  ],
  [
    "🌸",
    "Decoration",
    "Beautiful themes & decorations",
  ],
  [
    "📸",
    "Photography",
    "Capture every special moment",
  ],
  [
    "🎵",
    "DJ & Music",
    "Music for every celebration",
  ],
  [
    "💄",
    "Makeup & Beauty",
    "Professional bridal makeup",
  ],
];


/* =========================================================
   VENDORS
========================================================= */

const vendors = [
  [
    "Royal Wedding Palace",
    "Marriage Hall",
    "4.9",
  ],
  [
    "Dream Decorators",
    "Decoration",
    "4.8",
  ],
  [
    "Moments Photography",
    "Photography",
    "4.9",
  ],
];


/* =========================================================
   LOCATION DATA
========================================================= */

const locationData = {
  "Uttar Pradesh": [
    "Mathura",
    "Agra",
    "Lucknow",
    "Noida",
    "Ghaziabad",
    "Aligarh",
    "Meerut",
    "Kanpur",
    "Varanasi",
  ],

  Delhi: [
    "Central Delhi",
    "North Delhi",
    "South Delhi",
    "East Delhi",
    "West Delhi",
    "New Delhi",
  ],

  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
  ],

  Rajasthan: [
    "Jaipur",
    "Udaipur",
    "Jodhpur",
    "Kota",
    "Ajmer",
  ],
};


/* =========================================================
   GET SAVED USER
========================================================= */

const getSavedUser = () => {
  try {
    const localUser =
      localStorage.getItem("milan_user");

    const sessionUser =
      sessionStorage.getItem("milan_user");

    const savedUser =
      localUser || sessionUser;

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);

  } catch (error) {
    console.error(
      "Unable to read saved Milan user:",
      error
    );

    return null;
  }
};


/* =========================================================
   APP
========================================================= */

function App() {

  const navigate = useNavigate();


  /* =======================================================
     AUTH
  ======================================================= */
  const [vendorList, setVendorList] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  const [showAuth, setShowAuth] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState(() => getSavedUser());

  const [
    showProfileMenu,
    setShowProfileMenu,
  ] = useState(false);

  // Customer + vendor navbar notifications.
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Vendor home showcase media (frontend preview for now).
  const [vendorShowcasePhotos, setVendorShowcasePhotos] =
    useState([]);

  const [vendorShowcaseVideos, setVendorShowcaseVideos] =
    useState([]);

  const [vendorPortfolioLoading, setVendorPortfolioLoading] =
    useState(false);

  const [vendorPortfolioUploading, setVendorPortfolioUploading] =
    useState(false);

  const [vendorPortfolioError, setVendorPortfolioError] =
    useState("");
  const [vendorConfirmModal, setVendorConfirmModal] = useState({
    open: false,
    type: "",
    files: [],
    mediaId: null,
  });

  // Customer saved vendors / favourites.
  const [savedVendorIds, setSavedVendorIds] = useState([]);
  const [savingVendorIds, setSavingVendorIds] = useState([]);

  // Vendor home journey metrics.
  const [vendorJourneyLoading, setVendorJourneyLoading] =
    useState(false);

  const [vendorJourneyStats, setVendorJourneyStats] =
    useState({
      profileViews: 0,
      profileSaves: 0,
      totalEnquiries: 0,
      pendingEnquiries: 0,
      profileCreated: false,
    });


  // Vendor verification status for navbar.
  const [vendorVerificationStatus, setVendorVerificationStatus] =
    useState("not_submitted");


  /* =======================================================
     LOCATION
  ======================================================= */

  const [state, setState] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [area, setArea] =
    useState("");

  const [selectedService, setSelectedService] =
    useState("");

  const [customerPincode, setCustomerPincode] =
    useState("");

  const [customerAreas, setCustomerAreas] =
    useState([]);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [areaSearch, setAreaSearch] =
    useState("");

  const [areaSuggestions, setAreaSuggestions] =
    useState([]);

  const [areaSearchLoading, setAreaSearchLoading] =
    useState(false);

  const [showAreaSuggestions, setShowAreaSuggestions] =
    useState(false);

  const [availableStates, setAvailableStates] =
    useState([]);

  const [availableDistricts, setAvailableDistricts] =
    useState([]);

  const [statesLoading, setStatesLoading] =
    useState(false);

  const [districtsLoading, setDistrictsLoading] =
    useState(false);


  /* =======================================================
     LOGIN SUCCESS
     Always confirm the role from /auth/me before routing.
  ======================================================= */

  const handleLoginSuccess = async (user) => {

    console.log(
      "Login callback data:",
      user
    );

    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    // Keep the user from the login response for now.
    setCurrentUser(user || null);
    setShowProfileMenu(false);

    if (!token) {
      setShowAuth(false);
      navigate("/", {
        replace: true,
      });
      return;
    }

    try {

      // ---------------------------------------------------
      // GET TRUSTED USER + ROLE FROM BACKEND
      // ---------------------------------------------------

      const meResponse = await fetch(
        "http://127.0.0.1:8000/auth/me",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const meData =
        await meResponse.json();

      if (!meResponse.ok) {
        throw new Error(
          meData.detail ||
          "Unable to verify logged-in user."
        );
      }

      const verifiedUser = {
        ...(user || {}),
        ...meData,
      };

      const userRole =
        verifiedUser?.role
          ?.toString()
          .trim()
          .toLowerCase();

      console.log(
        "Verified logged-in user:",
        verifiedUser
      );

      console.log(
        "Verified role:",
        userRole
      );

      // Update React state and saved user so the entire
      // frontend has the verified role.
      setCurrentUser(verifiedUser);

      const storage =
        localStorage.getItem("milan_token")
          ? localStorage
          : sessionStorage;

      storage.setItem(
        "milan_user",
        JSON.stringify(verifiedUser)
      );

      // ---------------------------------------------------
      // ADMIN
      // ---------------------------------------------------

      if (userRole === "admin") {
        setShowAuth(false);

        navigate("/admin-dashboard", {
          replace: true,
        });

        return;
      }

      // ---------------------------------------------------
      // CUSTOMER
      // ---------------------------------------------------

      if (userRole !== "vendor") {

        setShowAuth(false);

        navigate("/", {
          replace: true,
        });

        return;
      }

      // ---------------------------------------------------
      // VENDOR
      // Check whether vendor profile already exists.
      // ---------------------------------------------------

      const vendorResponse = await fetch(
        "http://127.0.0.1:8000/vendors/me",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // New vendor
      if (vendorResponse.status === 404) {

        setShowAuth(false);

        navigate(
          "/vendor-profile-setup",
          {
            replace: true,
          }
        );

        return;
      }

      if (!vendorResponse.ok) {

        const vendorError =
          await vendorResponse
            .json()
            .catch(() => ({}));

        throw new Error(
          vendorError.detail ||
          "Unable to check vendor profile."
        );
      }

      // Existing vendor
      setShowAuth(false);

      navigate(
        "/vendor-dashboard",
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        "Login routing failed:",
        error
      );

      // If role verification itself fails, close auth and
      // keep the user on the public home rather than guessing.
      setShowAuth(false);

      navigate("/", {
        replace: true,
      });
    }
  };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {

    /* LOCAL STORAGE */

    localStorage.removeItem(
      "milan_token"
    );

    localStorage.removeItem(
      "milan_token_type"
    );

    localStorage.removeItem(
      "milan_user"
    );


    /* SESSION STORAGE */

    sessionStorage.removeItem(
      "milan_token"
    );

    sessionStorage.removeItem(
      "milan_token_type"
    );

    sessionStorage.removeItem(
      "milan_user"
    );


    /* REACT STATE */

    setCurrentUser(null);

    setShowProfileMenu(false);

    navigate("/");

    console.log(
      "User logged out from Milan."
    );
  };


  /* =======================================================
     SERVICE SELECTION
  ======================================================= */

  const handleServiceClick = (serviceTitle) => {

    const categoryMap = {
      "Marriage Halls": "Marriage Hall",
      "Catering": "Catering",
      "Decoration": "Decoration",
      "Photography": "Photography",
      "DJ & Music": "DJ & Music",
      "Makeup & Beauty": "Makeup & Beauty",
    };

    const selectedCategory =
      categoryMap[serviceTitle] ||
      serviceTitle;

    setSelectedService(
      selectedCategory
    );

    setCustomerPincode("");
    setAreaSearch("");
    setAreaSuggestions([]);
    setShowAreaSuggestions(false);
    setState("");
    setDistrict("");
    setArea("");
    setCustomerAreas([]);
    setLocationError("");
    setVendorList([]);
    setAvailableDistricts([]);

    loadStates();

    setTimeout(() => {

      document
        .getElementById(
          "service-location-search"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

    }, 100);
  };


  /* =======================================================
     LOAD STATES
  ======================================================= */

  const loadStates = async () => {

    if (availableStates.length > 0) {
      return;
    }

    try {

      setStatesLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/locations/states"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to load states."
        );
      }

      setAvailableStates(
        (data.states || []).filter(
          (stateName) =>
            stateName &&
            stateName.toUpperCase() !== "NA"
        )
      );

    } catch (error) {

      console.error(
        "Unable to load states:",
        error
      );

      setLocationError(
        "Unable to load states."
      );

    } finally {

      setStatesLoading(false);

    }
  };


  const handleCustomerStateChange =
    async (event) => {

      const selectedState =
        event.target.value;

      setState(selectedState);
      setDistrict("");
      setArea("");
      setAreaSearch("");
      setCustomerPincode("");
      setCustomerAreas([]);
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      setAvailableDistricts([]);
      setLocationError("");

      if (!selectedState) {
        return;
      }

      try {

        setDistrictsLoading(true);

        const response = await fetch(
          `http://127.0.0.1:8000/locations/districts?state=${encodeURIComponent(
            selectedState
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
            "Unable to load districts."
          );
        }

        setAvailableDistricts(
          data.districts || []
        );

      } catch (error) {

        console.error(
          "Unable to load districts:",
          error
        );

        setLocationError(
          "Unable to load districts for this state."
        );

      } finally {

        setDistrictsLoading(false);

      }
    };


  const handleCustomerDistrictChange =
    (event) => {

      setDistrict(
        event.target.value
      );

      setArea("");
      setAreaSearch("");
      setCustomerPincode("");
      setCustomerAreas([]);
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      setLocationError("");
    };


  /* =======================================================
     CUSTOMER AREA / LOCALITY SEARCH
  ======================================================= */

  const handleAreaSearchChange = async (event) => {

    const value =
      event.target.value;

    setAreaSearch(value);

    // Keep the already selected State and District.
    // Only reset the area/pincode while the user types a new locality.
    setArea("");
    setCustomerPincode("");
    setCustomerAreas([]);
    setLocationError("");

    if (!state) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      setLocationError(
        "Please select your state first."
      );
      return;
    }

    if (!district) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      setLocationError(
        "Please select your district / city first."
      );
      return;
    }

    if (value.trim().length < 2) {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
      return;
    }

    try {

      setAreaSearchLoading(true);

      const response = await fetch(
        `http://127.0.0.1:8000/locations/search?q=${encodeURIComponent(
          value.trim()
        )}&state=${encodeURIComponent(
          state
        )}&district=${encodeURIComponent(
          district
        )}`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to search locations."
        );
      }

      setAreaSuggestions(
        Array.isArray(data.locations)
          ? data.locations
          : []
      );

      setShowAreaSuggestions(true);

    } catch (error) {

      console.error(
        "Area search failed:",
        error
      );

      setAreaSuggestions([]);
      setShowAreaSuggestions(false);

      setLocationError(
        error.message ||
        "Unable to search locations."
      );

    } finally {

      setAreaSearchLoading(false);

    }
  };


  const handleAreaSuggestionSelect = (
    location
  ) => {

    setAreaSearch(
      location.area
    );

    setArea(
      location.area
    );

    setCustomerPincode(
      location.pincode
    );

    setState(
      location.state
    );

    setDistrict(
      location.district
    );

    setCustomerAreas([
      location.area
    ]);

    setAreaSuggestions([]);
    setShowAreaSuggestions(false);
    setLocationError("");
  };


  /* =======================================================
     CUSTOMER PINCODE LOOKUP
  ======================================================= */

  const handleCustomerPincodeChange =
    async (event) => {

      const value =
        event.target.value
          .replace(/\D/g, "")
          .slice(0, 6);

      setCustomerPincode(value);

      setAreaSearch("");
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);

      setState("");
      setDistrict("");
      setArea("");
      setCustomerAreas([]);
      setLocationError("");

      if (value.length !== 6) {
        return;
      }

      try {

        setLocationLoading(true);

        const response = await fetch(
          `http://127.0.0.1:8000/locations/pincode/${value}`
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
            "Pincode not found."
          );
        }

        setState(
          data.state || ""
        );

        setDistrict(
          data.district || ""
        );

        setArea("");

        setCustomerAreas(
          Array.isArray(data.areas)
            ? data.areas
            : []
        );

      } catch (error) {

        console.error(
          "Customer pincode lookup failed:",
          error
        );

        setState("");
        setDistrict("");
        setArea("");
        setCustomerAreas([]);

        setLocationError(
          error.message ||
          "Unable to find this pincode."
        );

      } finally {

        setLocationLoading(false);

      }
    };


  /* =======================================================
     FETCH MATCHING VENDORS
  ======================================================= */

  const fetchVendors = async () => {

    try {

      setVendorsLoading(true);

      const params =
        new URLSearchParams();

      if (state) {
        params.append(
          "state",
          state
        );
      }

      if (district) {
        params.append(
          "district",
          district
        );
      }

      if (area.trim()) {
        params.append(
          "area",
          area.trim()
        );
      }

      if (selectedService) {
        params.append(
          "category",
          selectedService
        );
      }

      const response = await fetch(
        `http://127.0.0.1:8000/vendors?${params.toString()}`
      );

      const data =
        await response.json();

      console.log(
        "Vendor API URL:",
        response.url
      );

      console.log(
        "Vendor API Response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load vendors."
        );
      }

      setVendorList(
        data.vendors || []
      );

    } catch (error) {

      console.error(
        "Unable to fetch vendors:",
        error
      );

      setVendorList([]);

    } finally {

      setVendorsLoading(false);

    }
  };


  /* =======================================================
     SEARCH SELECTED SERVICE
  ======================================================= */

  const handleServiceSearch =
    async () => {

      setLocationError("");

      if (!selectedService) {

        setLocationError(
          "Please select a wedding service first."
        );

        return;
      }

      if (!state) {

        setLocationError(
          "Please select your state."
        );

        return;
      }

      if (!district) {

        setLocationError(
          "Please select your district / city."
        );

        return;
      }

      if (!area) {

        setLocationError(
          "Please select your Area / Locality."
        );

        return;
      }

      if (
        !customerPincode ||
        !/^[1-9][0-9]{5}$/.test(
          customerPincode
        )
      ) {

        setLocationError(
          "Please select an area from the suggestions."
        );

        return;
      }

      await fetchVendors();

      document
        .getElementById("vendors")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    };


  /* =======================================================
     SCROLL TO VENDORS
  ======================================================= */

  const scrollToVendors = () => {

    document
      .getElementById("vendors")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };


  /* =======================================================
     DISPLAY NAME
  ======================================================= */

  const displayName =
    currentUser?.full_name ||
    currentUser?.email ||
    "Milan User";


  const firstName =
    displayName
      .trim()
      .split(" ")[0];

  // Keep the admin experience completely separate from
  // customer/vendor marketplace pages.
  const isAdmin =
    currentUser?.role?.toString().trim().toLowerCase() === "admin";


  /* =======================================================
     CUSTOMER NOTIFICATIONS
  ======================================================= */

  const loadNotifications = async () => {
    const role = currentUser?.role?.toString().trim().toLowerCase();

    if (!currentUser || !["customer", "vendor"].includes(role)) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      setShowNotifications(false);
      return;
    }

    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) return;

    try {
      setNotificationsLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/notifications",
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
        throw new Error(data.detail || "Unable to load notifications.");
      }

      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : []
      );
      setUnreadNotificationCount(Number(data.unread_count) || 0);
    } catch (error) {
      console.error("Unable to load notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const role = currentUser?.role?.toString().trim().toLowerCase();

    if (!currentUser || !["customer", "vendor"].includes(role)) {
      return undefined;
    }

    const notificationTimer = window.setInterval(loadNotifications, 30000);

    return () => window.clearInterval(notificationTimer);
  }, [currentUser]);

  const markNotificationRead = async (notification) => {
    if (!notification?.id) return;

    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) return;

    try {
      if (!notification.is_read) {
        const response = await fetch(
          `http://127.0.0.1:8000/notifications/${notification.id}/read`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id ? { ...item, is_read: true } : item
            )
          );
          setUnreadNotificationCount((count) => Math.max(count - 1, 0));
        }
      }

      setShowNotifications(false);

      const role = currentUser?.role?.toString().trim().toLowerCase();

      if (role === "vendor") {
        if (notification.notification_type === "new_enquiry") {
          navigate("/vendor-dashboard");
          return;
        }

        if (
          notification.notification_type === "verification_approved" ||
          notification.notification_type === "verification_rejected"
        ) {
          navigate("/vendor-verification");
          return;
        }

        return;
      }

      if (role === "customer" && notification.vendor_id) {
        navigate(`/vendors/${notification.vendor_id}`);
      }
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token || unreadNotificationCount === 0) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/notifications/read-all",
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
      setUnreadNotificationCount(0);
    } catch (error) {
      console.error("Unable to mark all notifications as read:", error);
    }
  };


  /* =======================================================
     VENDOR SHOWCASE MEDIA PREVIEW
     NOTE: These are local browser previews only for now.
     Backend upload/persistence will be connected next.
  ======================================================= */

  const getMilanToken = () =>
    localStorage.getItem("milan_token") ||
    sessionStorage.getItem("milan_token");

  const splitVendorPortfolioMedia = (media = []) => {
    const items = Array.isArray(media) ? media : [];

    setVendorShowcasePhotos(
      items.filter((item) => item?.media_type === "image").slice(0, 8)
    );

    setVendorShowcaseVideos(
      items.filter((item) => item?.media_type === "video").slice(0, 4)
    );
  };

  const loadVendorPortfolio = async () => {
    const isVendor =
      currentUser?.role?.toString().trim().toLowerCase() === "vendor";

    if (!isVendor) {
      setVendorShowcasePhotos([]);
      setVendorShowcaseVideos([]);
      setVendorPortfolioError("");
      return;
    }

    const token = getMilanToken();
    if (!token) return;

    try {
      setVendorPortfolioLoading(true);
      setVendorPortfolioError("");

      const response = await fetch(
        "http://127.0.0.1:8000/vendors/portfolio/me",
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
        throw new Error(data.detail || "Unable to load your portfolio.");
      }

      splitVendorPortfolioMedia(data.media || []);
    } catch (error) {
      console.error("Unable to load vendor portfolio:", error);
      setVendorPortfolioError(
        error.message || "Unable to load your portfolio."
      );
    } finally {
      setVendorPortfolioLoading(false);
    }
  };

  useEffect(() => {
    loadVendorPortfolio();
  }, [currentUser]);

  const uploadVendorPortfolioFiles = async (selectedFiles, expectedType) => {
    const token = getMilanToken();

    if (!token) {
      setVendorPortfolioError(
        "Please login again before uploading portfolio media."
      );
      return;
    }

    const files = Array.from(selectedFiles || []).filter((file) =>
      expectedType === "image"
        ? file.type.startsWith("image/")
        : file.type.startsWith("video/")
    );

    if (files.length === 0) {
      setVendorPortfolioError(
        expectedType === "image"
          ? "Please select a valid image file."
          : "Please select a valid video file."
      );
      return;
    }

    const existingCount =
      expectedType === "image"
        ? vendorShowcasePhotos.length
        : vendorShowcaseVideos.length;

    const maxCount = expectedType === "image" ? 8 : 4;
    const remainingSlots = Math.max(maxCount - existingCount, 0);

    if (remainingSlots === 0) {
      setVendorPortfolioError(
        expectedType === "image"
          ? "You can keep up to 8 portfolio photos."
          : "You can keep up to 4 portfolio videos."
      );
      return;
    }

    const formData = new FormData();

    files.slice(0, remainingSlots).forEach((file) => {
      formData.append("files", file);
    });

    try {
      setVendorPortfolioUploading(true);
      setVendorPortfolioError("");

      const response = await fetch(
        "http://127.0.0.1:8000/vendors/portfolio/upload",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Unable to upload portfolio media.");
      }

      await loadVendorPortfolio();
    } catch (error) {
      console.error("Portfolio upload failed:", error);
      setVendorPortfolioError(
        error.message || "Unable to upload portfolio media."
      );
    } finally {
      setVendorPortfolioUploading(false);
    }
  };

  const closeVendorConfirmModal = () => {
    setVendorConfirmModal({ open: false, type: "", files: [], mediaId: null });
  };

  const handleVendorPhotoSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;
    setVendorConfirmModal({
      open: true,
      type: "upload-image",
      files: selectedFiles,
      mediaId: null,
    });
  };

  const handleVendorVideoSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;
    setVendorConfirmModal({
      open: true,
      type: "upload-video",
      files: selectedFiles,
      mediaId: null,
    });
  };

  const removeVendorPortfolioMedia = async (mediaId) => {
    const token = getMilanToken();
    if (!token || !mediaId) return;

    try {
      setVendorPortfolioError("");

      const response = await fetch(
        `http://127.0.0.1:8000/vendors/portfolio/${mediaId}`,
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
        throw new Error(data.detail || "Unable to delete portfolio media.");
      }

      await loadVendorPortfolio();
    } catch (error) {
      console.error("Portfolio delete failed:", error);
      setVendorPortfolioError(
        error.message || "Unable to delete portfolio media."
      );
    }
  };

  const removeVendorPhoto = (mediaId) => {
    setVendorConfirmModal({
      open: true,
      type: "delete-image",
      files: [],
      mediaId,
    });
  };

  const removeVendorVideo = (mediaId) => {
    setVendorConfirmModal({
      open: true,
      type: "delete-video",
      files: [],
      mediaId,
    });
  };

  const confirmVendorPortfolioAction = async () => {
    const action = vendorConfirmModal;
    closeVendorConfirmModal();

    if (action.type === "upload-image") {
      await uploadVendorPortfolioFiles(action.files, "image");
    } else if (action.type === "upload-video") {
      await uploadVendorPortfolioFiles(action.files, "video");
    } else if (
      action.type === "delete-image" ||
      action.type === "delete-video"
    ) {
      await removeVendorPortfolioMedia(action.mediaId);
    }
  };

  /* =======================================================
     CUSTOMER SAVED VENDORS / FAVOURITES
  ======================================================= */

  useEffect(() => {
    const loadSavedVendors = async () => {
      const role = currentUser?.role?.toString().trim().toLowerCase();

      if (!currentUser || role !== "customer") {
        setSavedVendorIds([]);
        return;
      }

      const token = getMilanToken();
      if (!token) {
        setSavedVendorIds([]);
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/saved-vendors", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) return;

        const ids = (Array.isArray(data.vendors) ? data.vendors : [])
          .map((item) => Number(item?.vendor?.id))
          .filter(Boolean);

        setSavedVendorIds(ids);
      } catch (error) {
        console.error("Unable to load saved vendors:", error);
      }
    };

    loadSavedVendors();
  }, [currentUser]);

  const toggleSavedVendor = async (vendorId) => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }

    const role = currentUser?.role?.toString().trim().toLowerCase();
    if (role !== "customer") return;

    const token = getMilanToken();
    if (!token) {
      setShowAuth(true);
      return;
    }

    const numericVendorId = Number(vendorId);
    const isSaved = savedVendorIds.includes(numericVendorId);

    try {
      setSavingVendorIds((current) =>
        current.includes(numericVendorId)
          ? current
          : [...current, numericVendorId]
      );

      const response = await fetch(
        `http://127.0.0.1:8000/saved-vendors/${numericVendorId}`,
        {
          method: isSaved ? "DELETE" : "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Unable to update saved vendor.");
      }

      setSavedVendorIds((current) =>
        isSaved
          ? current.filter((id) => id !== numericVendorId)
          : current.includes(numericVendorId)
            ? current
            : [...current, numericVendorId]
      );
    } catch (error) {
      console.error("Save vendor failed:", error);
    } finally {
      setSavingVendorIds((current) =>
        current.filter((id) => id !== numericVendorId)
      );
    }
  };

  /* =======================================================
     VENDOR MILAN JOURNEY
     Real backend data only.
  ======================================================= */

  useEffect(() => {
    const loadVendorJourney = async () => {
      const isVendor =
        currentUser?.role?.toString().trim().toLowerCase() === "vendor";

      if (!isVendor) {
        setVendorJourneyStats({
          profileViews: 0,
          totalEnquiries: 0,
          pendingEnquiries: 0,
          profileCreated: false,
        });
        return;
      }

      const token =
        localStorage.getItem("milan_token") ||
        sessionStorage.getItem("milan_token");

      if (!token) return;

      try {
        setVendorJourneyLoading(true);

        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [vendorResponse, enquiryResponse, savesResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/vendors/me", {
            method: "GET",
            headers,
          }),
          fetch("http://127.0.0.1:8000/enquiries/vendor", {
            method: "GET",
            headers,
          }),
          fetch("http://127.0.0.1:8000/saved-vendors/vendor/me/count", {
            method: "GET",
            headers,
          }),
        ]);

        let vendorData = null;
        let enquiryData = { count: 0, enquiries: [] };
        let savesData = { profile_saves: 0 };

        if (vendorResponse.ok) {
          vendorData = await vendorResponse.json();
        } else if (vendorResponse.status !== 404) {
          const vendorError = await vendorResponse.json().catch(() => ({}));
          throw new Error(vendorError.detail || "Unable to load vendor journey.");
        }

        if (enquiryResponse.ok) {
          enquiryData = await enquiryResponse.json();
        } else if (enquiryResponse.status !== 404) {
          const enquiryError = await enquiryResponse.json().catch(() => ({}));
          throw new Error(enquiryError.detail || "Unable to load vendor enquiries.");
        }

        if (savesResponse.ok) {
          savesData = await savesResponse.json();
        } else if (savesResponse.status !== 404) {
          const savesError = await savesResponse.json().catch(() => ({}));
          throw new Error(savesError.detail || "Unable to load profile saves.");
        }

        const vendor = vendorData?.vendor || vendorData || null;
        const enquiries = Array.isArray(enquiryData?.enquiries)
          ? enquiryData.enquiries
          : [];

        const totalEnquiries =
          typeof enquiryData?.count === "number"
            ? enquiryData.count
            : enquiries.length;

        const pendingEnquiries = enquiries.filter(
          (enquiry) =>
            enquiry?.status?.toString().trim().toLowerCase() === "pending"
        ).length;

        setVendorJourneyStats({
          profileViews: Number(vendor?.profile_views) || 0,
          profileSaves: Number(savesData?.profile_saves) || 0,
          totalEnquiries,
          pendingEnquiries,
          profileCreated: Boolean(vendor),
        });
      } catch (error) {
        console.error("Unable to load vendor journey:", error);
      } finally {
        setVendorJourneyLoading(false);
      }
    };

    loadVendorJourney();
  }, [currentUser]);


  /* =======================================================
     VENDOR VERIFICATION STATUS
     Used only for the vendor navbar button.
  ======================================================= */

  useEffect(() => {
    const loadVendorVerificationStatus = async () => {
      const isVendor =
        currentUser?.role?.toString().trim().toLowerCase() === "vendor";

      if (!isVendor) {
        setVendorVerificationStatus("not_submitted");
        return;
      }

      const token =
        localStorage.getItem("milan_token") ||
        sessionStorage.getItem("milan_token");

      if (!token) {
        setVendorVerificationStatus("not_submitted");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/vendor-verification/me",
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
          setVendorVerificationStatus("not_submitted");
          return;
        }

        const verification = data.verification || data || {};

        setVendorVerificationStatus(
          verification.status || data.status || "not_submitted"
        );
      } catch (error) {
        console.error(
          "Unable to load vendor verification status:",
          error
        );
        setVendorVerificationStatus("not_submitted");
      }
    };

    loadVendorVerificationStatus();
  }, [currentUser]);


  /* =======================================================
     AUTH PAGE
  ======================================================= */

  if (showAuth) {
    return (
      <AuthPage
        onClose={() =>
          setShowAuth(false)
        }
        onLoginSuccess={
          handleLoginSuccess
        }
      />
    );
  }


  /* =======================================================
     HOME PAGE
  ======================================================= */

  const homePage = (
    <div className="app">
      {vendorConfirmModal.open && (
        <div
          className="milan-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeVendorConfirmModal();
          }}
        >
          <div
            className={`milan-confirm-modal ${vendorConfirmModal.type.startsWith("delete")
              ? "delete-modal"
              : vendorConfirmModal.type === "upload-video"
                ? "video-modal"
                : "photo-modal"
              }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="milan-confirm-title"
          >
            <button
              type="button"
              className="milan-confirm-close"
              onClick={closeVendorConfirmModal}
              aria-label="Close confirmation"
            >
              ×
            </button>

            {vendorConfirmModal.type === "upload-image" && (
              <>
                <div className="milan-status-shield">✓</div>
                <h3 id="milan-confirm-title">Upload this photo?</h3>
                <p className="milan-confirm-copy">
                  Please confirm to upload this photo to your portfolio.
                </p>

                {vendorConfirmModal.files?.[0] && (
                  <div className="milan-file-row">
                    <div className="milan-file-preview">
                      <img
                        src={URL.createObjectURL(vendorConfirmModal.files[0])}
                        alt="Selected upload"
                      />
                    </div>
                    <div className="milan-file-meta">
                      <strong>{vendorConfirmModal.files[0].name}</strong>
                      <span>
                        {(vendorConfirmModal.files[0].size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                )}

                <div className="milan-confirm-actions">
                  <button
                    type="button"
                    className="milan-confirm-cancel"
                    onClick={closeVendorConfirmModal}
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    className="milan-confirm-primary"
                    onClick={confirmVendorPortfolioAction}
                  >
                    Yes, Upload
                  </button>
                </div>
              </>
            )}

            {vendorConfirmModal.type === "delete-image" && (
              <>
                <div className="milan-delete-warning">!</div>
                <h3 id="milan-confirm-title">Delete this photo?</h3>
                <p className="milan-confirm-copy">
                  This photo will be permanently removed from your portfolio.
                </p>
                <div className="milan-delete-note">
                  This action cannot be undone.
                </div>

                <div className="milan-confirm-actions">
                  <button
                    type="button"
                    className="milan-confirm-cancel"
                    onClick={closeVendorConfirmModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="milan-confirm-primary danger"
                    onClick={confirmVendorPortfolioAction}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}

            {vendorConfirmModal.type === "upload-video" && (
              <div className="milan-video-layout">
                <div className="milan-video-preview-panel">
                  {vendorConfirmModal.files?.[0] && (
                    <video
                      src={URL.createObjectURL(vendorConfirmModal.files[0])}
                      className="milan-video-preview"
                      muted
                      playsInline
                    />
                  )}
                  <div className="milan-video-play">▶</div>
                </div>

                <div className="milan-video-content">
                  <h3 id="milan-confirm-title">Upload Video?</h3>
                  <p className="milan-confirm-copy">
                    Are you sure you want to upload this video to your portfolio?
                  </p>

                  {vendorConfirmModal.files?.[0] && (
                    <div className="milan-video-file-name">
                      <strong>{vendorConfirmModal.files[0].name}</strong>
                      <span>
                        {(vendorConfirmModal.files[0].size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  )}

                  <div className="milan-confirm-actions video-actions">
                    <button
                      type="button"
                      className="milan-confirm-cancel"
                      onClick={closeVendorConfirmModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="milan-confirm-primary"
                      onClick={confirmVendorPortfolioAction}
                    >
                      Yes, Upload
                    </button>
                  </div>
                </div>
              </div>
            )}

            {vendorConfirmModal.type === "delete-video" && (
              <>
                <div className="milan-delete-warning">!</div>
                <h3 id="milan-confirm-title">Delete this video?</h3>
                <p className="milan-confirm-copy">
                  This video will be permanently removed from your portfolio.
                </p>
                <div className="milan-delete-note">
                  This action cannot be undone.
                </div>

                <div className="milan-confirm-actions">
                  <button
                    type="button"
                    className="milan-confirm-cancel"
                    onClick={closeVendorConfirmModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="milan-confirm-primary danger"
                    onClick={confirmVendorPortfolioAction}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="nav-container">


          {/* LOGO */}

          <a
            className="logo"
            href="#home"
          >
            Milan
          </a>


          {/* NAVIGATION */}

          <nav className="nav-links">

            <a
              className="active"
              href="#home"
            >
              Home
            </a>

            <a href="#services">
              Services
            </a>

            <a href="#vendors">
              Vendors
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

            {currentUser &&
              currentUser?.role?.toString().trim().toLowerCase() === "vendor" && (
                <button
                  type="button"
                  onClick={() => navigate("/vendor-verification")}
                  style={{
                    border: "0",
                    background: "transparent",
                    color:
                      vendorVerificationStatus === "approved"
                        ? "#16835d"
                        : vendorVerificationStatus === "pending"
                          ? "#b7791f"
                          : "#dc2626",
                    font: "inherit",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: "8px 4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {vendorVerificationStatus === "approved"
                    ? "🟢 Verified"
                    : vendorVerificationStatus === "pending"
                      ? "🟠 Verification Pending"
                      : "🔴 Not Verified"}
                </button>
              )}

            {currentUser &&
              currentUser?.role?.toString().trim().toLowerCase() === "customer" && (
                <button
                  type="button"
                  className="saved-vendors-nav-link"
                  onClick={() => navigate("/saved-vendors")}
                  style={{
                    border: "0",
                    background: "transparent",
                    color: "#3f3539",
                    font: "inherit",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: "8px 4px",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  ❤️ Saved Vendors
                </button>
              )}

          </nav>


          {/* =================================================
              NAV RIGHT
          ================================================= */}

          <div className="nav-buttons">

            {!currentUser ? (

              <>
                <button
                  type="button"
                  className="login-btn"
                  onClick={() =>
                    setShowAuth(true)
                  }
                >
                  Login
                </button>

                <button
                  type="button"
                  className="start-btn"
                  onClick={() =>
                    setShowAuth(true)
                  }
                >
                  Get Started
                </button>
              </>

            ) : (

              <div className="user-profile-wrapper" style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                {["customer", "vendor"].includes(
                  currentUser?.role?.toString().trim().toLowerCase()
                ) && (
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        aria-label="Notifications"
                        onClick={() => {
                          setShowNotifications((previous) => !previous);
                          setShowProfileMenu(false);
                          if (!showNotifications) loadNotifications();
                        }}
                        style={{
                          position: "relative",
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          border: "1px solid #efdce3",
                          background: "#ffffff",
                          cursor: "pointer",
                          fontSize: "19px",
                          display: "grid",
                          placeItems: "center",
                          boxShadow: "0 5px 16px rgba(105, 45, 67, 0.08)",
                        }}
                      >
                        🔔
                        {unreadNotificationCount > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: "-5px",
                              right: "-5px",
                              minWidth: "19px",
                              height: "19px",
                              padding: "0 5px",
                              borderRadius: "999px",
                              background: "#c72d63",
                              color: "#ffffff",
                              border: "2px solid #ffffff",
                              fontSize: "10px",
                              fontWeight: "800",
                              lineHeight: "15px",
                              boxSizing: "border-box",
                            }}
                          >
                            {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                          </span>
                        )}
                      </button>

                      {showNotifications && (
                        <div
                          style={{
                            position: "absolute",
                            top: "52px",
                            right: "0",
                            width: "350px",
                            maxWidth: "calc(100vw - 24px)",
                            maxHeight: "430px",
                            overflowY: "auto",
                            zIndex: 1000,
                            background: "#ffffff",
                            border: "1px solid #efdce3",
                            borderRadius: "18px",
                            boxShadow: "0 18px 45px rgba(72, 34, 49, 0.16)",
                          }}
                        >
                          <div style={{ padding: "17px 18px", borderBottom: "1px solid #f2e5ea", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                            <div>
                              <strong style={{ color: "#34282d", fontSize: "15px" }}>Notifications</strong>
                              <div style={{ color: "#96858c", fontSize: "11px", marginTop: "2px" }}>
                                {unreadNotificationCount} unread
                              </div>
                            </div>
                            {unreadNotificationCount > 0 && (
                              <button
                                type="button"
                                onClick={markAllNotificationsRead}
                                style={{ border: 0, background: "transparent", color: "#c72d63", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>

                          {notificationsLoading && notifications.length === 0 ? (
                            <div style={{ padding: "26px 18px", textAlign: "center", color: "#8d7d84", fontSize: "13px" }}>Loading notifications...</div>
                          ) : notifications.length === 0 ? (
                            <div style={{ padding: "28px 18px", textAlign: "center", color: "#8d7d84", fontSize: "13px" }}>No notifications yet.</div>
                          ) : (
                            notifications.map((notification) => (
                              <button
                                key={notification.id}
                                type="button"
                                onClick={() => markNotificationRead(notification)}
                                style={{
                                  width: "100%",
                                  border: 0,
                                  borderBottom: "1px solid #f5eaee",
                                  background: notification.is_read ? "#ffffff" : "#fff5f8",
                                  padding: "15px 18px",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  display: "block",
                                }}
                              >
                                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                  <span style={{ fontSize: "18px" }}>
                                    {notification.notification_type === "enquiry_status"
                                      ? "💌"
                                      : notification.notification_type === "new_enquiry"
                                        ? "💌"
                                        : notification.notification_type === "verification_approved"
                                          ? "✓"
                                          : notification.notification_type === "verification_rejected"
                                            ? "!"
                                            : "🔔"}
                                  </span>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                      <strong style={{ color: "#3d2c33", fontSize: "13px" }}>
                                        {notification.title}
                                      </strong>
                                      {!notification.is_read && (
                                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#c72d63", flex: "0 0 7px" }} />
                                      )}
                                    </div>
                                    <p style={{ margin: "5px 0 0", color: "#75676d", fontSize: "12px", lineHeight: "1.5" }}>
                                      {notification.message}
                                    </p>
                                    {notification.created_at && (
                                      <span style={{ display: "block", marginTop: "7px", color: "#aa9ba1", fontSize: "10px" }}>
                                        {new Date(notification.created_at).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}


                {/* PROFILE BUTTON */}

                <button
                  type="button"
                  className="user-profile-button"
                  onClick={() =>
                    setShowProfileMenu(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  <span className="user-avatar">

                    {firstName
                      .charAt(0)
                      .toUpperCase()}

                  </span>

                  <span className="user-profile-name">
                    Hi, {firstName}
                  </span>

                  <span
                    className={`profile-arrow ${showProfileMenu
                      ? "open"
                      : ""
                      }`}
                  >
                    ▾
                  </span>

                </button>


                {/* =================================================
                    PROFILE DROPDOWN
                ================================================= */}

                {showProfileMenu && (

                  <div className="profile-dropdown">


                    {/* USER HEADER */}

                    <div className="profile-dropdown-header">

                      <div className="profile-large-avatar">

                        {firstName
                          .charAt(0)
                          .toUpperCase()}

                      </div>

                      <div>

                        <strong>
                          {displayName}
                        </strong>

                        <span>
                          {currentUser.email}
                        </span>

                      </div>

                    </div>


                    {/* ROLE */}

                    <div className="profile-role">

                      {currentUser.role === "vendor"
                        ? "Vendor"
                        : currentUser.role === "admin"
                          ? "Admin"
                          : "Customer"}

                    </div>


                    <div className="profile-divider"></div>


                    {/* =================================================
                        MY PROFILE
                    ================================================= */}

                    <button
                      type="button"
                      className="profile-menu-item"
                      onClick={() => {

                        setShowProfileMenu(
                          false
                        );

                        navigate(
                          "/profile"
                        );
                      }}
                    >
                      👤 My Profile
                    </button>

                    {/* =================================================
                        DASHBOARD
                    ================================================= */}
                    <button
                      type="button"
                      className="profile-menu-item"
                      onClick={async () => {
                        setShowProfileMenu(false);

                        if (currentUser.role === "admin") {
                          navigate("/admin-dashboard");
                          return;
                        }

                        if (currentUser.role !== "vendor") {
                          navigate("/customer-dashboard");
                          return;
                        }

                        const token =
                          localStorage.getItem("milan_token") ||
                          sessionStorage.getItem("milan_token");

                        if (!token) {
                          navigate("/");
                          return;
                        }

                        try {
                          const response = await fetch(
                            "http://127.0.0.1:8000/vendors/me",
                            {
                              method: "GET",
                              headers: {
                                Accept: "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );

                          if (response.status === 404) {
                            navigate("/vendor-profile-setup");
                            return;
                          }

                          if (!response.ok) {
                            throw new Error(
                              "Unable to check vendor profile."
                            );
                          }

                          navigate("/vendor-dashboard");
                        } catch (error) {
                          console.error(
                            "Vendor profile check failed:",
                            error
                          );

                          navigate("/vendor-profile-setup");
                        }
                      }}
                    >
                      ✦ Dashboard
                    </button>



                    <div className="profile-divider"></div>


                    {/* =================================================
                        LOGOUT
                    ================================================= */}

                    <button
                      type="button"
                      className="profile-menu-item logout-menu-item"
                      onClick={
                        handleLogout
                      }
                    >
                      ↪ Logout
                    </button>

                  </div>

                )}

              </div>

            )}

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>


        {/* ===================================================
            HERO
        =================================================== */}

        <section
          className="hero"
          id="home"
        >

          <div className="hero-container">

            <div className="hero-left">

              {currentUser?.role?.toLowerCase() === "vendor" ? (
                <>
                  <div className="hero-badge">
                    ✨ Your Growth Partner in Every Celebration
                  </div>

                  <h1>
                    Grow Your Wedding
                    <br />

                    <span>
                      Business
                    </span>

                    {" "}With Milan
                  </h1>

                  <p className="hero-description">
                    Thank you for choosing Milan as a partner in your
                    growth. Connect with more couples, receive genuine
                    wedding enquiries, and turn new opportunities into
                    lasting success.
                  </p>

                  <div className="trust-row">
                    <span>
                      ✓ Reach More Couples
                    </span>

                    <span>
                      ✓ Receive Genuine Leads
                    </span>

                    <span>
                      ✓ Grow Your Business
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="hero-badge">
                    ✨ Your Dream Wedding Starts Here
                  </div>

                  <h1>
                    Everything You Need

                    <br />

                    For Your{" "}

                    <span>
                      Perfect
                    </span>

                    <br />

                    <span>
                      Wedding
                    </span>
                  </h1>

                  <p className="hero-description">
                    Discover beautiful venues, talented photographers,
                    decorators, caterers and more — all in one place.
                  </p>

                  <div className="trust-row">
                    <span>
                      ✓ Verified Vendors
                    </span>

                    <span>
                      ✓ Best Prices
                    </span>

                    <span>
                      ✓ Trusted by 10K+ Couples
                    </span>
                  </div>
                </>
              )}

            </div>
          </div>

        </section>


        {/* ===================================================
            VENDOR MILAN JOURNEY
        =================================================== */}

        {currentUser?.role?.toLowerCase() === "vendor" && (
          <section
            className="vendor-journey-section"
            id="vendor-journey"
            style={{
              padding: "72px 20px 28px",
              background: "linear-gradient(180deg, #fffafc 0%, #ffffff 100%)",
            }}
          >
            <div className="container" style={{ maxWidth: "1180px", margin: "0 auto" }}>
              <div className="section-heading" style={{ textAlign: "center", marginBottom: "34px" }}>
                <p>YOUR MILAN JOURNEY</p>
                <h2>Build. Connect. Celebrate.</h2>
                <span>
                  Your business is part of thousands of wedding moments. Here's how your Milan journey is growing.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginBottom: "28px" }}>
                {[
                  { icon: "👀", label: "Profile Views", value: vendorJourneyStats.profileViews, help: "Couples who opened your profile" },
                  { icon: "❤️", label: "Profile Saves", value: vendorJourneyStats.profileSaves, help: "Couples who saved your profile" },
                  { icon: "💌", label: "Total Enquiries", value: vendorJourneyStats.totalEnquiries, help: "Wedding enquiries received" },
                  { icon: "⏳", label: "Pending Enquiries", value: vendorJourneyStats.pendingEnquiries, help: "Enquiries waiting for your response" },
                ].map((item) => (
                  <article key={item.label} style={{ padding: "24px", border: "1px solid #efdce3", borderRadius: "22px", background: "#ffffff", boxShadow: "0 14px 34px rgba(104,43,65,0.07)" }}>
                    <div style={{ width: "48px", height: "48px", display: "grid", placeItems: "center", marginBottom: "16px", borderRadius: "15px", background: "#fff0f5", fontSize: "23px" }}>
                      {item.icon}
                    </div>
                    <div style={{ marginBottom: "7px", color: "#2f2328", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "34px", fontWeight: "700" }}>
                      {vendorJourneyLoading ? "—" : item.value}
                    </div>
                    <h3 style={{ margin: "0 0 7px", color: "#34282d", fontSize: "16px" }}>{item.label}</h3>
                    <p style={{ margin: 0, color: "#81757a", fontSize: "13px", lineHeight: "1.6" }}>{item.help}</p>
                  </article>
                ))}
              </div>

              <div style={{ padding: "26px", border: "1px solid #efdce3", borderRadius: "24px", background: "linear-gradient(135deg, #fff8fb 0%, #ffffff 100%)", boxShadow: "0 14px 34px rgba(104,43,65,0.06)" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ display: "inline-block", marginBottom: "7px", color: "#c72d63", fontSize: "11px", fontWeight: "800", letterSpacing: "1.3px" }}>JOURNEY PROGRESS</span>
                  <h3 style={{ margin: 0, color: "#302327", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "24px" }}>Keep Growing With Milan</h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
                  {[
                    { label: "Profile Created", complete: vendorJourneyStats.profileCreated },
                    { label: "Business Details Added", complete: vendorJourneyStats.profileCreated },
                    { label: "Portfolio Added", complete: vendorShowcasePhotos.length > 0 || vendorShowcaseVideos.length > 0 },
                    { label: "First Customer Enquiry", complete: vendorJourneyStats.totalEnquiries > 0 },
                  ].map((milestone) => (
                    <div key={milestone.label} style={{ display: "flex", alignItems: "center", gap: "11px", minHeight: "54px", padding: "13px 15px", borderRadius: "15px", border: milestone.complete ? "1px solid #efccd9" : "1px solid #eee4e8", background: milestone.complete ? "#fff0f5" : "#faf7f8" }}>
                      <span style={{ width: "28px", height: "28px", flex: "0 0 28px", display: "grid", placeItems: "center", borderRadius: "50%", background: milestone.complete ? "#c72d63" : "#ffffff", border: milestone.complete ? "1px solid #c72d63" : "1px solid #d9cfd3", color: milestone.complete ? "#ffffff" : "#9a8e93", fontSize: "13px", fontWeight: "800" }}>
                        {milestone.complete ? "✓" : "○"}
                      </span>
                      <strong style={{ color: milestone.complete ? "#4b303a" : "#776c71", fontSize: "13px" }}>{milestone.label}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}


        {/* ===================================================
            CUSTOMER SERVICES / VENDOR BUSINESS SHOWCASE
        =================================================== */}

        {currentUser?.role?.toLowerCase() === "vendor" ? (

          <section
            className="services vendor-showcase-section"
            id="services"
          >
            <div className="container">

              <div className="section-heading">
                <p>MILAN FOR VENDORS</p>

                <h2>Showcase Your Business</h2>

                <span>
                  Add your business details, service photos and videos
                  so couples can understand your work and choose you
                  with confidence.
                </span>
              </div>

              <div className="vendor-showcase-grid">

                <article className="vendor-showcase-card">
                  <div className="vendor-showcase-icon">🏪</div>

                  <div className="vendor-showcase-content">
                    <h3>Business Details</h3>

                    <p>
                      Manage your business name, service category,
                      description, location and profile details.
                    </p>

                    <button
                      type="button"
                      className="vendor-showcase-action"
                      onClick={() =>
                        navigate("/vendor-profile-setup")
                      }
                    >
                      Manage Details →
                    </button>
                  </div>
                </article>

                <article className="vendor-showcase-card">
                  <div className="vendor-showcase-icon">🖼️</div>

                  <div className="vendor-showcase-content">
                    <h3>Service Photos</h3>

                    <p>
                      Add photos of your best wedding work and build
                      a portfolio that couples can trust.
                    </p>

                    <label className="vendor-showcase-action">
                      Add Photos →
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={vendorPortfolioUploading}
                        onChange={handleVendorPhotoSelect}
                      />
                    </label>
                  </div>
                </article>

                <article className="vendor-showcase-card">
                  <div className="vendor-showcase-icon">🎥</div>

                  <div className="vendor-showcase-content">
                    <h3>Service Videos</h3>

                    <p>
                      Upload short videos of your setup, venue,
                      decoration, DJ, catering or photography work.
                    </p>

                    <label className="vendor-showcase-action">
                      Add Videos →
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        disabled={vendorPortfolioUploading}
                        onChange={handleVendorVideoSelect}
                      />
                    </label>
                  </div>
                </article>

                <article className="vendor-showcase-card">
                  <div className="vendor-showcase-icon">📩</div>

                  <div className="vendor-showcase-content">
                    <h3>Customer Enquiries</h3>

                    <p>
                      Open your dashboard to manage wedding leads
                      and customer enquiries from couples.
                    </p>

                    <button
                      type="button"
                      className="vendor-showcase-action"
                      onClick={() =>
                        navigate("/vendor-dashboard")
                      }
                    >
                      View Enquiries →
                    </button>
                  </div>
                </article>

              </div>

              {(vendorPortfolioLoading ||
                vendorPortfolioUploading ||
                vendorPortfolioError) && (
                  <div
                    style={{
                      marginTop: "18px",
                      textAlign: "center",
                      color: vendorPortfolioError ? "#b42338" : "#7d6870",
                      fontSize: "13px",
                    }}
                  >
                    {vendorPortfolioError
                      ? `⚠ ${vendorPortfolioError}`
                      : vendorPortfolioUploading
                        ? "Uploading portfolio..."
                        : "Loading portfolio..."}
                  </div>
                )}

              {vendorShowcasePhotos.length > 0 && (
                <div className="vendor-media-section">
                  <div className="vendor-media-heading">
                    <span>PHOTO PORTFOLIO</span>
                    <h3>Your Selected Photos</h3>
                    <p>
                      Photos saved permanently to your Milan portfolio.
                    </p>
                  </div>

                  <div className="vendor-photo-preview-grid">
                    {vendorShowcasePhotos.map((photo, index) => (
                      <div
                        className="vendor-photo-preview"
                        key={photo.id || `${photo.file_url}-${index}`}
                      >
                        <img
                          src={`http://127.0.0.1:8000${photo.file_url}`}
                          alt="Vendor portfolio"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeVendorPhoto(photo.id)
                          }
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vendorShowcaseVideos.length > 0 && (
                <div className="vendor-media-section">
                  <div className="vendor-media-heading">
                    <span>VIDEO PORTFOLIO</span>
                    <h3>Your Selected Videos</h3>
                    <p>
                      Videos saved permanently to your Milan portfolio.
                    </p>
                  </div>

                  <div className="vendor-video-preview-grid">
                    {vendorShowcaseVideos.map((video, index) => (
                      <div
                        className="vendor-video-preview"
                        key={video.id || `${video.file_url}-${index}`}
                      >
                        <video
                          src={`http://127.0.0.1:8000${video.file_url}`}
                          controls
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeVendorVideo(video.id)
                          }
                          aria-label="Remove video"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </section>

        ) : (

          <section
            className="services"
            id="services"
          >

            <div className="container">

              <div className="section-heading">

                <p>
                  EXPLORE MILAN
                </p>

                <h2>
                  Everything For Your Wedding
                </h2>

                <span>
                  Choose a service below to find trusted wedding
                  vendors near you.
                </span>

              </div>


              <div className="service-step-hint">
                <span>STEP 1 OF 2</span>
                <strong>Choose a service</strong>
              </div>

              <div className="service-grid">

                {services.map(
                  ([
                    icon,
                    title,
                    text,
                  ]) => (

                    <div
                      className={`service-card ${selectedService ===
                        (
                          title === "Marriage Halls"
                            ? "Marriage Hall"
                            : title
                        )
                        ? "service-card-selected"
                        : ""
                        }`}
                      key={title}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleServiceClick(
                          title
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          handleServiceClick(
                            title
                          );
                        }
                      }}
                      style={{
                        cursor: "pointer",
                      }}
                    >

                      <div className="service-icon">
                        {icon}
                      </div>

                      <div>

                        <h3>
                          {title}
                        </h3>

                        <p>
                          {text}
                        </p>

                        <span className="service-explore">
                          Explore →
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>


              {/* CUSTOMER SERVICE LOCATION SEARCH */}

              {selectedService && (

                <div
                  id="service-location-search"
                  style={{
                    marginTop: "34px",
                    padding: "28px",
                    border:
                      "1px solid #efdce3",
                    borderRadius: "24px",
                    background: "#fffafb",
                    boxShadow:
                      "0 16px 40px rgba(104,43,65,0.08)",
                  }}
                >

                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "22px",
                    }}
                  >

                    <div className="service-step-hint service-step-hint-location">
                      <span>STEP 2 OF 2</span>
                      <strong>Choose your location</strong>
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        marginBottom: "8px",
                        color: "#c72d63",
                        fontSize: "11px",
                        fontWeight: "800",
                        letterSpacing: "1.5px",
                      }}
                    >
                      FIND NEAR YOU
                    </span>

                    <h3
                      style={{
                        margin: "0 0 7px",
                        color: "#302327",
                        fontFamily:
                          'Georgia, "Times New Roman", serif',
                        fontSize: "28px",
                      }}
                    >
                      Find {selectedService} Near You
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#81767b",
                        fontSize: "13px",
                      }}
                    >
                      Select your state and district, then search
                      your area. Pincode will fill automatically.
                    </p>

                  </div>


                  {locationError && (

                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "#fff0f1",
                        color: "#b42338",
                        fontSize: "13px",
                      }}
                    >
                      ⚠ {locationError}
                    </div>

                  )}


                  <div
                    className="customer-location-grid dependent-location-grid"
                  >

                    {/* STATE */}

                    <div className="search-field">

                      <div className="field-icon">
                        📍
                      </div>

                      <div className="field-content">

                        <small>
                          State
                        </small>

                        <select
                          value={state}
                          onFocus={loadStates}
                          onChange={
                            handleCustomerStateChange
                          }
                          className="location-select"
                          disabled={statesLoading}
                        >
                          <option value="">
                            {statesLoading
                              ? "Loading states..."
                              : "Select State"}
                          </option>

                          {availableStates.map(
                            (stateName) => (
                              <option
                                key={stateName}
                                value={stateName}
                              >
                                {stateName}
                              </option>
                            )
                          )}
                        </select>

                      </div>

                    </div>


                    {/* DISTRICT */}

                    <div className="search-field">

                      <div className="field-icon">
                        🏙️
                      </div>

                      <div className="field-content">

                        <small>
                          District / City
                        </small>

                        <select
                          value={district}
                          onChange={
                            handleCustomerDistrictChange
                          }
                          className="location-select"
                          disabled={
                            !state ||
                            districtsLoading
                          }
                        >
                          <option value="">
                            {districtsLoading
                              ? "Loading districts..."
                              : state
                                ? "Select District / City"
                                : "Select State First"}
                          </option>

                          {availableDistricts.map(
                            (districtName) => (
                              <option
                                key={districtName}
                                value={districtName}
                              >
                                {districtName}
                              </option>
                            )
                          )}
                        </select>

                      </div>

                    </div>


                    {/* AREA SEARCH */}

                    <div
                      className="search-field area-search-field"
                    >

                      <div className="field-icon">
                        🔎
                      </div>

                      <div className="field-content">

                        <small>
                          Area / Locality
                        </small>

                        <input
                          type="text"
                          value={areaSearch}
                          onChange={
                            handleAreaSearchChange
                          }
                          onFocus={() => {
                            if (
                              areaSuggestions.length > 0
                            ) {
                              setShowAreaSuggestions(
                                true
                              );
                            }
                          }}
                          placeholder={
                            !state
                              ? "Select state first"
                              : !district
                                ? "Select district first"
                                : "Type area / locality"
                          }
                          disabled={
                            !state || !district
                          }
                          className="area-input"
                          autoComplete="off"
                        />

                      </div>

                      {showAreaSuggestions && (
                        <div className="location-suggestions">

                          {areaSearchLoading ? (

                            <div className="location-suggestion-loading">
                              Searching locations...
                            </div>

                          ) : areaSuggestions.length > 0 ? (

                            areaSuggestions.map(
                              (location, index) => (

                                <button
                                  type="button"
                                  key={`${location.pincode}-${location.area}-${index}`}
                                  className="location-suggestion-item"
                                  onClick={() =>
                                    handleAreaSuggestionSelect(
                                      location
                                    )
                                  }
                                >

                                  <strong>
                                    {location.area}
                                  </strong>

                                  <span>
                                    {location.district},{" "}
                                    {location.state}
                                    {" • "}
                                    {location.pincode}
                                  </span>

                                </button>

                              )
                            )

                          ) : (

                            <div className="location-suggestion-loading">
                              No matching locations found.
                            </div>

                          )}

                        </div>
                      )}

                    </div>


                    {/* PINCODE AUTO FILLED */}

                    <div className="search-field">

                      <div className="field-icon">
                        📮
                      </div>

                      <div className="field-content">

                        <small>
                          Pincode
                        </small>

                        <input
                          type="text"
                          value={customerPincode}
                          readOnly
                          placeholder="Auto-filled"
                          className="area-input"
                        />

                      </div>

                    </div>

                  </div>


                  <button
                    type="button"
                    className="search-btn"
                    onClick={
                      handleServiceSearch
                    }
                    disabled={
                      locationLoading
                    }
                    style={{
                      display: "block",
                      width:
                        "min(300px, 100%)",
                      minHeight: "46px",
                      margin: "20px auto 0",
                      borderRadius: "24px",
                    }}
                  >
                    {locationLoading
                      ? "Finding Location..."
                      : `Find ${selectedService}`}
                  </button>

                </div>

              )}

            </div>

          </section>

        )}


        {/* ===================================================
            VENDORS
        =================================================== */}

        {currentUser?.role?.toLowerCase() !== "vendor" && (
          <section
            className="vendors"
            id="vendors"
          >

            <div className="container">

              <div className="section-heading">

                <p>
                  TOP VENDORS
                </p>

                <h2>
                  {selectedService
                    ? `${selectedService} Near You`
                    : "Trusted Wedding Vendors"}
                </h2>

                <span>
                  {selectedService
                    ? `Discover trusted ${selectedService} professionals in your selected area.`
                    : "Find highly-rated professionals for your wedding."}
                </span>

              </div>
              <div className="vendor-grid">

                {vendorsLoading ? (

                  <p>
                    Loading vendors...
                  </p>

                ) : vendorList.length > 0 ? (

                  vendorList.map((vendor) => (

                    <article
                      className="vendor-card vendor-result-card"
                      key={vendor.id}
                    >

                      <div className="vendor-result-top">

                        <div className="vendor-icon">

                          {vendor.category === "Marriage Hall" && "🏰"}

                          {vendor.category === "Decoration" && "🌺"}

                          {vendor.category === "Photography" && "📸"}

                          {vendor.category === "Catering" && "🍽️"}

                          {vendor.category === "DJ & Music" && "🎵"}

                          {vendor.category === "Makeup & Beauty" && "💄"}

                        </div>


                        <div className="vendor-result-heading">

                          <span className="vendor-category-badge">
                            {vendor.category}
                          </span>

                          <h3>
                            {vendor.business_name}
                          </h3>

                        </div>


                        {vendor.is_verified && (
                          <span
                            className="vendor-verification-badge verified vendor-verification-badge-compact"
                            title="Verified by Milan"
                            aria-label="Verified by Milan"
                          >
                            ✓
                          </span>
                        )}

                      </div>


                      <div className="vendor-result-location">

                        <span className="vendor-location-icon">
                          📍
                        </span>

                        <div>

                          <small>
                            Serving Location
                          </small>

                          <strong>
                            {vendor.area
                              ? `${vendor.area}, `
                              : ""}

                            {vendor.district
                              ? `${vendor.district}, `
                              : ""}

                            {vendor.state || ""}
                          </strong>

                        </div>

                      </div>


                      {vendor.description && (

                        <p className="vendor-result-description">
                          {vendor.description}
                        </p>

                      )}


                      <div className="vendor-result-actions">

                        <button
                          type="button"
                          onClick={() => toggleSavedVendor(vendor.id)}
                          disabled={savingVendorIds.includes(Number(vendor.id))}
                          aria-pressed={savedVendorIds.includes(Number(vendor.id))}
                          style={{
                            border: "1px solid #e8b7c8",
                            background: savedVendorIds.includes(Number(vendor.id))
                              ? "#fff0f5"
                              : "#ffffff",
                            color: "#9f3158",
                            borderRadius: "999px",
                            padding: "11px 18px",
                            fontWeight: 700,
                            cursor: savingVendorIds.includes(Number(vendor.id))
                              ? "wait"
                              : "pointer",
                          }}
                        >
                          {savingVendorIds.includes(Number(vendor.id))
                            ? "Saving..."
                            : savedVendorIds.includes(Number(vendor.id))
                              ? "♥ Saved"
                              : "♡ Save"}
                        </button>

                        <button
                          type="button"
                          className="vendor-primary-action"
                          onClick={() =>
                            navigate(
                              `/vendors/${vendor.id}`
                            )
                          }
                        >
                          View Details
                          <span>→</span>
                        </button>

                      </div>

                    </article>

                  ))

                ) : (

                  <div
                    style={{
                      width: "min(620px, 100%)",
                      margin: "10px auto 0",
                      padding: "42px 28px",
                      textAlign: "center",
                      background: "#fffafb",
                      border: "1px solid #f0dce4",
                      borderRadius: "24px",
                      boxShadow:
                        "0 12px 35px rgba(126, 47, 77, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: "62px",
                        height: "62px",
                        margin: "0 auto 18px",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        background: "#fdebf1",
                        fontSize: "28px",
                      }}
                    >
                      💍
                    </div>

                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontFamily:
                          'Georgia, "Times New Roman", serif',
                        fontSize: "27px",
                        color: "#302327",
                      }}
                    >
                      {selectedService
                        ? `No ${selectedService} Found Nearby`
                        : "Find Your Perfect Wedding Vendor"}
                    </h3>

                    <p
                      style={{
                        maxWidth: "470px",
                        margin: "0 auto",
                        color: "#81767b",
                        lineHeight: "1.7",
                        fontSize: "14px",
                      }}
                    >
                      {selectedService
                        ? `We don't have a ${selectedService} vendor listed in your selected area yet. Try another nearby area or explore another wedding service.`
                        : "Choose a wedding service above and enter your location to discover vendors near you."}
                    </p>

                    {selectedService && (
                      <div
                        style={{
                          marginTop: "24px",
                          display: "flex",
                          justifyContent: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            document
                              .getElementById(
                                "service-location-search"
                              )
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                          }}
                          style={{
                            padding: "12px 24px",
                            border: "none",
                            borderRadius: "24px",
                            background: "#cc2f65",
                            color: "#ffffff",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Change Area
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedService("");
                            setCustomerPincode("");
                            setState("");
                            setDistrict("");
                            setArea("");
                            setAreaSearch("");
                            setAreaSuggestions([]);
                            setShowAreaSuggestions(false);
                            setCustomerAreas([]);
                            setAvailableDistricts([]);
                            setVendorList([]);

                            document
                              .getElementById("services")
                              ?.scrollIntoView({
                                behavior: "smooth",
                              });
                          }}
                          style={{
                            padding: "12px 24px",
                            border: "1px solid #cc2f65",
                            borderRadius: "24px",
                            background: "#ffffff",
                            color: "#cc2f65",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Explore Other Services
                        </button>
                      </div>
                    )}
                  </div>

                )}

              </div>






            </div>

          </section >
        )}


        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        < section
          className="how-it-works"
          id="how-it-works"
        >

          <div className="container">

            <div className="section-heading">

              <p>
                HOW IT WORKS
              </p>

              <h2>
                Plan Your Wedding With Milan
              </h2>

            </div>


            <div className="steps">


              <div className="step">

                <span>
                  01
                </span>

                <div>
                  🔍
                </div>

                <h3>
                  Search
                </h3>

                <p>
                  Find wedding vendors
                  near you.
                </p>

              </div>


              <div className="step">

                <span>
                  02
                </span>

                <div>
                  ⚖️
                </div>

                <h3>
                  Compare
                </h3>

                <p>
                  Compare prices,
                  ratings and reviews.
                </p>

              </div>


              <div className="step">

                <span>
                  03
                </span>

                <div>
                  📅
                </div>

                <h3>
                  Book
                </h3>

                <p>
                  Choose your favorite
                  vendor.
                </p>

              </div>


              <div className="step">

                <span>
                  04
                </span>

                <div>
                  🎉
                </div>

                <h3>
                  Celebrate
                </h3>

                <p>
                  Enjoy your perfect
                  wedding day.
                </p>

              </div>

            </div>

          </div>

        </section >


        {/* ===================================================
            PREMIUM 3D WEBSITE ENDING
        =================================================== */}

        <section className="milan-3d-ending">

          <div className="milan-3d-orb milan-3d-orb-one" />
          <div className="milan-3d-orb milan-3d-orb-two" />
          <div className="milan-3d-orb milan-3d-orb-three" />

          <div className="milan-3d-ending-inner">

            <div className="milan-3d-kicker">
              THE MILAN EXPERIENCE
            </div>

            <h2 className="milan-3d-title">
              One Celebration.
              <br />
              Countless Beautiful Moments.
            </h2>

            <p className="milan-3d-subtitle">
              Milan brings the people behind your perfect wedding closer —
              discover, save and connect with wedding professionals in one
              beautiful place.
            </p>

            <div className="milan-3d-scene">

              <article className="milan-3d-card milan-3d-card-left">
                <div className="milan-3d-card-icon">
                  📍
                </div>

                <h3>
                  Discover Near You
                </h3>

                <p>
                  Find wedding venues and professionals around your city and locality.
                </p>
              </article>

              <article className="milan-3d-card milan-3d-card-center">
                <div className="milan-3d-card-icon">
                  ♡
                </div>

                <h3>
                  Save What You Love
                </h3>

                <p>
                  Keep your favourite wedding vendors together while planning your special day.
                </p>
              </article>

              <article className="milan-3d-card milan-3d-card-right">
                <div className="milan-3d-card-icon">
                  💌
                </div>

                <h3>
                  Connect With Ease
                </h3>

                <p>
                  Send enquiries directly and follow your wedding conversations effortlessly.
                </p>
              </article>

            </div>

            <p className="milan-3d-promise">
              “From the first search to the final celebration,
              <br />
              Milan stays a part of your wedding journey.”
            </p>

            <div className="milan-3d-signature">
              MILAN ♡
            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          PREMIUM FOOTER
      ===================================================== */}

      <footer className="milan-premium-footer">

        <div className="milan-premium-footer-main">

          <div className="milan-premium-footer-brand-wrap">
            <div className="milan-premium-footer-brand">
              Milan ♡
            </div>

            <p>
              Where beautiful celebrations begin.
            </p>
          </div>

          <nav className="milan-premium-footer-links" aria-label="Footer navigation">
            <a href="#home">
              Home
            </a>

            <a href="#services">
              Services
            </a>

            <a href="#vendors">
              Vendors
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

            {currentUser?.role?.toLowerCase() === "customer" && (
              <Link to="/saved-vendors">
                Saved Vendors
              </Link>
            )}
          </nav>

        </div>

        <div className="milan-premium-footer-bottom">
          <span>
            Made with ♡ for Indian weddings
          </span>

          <span>
            © 2026 Milan. All rights reserved.
          </span>
        </div>

      </footer>

    </div >
  );


  /* =======================================================
     ROUTES
  ======================================================= */

  return (
    <Routes>

      {/* ADMIN:
          Never show the customer/vendor marketplace homepage to admin.
          Even "/" opens the Admin Dashboard. */}
      <Route
        path="/"
        element={isAdmin ? <AdminDashboard /> : homePage}
      />

      <Route
        path="/admin-dashboard"
        element={isAdmin ? <AdminDashboard /> : homePage}
      />

      {/* CUSTOMER / GENERAL PAGES:
          Admin is blocked from these customer-facing pages. */}
      <Route
        path="/profile"
        element={isAdmin ? <AdminDashboard /> : <ProfilePage />}
      />

      <Route
        path="/saved-vendors"
        element={isAdmin ? <AdminDashboard /> : <SavedVendorsPage />}
      />

      <Route
        path="/customer-dashboard"
        element={isAdmin ? <AdminDashboard /> : <CustomerDashboard />}
      />

      <Route
        path="/vendors/:vendorId"
        element={isAdmin ? <AdminDashboard /> : <VendorDetails />}
      />

      {/* VENDOR PAGES:
          Admin also stays inside the admin experience. */}
      <Route
        path="/vendor-dashboard"
        element={isAdmin ? <AdminDashboard /> : <VendorDashboard />}
      />

      <Route
        path="/vendor-verification"
        element={isAdmin ? <AdminDashboard /> : <VendorVerification />}
      />

      <Route
        path="/vendor-profile-setup"
        element={isAdmin ? <AdminDashboard /> : <VendorProfileSetup />}
      />

      <Route
        path="*"
        element={isAdmin ? <AdminDashboard /> : homePage}
      />

    </Routes>
  );
}

export default App;