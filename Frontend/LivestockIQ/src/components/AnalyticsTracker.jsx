// Create a new component, e.g., components/AnalyticsTracker.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Send a pageview event every time the route changes
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);

  return null; // This component doesn't render anything
};

export default AnalyticsTracker;