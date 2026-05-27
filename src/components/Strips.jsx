import { useEffect, useState, useRef, useMemo } from 'react';
import { Tag, HeartHandshake, Sparkles, BadgeCheck, Globe, PackageCheck, ShieldCheck } from 'lucide-react';
import { WhatsappIcon } from './WhatsappIcon.jsx';

const featureStripItems = [
  { icon: Tag, line1: 'White Label', line2: 'Catalogue' },
  { icon: (props) => <WhatsappIcon size={36} {...props} />, line1: 'Easy Sharing', line2: 'on WhatsApp' },
  { icon: HeartHandshake, line1: 'Reseller', line2: 'Friendly' },
  { icon: Sparkles, line1: 'Daily New', line2: 'Arrivals' },
  { icon: BadgeCheck, line1: 'Trusted Quality', line2: 'Assurance' },
  { icon: Globe, line1: 'Pan India', line2: 'Wholesale' },
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
      {featureStripItems.map(({ icon: Icon, line1, line2 }, idx) => (
        <div key={idx} className="feature-item">
          <Icon strokeWidth={1.5} />
          <span>
            <strong>{line1}</strong>
            <strong>{line2}</strong>
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
  // Parse target number and suffix (e.g. "1000+" -> 1000 and "+", "95%" -> 95 and "%")
  const { target, suffix, hasMatch } = useMemo(() => {
    const match = String(value).match(/^(\d+)(.*)$/);
    return {
      target: match ? parseInt(match[1], 10) : 0,
      suffix: match ? match[2] : '',
      hasMatch: !!match,
    };
  }, [value]);

  const [count, setCount] = useState(target);
  const [isClient, setIsClient] = useState(false);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasMatch) return;

    setIsClient(true);
    setCount(0); // Reset for client-side animation

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          
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
  }, [target, hasMatch]);

  return (
    <div ref={elementRef}>
      {icon}
      <strong>
        {hasMatch ? `${isClient ? count : target}${suffix}` : value}
      </strong>
      <span>{label}</span>
    </div>
  );
}
