/**
 * @file InternalLinkNetwork.jsx
 * @description A fully customizable B2B Sourcing and Heritage Directory component rendered at the bottom
 * of the page. Maps the internal linking network dynamically based on Admin Panel configuration to establish
 * topical authority and SEO crawlability for search engines like Google.
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Grid,
  BookOpen,
  Briefcase,
  Layers,
  ShoppingBag,
  Tag,
  Globe,
  Link as LinkIcon,
  FileText,
  Sparkles,
  Star,
  Award,
  HelpCircle,
  Package
} from './icons.jsx';
import {
  getDirectoryConfigLocal,
  fetchDirectoryConfigRemote,
  DIRECTORY_UPDATED_EVENT,
  DEFAULT_DIRECTORY_CONFIG
} from '../utils/directoryService.js';
import { getCategorySlug } from '../config.js';

const DIRECTORY_CSS = `
.internal-link-network{padding:4.5rem 0 4rem;background:var(--paper);position:relative;width:100%;clear:both;box-sizing:border-box;margin-bottom:2rem}
.directory-container{width:min(1600px,calc(100% - var(--site-padding,48px)*2));max-width:1600px;margin:0 auto;min-height:320px;box-sizing:border-box}
.directory-header{margin-bottom:3.5rem;text-align:center;min-height:80px}
.directory-kicker{font-family:var(--font-hero-body);font-size:0.75rem;font-weight:700;letter-spacing:0.2em;color:#634015;text-transform:uppercase;display:block;margin-bottom:0.5rem}
.directory-title{font-family:var(--font-hero-heading);font-size:2.25rem;font-weight:400;line-height:1.2;letter-spacing:-0.02em;color:var(--gold-dark);margin:0 0 1.25rem}
.directory-divider{width:60px;height:2px;background:var(--gold);margin:0 auto;opacity:0.5}
.directory-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3rem 2rem;min-height:220px}
.directory-col{display:flex;flex-direction:column;min-height:180px}
.col-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1.5rem;padding-bottom:0.5rem;border-bottom:1px solid var(--line)}
.col-icon{color:var(--gold)}
.directory-col h3{font-family:var(--font-hero-heading);font-size:1.05rem;font-weight:500;color:var(--gold-dark);margin:0}
.directory-col ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem}
.directory-col li{margin:0}
.directory-col a{font-family:var(--font-hero-body);font-size:0.9rem;font-weight:500;color:var(--muted);text-decoration:none;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);display:inline-flex;align-items:center;padding:4px 0;min-height:28px}
.directory-col a:hover{color:var(--gold);transform:translateX(4px)}
@media (max-width:991px){.directory-grid{grid-template-columns:repeat(2,1fr);gap:2.5rem 2rem}.internal-link-network{padding:4rem var(--site-padding) 2rem}.directory-title{font-size:1.85rem}}
@media (max-width:576px){.directory-grid{grid-template-columns:1fr;gap:2rem}.directory-header{text-align:left;margin-bottom:2.5rem}.directory-divider{margin:0}.internal-link-network{padding:3.5rem var(--site-padding) 2rem}}
`;

const ICON_MAP = {
  Compass,
  Grid,
  BookOpen,
  Briefcase,
  Layers,
  ShoppingBag,
  Tag,
  Globe,
  Link: LinkIcon,
  FileText,
  Sparkles,
  Star,
  Award,
  HelpCircle,
  Package
};

export function DynamicIcon({ name, size = 18, className = 'col-icon' }) {
  const IconComp = ICON_MAP[name] || Compass;
  return <IconComp size={size} className={className} />;
}

export function InternalLinkNetwork({ navigate, setCategory, initialConfig }) {
  const [config, setConfig] = useState(() => initialConfig || DEFAULT_DIRECTORY_CONFIG);

  useEffect(() => {
    // 1. If initialConfig wasn't passed, check local storage cache
    if (!initialConfig) {
      const cached = getDirectoryConfigLocal();
      if (cached) {
        setConfig(cached);
      }
    } else {
      setConfig(initialConfig);
    }

    // 2. Fetch remote config in background after page load settles
    const timer = setTimeout(() => {
      const runFetch = () => {
        void fetchDirectoryConfigRemote().then(remoteData => {
          if (remoteData) {
            setConfig(prev => (JSON.stringify(prev) !== JSON.stringify(remoteData) ? remoteData : prev));
          }
        });
      };
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(runFetch, { timeout: 15000 });
      } else {
        runFetch();
      }
    }, 12000);

    return () => clearTimeout(timer);

    // 3. Listen for Admin Panel instant updates
    const handleUpdate = (e) => {
      const nextData = e.detail || getDirectoryConfigLocal();
      if (nextData) {
        setConfig(nextData);
      }
    };

    window.addEventListener(DIRECTORY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(DIRECTORY_UPDATED_EVENT, handleUpdate);
    };
  }, [initialConfig]);

  const getHref = (link) => {
    if (link.path) return link.path;
    if (link.type === 'category') {
      const slug = getCategorySlug(link.target || '');
      return slug ? `/${slug}` : `/catalogue?category=${encodeURIComponent(link.target || '')}`;
    }
    if (link.type === 'blog-guide') return `/blog/${link.target || ''}`;
    if (link.type === 'custom_url') return link.target || link.path || '#';
    return link.target ? (link.target.startsWith('/') ? link.target : `/${link.target}`) : '#';
  };

  const handleLinkClick = (e, link) => {
    // Allow middle click, Cmd+Click, Ctrl+Click to open in new tab naturally for SEO & UX
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    const targetRoute = link.type;
    const param = link.target;

    if (targetRoute === 'category') {
      e.preventDefault();
      if (setCategory) setCategory(param);
      const slug = getCategorySlug(param);
      navigate(slug || 'catalogue');
    } else if (targetRoute === 'blog-guide') {
      e.preventDefault();
      navigate('blog', param);
    } else if (targetRoute === 'custom_url') {
      if (link.path && link.path.startsWith('http')) {
        // Let normal browser link navigation handle external URLs
        return;
      }
      e.preventDefault();
      if (link.path) window.location.href = link.path;
    } else {
      e.preventDefault();
      navigate(param || link.path || 'home');
    }
  };

  return (
    <section className="internal-link-network" aria-label="B2B Sourcing & Heritage Directory">
      <style dangerouslySetInnerHTML={{ __html: DIRECTORY_CSS }} />
      <div className="directory-container">
        {config.title && (
          <div className="directory-header">
            {config.kicker && <span className="directory-kicker">{config.kicker}</span>}
            <h2 className="directory-title">{config.title}</h2>
            <div className="directory-divider"></div>
          </div>
        )}

        <div className="directory-grid">
          {config.columns && config.columns.map((col, colIdx) => (
            <div className="directory-col" key={col.id || colIdx}>
              <div className="col-header">
                <DynamicIcon name={col.icon} size={18} />
                <h3>{col.title}</h3>
              </div>
              <nav aria-label={`${col.title} Directory`}>
                <ul>
                  {col.links && col.links.map((item, idx) => {
                    const href = getHref(item);
                    return (
                      <li key={idx}>
                        <a
                          href={href}
                          onClick={(e) => handleLinkClick(e, item)}
                          title={item.label}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
