import { useEffect, useState, useRef, useMemo } from 'react';
import { Tag, HeartHandshake, Sparkles, BadgeCheck, Globe, PackageCheck, ShieldCheck } from 'lucide-react';

const WhatsAppIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    {/* Outlined speech bubble with tail */}
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    {/* Solid classic WhatsApp receiver receiver scaled and centered beautifully */}
    <path 
      d="M14.85 12.3c-.15-.08-.9-.45-1.04-.5-.14-.05-.24-.08-.34.08-.1.15-.4.5-.48.6-.08.1-.17.11-.32.04-.15-.08-.63-.23-1.2-1.07-.44-.4-.74-.9-.83-1.05-.08-.15-.01-.23.07-.3.07-.07.15-.17.22-.26.08-.09.1-.15.15-.25.05-.1.03-.19-.01-.26-.04-.08-.34-.81-.46-1.1-.12-.3-.25-.26-.34-.26H9.7c-.1 0-.26.04-.37.16-.11.12-.44.44-.44 1.08 0 .64.46 1.25.53 1.34.07.09.9 1.4 2.2 1.96.3.13.55.21.74.27.3.1.58.08.8.05.25-.04.77-.32.88-.63.11-.3.11-.57.08-.63-.03-.06-.12-.09-.27-.17z" 
      fill="currentColor" 
      stroke="none" 
    />
  </svg>
);

const featureStripItems = [
  { icon: Tag, line1: 'White Label', line2: 'Catalogue' },
  { icon: WhatsAppIcon, line1: 'Easy Sharing', line2: 'on WhatsApp' },
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
