import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = [
    {
      content: "LivestockIQ's antimicrobial tracking and MRL compliance alerts have revolutionized our farm operations. We now have complete confidence in our food safety standards and never miss withdrawal periods.",
      author: "Dr. Priya Sharma",
      role: "Veterinary Officer",
      initials: "PS",
      rating: 5,
    },
    {
      content: "The digital prescription management system has streamlined our veterinary practice. We can now monitor all antimicrobial treatments across multiple farms and ensure proper stewardship.",
      author: "Dr. Rajesh Kumar",
      role: "Livestock Veterinarian",
      initials: "RK",
      rating: 5,
    },
    {
      content: "As a dairy farmer, tracking antimicrobial usage was always challenging. LivestockIQ's mobile interface makes it so easy to record treatments and get alerts for withdrawal periods.",
      author: "Sunita Patel",
      role: "Dairy Farmer",
      initials: "SP",
      rating: 5,
    },
    {
      content: "The real-time dashboards provide invaluable insights for policy making. We can now track AMU trends across regions and make data-driven decisions for antimicrobial resistance mitigation.",
      author: "Mr. Arun Singh",
      role: "Government Official",
      initials: "AS",
      rating: 5,
    },
    {
      content: "LivestockIQ's blockchain-secured data integrity gives us confidence in regulatory compliance. The automated reporting features save us countless hours and ensure accurate AMU documentation.",
      author: "Dr. Meera Nair",
      role: "Farm Administrator",
      initials: "MN",
      rating: 5,
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    console.log('Next testimonial clicked');
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    console.log('Previous testimonial clicked');
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Farmers, Veterinarians & Officials Across India!
          </h2>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <Card className="p-8 lg:p-12 text-center">
            {/* Stars */}
            <div className="flex justify-center mb-6">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-8 italic">
              "{testimonials[currentIndex].content}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                {testimonials[currentIndex].initials}
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">
                  {testimonials[currentIndex].author}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentIndex].role}
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              data-testid="button-prev-testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Dots */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    console.log(`Testimonial ${index + 1} selected`);
                  }}
                  data-testid={`testimonial-dot-${index}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              data-testid="button-next-testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;