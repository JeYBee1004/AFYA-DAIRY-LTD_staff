// Supabase Client Setup
const supabaseUrl = 'https://nowlgjwlsaotkcniiswy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd2xnandsc2FvdGtjbmlpc3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjQ3ODMsImV4cCI6MjA2OTgwMDc4M30.b0qzgGVWqxRIoEK485QX1pnXFqIPziG7jIr0vyj1L1U'; 

(function antiInspect(window, document) {
  'use strict';

  // CONFIG: choose 'warn' or 'block' or 'log' when DevTools detected
  const ON_DETECT_ACTION = 'block'; 
  const CHECK_INTERVAL_MS = 500; 
  const SIZE_THRESHOLD = 160;

  // small helper to replace page content
  function blockPage(message) {
    try {
      document.head.innerHTML = '';
      document.body.innerHTML = `
        <div style="height:100vh;display:flex;align-items:center;justify-content:center;
                    font-family:Arial, sans-serif;text-align:center;padding:20px;">
          <div>
            <h1 style="margin:0 0 10px 0;">Access restricted</h1>
            <p style="margin:0 0 20px 0;">${message}</p>
          </div>
        </div>`;
      // optionally prevent further JS
      Object.freeze(document.body);
    } catch (e) {
      // fallback: redirect to blank page
      window.location.href = 'about:blank';
    }
  }

  // 1) Disable context menu (right-click)
  function disableContextMenu() {
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      // optional visible feedback:
      // alert("Right-click is disabled on this page.");
      return false;
    }, { passive: false });
  }

  // 2) Disable selection and copy (optional)
  function disableSelectionAndCopy() {
    // prevent text selection and copy shortcuts
    document.addEventListener('selectstart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('copy', (e) => e.preventDefault(), { passive: false });
  }

  // 3) Disable common devtools & view-source keyboard shortcuts
  function disableDevtoolsShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Normalize key name for cross-browser consistency
      const key = e.key || e.keyCode;

      // F12
      if (key === 'F12' || key === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / J / C  (DevTools)
      if (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C' || key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (view-source)
      if (e.ctrlKey && (key === 'U' || key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+K (Firefox console), Ctrl+Shift+S (some browsers)
      if (e.ctrlKey && e.shiftKey && (key === 'K' || key === 'k' || key === 'S' || key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { passive: false });
  }

  // 4) Detect DevTools using outer/inner dimension heuristic + visibility
  function startDevtoolsDetector(onDetect) {
    let lastState = { open: false, orientation: null };

    function check() {
      const widthDiff  = Math.abs(window.outerWidth - window.innerWidth);
      const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
      const isOpen = widthDiff > SIZE_THRESHOLD || heightDiff > SIZE_THRESHOLD;

      // If devtools open state changed
      if (isOpen !== lastState.open) {
        lastState.open = isOpen;
        lastState.orientation = (widthDiff > heightDiff) ? 'vertical' : 'horizontal';
        if (isOpen) onDetect({ orientation: lastState.orientation, widthDiff, heightDiff });
      }
    }

    // also try to detect when developer tools are undocked (window.onfocus/blur sometimes helps)
    window.addEventListener('resize', check);
    window.addEventListener('focus', check);
    window.addEventListener('blur', check);

    // periodic check for browsers that don't trigger events
    const id = setInterval(check, CHECK_INTERVAL_MS);

    // return a stop function
    return function stop() {
      clearInterval(id);
      window.removeEventListener('resize', check);
      window.removeEventListener('focus', check);
      window.removeEventListener('blur', check);
    };
  }

  // 5) Action to take when DevTools detected (based on config)
  function handleDevtoolsDetected(info) {
    const msg = `Developer tools detected (${info.orientation || 'unknown'}). Page access restricted.`;
    if (ON_DETECT_ACTION === 'log') {
      console.warn(msg, info);
    } else if (ON_DETECT_ACTION === 'warn') {
      // show a banner/warn but do not remove content
      try {
        const banner = document.createElement('div');
        banner.textContent = 'Warning: Developer tools detected. Some actions may be disabled.';
        banner.style = 'position:fixed;top:0;left:0;right:0;padding:10px;text-align:center;background:#ffcc00;z-index:99999;font-family:Arial,sans-serif;';
        document.documentElement.appendChild(banner);
        setTimeout(() => banner.remove(), 5000);
      } catch (e) { /* ignore */ }
      console.warn(msg, info);
    } else {
      // block
      blockPage('Developer tools are not allowed on this page. Please close them and reload.');
      console.warn(msg, info);
    }
  }

  // Initialize everything
  function init() {
    try {
      disableContextMenu();
      disableSelectionAndCopy();
      disableDevtoolsShortcuts();
      startDevtoolsDetector(handleDevtoolsDetected);

      // defensive: detect if console opened by timing a debugger statement (best-effort & not guaranteed)
      // we won't call debugger; because it will pause script. Instead we measure console behavior:
      (function detectByConsoleTiming() {
        const start = Date.now();
        // some consoles delay or change timing of console.log; not reliable but harmless
        console.log('%c', 'font-size:1px'); // no-op
        const elapsed = Date.now() - start;
        if (elapsed > 1000) {
          handleDevtoolsDetected({ orientation: 'timing', elapsed });
        }
      }());
    } catch (e) {
      // fail silently - do not break the host page
      console.error('antiInspect init error', e);
    }
  }

  // run when DOM ready; keep robust if script is loaded late
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }

}(window, document));

// Initialize Supabase client
let supabase = null;

function createSupabaseClient() {
  // Check if the Supabase library is loaded in the window
  if (typeof window !== "undefined" && window.supabase) {
    try {
      return window.supabase.createClient(supabaseUrl, supabaseKey);
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      return null;
    }
  }
  return null;
}

// Global initialization
supabase = createSupabaseClient();

// Application State
const AppState = {
  currentUser: {
    name: "Ephraim Karanja",
    role: "Senior Supervisor",
    username: "E.karanja",
    email: "ephraim.karanja@afyadairy.com",
    joinDate: "January 15, 2020",
    avatar: "EK",
  },
  currentPage: "dashboard",
  currentForm: "cow-registration",
};

// Data Storage using Supabase
class DataStorage {
  // Centralized error handling
  static async _fetchData(tableName, orderColumn = "created_at") {
    if (!supabase) {
      console.error("Supabase client not initialized.");
      return [];
    }
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order(orderColumn, { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return [];
    }
  }

  static async _insertData(tableName, recordData) {
    if (!supabase) {
      console.error("Supabase client not initialized.");
      return false;
    }
    try {
      const { data, error } = await supabase.from(tableName).insert([recordData]).select().single();
      if (error) throw error;
      return data || true;
    } catch (error) {
      console.error(`Error inserting data into ${tableName}:`, error);
      return false;
    }
  }

  // Normalizer helpers
  static _getRecordDate(record) {
    // Try common date fields and fall back to created_at/timestamp
    const dateCandidates = ["date", "record_date", "day", "created_at", "timestamp"];
    for (const k of dateCandidates) {
      if (!record[k]) continue;
      // created_at/timestamp may be full ISO datetime
      if (k === "created_at" || k === "timestamp") {
        try {
          return new Date(record[k]).toISOString().split("T")[0];
        } catch {
          continue;
        }
      }
      // plain date string already
      return record[k];
    }
    return null;
  }

  // Corrected table names to be snake_case to match Supabase schema
  static async getCows() {
    return this._fetchData("cow_info", "created_at");
  }

  static async addCow(cowData) {
    const dataToInsert = {
      id: cowData.cowId,
      name: cowData.cowName || null,
      breed: cowData.breed || null,
      status: cowData.status || null,
      birth_date: cowData.birthDate || null,
      weight: cowData.weight ? Number.parseFloat(cowData.weight) : null,
      acquisition_date: cowData.acquisitionDate || new Date().toISOString().split("T")[0],
      notes: cowData.notes || null,
      created_at: new Date().toISOString(),
    };
    return this._insertData("cow_info", dataToInsert);
  }

  static async getMilkRecords() {
    return this._fetchData("milk_production", "created_at");
  }

  static async addMilkRecord(recordData) {
    const dataToInsert = {
      cow_id: recordData.cowId,
      date: recordData.date || new Date().toISOString().split("T")[0],
      milking_time: recordData.milkingTime || null,
      quantity: Number.parseFloat(recordData.quantity),
      notes: recordData.notes || null,
      created_at: new Date().toISOString(),
    };
    return this._insertData("milk_production", dataToInsert);
  }

  static async getFeedingRecords() {
    return this._fetchData("feeding_records", "created_at");
  }

  static async addFeedingRecord(recordData) {
    const dataToInsert = {
      cow_id: recordData.cowId,
      date: recordData.date || new Date().toISOString().split("T")[0],
      time_period: recordData.timePeriod || null,
      feed_type: recordData.feedType || null,
      feed_name: recordData.feedName || null,
      quantity: Number.parseFloat(recordData.quantity),
      notes: recordData.notes || null,
      created_at: new Date().toISOString(),
    };
    return this._insertData("feeding_records", dataToInsert);
  }

  static async getHealthRecords() {
    return this._fetchData("health_records", "created_at");
  }

  static async addHealthRecord(recordData) {
    const dataToInsert = {
      cow_id: recordData.cowId,
      date: recordData.date || new Date().toISOString().split("T")[0],
      health_status: recordData.healthStatus || null,
      symptoms: recordData.symptoms || null,
      treatment: recordData.treatment || null,
      veterinarian: recordData.veterinarian || null,
      notes: recordData.notes || null,
      created_at: new Date().toISOString(),
    };
    return this._insertData("health_records", dataToInsert);
  }

  static async getStaff() {
    // ensure using correct column naming and return consistent objects
    const data = await this._fetchData("staff_info", "start_date");
    if (!data || data.length === 0) return this.getDefaultStaff();

    // normalize start_date to a consistent key
    return data.map((s) => ({
      id: s.id || s.staff_id || null,
      name: s.name || s.full_name || "Unknown",
      role: s.role || s.position || "Staff",
      department: s.department || s.team || "General",
      phone: s.phone || s.contact || "N/A",
      email: s.email || null,
      start_date: s.start_date || s.startDate || s.created_at || null,
      avatar: s.avatar || (s.name ? s.name.split(" ").map(p => p[0]).join("").toUpperCase().substring(0,2) : "NA"),
      raw: s,
    }));
  }

  static async addStaff(staffData) {
    // Map incoming form fields to the expected DB columns
    const record = {
      name: staffData.name,
      role: staffData.role,
      department: staffData.department,
      phone: staffData.phone,
      email: staffData.email || null,
      start_date: staffData.start_date || staffData.startDate || new Date().toISOString().split("T")[0],
      avatar: staffData.avatar || null,
      created_at: new Date().toISOString(),
    };

    return this._insertData("staff_info", record);
  }

  static async getAllData() {
    const [cows, milkRecords, feedingRecords, healthRecords, staff] = await Promise.all([
      this.getCows(),
      this.getMilkRecords(),
      this.getFeedingRecords(),
      this.getHealthRecords(),
      this.getStaff(),
    ]);

    return { cows, milkRecords, feedingRecords, healthRecords, staff };
  }

  static getDefaultStaff() {
    return [
      {
        id: 1,
        name: "KARANJA",
        role: "Senior Supervisor",
        department: "Dairy Operations",
        phone: "+254 712 345 678",
        email: "ephraim.karanja@afyadairy.com",
        start_date: "2020-01-15",
        avatar: "EK",
      },
      {
        id: 2,
        name: "Mary Wanjiku",
        role: "Farm Assistant",
        department: "Feeding & Care",
        phone: "+254 723 456 789",
        email: "mary.wanjiku@afyadairy.com",
        start_date: "2023-03-20",
        avatar: "MW",
      },
      {
        id: 3,
        name: "Peter Mwangi",
        role: "Veterinary Assistant",
        department: "Health & Wellness",
        phone: "+254 734 567 890",
        email: "peter.mwangi@afyadairy.com",
        start_date: "2023-02-10",
        avatar: "PM",
      },
    ];
  }

  // Fetch logged-in user from Supabase (try v2 and v1 auth methods)
  static async getCurrentAuthUser() {
    if (!supabase) return null;
    try {
      // v2
      if (supabase.auth && typeof supabase.auth.getUser === "function") {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data?.user || null;
      }
      // v1 fallback
      if (supabase.auth && typeof supabase.auth.user === "function") {
        return supabase.auth.user();
      }
      return null;
    } catch (error) {
      console.error("Error fetching auth user:", error);
      return null;
    }
  }

  // Optionally fetch profile from profiles table if available
  static async getProfileById(userId) {
    if (!supabase || !userId) return null;
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) return null;
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }
}

// DOM Elements
const elements = {
  sidebar: document.getElementById("sidebar"),
  menuToggle: document.getElementById("menuToggle"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  mobileOverlay: document.getElementById("mobileOverlay"),
  navLinks: document.querySelectorAll(".nav-link"),
  pages: document.querySelectorAll(".page"),
  formTabs: document.querySelectorAll(".form-tab"),
  formContainers: document.querySelectorAll(".form-container"),
  notificationToast: document.getElementById("notificationToast"),
  staffSearch: document.getElementById("staffSearch"),
  addStaffForm: document.getElementById("addStaffForm"),
};

// Real-time update configuration
const DASHBOARD_REFRESH_INTERVAL = 30000; // 30 seconds
let dashboardUpdateInterval = null;

// Application Initialization
document.addEventListener("DOMContentLoaded", async () => {
  await initializeApp();
  setupEventListeners();
  await updateDashboard();
  await populateStaffDirectory();
  setCurrentDate();
  setupCowSuggestions();
  startRealTimeUpdates();
});

// Corrected Application Initialization (async)
async function initializeApp() {
  if (!supabase) {
    showNotification("Database connection not available.", "warning");
    // Show a fallback message on the dashboard if no connection
    const dashboardPage = document.getElementById("dashboard-page");
    if (dashboardPage) {
      dashboardPage.innerHTML = `
        <div class="error-state">
          <h2>⚠️ Database Connection Error</h2>
          <p>Could not connect to the database. Please check your Supabase configuration.</p>
        </div>
      `;
    }
  } else {
    console.log("Supabase client initialized successfully");
  }

  // Try to load real user from Supabase auth/profile
  await loadCurrentUser();

  document.getElementById("currentUserName").textContent = AppState.currentUser.name.split(" ")[0];
  document.getElementById("headerUserName").textContent = AppState.currentUser.name.toUpperCase();
  document.getElementById("headerUserRole").textContent = AppState.currentUser.role;
  document.getElementById("userAvatar").textContent = AppState.currentUser.avatar;
  document.getElementById("profileName").textContent = AppState.currentUser.name;
  document.getElementById("profileRole").textContent = AppState.currentUser.role;
  document.getElementById("profileAvatar").textContent = AppState.currentUser.avatar;
  document.getElementById("profileUsername").textContent = AppState.currentUser.username;
  document.getElementById("profileEmail").textContent = AppState.currentUser.email;
  document.getElementById("profileRoleDetail").textContent = AppState.currentUser.role;
  document.getElementById("profileJoinDate").textContent = AppState.currentUser.joinDate;
  showPage("dashboard");
}

function setupEventListeners() {
  if (elements.menuToggle) elements.menuToggle.addEventListener("click", toggleSidebar);
  if (elements.sidebarToggle) elements.sidebarToggle.addEventListener("click", toggleSidebar);
  if (elements.mobileOverlay) elements.mobileOverlay.addEventListener("click", closeSidebar);

  elements.navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("data-page");
      showPage(page);
      setActiveNavLink(this);
      if (window.innerWidth <= 1024) closeSidebar();
    });
  });

  elements.formTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const formType = this.getAttribute("data-form");
      showForm(formType);
      setActiveFormTab(this);
    });
  });

  const cowReg = document.getElementById("cowRegistrationForm");
  if (cowReg) cowReg.addEventListener("submit", handleCowRegistrationSubmit);

  const milkForm = document.getElementById("milkProductionForm");
  if (milkForm) milkForm.addEventListener("submit", handleMilkProductionSubmit);

  const feedingForm = document.getElementById("feedingForm");
  if (feedingForm) feedingForm.addEventListener("submit", handleFeedingSubmit);

  const healthForm = document.getElementById("healthForm");
  if (healthForm) healthForm.addEventListener("submit", handleHealthSubmit);

  // Corrected: added event listener for add staff form
  if (elements.addStaffForm) {
    elements.addStaffForm.addEventListener("submit", addStaff);
  }

  window.addEventListener("resize", handleWindowResize);

  document.addEventListener("click", (e) => {
    if (e.target.classList && e.target.classList.contains("modal")) {
      closeModal(e.target.id);
    }
  });

  const userInfoEl = document.getElementById("userInfo");
  if (userInfoEl) {
    userInfoEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const um = document.getElementById("userMenu");
      if (um) um.classList.toggle("active");
    });
  }

  // Corrected: added a document-wide listener to close the menu
  document.addEventListener("click", (e) => {
    const userMenu = document.getElementById("userMenu");
    const userInfo = document.getElementById("userInfo");
    if (userMenu && userInfo && !userInfo.contains(e.target) && userMenu.classList.contains("active")) {
      userMenu.classList.remove("active");
    }
  });

  // Corrected: Added event listener for staff search
  if (elements.staffSearch) {
    elements.staffSearch.addEventListener("input", filterStaff);
  }
}

