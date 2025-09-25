import React from 'react';
import { Marquee } from '@/components/ui/Marquee'; // CORRECTED IMPORT
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    content: "LivestockIQ's antimicrobial tracking and MRL compliance alerts have revolutionized our farm operations. We now have complete confidence in our food safety standards.",
    author: "Dr. Priya Sharma",
    role: "Veterinary Officer",
    initials: "PS",
  },
  {
    content: "The digital prescription management system has streamlined our veterinary practice. We can now monitor all antimicrobial treatments across multiple farms.",
    author: "Dr. Rajesh Kumar",
    role: "Livestock Veterinarian",
    initials: "RK",
  },
  {
    content: "As a dairy farmer, tracking antimicrobial usage was always challenging. LivestockIQ's mobile interface makes it so easy to record treatments and get alerts.",
    author: "Sunita Patel",
    role: "Dairy Farmer",
    initials: "SP",
  },
  {
    content: "The real-time dashboards provide invaluable insights for policy making. We can now track AMU trends across regions and make data-driven decisions.",
    author: "Mr. Arun Singh",
    role: "Government Official",
    initials: "AS",
  },
  {
    content: "LivestockIQ's data integrity gives us confidence in regulatory compliance. The automated reporting features save us countless hours and ensure accurate AMU documentation.",
    author: "Dr. Meera Nair",
    role: "Farm Administrator",
    initials: "MN",
  },
];

const TestimonialCard = ({ content, author, role, initials }) => (
  <figure className={cn(
    "relative w-80 cursor-pointer overflow-hidden rounded-xl border p-4",
    "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
    "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
  )}>
    <div className="flex flex-row items-center gap-2">
      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
        {initials}
      </div>
      <div className="flex flex-col">
        <figcaption className="text-sm font-medium dark:text-white">
          {author}
        </figcaption>
        <p className="text-xs font-medium dark:text-white/40">{role}</p>
      </div>
    </div>
    <blockquote className="mt-2 text-sm">"{content}"</blockquote>
  </figure>
);

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Farmers, Veterinarians & Officials Across India!
          </h2>
        </div>
      </div>

      <div className="relative flex flex-col h-full w-full items-center justify-center overflow-hidden rounded-lg bg-background gap-10">
        {/* First marquee - Right to Left */}
        <Marquee pauseOnHover className="[--duration:80s]">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.author} {...testimonial} />
          ))}
        </Marquee>

        {/* Second marquee - Left to Right (reverse) */}
        <Marquee reverse pauseOnHover className="[--duration:80s]">
          {testimonials.map((testimonial, idx) => (
            <TestimonialCard key={`reverse-${idx}`} {...testimonial} />
          ))}
        </Marquee>
      </div>
    </section>
  );
};


export default TestimonialsSection;