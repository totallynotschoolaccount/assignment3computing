import React from 'react';

// Catches any error while drawing the page, so the user sees a message
// instead of a blank screen. This has to be a class component (Week 11 workshop).
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // the details stay in the browser console, the user only sees a short message
    console.error('PhishFight crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fallback-page">
          <h1>Something went wrong</h1>
          <p>Sorry, PhishFight hit an unexpected problem. Your links were not opened.</p>
          {/* a normal link reloads the whole app, which clears the error */}
          <a className="analyze-button" href="/">
            Go back to the home page
          </a>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;