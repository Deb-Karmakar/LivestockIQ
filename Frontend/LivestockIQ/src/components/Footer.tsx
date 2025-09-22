import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    'User Portals': ['Farmer Portal', 'Veterinary Portal', 'Government Dashboard', 'Admin Panel', 'Mobile App'],
    'AMU Monitoring': ['Prescription Tracking', 'MRL Compliance', 'Withdrawal Alerts', 'Usage Analytics', 'Blockchain Security'],
    Resources: ['Documentation', 'AMR Guidelines', 'Case Studies', 'Training', 'Webinars'],
    Company: ['About Us', 'Mission', 'Press', 'Partners', 'Contact'],
    Support: ['Help Center', 'Community', 'Status', 'Security', 'Privacy Policy'],
  };

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h3 className="text-2xl font-bold text-primary mb-4">LivestockIQ</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              India's comprehensive antimicrobial stewardship platform. Promoting responsible drug use and protecting public health through smart livestock monitoring.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <button
                  key={social.label}
                  className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-lg flex items-center justify-center transition-colors hover-elevate"
                  onClick={() => console.log(`${social.label} clicked`)}
                  data-testid={`social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <button
                      className="text-gray-400 hover:text-white transition-colors text-left"
                      onClick={() => console.log(`${link} clicked`)}
                      data-testid={`footer-link-${link.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="max-w-md">
            <h4 className="font-semibold text-white mb-2">Stay Updated</h4>
            <p className="text-gray-400 mb-4">
              Get the latest updates on antimicrobial stewardship and AMR mitigation strategies.
            </p>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-newsletter-email"
              />
              <Button 
                variant="default"
                onClick={() => console.log('Newsletter signup clicked')}
                data-testid="button-newsletter-signup"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">
            © 2024 LivestockIQ. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => console.log('Terms clicked')}
              data-testid="link-terms"
            >
              Terms of Service
            </button>
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => console.log('Privacy clicked')}
              data-testid="link-privacy"
            >
              Privacy Policy
            </button>
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => console.log('Cookies clicked')}
              data-testid="link-cookies"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;