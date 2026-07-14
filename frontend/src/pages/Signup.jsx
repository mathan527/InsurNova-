import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();

  // Redirect to new multi-step registration
  useEffect(() => {
    navigate('/register');
  }, [navigate]);

  return null;
}

