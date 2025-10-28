import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserProfile } from '../App';
import { signup } from '@/api/auth'; // 接後端
//import { useNavigate } from 'react-router-dom';

interface RegisterScreenProps {
  onRegister: (user: UserProfile) => void;
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onRegister, onNavigateToLogin }: RegisterScreenProps) {
  //const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match (frontend)
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    // Handle registration
    //onRegister({
      //fullName: formData.username,
      //email: formData.email,
      //birthday: '',
      //dietPreferences: [],
      //allergies: [],
      //healthRestrictions: [],
      //otherPreferences: '',
      //familyMembers: []
    //});

    setLoading(true);
    try {
      // API call
      const data = await signup({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        // birthday 可選：如要收就加一個欄位；後端接受 undefined
      });

      // backend returns { token, user } on 201 → already logged in
      //Tell App we’re logged in; App will set screen to 'home'
      if (data?.user) {
        onRegister({
          fullName: data.user.username,
          email: data.user.email,
          birthday: data.user.birthday || '',
          dietPreferences: [],
          allergies: [],
          healthRestrictions: [],
          otherPreferences: '',
          familyMembers: []
        });
      }

      // navigate after success (already authed)
      //navigate('/', { replace: true });
    } catch (err: any) {
      // backend can return { error: "..." } or field object
      const msg =
        err?.response?.data?.error
          ? (typeof err.response.data.error === 'string'
              ? err.response.data.error
              : Object.values(err.response.data.error).join('; '))
          : (err?.message || 'Signup failed');
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        
        .register-container * {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .register-button {
          transition: all 0.3s ease;
        }
        
        .register-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 133, 0, 0.4);
        }
        
        .register-button:active {
          transform: translateY(0);
        }
        
        .link-text {
          transition: all 0.2s ease;
        }
        
        .link-text:hover {
          opacity: 0.8;
          transform: translateX(2px);
        }
      `}</style>
      
      <div 
        className="register-container min-h-screen flex items-center justify-center p-4" 
        style={{ backgroundColor: 'var(--menufest-green)' }}
      >
        <div 
          className="w-full max-w-md bg-white rounded-2xl p-8"
          style={{ 
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div 
              className="mx-auto mb-4 w-22 h-22 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'white' }}
            >
              <img
                src="/images/logo.png"    // frontend/public/images/
                alt="Menufest logo"
                style={{ width: "50%", height: "50%", objectFit: "contain",  transform: "scale(1.1)" }}
              />
            </div>
            {/*<h1 
              className="mb-2"
              style={{ 
                color: 'var(--menufest-green)',
                fontSize: '2rem',
                fontWeight: '700'
              }}
            >
              Menufest
            </h1>*/}
            <p 
              className="text-gray-600"
              style={{ fontSize: '0.95rem' }}
            >
              Create your account
            </p>
          </div>
          
          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="username"
                style={{ color: 'var(--menufest-green)' }}
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Your name"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
                className="rounded-lg border-gray-300"
                style={{ 
                  backgroundColor: 'var(--menufest-cream)',
                  padding: '0.75rem'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label 
                htmlFor="email"
                style={{ color: 'var(--menufest-green)' }}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="rounded-lg border-gray-300"
                style={{ 
                  backgroundColor: 'var(--menufest-cream)',
                  padding: '0.75rem'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label 
                htmlFor="password"
                style={{ color: 'var(--menufest-green)' }}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="rounded-lg border-gray-300"
                style={{ 
                  backgroundColor: 'var(--menufest-cream)',
                  padding: '0.75rem'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label 
                htmlFor="confirmPassword"
                style={{ color: 'var(--menufest-green)' }}
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className="rounded-lg border-gray-300"
                style={{ 
                  backgroundColor: 'var(--menufest-cream)',
                  padding: '0.75rem'
                }}
              />
            </div>
            
            {/* Error message */}
            {error && (
              <div 
                className="text-center p-2 rounded-lg"
                style={{ 
                  backgroundColor: '#FEE',
                  color: '#C33',
                  fontSize: '0.85rem'
                }}
              >
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading}
              className="register-button w-full rounded-lg mt-6"
              style={{ 
                backgroundColor: 'var(--menufest-orange)',
                color: 'white',
                padding: '0.875rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {/*Sign Up*/}
              {loading ? 'Creating…' : 'Sign Up'}
            </Button>
          </form>
          
          {/* Link to Login */}
          <div className="text-center mt-6">
            <span 
              className="text-gray-600"
              style={{ fontSize: '0.9rem' }}
            >
              Already have an account?{' '}
            </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="link-text inline-flex items-center"
              style={{ 
                color: 'var(--menufest-orange)',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
