
import { useState, useEffect } from 'react';
import AuthScreen from '../components/AuthScreen';
import TechnicianSignatureWizard from '../components/TechnicianSignatureWizard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token with backend
      fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('auth_token');
        }
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuthentication = (token: string) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {!isAuthenticated ? (
        <AuthScreen onAuthenticate={handleAuthentication} />
      ) : (
        <TechnicianSignatureWizard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
