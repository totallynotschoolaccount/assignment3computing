import { Shield, Star } from 'lucide-react';

// Our logo from the A2 prototype: a red shield with a white star.
// The two icons sit on top of each other (see .logo in styles.css).
function Logo({ size = 40, big = false }) {
  return (
    <span className={big ? 'logo logo-big' : 'logo'}>
      <Shield size={size} color="#e3192b" fill="#e3192b" />
      <Star className="logo-star" size={size * 0.42} color="#ffffff" fill="#ffffff" />
    </span>
  );
}

export default Logo;