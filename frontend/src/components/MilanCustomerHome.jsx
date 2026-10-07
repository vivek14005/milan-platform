import mandapImage from "../assets/milan-mandap.png";

import "./MilanCustomerHome.css";

const cities = [

  ["Mathura", "Uttar Pradesh", "A beginning in the city of love."],

  ["Agra", "Uttar Pradesh", "A little grandeur, a lot of heart."],

  ["Noida", "Uttar Pradesh", "Modern celebrations, your way."],

  ["Delhi", "Delhi", "Big celebrations. Personal details."],

  ["Lucknow", "Uttar Pradesh", "Elegance with a warm welcome."],

];

function MilanCustomerHome({

  currentUser,

  firstName,

  onLogin,

  onVendorLogin,

  onLogout,

  onProfile,

  onSavedVendors,

  onRequestVendors,

  notifications = [],

  unreadNotificationCount = 0,

  notificationsLoading = false,

  showNotifications = false,

  onToggleNotifications,

  onNotificationClick,

  onMarkAllNotificationsRead,

  services,

  selectedService,

  onServiceSelect,

  state,

  district,

  availableStates,

  availableDistricts,

  statesLoading,

  districtsLoading,

  locationLoading,

  locationError,

  onLoadStates,

  onStateChange,

  onDistrictChange,

  onSearch,

  onCitySelect,

  vendorsLoading,

  vendorList,

  savedVendorIds,

  savingVendorIds,

  onToggleSaved,

  onVendorDetails,

}) {

  const exploreNearby = () => {

    if (selectedService) {

      onSearch();

      return;

    }

    document.getElementById("wedding-team")?.scrollIntoView({ behavior: "smooth" });

  };

  return (

    <div className="milan-site">

      <header className="milan-nav">

        <a className="milan-logo" href="#home">

          Milan<span>•</span>

        </a>

        <nav aria-label="Main navigation">

          <a href="#cities">Cities</a>

          <a href="#wedding-team">Wedding team</a>

          <a href="#how-it-works">How it works</a>

          {currentUser?.role?.toLowerCase() === "customer" && (

            <details className="milan-dashboard-menu">

              <summary>Dashboard</summary>

              <div className="milan-dashboard-options">

                <button type="button" onClick={onProfile}>My Profile</button>

                <button type="button" onClick={onSavedVendors}>Saved Vendors</button>

                <button type="button" onClick={onRequestVendors}>Request Vendors</button>

              </div>

            </details>

          )}

        </nav>

        <div className="milan-nav-actions">

          {currentUser ? (

            <>

              {currentUser?.role?.toLowerCase() === "customer" && (

                <div className="milan-customer-notifications">

                  <button

                    type="button"

                    className="milan-notification-bell"

                    aria-label="Customer notifications"

                    aria-expanded={showNotifications}

                    onClick={onToggleNotifications}

                  >

                    <span aria-hidden="true">🔔</span>

                    {unreadNotificationCount > 0 && (

                      <strong>

                        {unreadNotificationCount > 99

                          ? "99+"

                          : unreadNotificationCount}

                      </strong>

                    )}

                  </button>

                  {showNotifications && (

                    <section className="milan-notification-panel">

                      <header>

                        <div>

                          <h3>Notifications</h3>

                          <p>{unreadNotificationCount} unread</p>

                        </div>

                        {unreadNotificationCount > 0 && (

                          <button

                            type="button"

                            onClick={onMarkAllNotificationsRead}

                          >

                            Mark all as read

                          </button>

                        )}

                      </header>

                      <div className="milan-notification-list">

                        {notificationsLoading && notifications.length === 0 ? (

                          <p className="milan-notification-empty">

                            Loading notifications...

                          </p>

                        ) : notifications.length === 0 ? (

                          <p className="milan-notification-empty">

                            No notifications yet.

                          </p>

                        ) : (

                          notifications.map((notification) => (

                            <button

                              type="button"

                              key={notification.id}

                              className={`milan-notification-item ${notification.is_read ? "is-read" : "is-unread"

                                }`}

                              onClick={() =>

                                onNotificationClick(notification)

                              }

                            >

                              <span className="milan-notification-icon">

                                {notification.notification_type === "booking_message"

                                  ? "💬"

                                  : notification.notification_type?.startsWith("price_")

                                    ? "₹"

                                    : notification.notification_type === "vendor_package"

                                      ? "🎁"

                                      : "💌"}

                              </span>

                              <span className="milan-notification-copy">

                                <strong>{notification.title}</strong>

                                <small>{notification.message}</small>

                                {notification.created_at && (

                                  <time>

                                    {new Date(

                                      notification.created_at

                                    ).toLocaleString()}

                                  </time>

                                )}

                              </span>

                              {!notification.is_read && (

                                <i aria-label="Unread notification" />

                              )}

                            </button>

                          ))

                        )}

                      </div>

                    </section>

                  )}

                </div>

              )}

              <span className="milan-customer-greeting">

                Hi, {firstName}

              </span>

              <button

                type="button"

                className="milan-text-action"

                onClick={onLogout}

              >

                Logout

              </button>

            </>

          ) : (

            <>

              <button type="button" className="milan-account" onClick={onLogin}>

                Login / Join

              </button>

              <button

                type="button"

                className="milan-vendor-login"

                onClick={onVendorLogin}

              >

                Vendor Login

              </button>

            </>

          )}

        </div>

      </header>

      <main>

        <section className="milan-hero" id="home">

          <p className="milan-hero-edition">MILAN / EST. WITH LOVE</p>

          <div className="milan-hero-copy">

            <p className="milan-kicker">India&apos;s wedding marketplace</p>

            <h1>A beautiful<br />beginning.<br /><em>Closer to you.</em></h1>

          </div>

          <figure className="milan-mandap">

            <img src={mandapImage} alt="Ivory wedding mandap decorated with flowers and warm golden lamps" />

            <figcaption>Local experts. Extraordinary days.</figcaption>

          </figure>

        </section>

        <section className="milan-location-wrap" id="milan-location-panel">

          <h2>Find wedding services near you</h2>

          {locationError && (

            <p className="milan-location-error" role="alert">

              {locationError}

            </p>

          )}

          <div className="milan-location-panel">

            <label>

              <span>State</span>

              <select

                value={state}

                onFocus={onLoadStates}

                onChange={onStateChange}

                disabled={statesLoading}

              >

                <option value="">

                  {statesLoading ? "Loading states..." : "Choose state"}

                </option>

                {availableStates.map((item) => (

                  <option key={item} value={item}>

                    {item}

                  </option>

                ))}

              </select>

            </label>

            <label>

              <span>District / City</span>

              <select

                value={district}

                onChange={onDistrictChange}

                disabled={!state || districtsLoading}

              >

                <option value="">

                  {districtsLoading

                    ? "Loading districts..."

                    : state

                      ? "Choose district"

                      : "Choose state first"}

                </option>

                {availableDistricts.map((item) => (

                  <option key={item} value={item}>

                    {item}

                  </option>

                ))}

              </select>

            </label>

            <button

              type="button"

              className="milan-explore"

              onClick={exploreNearby}

              disabled={locationLoading}

            >

              {locationLoading

                ? "Finding..."

                : selectedService

                  ? `Find ${selectedService}`

                  : "Explore nearby"}

              <b>↗</b>

            </button>

          </div>

          {!selectedService && (

            <p className="milan-location-note">

              Choose your state and district, then select one service below.

            </p>

          )}

        </section>

        <div className="milan-ticker" aria-hidden="true">

          <div className="milan-ticker-track">

            <span>UTTAR PRADESH ✦ DELHI ✦ MAHARASHTRA ✦ RAJASTHAN ✦ PUNJAB ✦ HARYANA ✦ GUJARAT ✦ MADHYA PRADESH ✦ BIHAR ✦ JHARKHAND ✦ WEST BENGAL ✦ ODISHA ✦ ASSAM ✦ UTTARAKHAND ✦ HIMACHAL PRADESH ✦ JAMMU AND KASHMIR ✦ KARNATAKA ✦ KERALA ✦ TAMIL NADU ✦ TELANGANA ✦ ANDHRA PRADESH ✦ GOA ✦ CHHATTISGARH ✦</span>

            <span>UTTAR PRADESH ✦ DELHI ✦ MAHARASHTRA ✦ RAJASTHAN ✦ PUNJAB ✦ HARYANA ✦ GUJARAT ✦ MADHYA PRADESH ✦ BIHAR ✦ JHARKHAND ✦ WEST BENGAL ✦ ODISHA ✦ ASSAM ✦ UTTARAKHAND ✦ HIMACHAL PRADESH ✦ JAMMU AND KASHMIR ✦ KARNATAKA ✦ KERALA ✦ TAMIL NADU ✦ TELANGANA ✦ ANDHRA PRADESH ✦ GOA ✦ CHHATTISGARH ✦</span>

          </div>

        </div>

        <section className="milan-intro">

          <span>01 / DISCOVER</span>

          <h2>One place for every<br /><em>beautiful detail.</em></h2>

          <p>From the first venue visit to the final dance, Milan brings trusted wedding professionals in your city together on one thoughtfully designed platform.</p>

        </section>

        <section className="milan-cities" id="cities">

          <div className="milan-section-heading">

            <span>A CELEBRATION CLOSE TO HOME</span>

            <h2>Your city.<br /><em>Your beginning.</em></h2>

            <p>Choose a city to prepare your state and district above.</p>

          </div>

          <div className="milan-city-grid">

            {cities.map(([city, cityState, copy], index) => (

              <button type="button" key={city} onClick={() => onCitySelect(city)}>

                <span>{String(index + 1).padStart(2, "0")} / {cityState}</span>

                <h3>{city}</h3><p>{copy}</p><b>Set location ↗</b>

              </button>

            ))}

          </div>

        </section>

        <section className="milan-team" id="wedding-team">

          <div className="milan-section-heading">

            <span>YOUR PEOPLE / YOUR CELEBRATION</span>

            <h2>Build your<br /><em>wedding team.</em></h2>

            <p>Select one service to find matching professionals in your chosen district.</p>

          </div>

          <div className="milan-team-grid">

            {services.map(([icon, title, copy], index) => {

              const normalized = title === "Marriage Halls" ? "Marriage Hall" : title;

              const active = selectedService === normalized;

              return (

                <button type="button" key={title} className={active ? "active" : ""} onClick={() => onServiceSelect(title)} aria-pressed={active}>

                  <span>{String(index + 1).padStart(2, "0")} / SERVICE</span>

                  <i aria-hidden="true">{icon}</i><h3>{title}</h3><p>{copy}</p>

                  <b>{active ? "Selected ✓" : "Find professionals ↗"}</b>

                </button>

              );

            })}

          </div>

        </section>

        <section className="milan-results" id="vendors">

          <div className="milan-section-heading">

            <span>NEAR YOU</span>

            <h2>{selectedService ? `${selectedService} professionals.` : "Your selected professionals."}</h2>

            <p>{selectedService ? "Results use your existing Milan vendor API and selected location." : "Choose one wedding service above to begin."}</p>

          </div>

          {vendorsLoading ? <p className="milan-result-message">Loading vendors...</p> : vendorList.length ? (

            <div className="milan-vendor-grid">

              {vendorList.map((vendor) => (

                <article key={vendor.id}>

                  <span>{vendor.is_verified ? "✓ VERIFIED" : "MILAN VENDOR"}</span>

                  <h3>{vendor.business_name}</h3>

                  <p>{vendor.area ? `${vendor.area}, ` : ""}{vendor.district ? `${vendor.district}, ` : ""}{vendor.state || ""}</p>

                  {vendor.description && <small>{vendor.description}</small>}

                  <div>

                    <button type="button" onClick={() => onToggleSaved(vendor.id)} disabled={savingVendorIds.includes(Number(vendor.id))}>

                      {savedVendorIds.includes(Number(vendor.id)) ? "♥ Saved" : "♡ Save"}

                    </button>

                    <button type="button" onClick={() => onVendorDetails(vendor.id)}>View details ↗</button>

                  </div>

                </article>

              ))}

            </div>

          ) : <p className="milan-result-message">{selectedService ? "Complete your location above to see available vendors." : "No service selected yet."}</p>}

        </section>

        <section className="milan-love-lines" id="love-lines">

          <div className="milan-love-heart">

            <div className="milan-love-heart-art" aria-hidden="true">

              <svg

                className="milan-love-heart-outline"

                viewBox="0 0 1000 850"

                preserveAspectRatio="xMidYMid meet"

              >

                <defs>

                  <linearGradient id="milanRibbonGradient" x1="0" y1="0" x2="1" y2="1">

                    <stop offset="0%" stopColor="#f5d88f" />

                    <stop offset="24%" stopColor="#b77925" />

                    <stop offset="48%" stopColor="#64152f" />

                    <stop offset="72%" stopColor="#a93758" />

                    <stop offset="100%" stopColor="#edc775" />

                    <animateTransform

                      attributeName="gradientTransform"

                      type="rotate"

                      from="0 .5 .5"

                      to="360 .5 .5"

                      dur="7s"

                      repeatCount="indefinite"

                    />

                  </linearGradient>

                  <filter id="milanRibbonShadow" x="-30%" y="-30%" width="160%" height="160%">

                    <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#5d1730" floodOpacity=".2" />

                  </filter>

                </defs>

                <path className="milan-ribbon-shadow" d="M500 795 C435 729 125 510 125 285 C125 145 230 70 345 70 C417 70 470 108 500 166 C530 108 583 70 655 70 C770 70 875 145 875 285 C875 510 565 729 500 795 Z" />

                <path className="milan-ribbon-main" d="M500 795 C435 729 125 510 125 285 C125 145 230 70 345 70 C417 70 470 108 500 166 C530 108 583 70 655 70 C770 70 875 145 875 285 C875 510 565 729 500 795 Z" />

                <path className="milan-ribbon-shine" d="M500 795 C435 729 125 510 125 285 C125 145 230 70 345 70 C417 70 470 108 500 166 C530 108 583 70 655 70 C770 70 875 145 875 285 C875 510 565 729 500 795 Z" />

              </svg>

            </div>

            <div className="milan-love-heart-glow" aria-hidden="true" />

            <div className="milan-heart-sparkles" aria-hidden="true">

              <i>✦</i><i>✧</i><i>✦</i><i>•</i><i>✧</i><i>✦</i><i>•</i><i>✧</i>

            </div>

            <div className="milan-love-heart-content">

              <div className="milan-love-monogram" aria-hidden="true">

                <span>VOWS</span><b>♥</b><span>FOREVER</span>

              </div>

              <p className="milan-love-kicker">FOR EVERY KIND OF FOREVER</p>

              <div className="milan-love-line-stage">

                <p>Two hearts. <em>One home.</em><span>A lifetime in between.</span></p>

                <p>Not just a wedding.<em>The first page of forever.</em></p>

                <p>You found each other.<em>Now let every detail find its place.</em></p>

                <p>Every ritual holds a promise.<em>Every promise holds a lifetime.</em></p>

                <p>A thousand little moments.<em>One unforgettable beginning.</em></p>

                <p>From your first yes<em>to your forever.</em></p>

                <p>Your people. Your traditions.<em>Your beautiful beginning.</em></p>

                <p>Where two families meet,<em>one new story begins.</em></p>

                <p>The day may pass.<em>The feeling stays forever.</em></p>

                <p>Two names becoming<em>one beautiful story.</em></p>

              </div>

              <div className="milan-love-signature">

                <span />

                WITH LOVE, MILAN •

                <span />

              </div>

            </div>

          </div>

        </section>

        <section className="milan-how" id="how-it-works">

          <div><span>HOW MILAN WORKS</span><h2>Less searching.<br /><em>More celebrating.</em></h2></div>

          <ol>

            <li><span>01</span><div><h3>Set your location</h3><p>Choose your state and district.</p></div></li>

            <li><span>02</span><div><h3>Choose one service</h3><p>Tell Milan what you need for your celebration.</p></div></li>

            <li><span>03</span><div><h3>Connect directly</h3><p>Compare, save and contact the right professionals.</p></div></li>

          </ol>

        </section>

        <section className="milan-vendor-cta" id="for-vendors">

          <p>ARE YOU A WEDDING PROFESSIONAL?</p>

          <h2>Your next couple<br />is already <em>looking.</em></h2>

          <button type="button" onClick={onVendorLogin}>List your business <span>↗</span></button>

          <b aria-hidden="true">Milan.</b>

        </section>

      </main>

      <footer className="milan-footer">

        <a className="milan-logo" href="#home">Milan<span>•</span></a>

        <p>Made for celebrations across India.<small>Live listings depend on your Milan backend.</small></p>

        <nav><a href="#cities">Cities</a><a href="#love-lines">With love</a><a href="#home">Back to top ↑</a></nav>

      </footer>

    </div>

  );

}

export default MilanCustomerHome;
