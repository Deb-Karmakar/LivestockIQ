import { useEffect, useState, useRef } from 'react';

interface Stat {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

const StatsSection = () => {
  const [animatedValues, setAnimatedValues] = useState({
    farms: 0,
    animals: 0,
    compliance: 0,
    veterinarians: 0,
    states: 0,
  });

  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const stats: Stat[] = [
    { value: 25, label: 'Farms Monitoring AMU', suffix: 'K+' },
    { value: 1.2, label: 'Animals Under Surveillance', suffix: 'M+' },
    { value: 300, label: 'MRL Compliance Checks', suffix: 'K+' },
    { value: 8.5, label: 'Veterinarians Connected', suffix: 'K+' },
    { value: 15, label: 'States Covered', suffix: '+' },
  ];

  // Function to animate counting up to target value
  const animateValue = (
    start: number, 
    end: number, 
    duration: number, 
    callback: (value: number) => void,
    delay: number = 0
  ) => {
    setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = start + (end - start) * easeOutQuart;
        
        callback(parseFloat(currentValue.toFixed(1)));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, delay);
  };

  // Intersection Observer to trigger animation when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Trigger animations when section becomes visible
  useEffect(() => {
    if (isVisible) {
      // Animate each stat with different delays for staggered effect
      animateValue(0, 25, 2000, (value) => 
        setAnimatedValues(prev => ({ ...prev, farms: value })), 200
      );
      
      animateValue(0, 1.2, 2200, (value) => 
        setAnimatedValues(prev => ({ ...prev, animals: value })), 400
      );
      
      animateValue(0, 300, 2400, (value) => 
        setAnimatedValues(prev => ({ ...prev, compliance: value })), 600
      );
      
      animateValue(0, 8.5, 2600, (value) => 
        setAnimatedValues(prev => ({ ...prev, veterinarians: value })), 800
      );
      
      animateValue(0, 15, 2800, (value) => 
        setAnimatedValues(prev => ({ ...prev, states: value })), 1000
      );
    }
  }, [isVisible]);

  // Function to format the display value
  const formatValue = (value: number, originalValue: number) => {
    if (originalValue >= 1) {
      return Math.floor(value).toString();
    } else {
      return value.toFixed(1);
    }
  };

  return (
    <section className="py-16 bg-white" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Our Impact, By the Numbers
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Track our progress in antimicrobial stewardship—promoting responsible drug use and protecting public health across India.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
          {stats.map((stat, index) => {
            const animatedValue = Object.values(animatedValues)[index];
            
            return (
              <div key={stat.label} className="text-center group">
                <div className="mb-2 transform transition-transform duration-300 group-hover:scale-110">
                  <span 
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 transition-colors duration-300"
                    data-testid={`stat-value-${index}`}
                  >
                    {stat.prefix && stat.prefix}
                    {formatValue(animatedValue, stat.value)}
                  </span>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600">
                    {stat.suffix}
                  </span>
                </div>
                <p 
                  className="text-sm sm:text-base text-gray-600 font-medium transition-colors duration-300 group-hover:text-gray-800"
                  data-testid={`stat-label-${index}`}
                >
                  {stat.label}
                </p>
                
                {/* Optional: Add a subtle progress indicator */}
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-2000 ease-out"
                    style={{ 
                      width: isVisible ? '100%' : '0%',
                      transitionDelay: `${index * 200}ms`
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;