function toggleSidebar() {
  if (!elements.sidebar || !elements.mobileOverlay) return;
  elements.sidebar.classList.toggle("active");
  elements.mobileOverlay.classList.toggle("active");
  document.body.style.overflow = elements.sidebar.classList.contains("active") ? "hidden" : "";
}

function closeSidebar() {
  if (!elements.sidebar || !elements.mobileOverlay) return;
  elements.sidebar.classList.remove("active");
  elements.mobileOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

function handleWindowResize() {
  if (window.innerWidth > 1024) closeSidebar();
}

function showPage(pageId) {
  elements.pages.forEach((page) => {
    page.style.display = page.id === `${pageId}-page` ? "block" : "none";
  });
  AppState.currentPage = pageId;

  if (pageId === "dashboard") {
    updateDashboard();
    console.log("Dashboard page loaded, updating with latest data");
  }

  if (pageId === "data-summary") {
    updateDataSummary();
    console.log("Data summary page loaded, updating with latest data");
  }
  
  if (pageId === "staff-directory") {
    populateStaffDirectory();
    console.log("Staff directory page loaded, updating with latest data");
  }
}

function setActiveNavLink(activeLink) {
  elements.navLinks.forEach((link) => link.classList.remove("active"));
  if (activeLink) activeLink.classList.add("active");
}

function showForm(formType) {
  elements.formContainers.forEach((container) => {
    container.style.display = container.id === `${formType}-form` ? "block" : "none";
  });
  AppState.currentForm = formType;
}

function setActiveFormTab(activeTab) {
  elements.formTabs.forEach((tab) => tab.classList.remove("active"));
  if (activeTab) activeTab.classList.add("active");
}

function setCurrentDate() {
  const today = new Date().toISOString().split("T")[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach((input) => {
    if (!input.value) input.value = today;
  });
}

async function setupCowSuggestions() {
  const cowIdInputs = document.querySelectorAll('input[name="cowId"]');
  cowIdInputs.forEach((input) => {
    input.addEventListener("input", async function () {
      const value = this.value.toLowerCase();
      const cows = await DataStorage.getCows();
      const suggestions = cows.filter(
        (cow) => (cow.id && cow.id.toString().toLowerCase().includes(value)) || (cow.name && cow.name.toLowerCase().includes(value)),
      );
      showCowSuggestions(this, suggestions);
    });

    input.addEventListener("blur", function () {
      setTimeout(() => hideCowSuggestions(this), 200);
    });
  });
}

function showCowSuggestions(input, suggestions) {
  const suggestionsContainer = input.nextElementSibling;
  if (!suggestionsContainer || !suggestionsContainer.classList.contains("cow-suggestions")) return;

  if (suggestions.length === 0 || input.value.length < 2) {
    suggestionsContainer.style.display = "none";
    return;
  }

  suggestionsContainer.innerHTML = suggestions
    .map(
      (cow) => `
        <div class="suggestion-item" onclick="selectCow('${input.id}', '${cow.id}')">
          ${cow.id} - ${cow.name || "No name"}
        </div>
      `,
    )
    .join("");

  suggestionsContainer.style.display = "block";
}

function hideCowSuggestions(input) {
  const suggestionsContainer = input.nextElementSibling;
  if (suggestionsContainer && suggestionsContainer.classList.contains("cow-suggestions")) {
    suggestionsContainer.style.display = "none";
  }
}

function selectCow(inputId, cowId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.value = cowId;
    hideCowSuggestions(el);
  }
}

async function handleCowRegistrationSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (!data.cowId || !data.breed || !data.status) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  const existingCows = await DataStorage.getCows();
  if (existingCows.some((cow) => cow.id === data.cowId)) {
    showNotification("Cow ID already exists!", "error");
    return;
  }

  const success = await DataStorage.addCow(data);
  if (success) {
    showNotification("Cow registered successfully!");
    e.target.reset();
    setCurrentDate();
    await updateDashboard();
    addActivity("cow-registration", `New cow ${data.cowId} registered`, data.cowId);
    await updateRecentRecordsTable();
  } else {
    showNotification("Error saving cow data", "error");
  }
}

