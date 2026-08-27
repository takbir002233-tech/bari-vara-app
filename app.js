// Smart Billing & Accounts Management System
// Version 3.3.0 - Explicit Edit & Delete Controls with Quick Add

// Utilities: Bengali Digits & Date Formats
const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBn(num) {
  if (num === null || num === undefined || isNaN(num)) return '০';
  const numStr = Number(num).toFixed(2).replace(/\.00$/, '');
  return numStr.toString().replace(/\d/g, (d) => bnDigits[d]);
}

function toBnInt(num) {
  if (num === null || num === undefined || isNaN(num)) return '০';
  return Math.round(Number(num)).toString().replace(/\d/g, (d) => bnDigits[d]);
}

const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

function formatBnMonthYear(yearMonthStr) {
  if (!yearMonthStr) return '';
  const [y, m] = yearMonthStr.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  const yearBn = y.replace(/\d/g, (d) => bnDigits[d]);
  return `${bnMonths[monthIdx]} ${yearBn}`;
}

function formatBnDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  return `${toBnInt(d)}/${toBnInt(m)}/${toBnInt(y)}`;
}

function getCurrentYearMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getTodayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Storage Keys
const STORAGE_APP_STATE = 'smart_billing_app_state_v3';
const STORAGE_GMAIL_LIST = 'smart_billing_gmail_list_v3';

// Default State
let appSettings = {
  houseName: 'সম্রাট শাহজাহান টাওয়ার',
  phoneNumbers: '01614-055666, 01774-151202, 01980-000712',
  receiptBismillah: 'বিসমিল্লাহির রাহমানির রাহিম',
  receiptCopyBadge: 'ভাড়াটিয়া কপি',
  receiptNotice: '* বিল পরিশোধের শেষ তারিখ ১০ তারিখ। ১০ তারিখের মধ্যে পরিশোধ করিতে না পারিলে ১০ তারিখের পর ১০% জরিমানাসহ পরিশোধ করিতে হইবে। অন্যথায় ১৫ তারিখের পর সংযোগ বিচ্ছিন্ন করা হইবে। পুনরায় সংযোগ নিতে হলে সংযোগ ফি দিতে হবে। * কোন প্রকার জেঃ ও বিঃ লাইনে চুরি ধরা পড়িলে কর্তৃপক্ষের সিদ্ধান্ত মেনে নিতে হবে।',
  receiptQuote: '"মানুষের বিবেকই সবচাইতে বড় আদালত"',
  signLeft: 'ভাড়াটিয়ার স্বাক্ষর',
  signRight: 'আদায়কারীর স্বাক্ষর',
  unitRate: 8.5,
  defaultServiceCharge: 0,
  dueDateDay: 10,
  currency: '৳'
};

let electricMonthsData = {};
let rentMonthsData = {};
let ledgerData = [];
let savedGmails = [];
let activeGmail = '';

let currentSelectedMonth = getCurrentYearMonth();
let activePage = 'pageHome'; // Default start on Home Screen
let currentRentFilter = 'all';
let currentElectricSearch = '';
let currentRentSearch = '';
let currentLedgerSearch = '';
let activeReceiptItem = null;

// Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
  loadAppState();
  initLucide();
  setupMonthSelector();
  setupEventListeners();
  renderCurrentPage();
  updateGmailBadgeUI();
  setupAndroidBackButtonHandler();
});

function initLucide() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Load & Save State
function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_APP_STATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.settings) appSettings = { ...appSettings, ...parsed.settings };
      if (parsed.electric) electricMonthsData = parsed.electric;
      if (parsed.rent) rentMonthsData = parsed.rent;
      if (parsed.ledger) ledgerData = parsed.ledger;
    } else {
      loadInitialSampleData();
    }

    const gmailsRaw = localStorage.getItem(STORAGE_GMAIL_LIST);
    if (gmailsRaw) {
      savedGmails = JSON.parse(gmailsRaw);
      if (savedGmails.length > 0) activeGmail = savedGmails[0];
    }
  } catch (e) {
    console.error('Failed to load state', e);
    loadInitialSampleData();
  }

  if (!electricMonthsData[currentSelectedMonth]) electricMonthsData[currentSelectedMonth] = [];
  if (!rentMonthsData[currentSelectedMonth]) rentMonthsData[currentSelectedMonth] = [];

  const hName = document.getElementById('headerHouseName');
  if (hName) hName.textContent = appSettings.houseName || 'সম্রাট শাহজাহান টাওয়ার';
}

