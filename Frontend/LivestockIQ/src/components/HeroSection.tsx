// 1. Import the useNavigate hook
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight } from 'lucide-react';
import dashboardImage from "@assets/generated_images/Livestock_management_dashboard_interface_2be16097.png";

const HeroSection = () => {
  // 2. Initialize the navigate function
  const navigate = useNavigate();

  return (
    <section className="relative bg-gradient-to-br from-green-50 to-white py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Smart{' '}
                <span className="text-primary">Antimicrobial Stewardship</span>{' '}
                for Sustainable Livestock
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl">
                LivestockIQ helps track, monitor, and manage antimicrobial usage across livestock farms while ensuring compliance with Maximum Residue Limits (MRL).
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-3"
                data-testid="button-join-now"
                // 3. Update the onClick handler to navigate to /register
                onClick={() => navigate('/register')}
              >
                Join Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-3"
                data-testid="button-learn-more"
                onClick={() => console.log('Learn more clicked')}
              >
                <Play className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">Supporting AMR mitigation across India</p>
              <div className="flex items-center space-x-6 text-gray-400">
                <span className="font-semibold">Farmers</span>
                <span className="font-semibold">Veterinarians</span>
                <span className="font-semibold">Govt Officials</span>
                <span className="font-semibold">Regulators</span>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={dashboardImage}
                alt="LivestockIQ antimicrobial monitoring dashboard"
                className="w-full h-auto rounded-lg shadow-2xl"
                data-testid="hero-dashboard-image"
              />
              
              {/* Floating UI Elements */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">MRL Alerts</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ACTIVE</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Withdrawal-5d</span>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-green-400/20 rounded-lg transform rotate-3 scale-105 -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;