async function handleMilkProductionSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (!data.cowId || !data.date || !data.milkingTime || !data.quantity) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  const cows = await DataStorage.getCows();
  if (!cows.some((cow) => cow.id === data.cowId)) {
    showNotification("Cow ID not found. Please register the cow first.", "error");
    return;
  }

  const success = await DataStorage.addMilkRecord(data);
  if (success) {
    showNotification("Milk production record saved successfully!");
    e.target.reset();
    setCurrentDate();
    await updateDashboard();
    addActivity("milk", `Milk production recorded for ${data.cowId}`, `${data.quantity}L`);
    await updateRecentRecordsTable();
  } else {
    showNotification("Error saving milk production data", "error");
  }
}

async function handleFeedingSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (!data.cowId || !data.date || !data.timePeriod || !data.feedType || !data.quantity) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  const cows = await DataStorage.getCows();
  if (!cows.some((cow) => cow.id === data.cowId)) {
    showNotification("Cow ID not found. Please register the cow first.", "error");
    return;
  }

  const success = await DataStorage.addFeedingRecord(data);
  if (success) {
    showNotification("Feeding record saved successfully!");
    e.target.reset();
    setCurrentDate();
    await updateDashboard();
    addActivity("feeding", `Feeding logged for ${data.cowId}`, `${data.quantity}kg`);
    await updateRecentRecordsTable();
  } else {
    showNotification("Error saving feeding data", "error");
  }
}

