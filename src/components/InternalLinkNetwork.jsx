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
} from 'lucide-react';
import {
  getDirectoryConfigLocal,
  fetchDirectoryConfigRemote,
  DIRECTORY_UPDATED_EVENT,
  DEFAULT_DIRECTORY_CONFIG
} from '../utils/directoryService.js';

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

export function InternalLinkNetwork({ navigate, setCategory }) {
  const [config, setConfig] = useState(DEFAULT_DIRECTORY_CONFIG);

  useEffect(() => {
    // 1. Load local config first for instant cache display
    const cached = getDirectoryConfigLocal();
    if (cached) {
      setConfig(cached);
    }

    // 2. Fetch remote config synchronously/async on mount to update live
    void fetchDirectoryConfigRemote().then(remoteData => {
      if (remoteData) setConfig(remoteData);
    });

    // 3. Listen for Admin Panel instant updates
    const handleUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getDirectoryConfigLocal());
      }
    };

    window.addEventListener(DIRECTORY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(DIRECTORY_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const getHref = (link) => {
    if (link.path) return link.path;
    if (link.type === 'category') return `/wholesale-catalogue?category=${encodeURIComponent(link.target || '')}`;
    if (link.type === 'blog-guide') return `/blog/${link.target || ''}`;
    if (link.type === 'custom_url') return link.target || link.path || '#';
    return link.target ? (link.target.startsWith('/') ? link.target : `/${link.target}`) : '#';
  };

  const handleLinkClick = (e, link) => {
    // Allow middle click, Cmd+Click, Ctrl+Click to open in new tab naturally for SEO & UX
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    const targetRoute = link.type;
    const param = link.target;

    if (targetRoute === 'category' && setCategory) {
      e.preventDefault();
      setCategory(param);
      navigate('wholesale-catalogue');
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
