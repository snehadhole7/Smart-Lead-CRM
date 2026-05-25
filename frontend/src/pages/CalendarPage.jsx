import { useEffect, useMemo, useState } from 'react';
import { fetchCustomers } from '../api';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEW_OPTIONS = ['Month', 'Week', '14 Days'];
const STATUS_COLORS = {
  Active: 'status-active',
  'At Risk': 'status-risk',
  Closed: 'status-closed',
};

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildCalendar(currentDate, viewRange) {
  if (viewRange === 'Week') {
    const startOfWeek = addDays(currentDate, -currentDate.getDay());
    const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
    return [week];
  }

  if (viewRange === '14 Days') {
    const start = new Date(currentDate);
    const weeks = [];
    let week = [];
    for (let i = 0; i < 14; i += 1) {
      week.push(addDays(start, i));
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    return weeks;
  }

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayIndex = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();

  const calendar = [];
  let week = new Array(startDayIndex).fill(null);

  for (let day = 1; day <= totalDays; day += 1) {
    week.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }

  while (week.length < 7) {
    week.push(null);
  }
  calendar.push(week);

  return calendar;
}

function normalizeDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function CalendarPage({ token }) {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewRange, setViewRange] = useState('Month');

  useEffect(() => {
    const loadCustomers = async () => {
      setError('');
      try {
        const data = await fetchCustomers(token);
        setCustomers(data.filter((customer) => customer.nextCheckIn));
      } catch (err) {
        setError(err.message || 'Unable to load check-ins');
      }
    };
    if (token) loadCustomers();
  }, [token]);

  const calendar = useMemo(() => buildCalendar(currentDate, viewRange), [currentDate, viewRange]);

  const visibleRange = useMemo(() => {
    const start = new Date(currentDate);
    let end = new Date(currentDate);

    if (viewRange === 'Week') {
      start.setDate(currentDate.getDate() - currentDate.getDay());
      end = addDays(start, 6);
    } else if (viewRange === '14 Days') {
      end = addDays(start, 13);
    } else {
      start.setDate(1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    return { start, end };
  }, [currentDate, viewRange]);

  const checkinsByDate = useMemo(() => {
    const map = {};
    customers.forEach((customer) => {
      if (!customer.nextCheckIn) return;
      const checkInDate = new Date(customer.nextCheckIn);
      if (checkInDate < visibleRange.start || checkInDate > visibleRange.end) return;
      const key = normalizeDateKey(checkInDate);
      map[key] = map[key] || [];
      map[key].push(customer);
    });
    return map;
  }, [customers, visibleRange]);

  const selectedCheckins = selectedDate ? checkinsByDate[normalizeDateKey(selectedDate)] || [] : [];
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const visibleLabel =
    viewRange === 'Week'
      ? `Week of ${visibleRange.start.toLocaleDateString()}`
      : viewRange === '14 Days'
      ? `${visibleRange.start.toLocaleDateString()} - ${visibleRange.end.toLocaleDateString()}`
      : monthLabel;

  return (
    <div className="page-card">
      <h1>Check-in Calendar</h1>
      <p>View and manage upcoming customer check-ins in a calendar layout.</p>
      {error && <div className="error-message">{error}</div>}

      <div className="calendar-header">
        <div className="calendar-nav">
          <button
            className="small-button"
            onClick={() => setCurrentDate((prev) => addDays(prev, viewRange === 'Week' ? -7 : viewRange === '14 Days' ? -14 : -30))}
          >
            Previous
          </button>
          <div className="calendar-title">
            <h2>{visibleLabel}</h2>
            <span className="calendar-view-label">{viewRange} view</span>
          </div>
          <button
            className="small-button"
            onClick={() => setCurrentDate((prev) => addDays(prev, viewRange === 'Week' ? 7 : viewRange === '14 Days' ? 14 : 30))}
          >
            Next
          </button>
        </div>
        <div className="calendar-filters">
          <label>
            View
            <select value={viewRange} onChange={(e) => setViewRange(e.target.value)}>
              {VIEW_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="calendar-legend">
        <span className="legend-dot status-active" /> Active
        <span className="legend-dot status-risk" /> At Risk
        <span className="legend-dot status-closed" /> Closed
      </div>

      <div className="calendar-grid">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {calendar.flat().map((date, index) => {
          const isSelected = date && selectedDate && normalizeDateKey(date) === normalizeDateKey(selectedDate);
          const checkins = date ? checkinsByDate[normalizeDateKey(date)] : [];
          const primaryStatus = checkins.length ? checkins[0].status : null;
          return (
            <button
              key={index}
              type="button"
              className={`calendar-cell ${date ? '' : 'empty-cell'} ${checkins.length ? 'has-checkins' : ''} ${isSelected ? 'selected-date' : ''}`}
              onClick={() => date && setSelectedDate(date)}
              disabled={!date}
            >
              <div className="calendar-date-label">{date ? date.getDate() : ''}</div>
              {checkins.length > 0 && (
                <div className="calendar-chip">
                  <span className={`status-dot ${STATUS_COLORS[primaryStatus] || ''}`} />
                  {checkins.length} check-in
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="checkin-detail-panel">
        <h2>{selectedDate ? selectedDate.toLocaleDateString() : 'Select a day'}</h2>
        {selectedDate ? (
          selectedCheckins.length > 0 ? (
            <ul>
              {selectedCheckins.map((customer) => (
                <li key={customer._id}>
                  <div>
                    <strong>{customer.name}</strong>
                    <span>{customer.company}</span>
                  </div>
                  <div className={`status-badge ${STATUS_COLORS[customer.status] || ''}`}>
                    {customer.status}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No scheduled check-ins for this date.</p>
          )
        ) : (
          <p>Tap any date to show scheduled customer check-ins.</p>
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
