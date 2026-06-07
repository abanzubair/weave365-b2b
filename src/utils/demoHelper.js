import React, { useState, useEffect } from 'react';

export const DEMO_EMAIL = 'demo@weave365.com';

const STORAGE_KEY = 'weave365_demo_view_group';

let demoPriceGroup = 'wholesale';
if (typeof window !== 'undefined') {
  demoPriceGroup = localStorage.getItem(STORAGE_KEY) || 'wholesale';
}

const listeners = new Set();

export const DemoManager = {
  get priceGroup() {
    return demoPriceGroup;
  },
  setPriceGroup(group) {
    if (group !== 'wholesale' && group !== 'reseller') return;
    demoPriceGroup = group;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, group);
    }
    listeners.forEach(l => l());
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  isDemoUser(user) {
    return user?.email?.toLowerCase() === DEMO_EMAIL;
  }
};

export function useDemoPriceGroup(user) {
  const [group, setGroup] = useState(DemoManager.priceGroup);

  useEffect(() => {
    if (!DemoManager.isDemoUser(user)) return;
    return DemoManager.subscribe(() => {
      setGroup(DemoManager.priceGroup);
    });
  }, [user]);

  return DemoManager.isDemoUser(user) ? group : null;
}

export function overrideDemoPriceAccess(user, buyerProfile, access) {
  if (!DemoManager.isDemoUser(user)) {
    return access;
  }

  const activeGroup = DemoManager.priceGroup;
  
  return {
    ...access,
    isLoggedIn: true,
    canViewPrices: true,
    reason: 'approved',
    approvalStatus: 'approved',
    priceGroup: activeGroup,
    priceLabel: activeGroup === 'reseller' ? 'Reseller Price' : 'Wholesale Price',
  };
}

export function DemoToggle({ user, isMobile = false }) {
  const [group, setGroup] = useState(DemoManager.priceGroup);

  useEffect(() => {
    if (!DemoManager.isDemoUser(user)) return;
    return DemoManager.subscribe(() => {
      setGroup(DemoManager.priceGroup);
    });
  }, [user]);

  if (!DemoManager.isDemoUser(user)) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .demo-toggle-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(183, 134, 70, 0.05);
          border: 1px dashed var(--gold, #b78646);
          border-radius: 20px;
          padding: 3px 4px 3px 12px;
          height: 32px;
          box-sizing: border-box;
          user-select: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .demo-toggle-wrapper:hover {
          background: rgba(183, 134, 70, 0.08);
          border-style: solid;
        }
        .demo-toggle-label {
          font-family: var(--font-hero-body, 'Inter', sans-serif);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--gold-dark, #805d31);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .demo-toggle-switch {
          display: flex;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 14px;
          padding: 2px;
          gap: 2px;
        }
        .demo-toggle-btn {
          border: 0;
          background: transparent;
          padding: 3px 12px;
          font-family: var(--font-hero-body, 'Inter', sans-serif);
          font-size: 9.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 10px;
          color: var(--muted, #888);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .demo-toggle-btn:hover {
          color: var(--ink, #1f140d);
        }
        .demo-toggle-btn.active {
          background: var(--gold, #b78646);
          color: #fff !important;
          box-shadow: 0 2px 4px rgba(183, 134, 70, 0.2);
        }
        
        /* Mobile specific style override */
        .demo-toggle-wrapper.mobile-demo {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin: 16px 0 8px 0;
          padding: 6px 6px 6px 16px;
          height: 42px;
          border-radius: 24px;
        }
        .demo-toggle-wrapper.mobile-demo .demo-toggle-switch {
          border-radius: 18px;
          padding: 3px;
        }
        .demo-toggle-wrapper.mobile-demo .demo-toggle-btn {
          padding: 6px 16px;
          font-size: 10.5px;
          border-radius: 14px;
        }
        .demo-toggle-wrapper.mobile-demo .demo-toggle-label {
          font-size: 11px;
        }
      `}} />
      <div className={`demo-toggle-wrapper ${isMobile ? 'mobile-demo' : 'desktop-demo'}`}>
        <span className="demo-toggle-label">Demo View</span>
        <div className="demo-toggle-switch">
          <button
            type="button"
            className={`demo-toggle-btn ${group === 'wholesale' ? 'active' : ''}`}
            onClick={() => DemoManager.setPriceGroup('wholesale')}
          >
            Wholesale
          </button>
          <button
            type="button"
            className={`demo-toggle-btn ${group === 'reseller' ? 'active' : ''}`}
            onClick={() => DemoManager.setPriceGroup('reseller')}
          >
            Resale
          </button>
        </div>
      </div>
    </>
  );
}
