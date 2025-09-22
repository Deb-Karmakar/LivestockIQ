import React from 'react';
import HeroSection from '../components/homepage/HeroSection';
import FeaturesSection from '../components/homepage/FeaturesSection';
import HowItWorksSection from '../components/homepage/HowItWorksSection';
import CtaSection from '../components/homepage/CtaSection';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  return (
    <div className="bg-white">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default HomePage;