import { useState } from 'react';
import { loginUser } from '../api';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password123');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      const userData = await loginUser(email, password);
      onLogin(userData, userData.token);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="page-card">
      <h1>CRM Login</h1>
      <p>Sign in as Admin, Salesperson, or Manager to access the dashboard.</p>
      <div className="form-grid">
        {error && <div className="error-message">{error}</div>}
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button className="primary" onClick={handleSubmit}>Login</button>
      </div>
    </div>
  );
}

export default LoginPage;
