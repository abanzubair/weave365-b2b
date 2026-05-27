import { useEffect, useState, useRef, useMemo } from 'react';
import { Tag, Users, CloudUpload, ShieldCheck, Globe, Award, BadgeIndianRupee, HeartHandshake, PackagePlus, Truck, PackageCheck } from 'lucide-react';

const PremiumTagIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C69E6A" />
        <stop offset="100%" stopColor="#8C593B" />
      </linearGradient>
    </defs>
    {/* Background soft accent shape */}
    <path d="M46 16L32 6L18 16V44L32 54L46 44V16Z" fill="url(#goldGrad)" fillOpacity="0.06" stroke="url(#goldGrad)" strokeWidth="0.8" strokeDasharray="3 3" />
    {/* The main tag */}
    <path d="M22 18V42C22 43.66 23.34 45 25 45H39C40.66 45 42 43.66 42 42V18L32 9L22 18Z" stroke="url(#goldGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    {/* Inner decorative fine tag border */}
    <path d="M25 20V40C25 41.1 25.9 42 27 42H37C38.1 42 39 41.1 39 40V20L32 13.5L25 20Z" stroke="#8C593B" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* The thread / ribbon hole */}
    <circle cx="32" cy="18" r="2.5" fill="none" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <path d="M32 15.5V11C32 9 30 7.5 28 8.5" stroke="url(#goldGrad)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C69E6A" />
        <stop offset="100%" stopColor="#8C593B" />
      </linearGradient>
    </defs>
    {/* Concentric sharing wave rings */}
    <circle cx="32" cy="32" r="26" stroke="url(#goldGrad)" strokeWidth="0.6" strokeDasharray="4 4" strokeOpacity="0.3" />
    <circle cx="32" cy="32" r="21" stroke="url(#goldGrad)" strokeWidth="0.8" strokeOpacity="0.15" />
    {/* Main Speech Bubble */}
    <path d="M44 28C44 35.73 37.73 42 30 42C27.17 42 24.54 41.16 22.33 39.71L16 41L17.33 34.9C15.89 32.74 15 30.14 15 27.33C15 19.6 21.27 13.33 29 13.33C36.73 13.33 44 19.6 44 28Z" fill="url(#goldGrad)" fillOpacity="0.06" stroke="url(#goldGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    {/* The telephone receiver inside */}
    <path d="M34.5 32C34.3 31.9 33.3 31.4 33.1 31.3C32.9 31.2 32.8 31.2 32.6 31.4C32.4 31.6 31.9 32.3 31.7 32.5C31.5 32.7 31.4 32.7 31.2 32.6C30.8 32.4 29.5 32 28 30.6C26.8 29.5 26 28.2 25.8 27.8C25.6 27.5 25.8 27.3 25.9 27.2C26 27.1 26.1 26.9 26.3 26.8C26.4 26.7 26.5 26.6 26.5 26.4C26.5 26.2 26.4 26 26.3 25.9C26.2 25.6 25.9 24.8 25.7 24.4C25.5 23.9 25.3 24 25.2 24H24.7C24.5 24 24.2 24.1 24 24.3C23.7 24.6 23 25.3 23 26.7C23 28.1 24 29.5 24.1 29.7C24.2 29.9 26.1 32.8 29 34C29.7 34.3 30.2 34.5 30.6 34.6C31.3 34.8 31.9 34.8 32.4 34.7C33 34.6 33.6 34.2 33.8 33.7C34 33.2 34 32.7 33.9 32.6C33.8 32.5 33.6 32.4 33.4 32.3Z" stroke="url(#goldGrad)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PremiumResellerIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C69E6A" />
        <stop offset="100%" stopColor="#8C593B" />
      </linearGradient>
    </defs>
    {/* Geometric framing */}
    <circle cx="32" cy="32" r="26" stroke="url(#goldGrad)" strokeWidth="0.8" strokeOpacity="0.2" />
    <path d="M12 32C12 20.95 20.95 12 32 12C43.05 12 52 20.95 52 32" stroke="url(#goldGrad)" strokeWidth="0.5" strokeDasharray="3 3" />
    {/* Center User */}
    <path d="M32 35C38 35 41 38 41 42V45H23V42C23 38 26 35 32 35Z" fill="url(#goldGrad)" fillOpacity="0.06" stroke="url(#goldGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="25" r="5" stroke="url(#goldGrad)" strokeWidth="1.6" />
    {/* Left User Background */}
    <path d="M21.5 35C24.5 35 26.5 37 26.5 40V43.5" stroke="#8C593B" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
    <circle cx="20.5" cy="28.5" r="3.5" stroke="#8C593B" strokeWidth="1.2" strokeOpacity="0.5" />
    {/* Right User Background */}
    <path d="M42.5 35C39.5 35 37.5 37 37.5 40V43.5" stroke="#8C593B" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
    <circle cx="43.5" cy="28.5" r="3.5" stroke="#8C593B" strokeWidth="1.2" strokeOpacity="0.5" />
  </svg>
);

const PremiumArrivalsIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C69E6A" />
        <stop offset="100%" stopColor="#8C593B" />
      </linearGradient>
    </defs>
    {/* Sparkle stars */}
    <path d="M48 15L49 18L52 19L49 20L48 23L47 20L44 19L47 18L48 15Z" fill="url(#goldGrad)" opacity="0.8" />
    <path d="M16 10L17 12L19 13L17 14L16 16L15 14L13 13L15 12L16 10Z" fill="url(#goldGrad)" opacity="0.5" />
    {/* Cloud Body */}
    <path d="M43.5 39.5A6.5 6.5 0 0 0 45 27A10.5 10.5 0 0 0 25.5 22.5A9.5 9.5 0 0 0 17.5 35A6 6 0 0 0 19 46.5H43C47.42 46.5 51 42.92 51 38.5C51 34.62 47.74 31.5 43.5 31.5" fill="url(#goldGrad)" fillOpacity="0.06" stroke="url(#goldGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    {/* Upward arrow */}
    <path d="M32 41V27M32 27L28 31M32 27L36 31" stroke="url(#goldGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PremiumQualityIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C69E6A" />
        <stop offset="100%" stopColor="#8C593B" />
      </linearGradient>
    </defs>
    {/* Heraldic background lines */}
    <path d="M32 6L48 11V25C48 37 32 46 32 46C32 46 16 37 16 25V11L32 6Z" fill="url(#goldGrad)" fillOpacity="0.06" stroke="url(#goldGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    {/* Fine inner shield */}
    <path d="M32 10L44 14V25C44 34.5 32 42 32 42C32 42 20 34.5 20 25V14L32 10Z" stroke="#8C593B" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* The checkmark */}
    <path d="M26 24L30.5 28.5L38.5 20.5" stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PremiumWholesaleIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C69E6A" />
        <stop offset="100%" stopColor="#8C593B" />
      </linearGradient>
    </defs>
    {/* Outer circle */}
    <circle cx="32" cy="32" r="21" fill="url(#goldGrad)" fillOpacity="0.06" stroke="url(#goldGrad)" strokeWidth="1.6" />
    {/* Vertical and horizontal axes */}
    <path d="M32 11V53" stroke="url(#goldGrad)" strokeWidth="1.2" strokeOpacity="0.6" />
    <path d="M11 32H53" stroke="url(#goldGrad)" strokeWidth="1.2" strokeOpacity="0.6" />
    {/* Elliptical longitude arcs */}
    <path d="M32 11C38.5 16.5 42.5 24 42.5 32C42.5 40 38.5 47.5 32 53" stroke="url(#goldGrad)" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M32 11C25.5 16.5 21.5 24 21.5 32C21.5 40 25.5 47.5 32 53" stroke="url(#goldGrad)" strokeWidth="1.4" strokeLinecap="round" />
    {/* Latitude curves */}
    <path d="M14.5 21.5H49.5" stroke="#8C593B" strokeWidth="0.8" strokeOpacity="0.4" />
    <path d="M14.5 42.5H49.5" stroke="#8C593B" strokeWidth="0.8" strokeOpacity="0.4" />
  </svg>
);

const featureStripItems = [
  { icon: PremiumTagIcon, line1: 'White Label', line2: 'Catalogue' },
  { icon: WhatsAppIcon, line1: 'Easy Sharing', line2: 'on WhatsApp' },
  { icon: PremiumResellerIcon, line1: 'Reseller', line2: 'Friendly' },
  { icon: PremiumArrivalsIcon, line1: 'Daily New', line2: 'Arrivals' },
  { icon: PremiumQualityIcon, line1: 'Trusted Quality', line2: 'Assurance' },
  { icon: PremiumWholesaleIcon, line1: 'Pan India', line2: 'Wholesale' },
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
