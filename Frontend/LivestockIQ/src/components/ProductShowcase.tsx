import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import mobileAppImage from "@assets/generated_images/Mobile_livestock_tracking_app_6bd82410.png";
import pastoralImage from "@assets/generated_images/Pastoral_cattle_farming_landscape_140258b0.png";
const ProductShowcase = () => {
  const products = [
    {
      title: 'Farm Management',
      subtitle: 'Comprehensive Antimicrobial Usage Tracking for Farmers',
      description: 'LivestockIQ Farm Portal empowers farmers to record and track antimicrobial usage across their livestock operations. Monitor dosages, frequency, and treatment reasons while ensuring MRL compliance for safe food production.',
      features: [
        'Record Treatment Details – Track types, dosages, frequency, and reasons for antimicrobial use in animals.',
        'Withdrawal Period Alerts – Get automated notifications for withdrawal periods before animal product sale.',
        'MRL Compliance Monitoring – Ensure adherence to Maximum Residue Limits for all treated animals.',
      ],
      image: pastoralImage,
      imageAlt: 'Livestock farm with antimicrobial monitoring',
      reverse: false,
    },
    {
      title: 'Veterinary Integration',
      subtitle: 'Seamless Prescription and Treatment Management',
      description: 'LivestockIQ Vet Portal integrates with veterinary prescriptions and treatment logs to ensure proper antimicrobial stewardship and regulatory compliance across all treatments.',
      features: [
        'Digital Prescription Management – Issue and track veterinary prescriptions with built-in compliance checks.',
        'Treatment Log Integration – Monitor compliance with prescribed antimicrobial treatments and dosages.',
        'AMR Risk Assessment – Analyze antimicrobial usage patterns to identify and mitigate resistance risks.',
      ],
      image: mobileAppImage,
      imageAlt: 'Mobile veterinary prescription app',
      reverse: true,
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Lead India's Antimicrobial Stewardship Revolution
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Set industry standards for responsible antimicrobial use while ensuring livestock health and food safety.
          </p>
        </div>

        {/* Product Sections */}
        <div className="space-y-24">
          {products.map((product, index) => (
            <div
              key={product.title}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                product.reverse ? 'lg:gap-16' : ''
              }`}
            >
              {/* Content */}
              <div className={product.reverse ? 'lg:order-2' : ''}>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                      {product.subtitle}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4">
                    {product.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-6"
                    onClick={() => console.log(`Learn more about ${product.title}`)}
                    data-testid={`button-learn-more-${product.title.toLowerCase()}`}
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              <div className={product.reverse ? 'lg:order-1' : ''}>
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.imageAlt}
                    className="w-full h-auto rounded-lg shadow-xl"
                    data-testid={`product-image-${product.title.toLowerCase()}`}
                  />
                  
                  {/* Decorative elements */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-green-400/10 rounded-lg -z-10"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;