import React from 'react';
// 1. Import the useNavigate hook
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, BarChart3, Bell, Users, Database, Smartphone, Award, Target, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

const LearnMore = () => {
  // 2. Initialize the navigate function
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "MRL Compliance Monitoring",
      description: "Automated tracking of Maximum Residue Limits with real-time alerts for withdrawal periods, ensuring food safety compliance."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "AMU Analytics & Reporting",
      description: "Comprehensive antimicrobial usage tracking with PDF reports, trend analysis, and data-driven insights for better stewardship."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Alert System",
      description: "Automated notifications for treatment schedules, expiring medications, withdrawal periods, and compliance violations."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-Stakeholder Platform",
      description: "Seamless collaboration between farmers, veterinarians, and regulators with role-based access and communication tools."
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Complete Digital Records",
      description: "Centralized database for animal profiles, treatment history, inventory management, and regulatory compliance documentation."
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile-First Design",
      description: "QR/barcode scanning, offline capability, and responsive design for seamless field operations and data entry."
    }
  ];

  const benefits = [
    {
      category: "For Farmers",
      color: "bg-green-50 border-green-200",
      items: [
        "Reduce antimicrobial residue risks",
        "Optimize livestock health management",
        "Ensure regulatory compliance",
        "Improve farm productivity and profitability"
      ]
    },
    {
      category: "For Veterinarians",
      color: "bg-blue-50 border-blue-200",
      items: [
        "Digital prescription management",
        "Treatment protocol standardization",
        "Multi-farm patient oversight",
        "Evidence-based decision support"
      ]
    },
    {
      category: "For Regulators",
      color: "bg-purple-50 border-purple-200",
      items: [
        "Real-time compliance monitoring",
        "AMR trend analysis and reporting",
        "Policy enforcement tools",
        "Geographic usage pattern insights"
      ]
    }
  ];

  const stats = [
    { number: "100%", label: "MRL Compliance Tracking" },
    { number: "24/7", label: "Real-time Monitoring" },
    { number: "3", label: "User Categories Served" },
    { number: "360°", label: "Farm Management Coverage" }
  ];

  const problemPoints = [
    "Inappropriate antimicrobial use leading to drug resistance",
    "Lack of centralized tracking for antimicrobial usage",
    "Manual record-keeping prone to errors and losses",
    "Difficulty in ensuring MRL compliance before product sales",
    "Poor coordination between farmers and veterinarians",
    "Limited regulatory oversight and enforcement capabilities"
  ];

  const solutions = [
    "Digital antimicrobial usage tracking with automated compliance checks",
    "Centralized platform connecting all stakeholders in the livestock ecosystem",
    "Automated record-keeping with secure cloud-based storage",
    "Real-time MRL monitoring with withdrawal period alerts",
    "Integrated communication tools for seamless farmer-veterinarian coordination",
    "Comprehensive regulatory dashboard with compliance analytics and reporting"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Revolutionizing
              <span className="text-green-500"> Livestock Management</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              LivestockIQ addresses critical challenges in antimicrobial stewardship and food safety through intelligent farm management, ensuring compliance with Maximum Residue Limits while promoting sustainable livestock practices.
            </p>
            {/* 3. Button section updated */}
            <div className="flex justify-center">
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-12 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                onClick={() => navigate('/register')}
              >
                Get Started Today <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-green-500 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                The Challenge: <span className="text-red-500">Antimicrobial Resistance Crisis</span>
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Inappropriate antimicrobial use in livestock farming poses serious risks to public health, food safety, and contributes to the global antimicrobial resistance (AMR) crisis. Current manual systems lack the precision and oversight needed for responsible stewardship.
              </p>
              <div className="space-y-4">
                {problemPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Ministry Initiative</h3>
                </div>
                <div className="space-y-4 text-sm text-gray-600">
                  <p><strong>Organization:</strong> Ministry of Fisheries, Animal Husbandry & Dairying</p>
                  <p><strong>Focus:</strong> Digital solutions for AMU monitoring and MRL compliance</p>
                  <p><strong>Goal:</strong> Improved antimicrobial stewardship and food safety</p>
                  <p><strong>Impact:</strong> Global AMR mitigation and sustainable farming</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Our Solution: <span className="text-green-500">Comprehensive Digital Platform</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              LivestockIQ transforms traditional farm management through intelligent automation, real-time monitoring, and seamless stakeholder collaboration.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-gray-700 text-lg">{solution}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Advantages</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-green-500" />
                  <span className="font-semibold text-gray-900">Regulatory Compliance</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <span className="font-semibold text-gray-900">Improved Farm Productivity</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-green-500" />
                  <span className="font-semibold text-gray-900">Enhanced Food Safety</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-green-500" />
                  <span className="font-semibold text-gray-900">Stakeholder Collaboration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Comprehensive <span className="text-green-500">Feature Suite</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every tool you need for modern livestock management, from animal registration to regulatory compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6 text-green-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for All Users */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Benefits for <span className="text-green-500">Every Stakeholder</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform is designed to serve the unique needs of farmers, veterinarians, and regulators in the livestock ecosystem.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className={`p-8 rounded-xl border-2 ${benefit.color}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{benefit.category}</h3>
                <div className="space-y-4">
                  {benefit.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expected Outcomes */}
      <section className="py-20 bg-gradient-to-br from-green-500 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Expected Outcomes & Impact</h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Our platform drives measurable improvements in antimicrobial stewardship, regulatory compliance, and sustainable farming practices.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Improved antimicrobial stewardship practices",
              "Enhanced MRL compliance across farms",
              "Real-time AMU data for authorities",
              "Data-driven policy decisions",
              "Reduced antimicrobial residues in food",
              "Better public health protection",
              "Contribution to global AMR reduction",
              "Increased farmer and veterinarian engagement",
              "Sustainable livestock farming promotion"
            ].map((outcome, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-200 mt-0.5 flex-shrink-0" />
                  <span className="text-green-50">{outcome}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Transform Your Livestock Management?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join the digital revolution in antimicrobial stewardship. Ensure compliance, improve productivity, and contribute to global health initiatives.
          </p>
          {/* 4. Final CTA section also updated */}
          <div className="flex justify-center">
            <button 
                className="bg-green-500 hover:bg-green-600 text-white px-12 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                onClick={() => navigate('/register')}
            >
              Get Started Now <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LearnMore;