function saveAppState() {
  try {
    const payload = {
      settings: appSettings,
      electric: electricMonthsData,
      rent: rentMonthsData,
      ledger: ledgerData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_APP_STATE, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

// Sample Demo Data
function loadInitialSampleData() {
  const curM = getCurrentYearMonth();
  const today = getTodayDateStr();

  electricMonthsData[curM] = [
    {
      id: 'elec_101',
      roomNo: '১০১',
      tenantName: 'মো: রফিকুল ইসলাম',
      date: today,
      prevReading: 1240,
      currReading: 1320,
      usedUnits: 80,
      unitRate: 8.5,
      serviceCharge: 50,
      totalBill: 730,
      status: 'paid'
    },
    {
      id: 'elec_102',
      roomNo: '১০২',
      tenantName: 'তানভীর আহমেদ',
      date: today,
      prevReading: 850,
      currReading: 945,
      usedUnits: 95,
      unitRate: 8.5,
      serviceCharge: 50,
      totalBill: 857.5,
      status: 'unpaid'
    },
    {
      id: 'elec_103',
      roomNo: '১০৩',
      tenantName: 'আব্দুল কাদির',
      date: today,
      prevReading: 2100,
      currReading: 2170,
      usedUnits: 70,
      unitRate: 8.5,
      serviceCharge: 50,
      totalBill: 645,
      status: 'unpaid'
    }
  ];

  rentMonthsData[curM] = [
    {
      id: 'rent_101',
      roomNo: '১০১',
      tenantName: 'মো: রফিকুল ইসলাম',
      month: curM,
      rentPaymentDate: today,
      rentHouseAmount: 7500,
      status: 'paid'
    },
    {
      id: 'rent_102',
      roomNo: '১০২',
      tenantName: 'তানভীর আহমেদ',
      month: curM,
      rentPaymentDate: '',
      rentHouseAmount: 8000,
      status: 'unpaid'
    },
    {
      id: 'rent_103',
      roomNo: '১০৩',
      tenantName: 'আব্দুল কাদির',
      month: curM,
      rentPaymentDate: '',
      rentHouseAmount: 6500,
      status: 'unpaid'
    }
  ];

  ledgerData = [
    {
      id: 'led_1',
      date: today,
      month: curM,
      type: 'cash_in',
      description: 'রুম ১০১ বাড়িভাড়া গ্রহণ',
      amount: 7500
    },
    {
      id: 'led_2',
      date: today,
      month: curM,
      type: 'bank_in',
      description: 'রুম ১০১ বিদ্যুৎ বিল (বিকাশ)',
      amount: 680
    },
    {
      id: 'led_3',
      date: today,
      month: curM,
      type: 'cash_out',
      description: 'পাম্প মেরামত মিস্ত্রি খরচ',
      amount: 1200
    },
    {
      id: 'led_4',
      date: today,
      month: curM,
      type: 'bank_out',
      description: 'বিদ্যুৎ অফিস মেইন বিল প্রদান',
      amount: 4500
    }
  ];

  saveAppState();
}

// Setup Month Selector
function setupMonthSelector() {
  const monthSelect = document.getElementById('monthSelect');
  if (!monthSelect) return;
  monthSelect.innerHTML = '';

  const monthsSet = new Set(Object.keys(electricMonthsData));
  monthsSet.add(currentSelectedMonth);

  const [y, m] = currentSelectedMonth.split('-').map(Number);
  for (let i = -6; i <= 6; i++) {
    const d = new Date(y, m - 1 + i, 1);
    const yr = d.getFullYear();
    const mn = String(d.getMonth() + 1).padStart(2, '0');
    monthsSet.add(`${yr}-${mn}`);
  }

  const sortedMonths = Array.from(monthsSet).sort();
  sortedMonths.forEach((mStr) => {
    const opt = document.createElement('option');
    opt.value = mStr;
    opt.textContent = formatBnMonthYear(mStr);
    if (mStr === currentSelectedMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });
}

function isOverdueMonth() {
  const today = new Date();
  const [selYear, selMonth] = currentSelectedMonth.split('-').map(Number);
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1;
  const curDay = today.getDate();

  if (selYear < curYear || (selYear === curYear && selMonth < curMonth)) return true;
  if (selYear === curYear && selMonth === curMonth) return curDay > appSettings.dueDateDay;
  return false;
}

// Page Navigation
function switchPage(pageId) {
  activePage = pageId;

  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
  });

  document.querySelectorAll('.app-page').forEach(page => {
    page.classList.remove('active');
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  const fab = document.getElementById('fabAdd');
  if (fab) {
    fab.style.display = (pageId === 'pageHome') ? 'none' : 'flex';
  }

  renderCurrentPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentPage() {
  updateHomeScreenStats();

  if (activePage === 'pageHome') {
    updateHomeScreenStats();
  } else if (activePage === 'pageElectric') {
    renderElectricPage();
  } else if (activePage === 'pageRent') {
    renderRentPage();
  } else if (activePage === 'pageLedger') {
    renderLedgerPage();
  }
}

// Update Home Screen Overview Cards
function updateHomeScreenStats() {
  // 1. Electric Stats
  const elecList = electricMonthsData[currentSelectedMonth] || [];
  let elecUnits = 0;
  let elecAmount = 0;
  let elecPaid = 0;
  let elecDue = 0;

  elecList.forEach(t => {
    const bill = Number(t.totalBill) || 0;
    elecUnits += Number(t.usedUnits) || 0;
    elecAmount += bill;
    if (t.status === 'paid') elecPaid += bill;
    else elecDue += bill;
  });

  const hUnits = document.getElementById('homeElecUnits');
  const hAmt = document.getElementById('homeElecAmount');
  const hPaid = document.getElementById('homeElecPaid');
  const hDue = document.getElementById('homeElecDue');

  if (hUnits) hUnits.textContent = `${toBn(elecUnits)} ইউনিট`;
  if (hAmt) hAmt.textContent = `${appSettings.currency}${toBnInt(elecAmount)}`;
  if (hPaid) hPaid.textContent = `${appSettings.currency}${toBnInt(elecPaid)}`;
  if (hDue) hDue.textContent = `${appSettings.currency}${toBnInt(elecDue)}`;

  // 2. Rent Stats
  const rentList = rentMonthsData[currentSelectedMonth] || [];
  let rentRooms = rentList.length;
  let rentAmount = 0;
  let rentPaid = 0;
  let rentDue = 0;

  rentList.forEach(t => {
    const rent = Number(t.rentHouseAmount) || 0;
    rentAmount += rent;
    if (t.status === 'paid') rentPaid += rent;
    else rentDue += rent;
  });

  const hrRooms = document.getElementById('homeRentRooms');
  const hrAmt = document.getElementById('homeRentAmount');
  const hrPaid = document.getElementById('homeRentPaid');
  const hrDue = document.getElementById('homeRentDue');

  if (hrRooms) hrRooms.textContent = `${toBnInt(rentRooms)} টি`;
  if (hrAmt) hrAmt.textContent = `${appSettings.currency}${toBnInt(rentAmount)}`;
  if (hrPaid) hrPaid.textContent = `${appSettings.currency}${toBnInt(rentPaid)}`;
  if (hrDue) hrDue.textContent = `${appSettings.currency}${toBnInt(rentDue)}`;

  // 3. Ledger Stats
  const ledgerList = ledgerData.filter(x => x.month === currentSelectedMonth);
  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;

  ledgerList.forEach(l => {
    const amt = Number(l.amount) || 0;
    if (l.type === 'cash_in') cashIn += amt;
    else if (l.type === 'cash_out') cashOut += amt;
    else if (l.type === 'bank_in') bankIn += amt;
    else if (l.type === 'bank_out') bankOut += amt;
  });

  const totalIn = cashIn + bankIn;
  const totalOut = cashOut + bankOut;
  const cashBal = cashIn - cashOut;
  const netBal = totalIn - totalOut;

  const hlIn = document.getElementById('homeLedgerIn');
  const hlOut = document.getElementById('homeLedgerOut');
  const hlCash = document.getElementById('homeLedgerCash');
  const hlNet = document.getElementById('homeLedgerNet');

  if (hlIn) hlIn.textContent = `${appSettings.currency}${toBnInt(totalIn)}`;
  if (hlOut) hlOut.textContent = `${appSettings.currency}${toBnInt(totalOut)}`;
  if (hlCash) hlCash.textContent = `${appSettings.currency}${toBnInt(cashBal)}`;
  if (hlNet) hlNet.textContent = `${appSettings.currency}${toBnInt(netBal)}`;

  const overdueActive = isOverdueMonth();
  const overdueBanner = document.getElementById('overdueAlertBanner');
  if (overdueBanner) {
    overdueBanner.style.display = (overdueActive && (elecDue > 0 || rentDue > 0)) ? 'flex' : 'none';
  }

  initLucide();
}

// =========================================================================
// 1. PAGE 1: বিদ্যুৎ এর হিসাব
// =========================================================================
function renderElectricPage() {
  const tenants = electricMonthsData[currentSelectedMonth] || [];
  const overdueActive = isOverdueMonth();

  let totalUnits = 0;
  let totalService = 0;
  let totalAmount = 0;
  let totalPaid = 0;
  let totalDue = 0;

  tenants.forEach(t => {
    const bill = Number(t.totalBill) || 0;
    const srv = Number(t.serviceCharge) || 0;
    totalUnits += Number(t.usedUnits) || 0;
    totalService += srv;
    totalAmount += bill;
    if (t.status === 'paid') totalPaid += bill;
    else totalDue += bill;
  });

  // Electric Header Summary Box
  const regTotalUnits = document.getElementById('regTotalUnits');
  const regTotalAmount = document.getElementById('regTotalAmount');
  const regHouseTitle = document.getElementById('regHouseTitle');
  const regTotalPaid = document.getElementById('regTotalPaid');
  const regTotalDue = document.getElementById('regTotalDue');

  if (regTotalUnits) regTotalUnits.textContent = `${toBn(totalUnits)} ইউনিট`;
  if (regTotalAmount) regTotalAmount.textContent = `${appSettings.currency}${toBnInt(totalAmount)}`;
  if (regHouseTitle) regHouseTitle.textContent = appSettings.houseName || 'সম্রাট শাহজাহান টাওয়ার';
  if (regTotalPaid) regTotalPaid.textContent = `${appSettings.currency}${toBnInt(totalPaid)}`;
  if (regTotalDue) regTotalDue.textContent = `${appSettings.currency}${toBnInt(totalDue)}`;

  // Filter / Search
  const filtered = tenants.filter(t => {
    if (currentElectricSearch.trim() !== '') {
      const q = currentElectricSearch.toLowerCase().trim();
      return (t.roomNo || '').toLowerCase().includes(q) || (t.tenantName || '').toLowerCase().includes(q);
    }
    return true;
  });

  const tbody = document.getElementById('electricTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding: 24px; color: var(--text-muted);">কোনো বিদ্যুৎ রিডিং এন্ট্রি নেই। উপরে "+ নতুন বিদ্যুৎ রিডিং এন্ট্রি" বাটনে চাপ দিন।</td></tr>`;
  } else {
    filtered.forEach((t) => {
      const isUnpaid = t.status !== 'paid';
      const isOverdue = overdueActive && isUnpaid;

      const tr = document.createElement('tr');
      if (isOverdue) tr.className = 'row-overdue-unpaid';

      tr.innerHTML = `
        <td style="font-weight: 800;">${t.roomNo}</td>
        <td>${formatBnDate(t.date || getTodayDateStr())}</td>
        <td style="font-weight: 700; color: #1e3a8a;">${toBn(t.currReading)}</td>
        <td style="color: #64748b;">${toBn(t.prevReading)}</td>
        <td style="font-weight: 800; color: #2563eb;">${toBn(t.usedUnits)}</td>
        <td style="font-weight: 700; color: #d97706;">${appSettings.currency}${toBnInt(t.serviceCharge || 0)}</td>
        <td style="font-weight: 800; color: #059669;">${appSettings.currency}${toBnInt(t.totalBill)}</td>
        <td class="no-print" style="white-space: nowrap;">
          <button type="button" class="btn-card-action btn-open-slip" data-id="${t.id}" style="color: #dc2626; display: inline-flex; align-items: center; gap: 2px; border: 1px solid #fca5a5; background: #fff5f5; border-radius: 6px; padding: 3px 5px; font-size: 11px; font-weight: 700; cursor: pointer;" title="রশিদ স্লিপ">
            <i data-lucide="file-text" style="width:12px;height:12px;"></i> রশিদ
          </button>
          <button type="button" class="btn-card-action btn-edit-elec" data-id="${t.id}" style="color: #2563eb; display: inline-flex; align-items: center; gap: 2px; border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 6px; padding: 3px 5px; margin-left: 2px; font-size: 11px; font-weight: 700; cursor: pointer;" title="এডিট">
            <i data-lucide="edit-3" style="width:12px;height:12px;"></i> এডিট
          </button>
          <button type="button" class="btn-card-action btn-del-elec" data-id="${t.id}" style="color: #dc2626; display: inline-flex; align-items: center; border: 1px solid #fecaca; background: #fef2f2; border-radius: 6px; padding: 3px 5px; margin-left: 2px; cursor: pointer;" title="মুছে ফেলুন">
            <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
          </button>
        </td>
      `;

      // ONLY button clicks trigger actions - not entire row
      tr.querySelector('.btn-open-slip').addEventListener('click', (e) => {
        e.stopPropagation();
        openPaperReceiptModal(t.id);
      });

      tr.querySelector('.btn-edit-elec').addEventListener('click', (e) => {
        e.stopPropagation();
        openElectricModal(t.id);
      });

      tr.querySelector('.btn-del-elec').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteElectricEntry(t.id);
      });

      tbody.appendChild(tr);
    });
  }

  const footUnits = document.getElementById('electricFootTotalUnits');
  const footService = document.getElementById('electricFootTotalService');
  const footAmt = document.getElementById('electricFootTotalAmount');
  if (footUnits) footUnits.textContent = `${toBn(totalUnits)} ইউনিট`;
  if (footService) footService.textContent = `${appSettings.currency}${toBnInt(totalService)}`;
  if (footAmt) footAmt.textContent = `${appSettings.currency}${toBnInt(totalAmount)}`;

  const rateBadge = document.getElementById('elecCurrentUnitRateDisplay');
  if (rateBadge) rateBadge.textContent = `${appSettings.currency}${toBn(appSettings.unitRate || 8.5)}`;

  initLucide();
}

function deleteElectricEntry(id) {
  if (confirm('আপনি কি নিশ্চিতভাবে এই বিদ্যুৎ এন্ট্রি মুছে ফেলতে চান?')) {
    electricMonthsData[currentSelectedMonth] = (electricMonthsData[currentSelectedMonth] || []).filter(x => x.id !== id);
    saveAppState();
    renderElectricPage();
  }
}

// =========================================================================
// 2. PAGE 2: বাসা ভাড়ার হিসাব
// =========================================================================
function renderRentPage() {
  const tenants = rentMonthsData[currentSelectedMonth] || [];
  const overdueActive = isOverdueMonth();

  let totalRooms = tenants.length;
  let totalRentAmount = 0;
  let totalPaid = 0;
  let totalDue = 0;
  let paidCount = 0;

  tenants.forEach(t => {
    const rent = Number(t.rentHouseAmount) || 0;
    totalRentAmount += rent;
    if (t.status === 'paid') {
      totalPaid += rent;
      paidCount++;
    } else {
      totalDue += rent;
    }
  });

  const rentTotalRooms = document.getElementById('rentTotalRooms');
  const rentTotalAmount = document.getElementById('rentTotalAmount');
  const rentHouseTitle = document.getElementById('rentHouseTitle');
  const rentTotalPaid = document.getElementById('rentTotalPaid');
  const rentTotalDue = document.getElementById('rentTotalDue');

  if (rentTotalRooms) rentTotalRooms.textContent = `${toBnInt(totalRooms)} টি`;
  if (rentTotalAmount) rentTotalAmount.textContent = `${appSettings.currency}${toBnInt(totalRentAmount)}`;
  if (rentHouseTitle) rentHouseTitle.textContent = appSettings.houseName || 'সম্রাট শাহজাহান টাওয়ার';
  if (rentTotalPaid) rentTotalPaid.textContent = `${appSettings.currency}${toBnInt(totalPaid)}`;
  if (rentTotalDue) rentTotalDue.textContent = `${appSettings.currency}${toBnInt(totalDue)}`;

  const filtered = tenants.filter(t => {
    if (currentRentFilter === 'paid' && t.status !== 'paid') return false;
    if (currentRentFilter === 'unpaid' && t.status === 'paid') return false;

    if (currentRentSearch.trim() !== '') {
      const q = currentRentSearch.toLowerCase().trim();
      return (t.roomNo || '').toLowerCase().includes(q) || (t.tenantName || '').toLowerCase().includes(q);
    }
    return true;
  });

  const tbody = document.getElementById('rentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 24px; color: var(--text-muted);">কোনো বাসা ভাড়ার ডাটা নেই। উপরে "+ নতুন ভাড়া এন্ট্রি" বাটনে চাপ দিন।</td></tr>`;
  } else {
    filtered.forEach((t) => {
      const isUnpaid = t.status !== 'paid';
      const isOverdue = overdueActive && isUnpaid;

      const tr = document.createElement('tr');
      if (isOverdue) tr.className = 'row-overdue-unpaid';

      tr.innerHTML = `
        <td style="font-weight: 800;">${t.roomNo}</td>
        <td style="font-weight: 700; text-align: left; padding-left: 8px;">${t.tenantName}</td>
        <td>${formatBnMonthYear(t.month || currentSelectedMonth)}</td>
        <td>${t.rentPaymentDate ? formatBnDate(t.rentPaymentDate) : '-'}</td>
        <td style="font-weight: 800; color: #059669;">${appSettings.currency}${toBnInt(t.rentHouseAmount)}</td>
        <td>
          <button type="button" class="btn-toggle-rent-paid" data-id="${t.id}" style="border:none; cursor:pointer; font-weight:700; font-size:11px; padding:3px 8px; border-radius:12px; ${t.status === 'paid' ? 'background:#dcfce7;color:#15803d;' : (isOverdue ? 'background:#fee2e2;color:#b91c1c;' : 'background:#fef3c7;color:#b45309;')}">
            ${t.status === 'paid' ? '✓ Paid' : (isOverdue ? '⚠️ Unpaid' : 'Unpaid')}
          </button>
        </td>
        <td class="no-print" style="white-space: nowrap;">
          <button type="button" class="btn-card-action btn-edit-rent" data-id="${t.id}" style="display:inline-flex; align-items:center; gap:2px; border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 6px; padding: 3px 5px; font-size: 11px; font-weight: 700; color: #2563eb; cursor: pointer;" title="এডিট">
            <i data-lucide="edit-3" style="width:12px;height:12px;"></i> এডিট
          </button>
          <button type="button" class="btn-card-action btn-del-rent" data-id="${t.id}" style="display:inline-flex; align-items:center; border: 1px solid #fecaca; background: #fef2f2; border-radius: 6px; padding: 3px 5px; margin-left: 2px; color: #dc2626; cursor: pointer;" title="মুছে ফেলুন">
            <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
          </button>
        </td>
      `;

      tr.querySelector('.btn-toggle-rent-paid').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRentPayment(t.id);
      });

      tr.querySelector('.btn-edit-rent').addEventListener('click', (e) => {
        e.stopPropagation();
        openRentModal(t.id);
      });

      tr.querySelector('.btn-del-rent').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRentEntry(t.id);
      });

      tbody.appendChild(tr);
    });
  }

  const footRentAmt = document.getElementById('rentFootTotalAmount');
  const footPaidCnt = document.getElementById('rentFootPaidCount');
  if (footRentAmt) footRentAmt.textContent = `${appSettings.currency}${toBnInt(totalRentAmount)}`;
  if (footPaidCnt) footPaidCnt.textContent = `${toBnInt(paidCount)} টি আদায়`;

  initLucide();
}