async function handleHealthSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (!data.cowId || !data.date || !data.healthStatus) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  const cows = await DataStorage.getCows();
  if (!cows.some((cow) => cow.id === data.cowId)) {
    showNotification("Cow ID not found. Please register the cow first.", "error");
    return;
  }

  const success = await DataStorage.addHealthRecord(data);
  if (success) {
    showNotification("Health record saved successfully!");
    e.target.reset();
    setCurrentDate();
    await updateDashboard();
    addActivity("health", `Health check completed for ${data.cowId}`, data.healthStatus);
    await updateRecentRecordsTable();
  } else {
    showNotification("Error saving health data", "error");
  }
}

async function updateDashboard() {
  try {
    console.log("Updating dashboard with real-time data...");

    const loadingElements = ["milk-production", "feed-consumption", "total-cows", "health-alerts"];
    loadingElements.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.textContent = "Loading...";
    });

    const data = await DataStorage.getAllData();
    const today = new Date().toISOString().split("T")[0];

    // normalize and calculate totals using DataStorage._getRecordDate
    const todayMilk = data.milkRecords
      .map((r) => ({ ...r, _date: DataStorage._getRecordDate(r) }))
      .filter((r) => r._date === today)
      .reduce((sum, record) => sum + Number.parseFloat(record.quantity || 0), 0);

    const todayFeed = data.feedingRecords
      .map((r) => ({ ...r, _date: DataStorage._getRecordDate(r) }))
      .filter((r) => r._date === today)
      .reduce((sum, record) => sum + Number.parseFloat(record.quantity || 0), 0);

    const todayHealth = data.healthRecords
      .map((r) => ({ ...r, _date: DataStorage._getRecordDate(r) }))
      .filter((r) => r._date === today).length;

    updateDashboardCard("milk-production", `${todayMilk.toFixed(1)}L`);
    updateDashboardCard("feed-consumption", `${todayFeed.toFixed(1)}KG`);
    updateDashboardCard("total-cows", Array.isArray(data.cows) ? data.cows.length : 0);
    updateDashboardCard("health-alerts", todayHealth);

    const totalEntries =
      (Array.isArray(data.milkRecords) ? data.milkRecords.length : 0) +
      (Array.isArray(data.feedingRecords) ? data.feedingRecords.length : 0) +
      (Array.isArray(data.healthRecords) ? data.healthRecords.length : 0);

    const totalCows = Array.isArray(data.cows) ? data.cows.length : 0;

    const totalEntriesEl = document.getElementById("totalEntries");
    if (totalEntriesEl) totalEntriesEl.textContent = totalEntries;

    const tasksCompletedEl = document.getElementById("tasksCompleted");
    if (tasksCompletedEl) tasksCompletedEl.textContent = totalCows + totalEntries;

    updateRecentActivity(data);

    console.log("Dashboard updated successfully with real-time data");
  } catch (error) {
    console.error("Error updating dashboard:", error);
    showNotification("Error loading dashboard data", "error");
  }
}

