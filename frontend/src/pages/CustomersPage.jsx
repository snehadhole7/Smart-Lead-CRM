import { useEffect, useMemo, useState } from 'react';
import { createCustomer, fetchCustomers, updateCustomer } from '../api';

const statuses = ['All', 'Active', 'At Risk', 'Closed'];

function CustomersPage({ token }) {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');
  const [nextCheckIn, setNextCheckIn] = useState('');

  const loadCustomers = async (filters = {}) => {
    setError('');
    try {
      const data = await fetchCustomers(token, filters);
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Unable to load customers');
    }
  };

  useEffect(() => {
    if (token) {
      loadCustomers({ search, status: filterStatus === 'All' ? '' : filterStatus });
    }
  }, [token, search, filterStatus]);

  const handleCreateCustomer = async () => {
    setError('');
    try {
      const newCustomer = await createCustomer(token, {
        name,
        company,
        email,
        phone,
        status,
        nextCheckIn,
      });
      setCustomers((prev) => [newCustomer, ...prev]);
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setStatus('Active');
      setNextCheckIn('');
    } catch (err) {
      setError(err.message || 'Unable to add customer');
    }
  };

  const handleUpdateStatus = async (customerId, nextStatus) => {
    setError('');
    try {
      const updatedCustomer = await updateCustomer(token, customerId, { status: nextStatus });
      setCustomers((prev) => prev.map((customer) => (customer._id === customerId ? updatedCustomer : customer)));
    } catch (err) {
      setError(err.message || 'Unable to update customer');
    }
  };

  const statusSummary = useMemo(() => {
    return customers.reduce(
      (summary, customer) => {
        summary[customer.status] = (summary[customer.status] || 0) + 1;
        return summary;
      },
      { Active: 0, 'At Risk': 0, Closed: 0 }
    );
  }, [customers]);

  return (
    <div className="page-card">
      <h1>Customer Pipeline</h1>
      <p>Onboard customers and track status across the pipeline.</p>
      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid small-grid">
        {statuses.slice(1).map((label) => (
          <div key={label} className="stat-card">
            <h4>{label}</h4>
            <p>{statusSummary[label] || 0}</p>
          </div>
        ))}
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label>Search Customers</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, company or email" />
        </div>
        <div className="input-group">
          <label>Status Filter</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {statuses.map((statusOption) => (
              <option key={statusOption}>{statusOption}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="checkin-panel">
        <h2>Upcoming Customer Check-ins</h2>
        {customers.filter((customer) => {
          if (!customer.nextCheckIn) return false;
          const now = new Date();
          const checkIn = new Date(customer.nextCheckIn);
          return checkIn >= now && checkIn <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        }).length > 0 ? (
          <ul>
            {customers
              .filter((customer) => customer.nextCheckIn)
              .filter((customer) => {
                const now = new Date();
                const checkIn = new Date(customer.nextCheckIn);
                return checkIn >= now && checkIn <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
              })
              .sort((a, b) => new Date(a.nextCheckIn) - new Date(b.nextCheckIn))
              .map((customer) => (
                <li key={customer._id}>
                  <strong>{customer.name}</strong> with <em>{customer.company}</em>
                  <span>{new Date(customer.nextCheckIn).toLocaleDateString()}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p>No check-ins scheduled in the next 14 days.</p>
        )}
      </div>

      <div className="form-grid customer-onboard-grid">
        <div className="input-group">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div className="input-group">
          <label>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc" />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
        </div>
        <div className="input-group">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 012-3456" />
        </div>
        <div className="input-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Active</option>
            <option>At Risk</option>
            <option>Closed</option>
          </select>
        </div>
        <div className="input-group">
          <label>Next Check-in Date</label>
          <input type="date" value={nextCheckIn} onChange={(e) => setNextCheckIn(e.target.value)} />
        </div>
        <button className="primary" onClick={handleCreateCustomer}>Onboard Customer</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Next Check-in</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id}>
                <td>{customer.name}</td>
                <td>{customer.company}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.status}</td>
                <td>{customer.nextCheckIn ? new Date(customer.nextCheckIn).toLocaleDateString() : '-'}</td>
                <td>
                  {customer.status !== 'Closed' ? (
                    <button
                      className="small-button"
                      onClick={() => handleUpdateStatus(customer._id, customer.status === 'Active' ? 'At Risk' : 'Closed')}
                    >
                      {customer.status === 'Active' ? 'Mark At Risk' : 'Close'}
                    </button>
                  ) : (
                    <span className="status-label">Done</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CustomersPage;
