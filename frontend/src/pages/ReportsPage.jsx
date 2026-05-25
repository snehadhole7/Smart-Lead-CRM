import { useEffect, useState } from 'react';
import { fetchSummary } from '../api';

function ReportsPage({ token }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummary(await fetchSummary(token));
      } catch (err) {
        setError(err.message || 'Unable to load reports');
      }
    };
    if (token) loadSummary();
  }, [token]);

  return (
    <div className="page-card">
      <h1>Reports & Analytics</h1>
      <p>Track sales performance, lead progress, and follow-up activity.</p>
      {error && <div className="error-message">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Leads</h3>
          <p>{summary ? summary.totalLeads : '...'}</p>
        </div>
        <div className="stat-card">
          <h3>Total Customers</h3>
          <p>{summary ? summary.totalCustomers : '...'}</p>
        </div>
        <div className="stat-card">
          <h3>Follow-up Leads</h3>
          <p>{summary ? summary.followUps : '...'}</p>
        </div>
        <div className="stat-card">
          <h3>Conversion Rate</h3>
          <p>{summary ? `${summary.conversionRate}%` : '...'}</p>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
