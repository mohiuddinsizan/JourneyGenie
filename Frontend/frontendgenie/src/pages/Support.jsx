import React, { useState } from 'react';
import { 
  Mail, 
  MessageCircle, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Headphones,
  Clock,
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react';
import './Support.css';

const SupportPage = () => {
  // Configuration - easily change the receiver email here
  const RECEIVER_EMAIL = 'mohiuddinsizan13@gmail.com';
  
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    problem: '',
    priority: 'medium'
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.problem) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    // Create email content
    const emailSubject = formData.subject || 'Support Request - Landmark Recognition';
    const emailBody = `
Priority: ${formData.priority.toUpperCase()}
From: ${formData.email}
Date: ${new Date().toLocaleString()}

Issue Description:
${formData.problem}

---
This email was sent via the Landmark Recognition Support Form.
    `.trim();

    // Create mailto URL
    const mailtoUrl = `mailto:${RECEIVER_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    try {
      // Try to open email client with different methods
      // Method 1: Create a temporary link and click it (works better in Chrome)
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback method if the first doesn't work
      // setTimeout(() => {
      //   window.open(mailtoUrl);
      // }, 100);
      
      setSubmitStatus({
        type: 'success',
        message: 'Opening your email client... Please send the email to complete your support request.'
      });

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          email: '',
          subject: '',
          problem: '',
          priority: 'medium'
        });
        setSubmitStatus(null);
      }, 3000);

    } catch (error) {
      console.error('Error opening email client:', error);
      setSubmitStatus({
        type: 'error',
        message: `Could not open email client. Please manually email ${RECEIVER_EMAIL} with your issue.`
      });
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', icon: '🟢' },
    { value: 'medium', label: 'Medium Priority', icon: '🟡' },
    { value: 'high', label: 'High Priority', icon: '🔴' }
  ];

  return (
    <div className="support-page">
      <div className="support-container">
        {/* Header Section */}
        <div className="support-header">
          <div className="header-icon">
            <Headphones size={48} />
          </div>
          <h1 className="support-title">Get Help & Support</h1>
          <p className="support-description">
            Having trouble with landmark recognition? Our support team is here to help you get back on track with your travel discoveries.
          </p>
        </div>

        {/* Features Grid */}
        <div className="support-features">
          <div className="feature-card">
            <Clock size={32} className="feature-icon" />
            <h3>24hr Response</h3>
            <p>Quick replies to keep you exploring</p>
          </div>
          <div className="feature-card">
            <Shield size={32} className="feature-icon" />
            <h3>Privacy First</h3>
            <p>Your data is safe and secure</p>
          </div>
          <div className="feature-card">
            <Zap size={32} className="feature-icon" />
            <h3>Expert Solutions</h3>
            <p>Technical issues resolved fast</p>
          </div>
        </div>

        {/* Support Form */}
        <div className="support-form-container">
          <div className="form-header">
            <h2>
              <MessageCircle size={24} />
              Tell us what's wrong
            </h2>
            <p>Describe your issue and we'll get back to you soon</p>
          </div>

          <div className="support-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <Mail size={18} />
                Your Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="your.email@example.com"
                required
              />
            </div>

            {/* Subject Field */}
            <div className="form-group">
              <label htmlFor="subject" className="form-label">
                <MessageCircle size={18} />
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Brief description of your issue"
              />
            </div>

            {/* Priority Selection */}
            <div className="form-group">
              <label className="form-label">
                <AlertCircle size={18} />
                Priority Level
              </label>
              <div className="priority-options">
                {priorityOptions.map((option) => (
                  <label key={option.value} className="priority-option">
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={formData.priority === option.value}
                      onChange={handleInputChange}
                    />
                    <span className="priority-label">
                      <span className="priority-icon">{option.icon}</span>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Problem Description */}
            <div className="form-group">
              <label htmlFor="problem" className="form-label">
                <MessageCircle size={18} />
                Describe Your Problem *
              </label>
              <textarea
                id="problem"
                name="problem"
                value={formData.problem}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                rows="6"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="submit-button"
            >
              <ExternalLink size={20} />
              Open Email Client
            </button>
          </div>

          {/* Status Messages */}
          {submitStatus && (
            <div className={`status-message ${submitStatus.type}`}>
              {submitStatus.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              {submitStatus.message}
            </div>
          )}
        </div>

        {/* FAQ Preview */}
        <div className="faq-preview">
          <h3>Common Issues</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>🤖 AI Not Recognizing Landmark</h4>
              <p>Try taking a clearer photo with good lighting and the landmark centered in frame.</p>
            </div>
            <div className="faq-item">
              <h4>📱 Upload Not Working</h4>
              <p>Check your internet connection and ensure your image is under 10MB in JPG, PNG, or WebP format.</p>
            </div>
            <div className="faq-item">
              <h4>🔗 Broken Links</h4>
              <p>Some Wikipedia links may be temporarily unavailable. Try refreshing or check back later.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;