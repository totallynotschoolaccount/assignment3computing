import { Link } from 'react-router-dom';

// Shown for any address that does not exist, like /abc
function NotFoundPage() {
  return (
    <section className="fallback-page">
      <span className="section-tag">ERROR 404</span>
      <h1>Page not found</h1>
      <p>We could not find that page. It may have been moved, or the address has a typo.</p>
      <Link className="analyze-button" to="/">
        Go back to the home page
      </Link>
    </section>
  );
}

export default NotFoundPage;