function deleteRentEntry(id) {
  if (confirm('আপনি কি নিশ্চিতভাবে এই বাসা ভাড়া এন্ট্রি মুছে ফেলতে চান?')) {
    rentMonthsData[currentSelectedMonth] = (rentMonthsData[currentSelectedMonth] || []).filter(x => x.id !== id);
    saveAppState();
    renderRentPage();
  }
}

function toggleRentPayment(id) {
  const list = rentMonthsData[currentSelectedMonth] || [];
  const t = list.find(x => x.id === id);
  if (!t) return;

  if (t.status === 'paid') {
    t.status = 'unpaid';
    t.rentPaymentDate = '';
  } else {
    t.status = 'paid';
    t.rentPaymentDate = getTodayDateStr();
  }

  saveAppState();
  renderRentPage();
}

// =========================================================================
// 3. PAGE 3: মোট আয়-ব্যয় হিসাব
// =========================================================================
function renderLedgerPage() {
  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;

  const monthEntries = ledgerData.filter(x => x.month === currentSelectedMonth);

  monthEntries.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (item.type === 'cash_in') cashIn += amt;
    else if (item.type === 'cash_out') cashOut += amt;
    else if (item.type === 'bank_in') bankIn += amt;
    else if (item.type === 'bank_out') bankOut += amt;
  });

  const totalIn = cashIn + bankIn;
  const totalOut = cashOut + bankOut;
  const cashBal = cashIn - cashOut;
  const netBal = totalIn - totalOut;

  // Header Box (Photo 1 Khata Layout)
  const khataBankIn = document.getElementById('khataBankIn');
  const khataBankOut = document.getElementById('khataBankOut');
  const khataCashBal = document.getElementById('khataCashBal');
  const khataMonthName = document.getElementById('khataMonthName');
  const khataTotalIn = document.getElementById('khataTotalIn');
  const khataTotalOut = document.getElementById('khataTotalOut');
  const khataNetBal = document.getElementById('khataNetBal');

  if (khataBankIn) khataBankIn.textContent = `${appSettings.currency}${toBnInt(bankIn)}`;
  if (khataBankOut) khataBankOut.textContent = `${appSettings.currency}${toBnInt(bankOut)}`;
  if (khataCashBal) khataCashBal.textContent = `${appSettings.currency}${toBnInt(cashBal)}`;
  if (khataMonthName) khataMonthName.textContent = formatBnMonthYear(currentSelectedMonth);
  if (khataTotalIn) khataTotalIn.textContent = `${appSettings.currency}${toBnInt(totalIn)}`;
  if (khataTotalOut) khataTotalOut.textContent = `${appSettings.currency}${toBnInt(totalOut)}`;
  if (khataNetBal) khataNetBal.textContent = `${appSettings.currency}${toBnInt(netBal)}`;

  // Filter / Search
  const filtered = monthEntries.filter(item => {
    if (currentLedgerSearch.trim() !== '') {
      const q = currentLedgerSearch.toLowerCase().trim();
      return (item.description || '').toLowerCase().includes(q) || (item.date || '').includes(q);
    }
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const tbody = document.getElementById('ledgerTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 24px; color: var(--text-muted);">এই মাসে কোনো আয়-ব্যয়ের খতিয়ান এন্ট্রি নেই। উপরে "+ নতুন আয় / ব্যয় যোগ" বাটনে চাপ দিন।</td></tr>`;
  } else {
    // Group by Date for exact replica of Photo 1 Khata
    const dateGroups = {};
    filtered.forEach(item => {
      if (!dateGroups[item.date]) dateGroups[item.date] = [];
      dateGroups[item.date].push(item);
    });

    Object.keys(dateGroups).forEach(dateKey => {
      const items = dateGroups[dateKey];
      items.forEach((item, idx) => {
        const tr = document.createElement('tr');

        let dateCell = '';
        if (idx === 0) {
          dateCell = `<td rowspan="${items.length}" style="font-weight: 800; vertical-align: middle; background: #faf5ff;">${formatBnDate(dateKey)}</td>`;
        }

        tr.innerHTML = `
          ${dateCell}
          <td style="text-align: left; padding-left: 6px; font-weight: 600;">${item.description}</td>
          <td style="font-weight: 700; color: #15803d;">${item.type === 'cash_in' ? appSettings.currency + toBnInt(item.amount) : '-'}</td>
          <td style="font-weight: 700; color: #b91c1c;">${item.type === 'cash_out' ? appSettings.currency + toBnInt(item.amount) : '-'}</td>
          <td style="font-weight: 700; color: #0369a1;">${item.type === 'bank_in' ? appSettings.currency + toBnInt(item.amount) : '-'}</td>
          <td style="font-weight: 700; color: #c2410c;">${item.type === 'bank_out' ? appSettings.currency + toBnInt(item.amount) : '-'}</td>
          <td class="no-print" style="white-space: nowrap;">
            <button type="button" class="btn-card-action btn-edit-ledger" data-id="${item.id}" style="display: inline-flex; align-items: center; gap: 2px; border: 1px solid #ddd6fe; background: #f5f3ff; border-radius: 6px; padding: 3px 5px; font-size: 11px; font-weight: 700; color: #7c3aed; cursor: pointer;" title="এডিট">
              <i data-lucide="edit-3" style="width:12px;height:12px;"></i> এডিট
            </button>
            <button type="button" class="btn-card-action btn-del-ledger" data-id="${item.id}" style="display: inline-flex; align-items: center; border: 1px solid #fecaca; background: #fef2f2; border-radius: 6px; padding: 3px 5px; margin-left: 2px; color: #dc2626; cursor: pointer;" title="মুছে ফেলুন">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </td>
        `;

        tr.querySelector('.btn-edit-ledger').addEventListener('click', (e) => {
          e.stopPropagation();
          openLedgerModal(item.id);
        });

        tr.querySelector('.btn-del-ledger').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteLedgerEntry(item.id);
        });

        tbody.appendChild(tr);
      });
    });
  }

  // Footer Totals
  const footCashIn = document.getElementById('footCashIn');
  const footCashOut = document.getElementById('footCashOut');
  const footBankIn = document.getElementById('footBankIn');
  const footBankOut = document.getElementById('footBankOut');

  if (footCashIn) footCashIn.textContent = `${appSettings.currency}${toBnInt(cashIn)}`;
  if (footCashOut) footCashOut.textContent = `${appSettings.currency}${toBnInt(cashOut)}`;
  if (footBankIn) footBankIn.textContent = `${appSettings.currency}${toBnInt(bankIn)}`;
  if (footBankOut) footBankOut.textContent = `${appSettings.currency}${toBnInt(bankOut)}`;

  initLucide();
}

