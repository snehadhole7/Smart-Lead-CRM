import { useEffect, useState } from 'react';
import { fetchSummary, fetchUpcomingCheckins } from '../api';

function Dashboard({ token, user }) {
  const [summary, setSummary] = useState(null);
  const [upcomingCheckins, setUpcomingCheckins] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [error, setError] = useState('');

  const supportsNotifications = typeof window !== 'undefined' && 'Notification' in window;

  const loadUpcomingCheckins = async () => {
    try {
      const data = await fetchUpcomingCheckins(token);
      setUpcomingCheckins(data);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    if (supportsNotifications) {
      setNotificationPermission(Notification.permission);
    }
  }, [supportsNotifications]);

  const requestNotificationPermission = async () => {
    if (!supportsNotifications) return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
  };

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await fetchSummary(token);
        setSummary(data);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard');
      }
    };

    if (token) {
      loadSummary();
      loadUpcomingCheckins();
    }
  }, [token, supportsNotifications]);

  useEffect(() => {
    if (upcomingCheckins.length === 0) return undefined;

    const message = `You have ${upcomingCheckins.length} customer check-in${upcomingCheckins.length > 1 ? 's' : ''} due soon.`;
    setToastMessage(message);

    if (notificationPermission === 'granted' && supportsNotifications) {
      new Notification('CRM Check-in Reminder', { body: message });
    }

    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      const gain = context.createGain();
      gain.gain.value = 0.05;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
      oscillator.onended = () => context.close();
    }

    const timer = setTimeout(() => setToastMessage(''), 6000);
    return () => clearTimeout(timer);
  }, [upcomingCheckins, notificationPermission, supportsNotifications]);

  useEffect(() => {
    if (!token) return undefined;
    const interval = setInterval(loadUpcomingCheckins, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="page-card">
      <h1>Dashboard</h1>
      <div className="dashboard-top-row">
        <p>Welcome back{user ? `, ${user.name}` : ''}. Track lead progress and upcoming follow-ups.</p>
        {supportsNotifications && notificationPermission !== 'granted' && (
          <button type="button" className="small-button" onClick={requestNotificationPermission}>
            Enable Desktop Notifications
          </button>
        )}
      </div>
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
          <button type="button" className="toast-close" onClick={() => setToastMessage('')}>
            ×
          </button>
        </div>
      )}
      {upcomingCheckins.length > 0 && (
        <div className="alert-banner">
          <strong>{upcomingCheckins.length} customer check-in{upcomingCheckins.length > 1 ? 's' : ''} due in the next 7 days.</strong>
          <div className="alert-list">
            {upcomingCheckins.slice(0, 3).map((checkin) => (
              <span key={checkin._id}>{checkin.name} @ {checkin.company}</span>
            ))}
            {upcomingCheckins.length > 3 && <span>and {upcomingCheckins.length - 3} more...</span>}
          </div>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
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
          <h3>Qualified Follow-ups</h3>
          <p>{summary ? summary.followUps : '...'}</p>
        </div>
        <div className="stat-card">
          <h3>Upcoming Follow-ups</h3>
          <p>{summary ? summary.upcomingFollowUps : '...'}</p>
        </div>
        <div className="stat-card">
          <h3>Conversion Rate</h3>
          <p>{summary ? `${summary.conversionRate}%` : '...'}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