function updateDashboardCard(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.transition = "all 0.3s ease";
    element.style.transform = "scale(1.05)";
    element.textContent = value;
    setTimeout(() => {
      element.style.transform = "scale(1)";
    }, 300);
  }
}

function updateRecentActivity(data) {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  const today = new Date().toISOString().split("T")[0];
  const recentRecords = [
    ...data.milkRecords
      .map((r) => ({ ...r, type: "milk", message: `Milk production recorded for ${r.cow_id || r.cowId}`, value: `${r.quantity}L`, time: r.created_at || r.timestamp }))
      .filter((r) => DataStorage._getRecordDate(r) === today),
    ...data.feedingRecords
      .map((r) => ({ ...r, type: "feeding", message: `Feeding logged for ${r.cow_id || r.cowId}`, value: `${r.quantity}kg`, time: r.created_at || r.timestamp }))
      .filter((r) => DataStorage._getRecordDate(r) === today),
    ...data.healthRecords
      .map((r) => ({ ...r, type: "health", message: `Health check completed for ${r.cow_id || r.cowId}`, value: r.health_status, time: r.created_at || r.timestamp }))
      .filter((r) => DataStorage._getRecordDate(r) === today),
    ...data.cows
      .map((r) => ({ ...r, type: "cow-registration", message: `New cow registered: ${r.id}`, value: `ID: ${r.id}`, time: r.created_at }))
      .filter((r) => {
        const d = DataStorage._getRecordDate(r);
        return d === today;
      }),
  ]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 5);

  if (recentRecords.length === 0) {
    activityList.innerHTML = `
      <div class="activity-item">
        <div class="activity-icon info">
          <i class="fas fa-info-circle"></i>
        </div>
        <div class="activity-content">
          <p><strong>No activity today</strong> - Start entering farm data</p>
          <span class="activity-time">Ready</span>
        </div>
        <div class="activity-value">Ready</div>
      </div>
    `;
    return;
  }

  activityList.innerHTML = recentRecords
    .map((record) => {
      const iconClass = record.type === "milk" ? "milk" : record.type === "feeding" ? "feeding" : record.type === "health" ? "health" : "cow-registration";
      const iconName = record.type === "milk" ? "fa-tint" : record.type === "feeding" ? "fa-seedling" : record.type === "health" ? "fa-heart" : "fa-plus";
      const timeAgo = getTimeAgo(record.time);

      return `
      <div class="activity-item">
        <div class="activity-icon ${iconClass}">
          <i class="fas ${iconName}"></i>
        </div>
        <div class="activity-content">
          <p><strong>${record.message}</strong></p>
          <span class="activity-time">${timeAgo}</span>
        </div>
        <div class="activity-value">${record.value}</div>
      </div>
    `;
    })
    .join("");
}