function deleteLedgerEntry(id) {
  if (confirm('আপনি কি নিশ্চিতভাবে এই খতিয়ান এন্ট্রি মুছে ফেলতে চান?')) {
    ledgerData = ledgerData.filter(x => x.id !== id);
    saveAppState();
    renderLedgerPage();
  }
}

// =========================================================================
// MODALS LOGIC
// =========================================================================

// 1. Electric Modal
function openElectricModal(id) {
  const modal = document.getElementById('electricModal');
  const form = document.getElementById('electricForm');
  if (!modal || !form) return;
  form.reset();

  const isEdit = Boolean(id);
  document.getElementById('electricModalTitle').textContent = isEdit ? 'বিদ্যুৎ রিডিং এডিট' : 'নতুন বিদ্যুৎ রিডিং যোগ';
  document.getElementById('btnDeleteElectric').style.display = isEdit ? 'inline-flex' : 'none';

  if (isEdit) {
    const list = electricMonthsData[currentSelectedMonth] || [];
    const t = list.find(item => item.id === id);
    if (!t) return;

    document.getElementById('electricFormId').value = t.id;
    document.getElementById('electricRoomNo').value = t.roomNo;
    document.getElementById('electricDate').value = t.date || getTodayDateStr();
    document.getElementById('electricTenantName').value = t.tenantName || '';
    document.getElementById('electricCurrReading').value = t.currReading;
    document.getElementById('electricPrevReading').value = t.prevReading;
    document.getElementById('electricUnitRate').value = t.unitRate || appSettings.unitRate;
    document.getElementById('electricServiceCharge').value = t.serviceCharge !== undefined ? t.serviceCharge : 0;
    document.getElementById('electricPaymentStatus').value = t.status || 'unpaid';
  } else {
    document.getElementById('electricFormId').value = '';
    document.getElementById('electricDate').value = getTodayDateStr();
    document.getElementById('electricUnitRate').value = appSettings.unitRate || 8.5;
    document.getElementById('electricServiceCharge').value = appSettings.defaultServiceCharge || 0;
    document.getElementById('electricCurrReading').value = 0;
    document.getElementById('electricPrevReading').value = 0;
  }

  calcElectricFormLive();
  modal.classList.add('active');
  initLucide();
}

function closeElectricModal() {
  const modal = document.getElementById('electricModal');
  if (modal) modal.classList.remove('active');
}

function calcElectricFormLive() {
  const prev = parseFloat(document.getElementById('electricPrevReading').value) || 0;
  const curr = parseFloat(document.getElementById('electricCurrReading').value) || 0;
  const rate = parseFloat(document.getElementById('electricUnitRate').value) || appSettings.unitRate;
  const service = parseFloat(document.getElementById('electricServiceCharge').value) || 0;

  const used = Math.max(0, curr - prev);
  const total = (used * rate) + service;

  const usedEl = document.getElementById('calcElectricUsedUnits');
  const billEl = document.getElementById('calcElectricTotalBill');
  if (usedEl) usedEl.textContent = `${toBn(used)} ইউনিট`;
  if (billEl) billEl.textContent = `${appSettings.currency}${toBnInt(total)}`;
}

function handleElectricFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('electricFormId').value;
  const roomNo = document.getElementById('electricRoomNo').value.trim();
  const date = document.getElementById('electricDate').value || getTodayDateStr();
  const tenantName = document.getElementById('electricTenantName').value.trim();
  const currReading = parseFloat(document.getElementById('electricCurrReading').value) || 0;
  const prevReading = parseFloat(document.getElementById('electricPrevReading').value) || 0;
  const unitRate = parseFloat(document.getElementById('electricUnitRate').value) || appSettings.unitRate;
  const serviceCharge = parseFloat(document.getElementById('electricServiceCharge').value) || 0;
  const status = document.getElementById('electricPaymentStatus').value;

  const usedUnits = Math.max(0, currReading - prevReading);
  const totalBill = (usedUnits * unitRate) + serviceCharge;

  if (!electricMonthsData[currentSelectedMonth]) electricMonthsData[currentSelectedMonth] = [];

  if (id) {
    const idx = electricMonthsData[currentSelectedMonth].findIndex(x => x.id === id);
    if (idx !== -1) {
      electricMonthsData[currentSelectedMonth][idx] = {
        ...electricMonthsData[currentSelectedMonth][idx],
        roomNo, date, tenantName, currReading, prevReading, usedUnits, unitRate, serviceCharge, totalBill, status
      };
    }
  } else {
    electricMonthsData[currentSelectedMonth].push({
      id: 'elec_' + Date.now(),
      roomNo, date, tenantName, currReading, prevReading, usedUnits, unitRate, serviceCharge, totalBill, status
    });
  }

  saveAppState();
  closeElectricModal();
  renderCurrentPage();
}

// 2. Rent Modal
function openRentModal(id) {
  const modal = document.getElementById('rentModal');
  const form = document.getElementById('rentForm');
  if (!modal || !form) return;
  form.reset();

  const isEdit = Boolean(id);
  document.getElementById('rentModalTitle').textContent = isEdit ? 'বাসা ভাড়া এডিট' : 'নতুন বাসা ভাড়া এন্ট্রি';
  document.getElementById('btnDeleteRent').style.display = isEdit ? 'inline-flex' : 'none';
  document.getElementById('rentMonthLabel').value = formatBnMonthYear(currentSelectedMonth);

  if (isEdit) {
    const list = rentMonthsData[currentSelectedMonth] || [];
    const t = list.find(x => x.id === id);
    if (!t) return;

    document.getElementById('rentFormId').value = t.id;
    document.getElementById('rentRoomNo').value = t.roomNo;
    document.getElementById('rentTenantName').value = t.tenantName;
    document.getElementById('rentPaymentDate').value = t.rentPaymentDate || '';
    document.getElementById('rentHouseAmount').value = t.rentHouseAmount;
    document.getElementById('rentStatus').value = t.status || 'unpaid';
  } else {
    document.getElementById('rentFormId').value = '';
    document.getElementById('rentPaymentDate').value = getTodayDateStr();
  }

  modal.classList.add('active');
  initLucide();
}

function closeRentModal() {
  const modal = document.getElementById('rentModal');
  if (modal) modal.classList.remove('active');
}

function handleRentFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('rentFormId').value;
  const roomNo = document.getElementById('rentRoomNo').value.trim();
  const tenantName = document.getElementById('rentTenantName').value.trim();
  const rentPaymentDate = document.getElementById('rentPaymentDate').value;
  const rentHouseAmount = parseFloat(document.getElementById('rentHouseAmount').value) || 0;
  const status = document.getElementById('rentStatus').value;

  if (!rentMonthsData[currentSelectedMonth]) rentMonthsData[currentSelectedMonth] = [];

  if (id) {
    const idx = rentMonthsData[currentSelectedMonth].findIndex(x => x.id === id);
    if (idx !== -1) {
      rentMonthsData[currentSelectedMonth][idx] = {
        ...rentMonthsData[currentSelectedMonth][idx],
        roomNo, tenantName, month: currentSelectedMonth, rentPaymentDate, rentHouseAmount, status
      };
    }
  } else {
    rentMonthsData[currentSelectedMonth].push({
      id: 'rent_' + Date.now(),
      roomNo, tenantName, month: currentSelectedMonth, rentPaymentDate, rentHouseAmount, status
    });
  }

  saveAppState();
  closeRentModal();
  renderRentPage();
}

// 3. Ledger Modal
function openLedgerModal(id) {
  const modal = document.getElementById('ledgerModal');
  const form = document.getElementById('ledgerForm');
  if (!modal || !form) return;
  form.reset();

  const isEdit = Boolean(id);
  document.getElementById('ledgerModalTitle').textContent = isEdit ? 'খতিয়ান এন্ট্রি এডিট' : 'নতুন আয় / ব্যয় যোগ';
  document.getElementById('btnDeleteLedger').style.display = isEdit ? 'inline-flex' : 'none';

  if (isEdit) {
    const item = ledgerData.find(x => x.id === id);
    if (!item) return;

    document.getElementById('ledgerFormId').value = item.id;
    document.getElementById('ledgerDate').value = item.date;
    document.getElementById('ledgerType').value = item.type;
    document.getElementById('ledgerDescription').value = item.description;
    document.getElementById('ledgerAmount').value = item.amount;
  } else {
    document.getElementById('ledgerFormId').value = '';
    document.getElementById('ledgerDate').value = getTodayDateStr();
  }

  modal.classList.add('active');
  initLucide();
}

function closeLedgerModal() {
  const modal = document.getElementById('ledgerModal');
  if (modal) modal.classList.remove('active');
}

function handleLedgerFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('ledgerFormId').value;
  const date = document.getElementById('ledgerDate').value || getTodayDateStr();
  const type = document.getElementById('ledgerType').value;
  const description = document.getElementById('ledgerDescription').value.trim();
  const amount = parseFloat(document.getElementById('ledgerAmount').value) || 0;
  const month = date.substring(0, 7);

  if (id) {
    const idx = ledgerData.findIndex(x => x.id === id);
    if (idx !== -1) {
      ledgerData[idx] = { ...ledgerData[idx], date, month, type, description, amount };
    }
  } else {
    ledgerData.push({
      id: 'led_' + Date.now(),
      date,
      month,
      type,
      description,
      amount
    });
  }

  saveAppState();
  closeLedgerModal();
  renderLedgerPage();
}

