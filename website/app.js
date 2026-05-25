const apiUrl = 'http://127.0.0.1:4000';

const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const dashboardSection = document.getElementById('dashboardSection');
const leadsSection = document.getElementById('leadsSection');
const customersSection = document.getElementById('customersSection');
const reportsSection = document.getElementById('reportsSection');
const loginBtn = document.getElementById('loginBtn');
const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const signupBtn = document.getElementById('signupBtn');
const sendSignupOtpBtn = document.getElementById('sendSignupOtpBtn');
const verifySignupOtpBtn = document.getElementById('verifySignupOtpBtn');
const generatePasswordBtn = document.getElementById('generatePasswordBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const signupInfo = document.getElementById('signupInfo');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const otpInfo = document.getElementById('otpInfo');
const leadError = document.getElementById('leadError');
const customerError = document.getElementById('customerError');

const navButtons = document.querySelectorAll('.nav-btn');
const navDashboard = document.getElementById('nav-dashboard');
const navLeads = document.getElementById('nav-leads');
const navCustomers = document.getElementById('nav-customers');
const navReports = document.getElementById('nav-reports');

const totalLeadsEl = document.getElementById('totalLeads');
const totalCustomersEl = document.getElementById('totalCustomers');
const followUpsEl = document.getElementById('followUps');
const conversionRateEl = document.getElementById('conversionRate');
const welcomeText = document.getElementById('welcomeText');

const leadsTable = document.getElementById('leadsTable');
const customersTable = document.getElementById('customersTable');
const reportLeads = document.getElementById('reportLeads');
const reportCustomers = document.getElementById('reportCustomers');
const reportFollowUps = document.getElementById('reportFollowUps');
const reportConversionRate = document.getElementById('reportConversionRate');

const leadName = document.getElementById('leadName');
const leadCompany = document.getElementById('leadCompany');
const leadContact = document.getElementById('leadContact');
const leadStatus = document.getElementById('leadStatus');
const saveLeadBtn = document.getElementById('saveLeadBtn');

const tokenKey = 'crmToken';
const userKey = 'crmUser';

const setActiveNav = (button) => {
  navButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
};

const showSection = (section) => {
  [loginSection, signupSection, dashboardSection, leadsSection, customersSection, reportsSection].forEach((sec) => sec.classList.add('hidden'));
  section.classList.remove('hidden');
};

const getToken = () => localStorage.getItem(tokenKey);
const getUser = () => JSON.parse(localStorage.getItem(userKey));

const request = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const showLoginMessage = (element, message) => {
  element.textContent = message;
  element.classList.remove('hidden');
};

const clearLoginMessages = () => {
  loginError.classList.add('hidden');
  otpInfo.classList.add('hidden');
};

const showSignupMessage = (element, message) => {
  element.textContent = message;
  element.classList.remove('hidden');
};

const clearSignupMessages = () => {
  signupError.classList.add('hidden');
  signupInfo.classList.add('hidden');
};

const getLoginIdentifier = () => document.getElementById('loginIdentifier').value.trim();
const getOtpChannel = () => document.querySelector('input[name="otpChannel"]:checked').value;
const getSignupOtpChannel = () => document.querySelector('input[name="signupOtpChannel"]:checked').value;
const getPasswordMode = () => document.querySelector('input[name="passwordMode"]:checked').value;
let signupOtpVerified = false;

const isEmailValue = (value) => value.includes('@');
const selectRadio = (name, value) => {
  document.querySelector(`input[name="${name}"][value="${value}"]`).checked = true;
};

const generateRecommendedPassword = () => {
  const words = ['Lead', 'Client', 'Sales', 'Growth', 'Smart', 'Pipeline'];
  const symbol = ['#', '@', '$', '!'][Math.floor(Math.random() * 4)];
  const word = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${word}${symbol}${number}CRM`;
};

const fillRecommendedPassword = () => {
  const passwordInput = document.getElementById('signupPassword');
  passwordInput.type = 'text';
  passwordInput.value = generateRecommendedPassword();
  showSignupMessage(signupInfo, 'Recommended password added. You can use it or edit it.');
};

const storeSession = async (user) => {
  localStorage.setItem(tokenKey, user.token);
  localStorage.setItem(userKey, JSON.stringify(user));
  welcomeText.textContent = `Welcome back, ${user.name}`;
  showSection(dashboardSection);
  setActiveNav(navDashboard);
  await loadDashboard();
};

const login = async () => {
  clearLoginMessages();
  const identifier = getLoginIdentifier();
  const password = document.getElementById('password').value;
  try {
    const user = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    await storeSession(user);
  } catch (err) {
    showLoginMessage(loginError, err.message);
  }
};

const signup = async () => {
  clearSignupMessages();
  if (!signupOtpVerified) {
    showSignupMessage(signupError, 'Please verify signup OTP before creating account');
    return;
  }

  const password = document.getElementById('signupPassword').value.trim();
  if (!password) {
    showSignupMessage(signupError, 'Please set a password before signup');
    return;
  }

  if (password.length < 8) {
    showSignupMessage(signupError, 'Password should be at least 8 characters');
    return;
  }

  try {
    const user = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('signupName').value.trim(),
        email: document.getElementById('signupEmail').value.trim(),
        phone: document.getElementById('signupPhone').value.trim(),
        role: document.getElementById('signupRole').value,
        password,
        otpChannel: getSignupOtpChannel(),
      }),
    });
    await storeSession(user);
  } catch (err) {
    showSignupMessage(signupError, err.message);
  }
};

const sendSignupOtp = async () => {
  clearSignupMessages();
  signupOtpVerified = false;
  try {
    const data = await request('/api/auth/request-signup-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('signupEmail').value.trim(),
        phone: document.getElementById('signupPhone').value.trim(),
        channel: getSignupOtpChannel(),
      }),
    });
    const demoText = data.demoOtp ? ` Demo OTP: ${data.demoOtp}` : ' Enter the OTP you received.';
    showSignupMessage(signupInfo, `${data.message} to ${data.destination}.${demoText}`);
  } catch (err) {
    showSignupMessage(signupError, err.message);
  }
};

const verifySignupOtp = async () => {
  clearSignupMessages();
  try {
    const data = await request('/api/auth/verify-signup-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('signupEmail').value.trim(),
        phone: document.getElementById('signupPhone').value.trim(),
        channel: getSignupOtpChannel(),
        otp: document.getElementById('signupOtpCode').value,
      }),
    });
    signupOtpVerified = true;
    showSignupMessage(signupInfo, `${data.message}. You can now finish signup.`);
  } catch (err) {
    signupOtpVerified = false;
    showSignupMessage(signupError, err.message);
  }
};

const sendOtp = async () => {
  clearLoginMessages();
  const identifier = getLoginIdentifier();
  const channel = getOtpChannel();

  if (!identifier) {
    showLoginMessage(loginError, 'Enter email or phone number first');
    return;
  }

  if (channel === 'email' && !isEmailValue(identifier)) {
    showLoginMessage(loginError, 'You entered a phone number. Select Phone Number to receive OTP by SMS.');
    return;
  }

  if (channel === 'phone' && isEmailValue(identifier)) {
    showLoginMessage(loginError, 'You entered an email. Select Email to receive OTP by email.');
    return;
  }

  try {
    const data = await request('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        channel,
      }),
    });
    const demoText = data.demoOtp ? ` Demo OTP: ${data.demoOtp}` : ' Enter the OTP you received.';
    showLoginMessage(otpInfo, `${data.message} to ${data.destination}.${demoText}`);
  } catch (err) {
    showLoginMessage(loginError, err.message);
  }
};

const verifyOtp = async () => {
  clearLoginMessages();
  try {
    const user = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: getLoginIdentifier(),
        channel: getOtpChannel(),
        otp: document.getElementById('otpCode').value,
      }),
    });
    await storeSession(user);
  } catch (err) {
    showLoginMessage(loginError, err.message);
  }
};

const logout = () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  showSection(loginSection);
  setActiveNav(navDashboard);
};

const loadDashboard = async () => {
  try {
    const summary = await request('/api/reports/summary');
    totalLeadsEl.textContent = summary.totalLeads;
    totalCustomersEl.textContent = summary.totalCustomers;
    followUpsEl.textContent = summary.followUps;
    conversionRateEl.textContent = `${summary.conversionRate}%`;
    reportLeads.textContent = summary.totalLeads;
    reportCustomers.textContent = summary.totalCustomers;
    reportFollowUps.textContent = summary.followUps;
    reportConversionRate.textContent = `${summary.conversionRate}%`;
  } catch (err) {
    console.error(err);
  }
};

const loadLeads = async () => {
  leadError.classList.add('hidden');
  try {
    const leads = await request('/api/leads');
    leadsTable.innerHTML = leads.map((lead) => `
      <tr>
        <td>${lead.name}</td>
        <td>${lead.company}</td>
        <td>${lead.contact}</td>
        <td>${lead.status}</td>
      </tr>
    `).join('');
  } catch (err) {
    leadError.textContent = err.message;
    leadError.classList.remove('hidden');
  }
};

const loadCustomers = async () => {
  customerError.classList.add('hidden');
  try {
    const customers = await request('/api/customers');
    customersTable.innerHTML = customers.map((customer) => `
      <tr>
        <td>${customer.name}</td>
        <td>${customer.company}</td>
        <td>${customer.email}</td>
        <td>${customer.phone}</td>
        <td>${customer.status}</td>
      </tr>
    `).join('');
  } catch (err) {
    customerError.textContent = err.message;
    customerError.classList.remove('hidden');
  }
};

const saveLead = async () => {
  leadError.classList.add('hidden');
  try {
    await request('/api/leads', {
      method: 'POST',
      body: JSON.stringify({
        name: leadName.value,
        company: leadCompany.value,
        contact: leadContact.value,
        status: leadStatus.value,
      }),
    });
    leadName.value = '';
    leadCompany.value = '';
    leadContact.value = '';
    leadStatus.value = 'New';
    await loadLeads();
    await loadDashboard();
  } catch (err) {
    leadError.textContent = err.message;
    leadError.classList.remove('hidden');
  }
};

loginBtn.addEventListener('click', login);
showSignupBtn.addEventListener('click', () => {
  clearLoginMessages();
  showSection(signupSection);
  signupOtpVerified = false;
  document.querySelector('input[name="passwordMode"][value="recommended"]').checked = true;
  fillRecommendedPassword();
});
showLoginBtn.addEventListener('click', () => {
  clearSignupMessages();
  showSection(loginSection);
});
signupBtn.addEventListener('click', signup);
sendSignupOtpBtn.addEventListener('click', sendSignupOtp);
verifySignupOtpBtn.addEventListener('click', verifySignupOtp);
generatePasswordBtn.addEventListener('click', fillRecommendedPassword);
document.querySelectorAll('input[name="signupOtpChannel"]').forEach((input) => {
  input.addEventListener('change', () => {
    signupOtpVerified = false;
    clearSignupMessages();
    document.getElementById('signupOtpCode').value = '';
    showSignupMessage(signupInfo, 'Send and verify OTP again for the selected signup method.');
  });
});
['signupEmail', 'signupPhone'].forEach((id) => {
  document.getElementById(id).addEventListener('input', () => {
    signupOtpVerified = false;
  });
});
document.querySelectorAll('input[name="passwordMode"]').forEach((input) => {
  input.addEventListener('change', () => {
    clearSignupMessages();
    if (getPasswordMode() === 'recommended') {
      fillRecommendedPassword();
    } else {
      document.getElementById('signupPassword').value = '';
      document.getElementById('signupPassword').type = 'password';
      showSignupMessage(signupInfo, 'Enter your own password for phone/email login.');
    }
  });
});
sendOtpBtn.addEventListener('click', sendOtp);
verifyOtpBtn.addEventListener('click', verifyOtp);
document.getElementById('loginIdentifier').addEventListener('input', () => {
  const identifier = getLoginIdentifier();
  if (!identifier) return;
  selectRadio('otpChannel', isEmailValue(identifier) ? 'email' : 'phone');
});
logoutBtn.addEventListener('click', logout);
navDashboard.addEventListener('click', async () => {
  showSection(dashboardSection);
  setActiveNav(navDashboard);
  await loadDashboard();
});
navLeads.addEventListener('click', async () => {
  showSection(leadsSection);
  setActiveNav(navLeads);
  await loadLeads();
});
navCustomers.addEventListener('click', async () => {
  showSection(customersSection);
  setActiveNav(navCustomers);
  await loadCustomers();
});
navReports.addEventListener('click', async () => {
  showSection(reportsSection);
  setActiveNav(navReports);
  await loadDashboard();
});
saveLeadBtn.addEventListener('click', saveLead);

if (getToken()) {
  showSection(dashboardSection);
  const user = getUser();
  if (user) welcomeText.textContent = `Welcome back, ${user.name}`;
  loadDashboard();
} else {
  showSection(loginSection);
}
