// 1. Import the useNavigate hook
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  MapPin, 
  CheckSquare, 
  BarChart3, 
  Heart, 
  Link 
} from 'lucide-react';

const FeaturesGrid = () => {
  // 2. Initialize the navigate function
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Multi-Role Access',
      description: 'Dedicated portals for farmers, veterinarians, government officials, and administrators with role-based permissions and workflows.',
    },
    {
      icon: MapPin,
      title: 'Regional Monitoring',
      description: 'Track antimicrobial usage trends across regions and species with real-time dashboards for policy makers and regulators.',
    },
    {
      icon: CheckSquare,
      title: 'Prescription Tracking',
      description: 'Digital integration with veterinary prescriptions and treatment logs to monitor compliance with antimicrobial stewardship guidelines.',
    },
    {
      icon: BarChart3,
      title: 'Data Analytics',
      description: 'Advanced analytics and visualization tools for AMU trend analysis across species, regions, and time periods with automated reporting.',
    },
    {
      icon: Heart,
      title: 'MRL Compliance',
      description: 'Automated alert systems for withdrawal periods and Maximum Residue Limit compliance prior to animal product sale or processing.',
    },
    {
      icon: Link,
      title: 'Blockchain Security',
      description: 'Secure data integrity and traceability using blockchain technology to ensure tamper-proof antimicrobial usage records.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Features Built for Antimicrobial Stewardship
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive digital tools for responsible antimicrobial use and regulatory compliance
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="p-6 hover-elevate transition-all duration-300 border-2 border-transparent hover:border-primary/20"
              data-testid={`feature-card-${index}`}
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Ready to join the antimicrobial stewardship movement?</p>
          <button 
            className="text-primary font-semibold hover:text-primary/80 transition-colors"
            // 3. Update the onClick handler to navigate to /register
            onClick={() => navigate('/register')}
            data-testid="button-join-now"
          >
            Join Now →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;