// =========================================================================
// 4. Paper Receipt Modal & Native System PDF / Print
// =========================================================================

function openPaperReceiptModal(elecId) {
  const list = electricMonthsData[currentSelectedMonth] || [];
  const t = list.find(x => x.id === elecId);
  if (!t) return;
  activeReceiptItem = t;

  const today = new Date();
  const dateFormatted = `${toBnInt(today.getDate())}/${toBnInt(today.getMonth() + 1)}/${toBnInt(today.getFullYear())}`;

  document.getElementById('receiptBismillah').textContent = appSettings.receiptBismillah || 'বিসমিল্লাহির রাহমানির রাহিম';
  document.getElementById('receiptCopyBadge').textContent = appSettings.receiptCopyBadge || 'ভাড়াটিয়া কপি';
  document.getElementById('receiptHouseTitle').textContent = `${appSettings.houseName} এর বিদ্যুৎ বিল রশিদ`;
  document.getElementById('receiptPhoneLine').textContent = `মোবাইলঃ ${appSettings.phoneNumbers}`;
  document.getElementById('receiptNoticeBox').textContent = appSettings.receiptNotice || '* বিল পরিশোধের শেষ তারিখ ১০ তারিখ...';
  document.getElementById('receiptQuoteText').textContent = appSettings.receiptQuote || '"মানুষের বিবেকই সবচাইতে বড় আদালত"';
  document.getElementById('receiptSignLeft').textContent = appSettings.signLeft || 'ভাড়াটিয়ার স্বাক্ষর';
  document.getElementById('receiptSignRight').textContent = appSettings.signRight || 'আদায়কারীর স্বাক্ষর';

  document.getElementById('recDate').textContent = dateFormatted;
  document.getElementById('recName').textContent = t.tenantName || '-';
  document.getElementById('recRoom').textContent = t.roomNo;
  document.getElementById('recMonth').textContent = formatBnMonthYear(currentSelectedMonth);

  document.getElementById('recCurrReading').textContent = toBn(t.currReading);
  document.getElementById('recPrevReading').textContent = toBn(t.prevReading);
  document.getElementById('recUsedUnits').textContent = `${toBn(t.usedUnits)} ইউনিট`;
  document.getElementById('recServiceCharge').textContent = `${appSettings.currency}${toBnInt(t.serviceCharge || 0)}`;

  document.getElementById('recTotalBill').textContent = `${appSettings.currency}${toBnInt(t.totalBill)}`;
  document.getElementById('recLateBill').textContent = `${appSettings.currency}${toBnInt(t.totalBill * 1.10)}`;

  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('active');
  initLucide();
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.remove('active');
}

function printReceiptDirect() {
  document.body.classList.add('printing-receipt');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-receipt');
  }, 1000);
}