function getTimeAgo(timestamp) {
  if (!timestamp) return "Just now";

  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

async function updateDataSummary() {
  try {
    console.log("Updating data summary with real-time data...");

    const data = await DataStorage.getAllData();
    const today = new Date().toISOString().split("T")[0];

    const todayMilkRecords = data.milkRecords.filter((record) => DataStorage._getRecordDate(record) === today).length;
    const todayFeedingRecords = data.feedingRecords.filter((record) => DataStorage._getRecordDate(record) === today).length;
    const todayHealthRecords = data.healthRecords.filter((record) => DataStorage._getRecordDate(record) === today).length;

    updateDashboardCard("milkRecords", todayMilkRecords);
    updateDashboardCard("feedingRecords", todayFeedingRecords);
    updateDashboardCard("healthRecords", todayHealthRecords);

    await updateRecentRecordsTable();

    console.log("Data summary updated successfully");
  } catch (error) {
    console.error("Error updating data summary:", error);
    showNotification("Error loading summary data", "error");
  }
}

async function updateRecentRecordsTable() {
  const data = await DataStorage.getAllData();
  const allRecords = [
    ...data.milkRecords.map((r) => ({ ...r, type: "Milk Production", icon: "fas fa-tint", cowId: r.cow_id || r.cowId, timestamp: r.created_at || r.timestamp, quantity: r.quantity })),
    ...data.feedingRecords.map((r) => ({ ...r, type: "Feeding", icon: "fas fa-seedling", cowId: r.cow_id || r.cowId, timestamp: r.created_at || r.timestamp, quantity: r.quantity })),
    ...data.healthRecords.map((r) => ({ ...r, type: "Health Check", icon: "fas fa-heart", cowId: r.cow_id || r.cowId, timestamp: r.created_at || r.timestamp, health_status: r.health_status })),
  ]
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 10);

  const tableContainer = document.getElementById("recentRecordsTable");

  if (!tableContainer) return;

  if (allRecords.length === 0) {
    tableContainer.innerHTML = '<p class="no-data">No records found. Start by entering some data!</p>';
    return;
  }

  tableContainer.innerHTML = `
      <div class="records-list">
        ${allRecords
          .map(
            (record) => `
            <div class="record-item">
              <div class="record-icon">
                <i class="${record.icon}"></i>
              </div>
              <div class="record-content">
                <p><strong>${record.type}</strong> - ${record.cowId}</p>
                <span class="record-time">${new Date(record.timestamp || Date.now()).toLocaleString()}</span>
              </div>
              <div class="record-value">
                ${
                  record.quantity !== undefined && record.quantity !== null
                    ? `${record.quantity}${record.type === "Milk Production" ? "L" : "kg"}`
                    : record.health_status || "Completed"
                }
              </div>
            </div>
          `,
          )
          .join("")}
      </div>
    `;
}

