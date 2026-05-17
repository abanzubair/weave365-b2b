import { useEffect, useState, useRef } from 'react';
import { Award, BadgeIndianRupee, HeartHandshake, PackagePlus, Tag, Truck, PackageCheck, ShieldCheck } from 'lucide-react';

const featureStripItems = [
  { icon: BadgeIndianRupee, title: 'Bulk Pricing Advantage', copy: 'Better margins for wholesale buyers & Resellers' },
  { icon: PackagePlus, title: 'Daily New Stock', copy: 'Fresh catalog updates for repeat buying' },
  { icon: Truck, title: 'Pan India & Worldwide Delivery', copy: 'Reliable shipping across India and overseas' },
  { icon: Award, title: 'Low MOQ / Flexible Buying', copy: 'Start small and scale your orders easily' },
];

const benefitStripItems = [
  { icon: PackageCheck, title: '1000+ Designs Available', copy: 'Wide catalog depth for every market' },
  { icon: ShieldCheck, title: '500+ Active Buyers', copy: 'Trusted by repeat wholesale customers' },
  { icon: Tag, title: '10+ Years in Banaras Network', copy: 'Strong sourcing relationships and local reach' },
  { icon: HeartHandshake, title: '95% Repeat Buyer Rate', copy: 'Reliable products, pricing, and dispatch' },
];

export function FeatureStrip() {
  return (
    <section className="feature-strip">
      {featureStripItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon strokeWidth={1.5} />
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

export function BenefitStrip() {
  return (
    <section className="benefit-strip">
      {benefitStripItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon strokeWidth={1.5} />
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

export function Stat({ icon, value, label }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  // Parse target number and suffix (e.g. "1000+" -> 1000 and "+", "95%" -> 95 and "%")
  const match = String(value).match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : '';

  useEffect(() => {
    if (!match) {
      setCount(value);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          
          let start = 0;
          const duration = 1600; // Smooth 1.6s animation
          const startTime = performance.now();

          const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // Smooth easeOutQuad
            const easeProgress = progress * (2 - progress);
            const current = Math.floor(easeProgress * target);
            
            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [target, value, match]);

  return (
    <div ref={elementRef}>
      {icon}
      <strong>
        {match ? `${count}${suffix}` : value}
      </strong>
      <span>{label}</span>
    </div>
  );
}
