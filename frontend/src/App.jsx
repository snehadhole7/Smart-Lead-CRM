import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LeadsPage from './pages/LeadsPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  const storedToken = localStorage.getItem('crmToken');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('crmUser')) || null);
  const [token, setToken] = useState(storedToken || '');
  const [currentPage, setCurrentPage] = useState(storedToken ? 'dashboard' : 'login');

  useEffect(() => {
    if (!storedToken && token) {
      setCurrentPage('dashboard');
    }
  }, [storedToken, token]);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('crmToken', authToken);
    localStorage.setItem('crmUser', JSON.stringify(userData));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('crmToken');
    localStorage.removeItem('crmUser');
    setCurrentPage('login');
  };

  const pages = {
    dashboard: <Dashboard token={token} user={user} />,
    leads: <LeadsPage token={token} />,
    customers: <CustomersPage token={token} />,
    calendar: <CalendarPage token={token} />,
    reports: <ReportsPage token={token} />,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">www.SmartleadCRM</div>
        <button onClick={() => setCurrentPage('dashboard')} disabled={!token}>Dashboard</button>
        <button onClick={() => setCurrentPage('leads')} disabled={!token}>Leads</button>
        <button onClick={() => setCurrentPage('customers')} disabled={!token}>Customers</button>
        <button onClick={() => setCurrentPage('calendar')} disabled={!token}>Check-in Calendar</button>
        <button onClick={() => setCurrentPage('reports')} disabled={!token}>Reports</button>
        <button onClick={handleLogout} className="primary">Log Out</button>
      </aside>
      <main className="content">
        {currentPage === 'login' ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          pages[currentPage]
        )}
        <footer className="site-footer">Powered by Sneha Dhole</footer>
      </main>
    </div>
  );
}

export default App;