function addActivity(type, message, value) {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;
  const activityItem = document.createElement("div");
  activityItem.className = "activity-item";

  const iconClass = type === "milk" ? "milk" : type === "feeding" ? "feeding" : type === "health" ? "health" : "info";
  const iconName = type === "milk" ? "fa-tint" : type === "feeding" ? "fa-seedling" : type === "health" ? "fa-heart" : "fa-plus";

  activityItem.innerHTML = `
    <div class="activity-icon ${iconClass}">
      <i class="fas ${iconName}"></i>
    </div>
    <div class="activity-content">
      <p><strong>${message}</strong></p>
      <span class="activity-time">Just now</span>
    </div>
    <div class="activity-value">${value}</div>
  `;

  activityList.insertBefore(activityItem, activityList.firstChild);

  while (activityList.children.length > 5) {
    activityList.removeChild(activityList.lastChild);
  }
}

async function populateStaffDirectory() {
  const staffGrid = document.getElementById("staffGrid");
  // Show a loading state
  if (staffGrid) {
    staffGrid.innerHTML = '<p class="loading-state">Loading staff directory...</p>';
  }
  
  const staff = await DataStorage.getStaff();

  if (staffGrid) {
    if (!staff || staff.length === 0) {
      staffGrid.innerHTML = '<p class="no-data">No staff members found.</p>';
      return;
    }

    staffGrid.innerHTML = staff
      .map(
        (member) => `
          <div class="staff-card">
            <div class="staff-header">
              <div class="staff-avatar">${member.avatar}</div>
              <div class="staff-info">
                <h4>${member.name}</h4>
                <p>${member.role}</p>
                <span class="staff-department">${member.department}</span>
              </div>
            </div>
            <div class="staff-details">
              <div class="staff-contact">
                <i class="fas fa-phone"></i>
                <span>${member.phone}</span>
              </div>
              <div class="staff-contact">
                <i class="fas fa-envelope"></i>
                <span>${member.email || "N/A"}</span>
              </div>
              <div class="staff-contact">
                <i class="fas fa-calendar"></i>
                <span>Started: ${member.start_date ? new Date(member.start_date).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>
        `,
      )
      .join("");
  }
}

function filterStaff() {
  const searchTerm = (elements.staffSearch && elements.staffSearch.value) ? elements.staffSearch.value.toLowerCase() : "";
  const staffCards = document.querySelectorAll(".staff-card");

  staffCards.forEach((card) => {
    const nameEl = card.querySelector("h4");
    const roleEl = card.querySelector("p");
    const deptEl = card.querySelector(".staff-department");
    const name = nameEl ? nameEl.textContent.toLowerCase() : "";
    const role = roleEl ? roleEl.textContent.toLowerCase() : "";
    const department = deptEl ? deptEl.textContent.toLowerCase() : "";

    const matches = name.includes(searchTerm) || role.includes(searchTerm) || department.includes(searchTerm);
    card.style.display = matches ? "block" : "none";
  });
}