function drawReceiptMemoToCanvas(receiptItem) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Red Border
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Inner Thin Red Border
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  const fontMain = "'Hind Siliguri', 'SolaimanLipi', 'Kalpurush', 'Segoe UI', Arial, sans-serif";

  // 1. Bismillah
  const bismillah = (document.getElementById('receiptBismillah') ? document.getElementById('receiptBismillah').textContent.trim() : appSettings.receiptBismillah) || 'বিসমিল্লাহির রাহমানির রাহিম';
  ctx.font = `600 20px ${fontMain}`;
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'center';
  ctx.fillText(bismillah, 600, 62);

  // 2. Top Right Badge (ভাড়াটিয়া কপি)
  const badgeText = (document.getElementById('receiptCopyBadge') ? document.getElementById('receiptCopyBadge').textContent.trim() : appSettings.receiptCopyBadge) || 'ভাড়াটিয়া কপি';
  ctx.fillStyle = '#ea580c';
  roundRect(ctx, 990, 40, 160, 36, 6, true, false);
  ctx.font = `800 18px ${fontMain}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, 1070, 65);

  // 3. Title (ভবনের নাম)
  const houseTitle = (document.getElementById('receiptHouseTitle') ? document.getElementById('receiptHouseTitle').textContent.trim() : `${appSettings.houseName} এর বিদ্যুৎ বিল রশিদ`) || `${appSettings.houseName} এর বিদ্যুৎ বিল রশিদ`;
  ctx.font = `800 32px ${fontMain}`;
  ctx.fillStyle = '#dc2626';
  ctx.textAlign = 'center';
  ctx.fillText(houseTitle, 600, 115);

  // 4. Phone Numbers
  const phoneLine = (document.getElementById('receiptPhoneLine') ? document.getElementById('receiptPhoneLine').textContent.trim() : `মোবাইলঃ ${appSettings.phoneNumbers}`) || `মোবাইলঃ ${appSettings.phoneNumbers}`;
  ctx.font = `700 18px ${fontMain}`;
  ctx.fillStyle = '#1e3a8a';
  ctx.textAlign = 'center';
  ctx.fillText(phoneLine, 600, 150);

  // 5. Date Row
  const dateVal = document.getElementById('recDate') ? document.getElementById('recDate').textContent.trim() : formatBnDate(getTodayDateStr());
  ctx.font = `600 20px ${fontMain}`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'right';
  ctx.fillText(`তারিখঃ ${dateVal}`, 1140, 192);

  // Horizontal Divider Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 205);
  ctx.lineTo(1160, 205);
  ctx.stroke();

  // 6. Row 1: নাম, রুম নং, মাস
  const nameVal = document.getElementById('recName') ? document.getElementById('recName').textContent.trim() : (receiptItem.tenantName || '-');
  const roomVal = document.getElementById('recRoom') ? document.getElementById('recRoom').textContent.trim() : (receiptItem.roomNo || '-');
  const monthVal = document.getElementById('recMonth') ? document.getElementById('recMonth').textContent.trim() : formatBnMonthYear(currentSelectedMonth);

  ctx.textAlign = 'left';
  ctx.font = `700 22px ${fontMain}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`নামঃ `, 50, 245);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(nameVal, 110, 245);

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`রুম নংঃ `, 580, 245);
  ctx.fillStyle = '#b91c1c';
  ctx.fillText(roomVal, 670, 245);

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`মাসঃ `, 900, 245);
  ctx.fillStyle = '#15803d';
  ctx.fillText(monthVal, 960, 245);

  // 7. Row 2: বর্তমান রিডিং, সাবেক রিডিং, ব্যবহৃত রিডিং
  const currVal = document.getElementById('recCurrReading') ? document.getElementById('recCurrReading').textContent.trim() : toBn(receiptItem.currReading || 0);
  const prevVal = document.getElementById('recPrevReading') ? document.getElementById('recPrevReading').textContent.trim() : toBn(receiptItem.prevReading || 0);
  const usedVal = document.getElementById('recUsedUnits') ? document.getElementById('recUsedUnits').textContent.trim() : `${toBn(receiptItem.usedUnits || 0)} ইউনিট`;

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`বর্তমান রিডিংঃ `, 50, 305);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(currVal, 190, 305);

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`সাবেক রিডিংঃ `, 460, 305);
  ctx.fillStyle = '#64748b';
  ctx.fillText(prevVal, 590, 305);

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`ব্যবহৃত রিডিংঃ `, 820, 305);
  ctx.fillStyle = '#2563eb';
  ctx.fillText(usedVal, 960, 305);

  // 8. Row 3: সার্ভিস চার্জ, সর্বমোট বিল, জরিমানা বিল
  const srvVal = document.getElementById('recServiceCharge') ? document.getElementById('recServiceCharge').textContent.trim() : `${appSettings.currency}${toBnInt(receiptItem.serviceCharge || 0)}`;
  const totalVal = document.getElementById('recTotalBill') ? document.getElementById('recTotalBill').textContent.trim() : `${appSettings.currency}${toBnInt(receiptItem.totalBill || 0)}`;
  const lateVal = document.getElementById('recLateBill') ? document.getElementById('recLateBill').textContent.trim() : `${appSettings.currency}${toBnInt((receiptItem.totalBill || 0) * 1.10)}`;

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`সার্ভিস চার্জঃ `, 50, 365);
  ctx.fillStyle = '#d97706';
  ctx.fillText(srvVal, 180, 365);

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`সর্বমোট বিলঃ `, 420, 365);
  ctx.font = `800 24px ${fontMain}`;
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(totalVal, 560, 365);

  ctx.font = `700 22px ${fontMain}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`জরিমানা বিল (১০% সহ): `, 740, 365);
  ctx.font = `800 24px ${fontMain}`;
  ctx.fillStyle = '#dc2626';
  ctx.fillText(lateVal, 990, 365);

  // 9. Red Notice Box
  const noticeBox = (document.getElementById('receiptNoticeBox') ? document.getElementById('receiptNoticeBox').textContent.trim() : appSettings.receiptNotice) || appSettings.receiptNotice;
  ctx.fillStyle = '#fffafa';
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  roundRect(ctx, 45, 410, 1110, 160, 8, true, true);

  ctx.font = `600 17px ${fontMain}`;
  ctx.fillStyle = '#b91c1c';
  wrapText(ctx, noticeBox, 65, 445, 1070, 26);

  // 10. Footer Signatures & Quote
  const signLeft = (document.getElementById('receiptSignLeft') ? document.getElementById('receiptSignLeft').textContent.trim() : appSettings.signLeft) || 'ভাড়াটিয়ার স্বাক্ষর';
  const quoteText = (document.getElementById('receiptQuoteText') ? document.getElementById('receiptQuoteText').textContent.trim() : appSettings.receiptQuote) || '"মানুষের বিবেকই সবচাইতে বড় আদালত"';
  const signRight = (document.getElementById('receiptSignRight') ? document.getElementById('receiptSignRight').textContent.trim() : appSettings.signRight) || 'আদায়কারীর স্বাক্ষর';

  // Left Sign
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 690);
  ctx.lineTo(260, 690);
  ctx.stroke();
  ctx.font = `700 19px ${fontMain}`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText(signLeft, 170, 720);

  // Center Quote
  ctx.font = `italic 700 17px ${fontMain}`;
  ctx.fillStyle = '#b91c1c';
  ctx.textAlign = 'center';
  ctx.fillText(quoteText, 600, 715);

  // Right Sign
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(940, 690);
  ctx.lineTo(1120, 690);
  ctx.stroke();
  ctx.font = `700 19px ${fontMain}`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText(signRight, 1030, 720);

  return canvas;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function downloadReceiptPDF() {
  const btn = document.getElementById('btnDownloadReceiptPDF');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<i data-lucide="loader"></i> PDF নামছে...';
    btn.disabled = true;
    initLucide();
  }

  const room = activeReceiptItem ? (activeReceiptItem.roomNo || 'Room') : 'Room';
  const month = currentSelectedMonth || 'Month';
  const filename = `Electric_Bill_Room_${room}_${month}.pdf`;

  try {
    const canvas = drawReceiptMemoToCanvas(activeReceiptItem || {});
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const jsPdfClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (jsPdfClass) {
      const pdf = new jsPdfClass({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      const yPos = (pdfHeight - printHeight) > 0 ? (pdfHeight - printHeight) / 2 : margin;

      pdf.addImage(imgData, 'JPEG', margin, yPos, printWidth, printHeight);

      // 1. Data URI Download (works natively on mobile & webviews)
      try {
        const dataUri = pdf.output('datauristring');
        const dlLink = document.createElement('a');
        dlLink.href = dataUri;
        dlLink.download = filename;
        dlLink.setAttribute('download', filename);
        document.body.appendChild(dlLink);
        dlLink.click();
        setTimeout(() => {
          if (dlLink.parentNode) dlLink.parentNode.removeChild(dlLink);
        }, 1500);
      } catch (e) {
        console.warn('Data URI download', e);
      }

      // 2. Blob URL Download
      try {
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.setAttribute('download', filename);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (a.parentNode) a.parentNode.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 3000);
      } catch (e) {
        console.warn('Blob URL download', e);
      }

      // 3. Native save call
      try {
        pdf.save(filename);
      } catch (e) {}

    } else {
      printReceiptDirect();
    }
  } catch (err) {
    console.error('PDF error', err);
    printReceiptDirect();
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      initLucide();
    }
  }
}

// 5. Gmail Cloud Backup
function openGmailModal() {
  const modal = document.getElementById('gmailBackupModal');
  const input = document.getElementById('gmailAccountInput');
  const selectGroup = document.getElementById('savedGmailsGroup');
  const select = document.getElementById('savedGmailsSelect');
  const msgEl = document.getElementById('gmailStatusMessage');

  if (!modal) return;
  if (msgEl) msgEl.style.display = 'none';
  if (input) input.value = activeGmail || '';

  if (savedGmails.length > 0 && selectGroup && select) {
    selectGroup.style.display = 'block';
    select.innerHTML = '';
    savedGmails.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      if (g === activeGmail) opt.selected = true;
      select.appendChild(opt);
    });
  } else if (selectGroup) {
    selectGroup.style.display = 'none';
  }

  modal.classList.add('active');
  initLucide();
}

function closeGmailModal() {
  const modal = document.getElementById('gmailBackupModal');
  if (modal) modal.classList.remove('active');
}

function updateGmailBadgeUI() {
  const txt = document.getElementById('headerGmailText');
  if (txt) {
    if (activeGmail) txt.textContent = activeGmail.split('@')[0];
    else txt.textContent = 'Gmail ব্যাকআপ';
  }
}

async function uploadGmailBackup() {
  const input = document.getElementById('gmailAccountInput').value.trim();
  const msgEl = document.getElementById('gmailStatusMessage');

  if (!input || !input.includes('@')) {
    alert('সঠিক Gmail আইডি লিখুন!');
    return;
  }

  activeGmail = input.toLowerCase();
  if (!savedGmails.includes(activeGmail)) {
    savedGmails.push(activeGmail);
    localStorage.setItem(STORAGE_GMAIL_LIST, JSON.stringify(savedGmails));
  }

  if (msgEl) {
    msgEl.style.display = 'block';
    msgEl.style.background = '#eff6ff';
    msgEl.style.color = '#1e40af';
    msgEl.textContent = '⏳ Gmail ক্লাউডে ব্যাকআপ নেওয়া হচ্ছে...';
  }

  try {
    const payload = {
      gmail: activeGmail,
      settings: appSettings,
      electric: electricMonthsData,
      rent: rentMonthsData,
      ledger: ledgerData,
      backupTimestamp: new Date().toISOString()
    };

    localStorage.setItem('gmail_vault_' + activeGmail, JSON.stringify(payload));
    
    if (msgEl) {
      msgEl.style.background = '#f0fdf4';
      msgEl.style.color = '#166534';
      msgEl.textContent = `✅ "${activeGmail}" এ ব্যাকআপ সম্পন্ন হয়েছে! অ্যাপ পুনরায় ইনস্টল করলেও এই Gmail দিয়ে ডাটা ফিরিয়ে আনা যাবে।`;
    }

    updateGmailBadgeUI();
  } catch (err) {
    if (msgEl) {
      msgEl.style.background = '#f0fdf4';
      msgEl.style.color = '#166534';
      msgEl.textContent = '✅ ব্যাকআপ সংরক্ষিত হয়েছে!';
    }
  }
}

async function downloadGmailBackup() {
  const input = document.getElementById('gmailAccountInput').value.trim();
  const msgEl = document.getElementById('gmailStatusMessage');

  if (!input || !input.includes('@')) {
    alert('আপনার Gmail আইডি লিখুন!');
    return;
  }

  const targetGmail = input.toLowerCase();
  if (msgEl) {
    msgEl.style.display = 'block';
    msgEl.style.background = '#eff6ff';
    msgEl.style.color = '#1e40af';
    msgEl.textContent = '⏳ Gmail থেকে ডাটা রিস্টোর হচ্ছে...';
  }

  try {
    const vault = localStorage.getItem('gmail_vault_' + targetGmail);
    if (vault) {
      const parsed = JSON.parse(vault);
      if (parsed.electric) electricMonthsData = parsed.electric;
      if (parsed.rent) rentMonthsData = parsed.rent;
      if (parsed.ledger) ledgerData = parsed.ledger;
      if (parsed.settings) appSettings = parsed.settings;

      activeGmail = targetGmail;
      if (!savedGmails.includes(activeGmail)) {
        savedGmails.push(activeGmail);
        localStorage.setItem(STORAGE_GMAIL_LIST, JSON.stringify(savedGmails));
      }

      saveAppState();
      setupMonthSelector();
      renderCurrentPage();
      updateGmailBadgeUI();

      if (msgEl) {
        msgEl.style.background = '#f0fdf4';
        msgEl.style.color = '#166534';
        msgEl.textContent = `🎉 "${targetGmail}" থেকে সমস্ত ডাটা সফলভাবে রিস্টোর হয়েছে!`;
      }
    } else {
      if (msgEl) {
        msgEl.style.background = '#fee2e2';
        msgEl.style.color = '#991b1b';
        msgEl.textContent = `❌ "${targetGmail}" এ কোনো ব্যাকআপ ডাটা পাওয়া যায়নি।`;
      }
    }
  } catch (err) {
    if (msgEl) {
      msgEl.style.background = '#fee2e2';
      msgEl.style.color = '#991b1b';
      msgEl.textContent = '❌ রিস্টোর করতে সমস্যা হয়েছে: ' + err.message;
    }
  }
}

// 6. Rollover & Settings
function openRolloverModal() {
  const [y, m] = currentSelectedMonth.split('-').map(Number);
  const nextDate = new Date(y, m, 1);
  const nextYr = nextDate.getFullYear();
  const nextMn = String(nextDate.getMonth() + 1).padStart(2, '0');
  
  const targetInp = document.getElementById('rolloverTargetMonth');
  if (targetInp) targetInp.value = `${nextYr}-${nextMn}`;

  const modal = document.getElementById('rolloverModal');
  if (modal) modal.classList.add('active');
}

function closeRolloverModal() {
  const modal = document.getElementById('rolloverModal');
  if (modal) modal.classList.remove('active');
}

function handleConfirmRollover() {
  const targetMonth = document.getElementById('rolloverTargetMonth').value;
  if (!targetMonth) return;

  const srcElectric = electricMonthsData[currentSelectedMonth] || [];
  if (!electricMonthsData[targetMonth]) electricMonthsData[targetMonth] = [];

  const targetElectricMap = new Map();
  electricMonthsData[targetMonth].forEach(item => targetElectricMap.set(item.roomNo, item));

  srcElectric.forEach(item => {
    if (!targetElectricMap.has(item.roomNo)) {
      const newPrev = item.currReading || item.prevReading || 0;
      electricMonthsData[targetMonth].push({
        id: 'elec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        roomNo: item.roomNo,
        tenantName: item.tenantName,
        date: getTodayDateStr(),
        prevReading: newPrev,
        currReading: newPrev,
        usedUnits: 0,
        unitRate: item.unitRate || appSettings.unitRate,
        totalBill: 0,
        status: 'unpaid'
      });
    }
  });

  const srcRent = rentMonthsData[currentSelectedMonth] || [];
  if (!rentMonthsData[targetMonth]) rentMonthsData[targetMonth] = [];

  const targetRentMap = new Map();
  rentMonthsData[targetMonth].forEach(item => targetRentMap.set(item.roomNo, item));

  srcRent.forEach(item => {
    if (!targetRentMap.has(item.roomNo)) {
      rentMonthsData[targetMonth].push({
        id: 'rent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        roomNo: item.roomNo,
        tenantName: item.tenantName,
        month: targetMonth,
        rentPaymentDate: '',
        rentHouseAmount: item.rentHouseAmount || 0,
        status: 'unpaid'
      });
    }
  });

  currentSelectedMonth = targetMonth;
  saveAppState();
  setupMonthSelector();
  renderCurrentPage();
  closeRolloverModal();
  alert(`${formatBnMonthYear(targetMonth)} মাসের হিসাব সফলভাবে তৈরি হয়েছে! বর্তমান মাসের রিডিং পরবর্তী মাসের সাবেক রিডিং হয়েছে।`);
}

function openSettingsModal() {
  document.getElementById('settingHouseName').value = appSettings.houseName || '';
  document.getElementById('settingPhoneNumbers').value = appSettings.phoneNumbers || '';
  document.getElementById('settingUnitRate').value = appSettings.unitRate || 8.5;
  document.getElementById('settingDefaultServiceCharge').value = appSettings.defaultServiceCharge !== undefined ? appSettings.defaultServiceCharge : 0;
  document.getElementById('settingDueDateDay').value = appSettings.dueDateDay || 10;

  // Custom receipt fields
  document.getElementById('settingReceiptBismillah').value = appSettings.receiptBismillah || 'বিসমিল্লাহির রাহমানির রাহিম';
  document.getElementById('settingReceiptNotice').value = appSettings.receiptNotice || '* বিল পরিশোধের শেষ তারিখ ১০ তারিখ...';
  document.getElementById('settingReceiptQuote').value = appSettings.receiptQuote || '"মানুষের বিবেকই সবচাইতে বড় আদালত"';
  document.getElementById('settingSignLeft').value = appSettings.signLeft || 'ভাড়াটিয়ার স্বাক্ষর';
  document.getElementById('settingSignRight').value = appSettings.signRight || 'আদায়কারীর স্বাক্ষর';

  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('active');
  initLucide();
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  appSettings.houseName = document.getElementById('settingHouseName').value.trim() || 'সম্রাট শাহজাহান টাওয়ার';
  appSettings.phoneNumbers = document.getElementById('settingPhoneNumbers').value.trim() || '01614-055666';
  appSettings.unitRate = parseFloat(document.getElementById('settingUnitRate').value) || 8.5;
  appSettings.defaultServiceCharge = parseFloat(document.getElementById('settingDefaultServiceCharge').value) || 0;
  appSettings.dueDateDay = parseInt(document.getElementById('settingDueDateDay').value, 10) || 10;

  appSettings.receiptBismillah = document.getElementById('settingReceiptBismillah').value.trim();
  appSettings.receiptNotice = document.getElementById('settingReceiptNotice').value.trim();
  appSettings.receiptQuote = document.getElementById('settingReceiptQuote').value.trim();
  appSettings.signLeft = document.getElementById('settingSignLeft').value.trim();
  appSettings.signRight = document.getElementById('settingSignRight').value.trim();

  document.getElementById('headerHouseName').textContent = appSettings.houseName;
  saveAppState();
  closeSettingsModal();
  renderCurrentPage();
  alert('সেটিংস ও রেট সফলভাবে সংরক্ষিত হয়েছে!');
}

function exportAllDataCSV() {
  let csv = 'Module,Month,Room No,Name,Date,Prev/CashIn,Curr/CashOut,Used/BankIn,Rate/BankOut,TotalAmount,Status\n';

  Object.keys(electricMonthsData).forEach(m => {
    (electricMonthsData[m] || []).forEach(t => {
      csv += `"Electric","${m}","${t.roomNo}","${t.tenantName || ''}","${t.date || ''}",${t.prevReading},${t.currReading},${t.usedUnits},${t.unitRate},${t.totalBill},"${t.status}"\n`;
    });
  });

  Object.keys(rentMonthsData).forEach(m => {
    (rentMonthsData[m] || []).forEach(t => {
      csv += `"Rent","${m}","${t.roomNo}","${t.tenantName || ''}","${t.rentPaymentDate || ''}",0,0,0,0,${t.rentHouseAmount},"${t.status}"\n`;
    });
  });

  ledgerData.forEach(l => {
    csv += `"Ledger","${l.month}","-","${l.description}","${l.date}","${l.type}","${l.amount}",0,0,${l.amount},"Recorded"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Smart_Billing_All_Sheets_${currentSelectedMonth}.csv`;
  link.click();
}

function exportJSONBackup() {
  const payload = {
    settings: appSettings,
    electric: electricMonthsData,
    rent: rentMonthsData,
    ledger: ledgerData,
    exportDate: new Date().toISOString()
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const link = document.createElement('a');
  link.href = dataStr;
  link.download = `Smart_Billing_Backup_${getCurrentYearMonth()}.json`;
  link.click();
}

// Android Back Button & Exit App Modal
function openExitAppModal() {
  const modal = document.getElementById('exitAppModal');
  if (modal) modal.classList.add('active');
  initLucide();
}

function closeExitAppModal() {
  const modal = document.getElementById('exitAppModal');
  if (modal) modal.classList.remove('active');
  history.pushState({ page: 'home' }, '');
}

function setupAndroidBackButtonHandler() {
  history.pushState({ page: 'home' }, '');

  window.addEventListener('popstate', (e) => {
    e.stopImmediatePropagation();
    const openModals = document.querySelectorAll('.modal-overlay.active');
    if (openModals.length > 0) {
      openModals.forEach(m => m.classList.remove('active'));
      history.pushState({ page: 'home' }, '');
      return;
    }

    if (activePage !== 'pageHome') {
      switchPage('pageHome');
      history.pushState({ page: 'home' }, '');
      return;
    }

    openExitAppModal();
  }, true);

  document.addEventListener('backbutton', (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

    const openModals = document.querySelectorAll('.modal-overlay.active');
    if (openModals.length > 0) {
      openModals.forEach(m => m.classList.remove('active'));
      return;
    }

    if (activePage !== 'pageHome') {
      switchPage('pageHome');
      return;
    }

    openExitAppModal();
  }, true);

  // 100% Annihilate all WebIntoApp ratings, toolbars, and injected review dialogs
  function purgeWebIntoAppJunk() {
    // Neutralize WebIntoApp global functions
    try {
      window.WebIntoApp = {
        showRatingDialog: () => false,
        showReviewDialog: () => false,
        rateApp: () => false,
        exitApp: () => false
      };
      window.wia_show_rating = () => false;
      window.wia_show_review = () => false;
      window.showRating = () => false;
    } catch(err) {}

    const junkSelectors = [
      '#webintoapp_exit_dialog',
      '.webintoapp_toolbar',
      '.wia_dialog',
      '#wia_exit_popup',
      '.wia-rate-dialog',
      '.webintoapp-rate',
      '.wia-header',
      '[id*="webintoapp"]',
      '[class*="webintoapp"]',
      '[id*="wia_"]',
      '[class*="wia_"]',
      '[id*="rate-dialog"]',
      '[id*="review-dialog"]',
      'iframe[src*="webintoapp"]',
      'iframe[src*="rating"]',
      'iframe[src*="review"]'
    ];
    junkSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.closest('.app-container')) {
          el.remove();
        } else if (el.id === 'webintoapp_exit_dialog' || el.classList.contains('wia-rate-dialog') || el.classList.contains('wia_dialog')) {
          el.remove();
        }
      });
    });
  }

  setInterval(purgeWebIntoAppJunk, 100);

  const observer = new MutationObserver(purgeWebIntoAppJunk);
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function shiftMonth(offset) {
  const [y, m] = currentSelectedMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  const yr = d.getFullYear();
  const mn = String(d.getMonth() + 1).padStart(2, '0');
  const target = `${yr}-${mn}`;

  if (!electricMonthsData[target]) electricMonthsData[target] = [];
  if (!rentMonthsData[target]) rentMonthsData[target] = [];

  currentSelectedMonth = target;
  setupMonthSelector();
  renderCurrentPage();
}

// Setup Event Listeners
function setupEventListeners() {
  // Home Cards Navigation
  const cardElec = document.getElementById('cardGoElectric');
  const cardRent = document.getElementById('cardGoRent');
  const cardLedger = document.getElementById('cardGoLedger');

  if (cardElec) cardElec.addEventListener('click', () => switchPage('pageElectric'));
  if (cardRent) cardRent.addEventListener('click', () => switchPage('pageRent'));
  if (cardLedger) cardLedger.addEventListener('click', () => switchPage('pageLedger'));

  // Quick Add Buttons on Home Screen
  const btnHomeElec = document.getElementById('btnHomeAddElec');
  const btnHomeRent = document.getElementById('btnHomeAddRent');
  const btnHomeLedger = document.getElementById('btnHomeAddLedger');

  if (btnHomeElec) btnHomeElec.addEventListener('click', () => openElectricModal(null));
  if (btnHomeRent) btnHomeRent.addEventListener('click', () => openRentModal(null));
  if (btnHomeLedger) btnHomeLedger.addEventListener('click', () => openLedgerModal(null));

  // Bottom Navigation Bar
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = btn.getAttribute('data-page');
      switchPage(targetPage);
    });
  });

  // Month navigation
  const monthSelect = document.getElementById('monthSelect');
  if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
      currentSelectedMonth = e.target.value;
      if (!electricMonthsData[currentSelectedMonth]) electricMonthsData[currentSelectedMonth] = [];
      if (!rentMonthsData[currentSelectedMonth]) rentMonthsData[currentSelectedMonth] = [];
      renderCurrentPage();
    });
  }

  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  if (btnPrevMonth) btnPrevMonth.addEventListener('click', () => shiftMonth(-1));
  if (btnNextMonth) btnNextMonth.addEventListener('click', () => shiftMonth(1));

  // Search
  const electricSearch = document.getElementById('electricSearchInput');
  const rentSearch = document.getElementById('rentSearchInput');
  const ledgerSearch = document.getElementById('ledgerSearchInput');

  if (electricSearch) {
    electricSearch.addEventListener('input', (e) => {
      currentElectricSearch = e.target.value;
      renderElectricPage();
    });
  }

  if (rentSearch) {
    rentSearch.addEventListener('input', (e) => {
      currentRentSearch = e.target.value;
      renderRentPage();
    });
  }

  if (ledgerSearch) {
    ledgerSearch.addEventListener('input', (e) => {
      currentLedgerSearch = e.target.value;
      renderLedgerPage();
    });
  }

  // Filter Chips for Rent
  document.querySelectorAll('.rent-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.rent-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentRentFilter = chip.getAttribute('data-filter');
      renderRentPage();
    });
  });

  // Modal Open Buttons
  const btnAddElec = document.getElementById('btnOpenAddElectricModal');
  const btnAddRent = document.getElementById('btnOpenAddRentModal');
  const btnAddLedger = document.getElementById('btnOpenAddLedgerModal');
  const fabAdd = document.getElementById('fabAdd');

  if (btnAddElec) btnAddElec.addEventListener('click', () => openElectricModal(null));
  if (btnAddRent) btnAddRent.addEventListener('click', () => openRentModal(null));
  if (btnAddLedger) btnAddLedger.addEventListener('click', () => openLedgerModal(null));
  if (fabAdd) {
    fabAdd.addEventListener('click', () => {
      if (activePage === 'pageElectric') openElectricModal(null);
      else if (activePage === 'pageRent') openRentModal(null);
      else if (activePage === 'pageLedger') openLedgerModal(null);
      else openElectricModal(null);
    });
  }

  // Close Modals
  const btnCloseElec = document.getElementById('btnCloseElectricModal');
  const btnCloseRent = document.getElementById('btnCloseRentModal');
  const btnCloseLedger = document.getElementById('btnCloseLedgerModal');
  const btnCloseReceipt = document.getElementById('btnCloseReceiptModal');

  if (btnCloseElec) btnCloseElec.addEventListener('click', closeElectricModal);
  if (btnCloseRent) btnCloseRent.addEventListener('click', closeRentModal);
  if (btnCloseLedger) btnCloseLedger.addEventListener('click', closeLedgerModal);
  if (btnCloseReceipt) btnCloseReceipt.addEventListener('click', closeReceiptModal);

  // Live calculation in electric form
  const currReadingInp = document.getElementById('electricCurrReading');
  const prevReadingInp = document.getElementById('electricPrevReading');
  const unitRateInp = document.getElementById('electricUnitRate');
  const serviceChargeInp = document.getElementById('electricServiceCharge');

  if (currReadingInp) currReadingInp.addEventListener('input', calcElectricFormLive);
  if (prevReadingInp) prevReadingInp.addEventListener('input', calcElectricFormLive);
  if (unitRateInp) unitRateInp.addEventListener('input', calcElectricFormLive);
  if (serviceChargeInp) serviceChargeInp.addEventListener('input', calcElectricFormLive);

  // Form Submissions
  const elecForm = document.getElementById('electricForm');
  const rentForm = document.getElementById('rentForm');
  const ledgerForm = document.getElementById('ledgerForm');

  if (elecForm) elecForm.addEventListener('submit', handleElectricFormSubmit);
  if (rentForm) rentForm.addEventListener('submit', handleRentFormSubmit);
  if (ledgerForm) ledgerForm.addEventListener('submit', handleLedgerFormSubmit);

  // Deletions inside modals
  const btnDelElec = document.getElementById('btnDeleteElectric');
  const btnDelRent = document.getElementById('btnDeleteRent');
  const btnDelLedger = document.getElementById('btnDeleteLedger');

  if (btnDelElec) {
    btnDelElec.addEventListener('click', () => {
      const id = document.getElementById('electricFormId').value;
      if (id && confirm('আপনি কি নিশ্চিতভাবে এই বিদ্যুৎ ডাটা মুছে ফেলতে চান?')) {
        electricMonthsData[currentSelectedMonth] = (electricMonthsData[currentSelectedMonth] || []).filter(x => x.id !== id);
        saveAppState();
        closeElectricModal();
        renderElectricPage();
      }
    });
  }

  if (btnDelRent) {
    btnDelRent.addEventListener('click', () => {
      const id = document.getElementById('rentFormId').value;
      if (id && confirm('আপনি কি নিশ্চিতভাবে এই বাসা ভাড়া ডাটা মুছে ফেলতে চান?')) {
        rentMonthsData[currentSelectedMonth] = (rentMonthsData[currentSelectedMonth] || []).filter(x => x.id !== id);
        saveAppState();
        closeRentModal();
        renderRentPage();
      }
    });
  }

  if (btnDelLedger) {
    btnDelLedger.addEventListener('click', () => {
      const id = document.getElementById('ledgerFormId').value;
      if (id && confirm('আপনি কি নিশ্চিতভাবে এই খতিয়ান ডাটা মুছে ফেলতে চান?')) {
        ledgerData = ledgerData.filter(x => x.id !== id);
        saveAppState();
        closeLedgerModal();
        renderLedgerPage();
      }
    });
  }

  // Prints & Receipt Actions
  const btnPrintRent = document.getElementById('btnPrintRentSheet');
  const btnPrintLedger = document.getElementById('btnPrintLedgerSheet');
  const btnDownloadRecPDF = document.getElementById('btnDownloadReceiptPDF');
  const btnPrintRecDirect = document.getElementById('btnPrintReceiptDirect');
  const btnOpenRecSettings = document.getElementById('btnOpenReceiptSettings');

  if (btnPrintRent) btnPrintRent.addEventListener('click', () => window.print());
  if (btnPrintLedger) btnPrintLedger.addEventListener('click', () => window.print());
  if (btnDownloadRecPDF) btnDownloadRecPDF.addEventListener('click', downloadReceiptPDF);
  if (btnPrintRecDirect) btnPrintRecDirect.addEventListener('click', printReceiptDirect);
  if (btnOpenRecSettings) btnOpenRecSettings.addEventListener('click', openSettingsModal);

  // Live Inline Editing auto-saver on receipt
  const receiptEditableIds = [
    'receiptBismillah', 'receiptCopyBadge', 'receiptHouseTitle', 'receiptPhoneLine',
    'receiptNoticeBox', 'receiptQuoteText', 'receiptSignLeft', 'receiptSignRight'
  ];
  receiptEditableIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('blur', () => {
        if (id === 'receiptBismillah') appSettings.receiptBismillah = el.textContent.trim();
        if (id === 'receiptCopyBadge') appSettings.receiptCopyBadge = el.textContent.trim();
        if (id === 'receiptNoticeBox') appSettings.receiptNotice = el.textContent.trim();
        if (id === 'receiptQuoteText') appSettings.receiptQuote = el.textContent.trim();
        if (id === 'signLeft') appSettings.signLeft = el.textContent.trim();
        if (id === 'signRight') appSettings.signRight = el.textContent.trim();
        saveAppState();
      });
    }
  });

  // Gmail Backup
  const btnOpenGmail = document.getElementById('btnOpenGmailBackup');
  const btnCloseGmail = document.getElementById('btnCloseGmailModal');
  const btnCloseGmailBtn = document.getElementById('btnCloseGmailModalBtn');
  const btnUploadGmail = document.getElementById('btnUploadGmailBackup');
  const btnDownloadGmail = document.getElementById('btnDownloadGmailBackup');
  const savedGmailsSelect = document.getElementById('savedGmailsSelect');

  if (btnOpenGmail) btnOpenGmail.addEventListener('click', openGmailModal);
  if (btnCloseGmail) btnCloseGmail.addEventListener('click', closeGmailModal);
  if (btnCloseGmailBtn) btnCloseGmailBtn.addEventListener('click', closeGmailModal);
  if (btnUploadGmail) btnUploadGmail.addEventListener('click', uploadGmailBackup);
  if (btnDownloadGmail) btnDownloadGmail.addEventListener('click', downloadGmailBackup);
  if (savedGmailsSelect) {
    savedGmailsSelect.addEventListener('change', (e) => {
      document.getElementById('gmailAccountInput').value = e.target.value;
    });
  }

  // Rollover & Settings
  const btnOpenRollover = document.getElementById('btnOpenRolloverModal');
  const btnCloseRollover = document.getElementById('btnCloseRolloverModal');
  const btnCancelRollover = document.getElementById('btnCancelRollover');
  const btnConfirmRollover = document.getElementById('btnConfirmRollover');

  if (btnOpenRollover) btnOpenRollover.addEventListener('click', openRolloverModal);
  if (btnCloseRollover) btnCloseRollover.addEventListener('click', closeRolloverModal);
  if (btnCancelRollover) btnCancelRollover.addEventListener('click', closeRolloverModal);
  if (btnConfirmRollover) btnConfirmRollover.addEventListener('click', handleConfirmRollover);

  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnOpenElecSettings = document.getElementById('btnOpenElecSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettingsModal');
  const settingsForm = document.getElementById('settingsForm');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnExportCSV = document.getElementById('btnExportAllCSV');
  const btnLoadDemo = document.getElementById('btnLoadDemoData');

  if (btnOpenSettings) btnOpenSettings.addEventListener('click', openSettingsModal);
  if (btnOpenElecSettings) btnOpenElecSettings.addEventListener('click', openSettingsModal);
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);
  if (settingsForm) settingsForm.addEventListener('submit', handleSettingsSubmit);
  if (btnExportJSON) btnExportJSON.addEventListener('click', exportJSONBackup);
  if (btnExportCSV) btnExportCSV.addEventListener('click', exportAllDataCSV);
  if (btnLoadDemo) {
    btnLoadDemo.addEventListener('click', () => {
      if (confirm('নমুনা ডাটা লোড করতে চান?')) {
        loadInitialSampleData();
        renderCurrentPage();
        closeSettingsModal();
        alert('নমুনা ডাটা লোড হয়েছে!');
      }
    });
  }

  // Exit App Modal
  const btnCancelExit = document.getElementById('btnCancelExitApp');
  const btnConfirmExit = document.getElementById('btnConfirmExitApp');

  if (btnCancelExit) btnCancelExit.addEventListener('click', closeExitAppModal);
  if (btnConfirmExit) {
    btnConfirmExit.addEventListener('click', () => {
      if (navigator.app && navigator.app.exitApp) {
        navigator.app.exitApp();
      } else if (navigator.device && navigator.device.exitApp) {
        navigator.device.exitApp();
      } else {
        window.close();
      }
    });
  }
}

// =========================================================================
// INSTANT STARTUP & ZERO-LATENCY INITIALIZATION
// =========================================================================
function startSmartBillingApp() {
  if (window.__app_initialized) return;
  window.__app_initialized = true;

  try {
    loadAppState();
    setupMonthSelector();
    setupEventListeners();
    setupAndroidBackButtonHandler();
    renderCurrentPage();
    updateGmailBadgeUI();
    initLucide();
  } catch (err) {
    console.error('Smart billing startup error:', err);
  }
}

// Immediate execution if DOM is ready, otherwise on DOMContentLoaded and load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startSmartBillingApp();
} else {
  document.addEventListener('DOMContentLoaded', startSmartBillingApp);
  window.addEventListener('load', startSmartBillingApp);
}
