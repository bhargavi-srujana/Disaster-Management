import React, { useState } from 'react';

export default function UserRegistration({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    notify_disasters: true,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      console.log('User registered successfully:', data);
      setSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (success) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}>
        <div style={{
          backgroundColor: '#2D5F3F',
          border: '3px solid #1B3A26',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#F7F6F2',
            border: '3px solid #1B3A26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px'
          }}>
            ✓
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#F7F6F2',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            REGISTRATION SUCCESSFUL
          </h3>
          <p style={{ color: '#C9E4D4', fontSize: '14px' }}>
            You will receive disaster alerts for {formData.location}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#F7F6F2',
        border: '3px solid #2B2B2B',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2B2B2B',
          color: '#F7F6F2',
          padding: '16px 20px',
          borderBottom: '3px solid #000000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            REGISTER FOR DISASTER ALERTS
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '2px solid #F7F6F2',
              color: '#F7F6F2',
              fontSize: '20px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⚪ FULL NAME
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #4A4A4A',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box'
              }}
              placeholder="Name"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ✉ EMAIL ADDRESS
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #4A4A4A',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box'
              }}
              placeholder="email@example.com"
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ☎ PHONE NUMBER
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #4A4A4A',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box'
              }}
              placeholder="+1234567890"
            />
          </div>

          {/* Location */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📍 LOCATION
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #4A4A4A',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box'
              }}
              placeholder="Mumbai, Delhi, etc."
            />
          </div>

          {/* Notification Preference */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#E9E8E3',
            border: '2px solid #4A4A4A',
            marginBottom: '16px'
          }}>
            <input
              type="checkbox"
              name="notify_disasters"
              checked={formData.notify_disasters}
              onChange={handleChange}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <label style={{
              fontSize: '13px',
              fontWeight: '700',
              margin: 0,
              cursor: 'pointer',
              flex: 1
            }}>
              🔔 SEND ME DISASTER ALERTS AND WARNINGS
            </label>
          </div>                    

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#B71C1C',
              border: '2px solid #8B0000',
              color: '#FFFFFF',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#666666' : '#2B2B2B',
              color: '#F7F6F2',
              border: '2px solid #000000',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxSizing: 'border-box'
            }}
          >
            {loading ? 'REGISTERING...' : 'REGISTER FOR ALERTS'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#E9E8E3',
          borderTop: '2px solid #4A4A4A',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center'
        }}>
          YOUR INFORMATION WILL BE USED ONLY FOR SENDING DISASTER ALERTS. WE RESPECT YOUR PRIVACY. IGNORE THIS IF YOU ARE REGISTERED ALREADY.
        </div>
      </div>
    </div>
  );
}