function showAddStaffModal() {
  const modal = document.getElementById("addStaffModal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

async function addStaff(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (!data.name || !data.role || !data.phone || !data.department || !data.startDate) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  const avatar = data.name.split(" ").map((part) => part.charAt(0)).join("").toUpperCase().substring(0, 2);

  const newStaff = {
    name: data.name,
    role: data.role,
    department: data.department,
    phone: data.phone,
    email: data.email || null,
    start_date: data.startDate, // Corrected key to match Supabase schema
    avatar,
  };

  const success = await DataStorage.addStaff(newStaff);
  if (success) {
    await populateStaffDirectory();
    closeModal("addStaffModal");
    e.target.reset();
    showNotification("Staff member added successfully!");
  } else {
    showNotification("Error adding staff member", "error");
  }
}

function resetCurrentForm() {
  const activeForm = document.querySelector('.form-container[style*="block"] form');
  if (activeForm) {
    activeForm.reset();
    setCurrentDate();
    showNotification("Form reset successfully!");
  }
}

function showNotification(message, type = "success") {
  const toast = elements.notificationToast;
  if (!toast) return;
  const toastMessage = document.getElementById("toastMessage");
  const toastIcon = toast.querySelector("i");

  if (toastMessage) toastMessage.textContent = message;

  if (type === "error") {
    if (toastIcon) toastIcon.className = "fas fa-exclamation-circle";
    toast.style.background = "var(--danger-color)";
  } else if (type === "warning") {
    if (toastIcon) toastIcon.className = "fas fa-exclamation-triangle";
    toast.style.background = "var(--warning-color)";
  } else {
    if (toastIcon) toastIcon.className = "fas fa-check-circle";
    toast.style.background = "var(--success-color)";
  }

  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function showProfile() {
  showPage("profile");
  setActiveNavLink(document.querySelector('[data-page="profile"]'));
}

function editProfile() {
  showNotification("Profile editing coming soon!", "warning");
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    showNotification("Logging out...", "warning");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }
}

function startRealTimeUpdates() {
  if (dashboardUpdateInterval) {
    clearInterval(dashboardUpdateInterval);
  }
  dashboardUpdateInterval = setInterval(updateDashboard, DASHBOARD_REFRESH_INTERVAL);
  console.log(`Real-time updates started, refreshing every ${DASHBOARD_REFRESH_INTERVAL / 1000} seconds.`);
}

// Load current user from Supabase and profile table if present
async function loadCurrentUser() {
  try {
    const authUser = await DataStorage.getCurrentAuthUser();
    if (!authUser) {
      console.log("No authenticated user found, using default AppState.currentUser");
      return;
    }

    // Try to get a richer profile
    const profile = await DataStorage.getProfileById(authUser.id);
    if (profile) {
      AppState.currentUser = {
        name: profile.full_name || profile.name || authUser.user_metadata?.full_name || authUser.email.split("@")[0],
        role: profile.role || "Staff",
        username: profile.username || authUser.email.split("@")[0],
        email: authUser.email || profile.email,
        joinDate: profile.join_date || profile.created_at || new Date().toLocaleDateString(),
        avatar: profile.avatar || (profile.full_name ? profile.full_name.split(" ").map(p=>p[0]).join("").toUpperCase().substring(0,2) : authUser.email[0].toUpperCase()),
      };
    } else {
      AppState.currentUser = {
        name: authUser.user_metadata?.full_name || authUser.email.split("@")[0],
        role: "Staff",
        username: authUser.email.split("@")[0],
        email: authUser.email,
        joinDate: new Date().toLocaleDateString(),
        avatar: (authUser.user_metadata?.full_name || authUser.email).split(" ").map(p=>p[0]).join("").toUpperCase().substring(0,2),
      };
    }

    // Update UI immediately if elements exist
    const firstNameEl = document.getElementById("currentUserName");
    if (firstNameEl) firstNameEl.textContent = AppState.currentUser.name.split(" ")[0];
    const headerNameEl = document.getElementById("headerUserName");
    if (headerNameEl) headerNameEl.textContent = AppState.currentUser.name.toUpperCase();
    const headerRoleEl = document.getElementById("headerUserRole");
    if (headerRoleEl) headerRoleEl.textContent = AppState.currentUser.role;
    const avatarEl = document.getElementById("userAvatar");
    if (avatarEl) avatarEl.textContent = AppState.currentUser.avatar;
    const profileName = document.getElementById("profileName");
    if (profileName) profileName.textContent = AppState.currentUser.name;
    const profileRole = document.getElementById("profileRole");
    if (profileRole) profileRole.textContent = AppState.currentUser.role;
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) profileAvatar.textContent = AppState.currentUser.avatar;
    const profileUsername = document.getElementById("profileUsername");
    if (profileUsername) profileUsername.textContent = AppState.currentUser.username;
    const profileEmail = document.getElementById("profileEmail");
    if (profileEmail) profileEmail.textContent = AppState.currentUser.email;
    const profileJoin = document.getElementById("profileJoinDate");
    if (profileJoin) profileJoin.textContent = AppState.currentUser.joinDate;
  } catch (error) {
    console.error("Error loading current user:", error);
  }
}

// Global function exports for onclick handlers
window.resetCurrentForm = resetCurrentForm;
window.filterStaff = filterStaff;
window.showAddStaffModal = showAddStaffModal;
window.closeModal = closeModal;
window.addStaff = addStaff;
window.showProfile = showProfile;
window.editProfile = editProfile;
window.logout = logout;
window.selectCow = selectCow;

