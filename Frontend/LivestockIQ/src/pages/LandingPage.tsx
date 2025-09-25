
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import ProductShowcase from '@/components/ProductShowcase';
import FeaturesGrid from '@/components/FeaturesGrid';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <HeroSection />
        <StatsSection />
        <ProductShowcase />
        <FeaturesGrid />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;