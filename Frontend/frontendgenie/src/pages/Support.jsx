import React, { useState } from 'react';
import { 
  Mail, 
  MessageCircle, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  HeadphonesIcon,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import './Support.css';

const SupportPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    problem: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.problem) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call to send email
      const emailData = {
        to: 'mohiuddinsizan13@gmail.com',
        from: formData.email,
        subject: formData.subject || 'Support Request - Landmark Recognition',
        priority: formData.priority,
        message: formData.problem,
        timestamp: new Date().toISOString()
      };

      // Mock API endpoint - replace with your actual email service
      const response = await fetch('/api/support/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Your support request has been sent successfully! We\'ll get back to you within 24 hours.'
        });
        
        // Reset form
        setFormData({
          email: '',
          subject: '',
          problem: '',
          priority: 'medium'
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending support request:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Sorry, there was an error sending your request. Please try again later or contact us directly.'
      });
    } finally {
      setIsSubmitting(false);
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
            <HeadphonesIcon size={48} />
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
            <MessageCircle size={24} />
            <h2>Tell us what's wrong</h2>
            <p>Describe your issue and we'll get back to you soon</p>
          </div>

          <form onSubmit={handleSubmit} className="support-form">
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
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send Support Request
                </>
              )}
            </button>
          </form>

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