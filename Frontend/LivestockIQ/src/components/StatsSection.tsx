import { useEffect, useState } from 'react';

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

const StatsSection = () => {
  const [animatedValues, setAnimatedValues] = useState({
    farmers: 0,
    animals: 0,
    tasks: 0,
    farms: 0,
    species: 0,
  });

  const stats: Stat[] = [
    { value: '25', label: 'Farms Monitoring AMU', suffix: 'K+' },
    { value: '1.2', label: 'Animals Under Surveillance', suffix: 'M+' },
    { value: '300', label: 'MRL Compliance Checks', suffix: 'K+' },
    { value: '2.5', label: 'Veterinarians Connected', suffix: 'K+' },
    { value: '15', label: 'States Covered', suffix: '+' },
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimatedValues(prev => ({ ...prev, farmers: 50 })), 100),
      setTimeout(() => setAnimatedValues(prev => ({ ...prev, animals: 2.5 })), 200),
      setTimeout(() => setAnimatedValues(prev => ({ ...prev, tasks: 500 })), 300),
      setTimeout(() => setAnimatedValues(prev => ({ ...prev, farms: 5 })), 400),
      setTimeout(() => setAnimatedValues(prev => ({ ...prev, species: 10 })), 500),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="py-16 bg-white">
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
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2">
                <span 
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary"
                  data-testid={`stat-value-${index}`}
                >
                  {Object.values(animatedValues)[index]}
                </span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                  {stat.suffix}
                </span>
              </div>
              <p 
                className="text-sm sm:text-base text-gray-600 font-medium"
                data-testid={`stat-label-${index}`}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;