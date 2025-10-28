import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserProfile } from '../App';
import { login } from '@/api/auth'; // 接後端

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  onNavigateToRegister: () => void;
}

export function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // simple client validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    
    setLoading(true);
    try {
      // ★ real API call: sets token via tokenStore in auth.ts
      const data = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // map backend user → your app's UserProfile
      if (data?.user) {
        onLogin({
          fullName: data.user.username,
          email: data.user.email,
          birthday: data.user.birthday || '',
          dietPreferences: [],
          allergies: [],
          healthRestrictions: [],
          otherPreferences: '',
          familyMembers: [],
        });
      }
      // App will switch screen to 'home' (see your App.tsx onLogin handler)
    } catch (err: any) {
      const msg =
        err?.response?.data?.error
          ? (typeof err.response.data.error === 'string'
              ? err.response.data.error
              : Object.values(err.response.data.error).join('; '))
          : (err?.message || 'Login failed');
      setError(String(msg));
    } finally {
      setLoading(false);
    }
    // Simulate login - in real app would validate credentials
    //onLogin({
    //  fullName: 'John Doe', // Mock user data
    //  email: formData.email,
    //  birthday: '',
    //  dietPreferences: [],
    //  allergies: [],
    //  healthRestrictions: [],
    //  otherPreferences: '',
    //  familyMembers: []
    //});
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        
        .login-container * {
          font-family: 'Inter', 'Noto Sans TC', sans-serif;
        }
        
        .login-button {
          transition: all 0.3s ease;
        }
        
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 133, 0, 0.4);
        }
        
        .login-button:active {
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
        className="login-container min-h-screen flex items-center justify-center p-4" 
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
            <p 
              className="text-gray-600"
              style={{ fontSize: '0.95rem' }}
            >
              Welcome back!
            </p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
            
            <Button 
              type="submit" 
              className="login-button w-full rounded-lg mt-6"
              style={{ 
                backgroundColor: 'var(--menufest-orange)',
                color: 'white',
                padding: '0.875rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Log In
            </Button>
          </form>
          
          {/* Link to Register */}
          <div className="text-center mt-6">
            <span 
              className="text-gray-600"
              style={{ fontSize: '0.9rem' }}
            >
              Don't have an account?{' '}
            </span>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="link-text inline-flex items-center"
              style={{ 
                color: 'var(--menufest-orange)',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
