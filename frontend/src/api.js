const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

const request = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

export const loginUser = (email, password) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const fetchSummary = (token) =>
  request('/api/reports/summary', {
    method: 'GET',
    token,
  });

export const fetchUpcomingCheckins = (token) =>
  request('/api/reports/checkins', {
    method: 'GET',
    token,
  });

export const fetchLeads = (token, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null) {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return request(`/api/leads${query ? `?${query}` : ''}`, {
    method: 'GET',
    token,
  });
};

export const createLead = (token, payload) =>
  request('/api/leads', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });

export const updateLead = (token, id, payload) =>
  request(`/api/leads/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });

export const convertLead = (token, id) =>
  request(`/api/leads/${id}/convert`, {
    method: 'POST',
    token,
  });

export const fetchReminders = (token) =>
  request('/api/leads/reminders', {
    method: 'GET',
    token,
  });

export const fetchCustomers = (token, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null) {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return request(`/api/customers${query ? `?${query}` : ''}`, {
    method: 'GET',
    token,
  });
};

export const createCustomer = (token, payload) =>
  request('/api/customers', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });

export const updateCustomer = (token, id, payload) =>
  request(`/api/customers/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
