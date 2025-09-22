// 1. Import the useNavigate hook
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

const CTASection = () => {
  // 2. Initialize the navigate function
  const navigate = useNavigate();

  const benefits = [
    'Complete AMU Monitoring',
    'MRL Compliance Alerts',
    'Multi-Role Access',
  ];

  return (
    <section className="py-20 bg-primary text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-green-600"></div>
      <div className="absolute inset-0 bg-pattern opacity-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Lead the Fight Against AMR
          </h2>
          <p className="text-xl lg:text-2xl text-green-100 mb-8 leading-relaxed">
            Join India's comprehensive antimicrobial stewardship platform. Protect public health through responsible livestock practices.
          </p>

          {/* Main CTA */}
          <div className="mb-8">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-4 bg-white text-primary hover:bg-gray-100"
              // 3. Update the onClick handler to navigate to /register
              onClick={() => navigate('/register')}
              data-testid="button-join-now"
            >
              Join Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 text-green-100">
            {benefits.map((benefit, index) => (
              <div key={benefit} className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-300" />
                <span data-testid={`benefit-${index}`}>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;