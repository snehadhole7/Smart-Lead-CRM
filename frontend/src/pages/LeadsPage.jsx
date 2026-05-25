import { useEffect, useState } from 'react';
import { fetchLeads, createLead, fetchReminders, updateLead, convertLead } from '../api';

function LeadsPage({ token }) {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState('New');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [followUpDue, setFollowUpDue] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [error, setError] = useState('');

  const loadLeads = async (filters = {}) => {
    setError('');
    try {
      const data = await fetchLeads(token, filters);
      setLeads(data);
    } catch (err) {
      setError(err.message || 'Unable to load leads');
    }
  };

  const loadReminders = async () => {
    if (!token) return;
    setLoadingReminders(true);
    try {
      const data = await fetchReminders(token);
      setReminders(data);
    } catch (err) {
      setError(err.message || 'Unable to load reminders');
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadLeads({
      search,
      status: filterStatus === 'All' ? '' : filterStatus,
      followUpDue: followUpDue ? 'true' : '',
    });
    loadReminders();
  }, [token, search, filterStatus, followUpDue]);

  const handleSave = async () => {
    setError('');
    try {
      const newLead = await createLead(token, {
        name,
        company,
        contact,
        status,
        notes,
        nextFollowUp,
      });
      setLeads((prev) => [newLead, ...prev]);
      setName('');
      setCompany('');
      setContact('');
      setStatus('New');
      setNotes('');
      setNextFollowUp('');
      loadReminders();
    } catch (err) {
      setError(err.message || 'Unable to save lead');
    }
  };

  const getNextStatusAction = (currentStatus) => {
    if (currentStatus === 'New') return 'Contacted';
    if (currentStatus === 'Contacted') return 'Qualified';
    return null;
  };

  const handleUpdateLead = async (leadId, updatedFields) => {
    setError('');
    try {
      const updatedLead = await updateLead(token, leadId, updatedFields);
      setLeads((prev) => prev.map((lead) => (lead._id === leadId ? updatedLead : lead)));
      loadReminders();
    } catch (err) {
      setError(err.message || 'Unable to update lead');
    }
  };

  const handleConvertLead = async (leadId) => {
    setError('');
    try {
      await convertLead(token, leadId);
      setLeads((prev) => prev.filter((lead) => lead._id !== leadId));
      loadReminders();
    } catch (err) {
      setError(err.message || 'Unable to convert lead');
    }
  };

  return (
    <div className="page-card">
      <h1>Lead Management</h1>
      <p>Capture leads, schedule follow-ups, and filter the pipeline.</p>
      {error && <div className="error-message">{error}</div>}

      <div className="reminder-panel">
        <div className="reminder-header">
          <h2>Upcoming Follow-up Reminders</h2>
          <span>{loadingReminders ? 'Loading...' : `${reminders.length} due this week`}</span>
        </div>
        {reminders.length > 0 ? (
          <ul>
            {reminders.map((lead) => (
              <li key={lead._id} className="reminder-item">
                <div>
                  <strong>{lead.name}</strong> at <em>{lead.company}</em>
                  <span className="reminder-date">
                    {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : 'No date'}
                  </span>
                </div>
                <button
                  className="small-button"
                  onClick={() => handleUpdateLead(lead._id, { status: getNextStatusAction(lead.status) || lead.status })}
                  disabled={!getNextStatusAction(lead.status)}
                >
                  {getNextStatusAction(lead.status) ? `Mark ${getNextStatusAction(lead.status)}` : 'No quick action'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="reminder-empty">No follow-ups due in the next 7 days.</p>
        )}
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label>Search Leads</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or company" />
        </div>
        <div className="input-group">
          <label>Status Filter</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>All</option>
            <option>New</option>
            <option>Contacted</option>
            <option>Qualified</option>
            <option>Lost</option>
          </select>
        </div>
        <div className="input-group checkbox-group">
          <label>
            <input type="checkbox" checked={followUpDue} onChange={(e) => setFollowUpDue(e.target.checked)} />
            Show follow-ups due this week
          </label>
        </div>
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label>Lead Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="input-group">
          <label>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
        </div>
        <div className="input-group">
          <label>Contact</label>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+1 555 0100" />
        </div>
        <div className="input-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>New</option>
            <option>Contacted</option>
            <option>Qualified</option>
            <option>Lost</option>
          </select>
        </div>
        <div className="input-group">
          <label>Next Follow-up Date</label>
          <input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Notes</label>
          <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter lead notes" />
        </div>
        <button className="primary" onClick={handleSave}>Save Lead</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Follow-up</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const isDue = lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();
              const nextAction = getNextStatusAction(lead.status);
              return (
                <tr key={lead._id} className={isDue ? 'due-row' : ''}>
                  <td>{lead.name}</td>
                  <td>{lead.company}</td>
                  <td>{lead.contact}</td>
                  <td>
                    {lead.status}
                    {isDue && <span className="due-chip">Follow-up due</span>}
                  </td>
                  <td>{lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : '-'}</td>
                  <td>{lead.notes || '-'}</td>
                  <td className="action-cell">
                    {nextAction ? (
                      <button
                        className="small-button"
                        onClick={() => handleUpdateLead(lead._id, { status: nextAction })}
                      >
                        {nextAction === 'Qualified' ? 'Qualify' : `Mark ${nextAction}`}
                      </button>
                    ) : (
                      <span className="status-label">No action</span>
                    )}
                    {lead.status === 'Qualified' && (
                      <button className="small-button secondary" onClick={() => handleConvertLead(lead._id)}>
                        Convert to Customer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeadsPage;
