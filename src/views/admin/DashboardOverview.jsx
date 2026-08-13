import { useState, useMemo } from 'react';
import { formatMoney } from '../../storefrontShared.jsx';
import {
  ShoppingBag,
  Box,
  Calendar,
  Clock,
  LineChart,
  Check,
  RefreshCw,
  Printer,
  Database,
} from 'lucide-react';

export default function DashboardOverview({
  adminData,
  updateInquiryStatus,
  loadAdminData,
  setSelectedUserList,
  handleManualSync,
  syncStatus,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Hover states for the Best Selling Products Pie Chart interactive tooltip
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  // Active chart toggle: 'sales' | 'orders'
  const [activeChartTab, setActiveChartTab] = useState('sales');

  const enquiryRows = useMemo(() => {
    const orders = (adminData.optional.orders || []).map(o => ({ ...o, _sourceTable: 'orders' }));
    const sorted = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted;
  }, [adminData.optional.orders]);

  // Price Calculation helper (returns raw amount in INR)
  const getOrderAmountInINR = (row) => {
    let amtInINR = 0;
    if (row.amount !== undefined && row.amount !== null && Number(row.amount) > 0) {
      amtInINR = Number(row.amount);
    } else if (row.total_price !== undefined && row.total_price !== null && Number(row.total_price) > 0) {
      amtInINR = Number(row.total_price);
    } else {
      let itemsList = row.items;
      if (typeof itemsList === 'string') {
        try { itemsList = JSON.parse(itemsList); } catch (e) { itemsList = null; }
      }
      if (Array.isArray(itemsList) && itemsList.length > 0 && itemsList.some(i => i.price !== undefined && i.price !== null)) {
        amtInINR = itemsList.reduce((sum, item) => {
          const qty = Number(item.quantity) || 1;
          const price = (item.price !== undefined && item.price !== null) ? Number(item.price) : 1250;
          return sum + (price * qty);
        }, 0);
      } else {
        let itemsCount = 0;
        if (Array.isArray(itemsList)) {
          itemsCount = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
        } else {
          itemsCount = 1;
        }
        amtInINR = itemsCount * 1250; // base wholesale price 1250 INR per item fallback
      }
    }
    return amtInINR;
  };

  const getMockPrice = (inquiry) => {
    return getOrderAmountInINR(inquiry);
  };

  const formatINR = (val) => {
    return formatMoney(val);
  };

  const isEligibleOrder = (row) => {
    const status = String(row.status || '').toLowerCase().trim();
    return (
      status === 'payment verified' ||
      status === 'processing & qc' ||
      status === 'dispatched' ||
      status === 'delivered'
    );
  };

  const getCleanStatusClass = (status) => {
    return 'status-' + String(status || 'New (Payment Review)')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s&]/g, '')
      .replace(/&/g, 'and')
      .replace(/\s+/g, '-');
  };

  const handlePrintInquiry = (inquiry) => {
    if (!inquiry) return;
    const invoiceCode = inquiry.id ? inquiry.id.slice(0, 6).toUpperCase() : 'INV-1001';
    const dateStr = inquiry.created_at
      ? new Date(inquiry.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleDateString('en-IN');
    
    let itemsList = [];
    if (Array.isArray(inquiry.items) && inquiry.items.length > 0) {
      itemsList = inquiry.items;
    } else if (typeof inquiry.items === 'string') {
      try { itemsList = JSON.parse(inquiry.items); } catch(e) {}
    }

    const orderLevelTotal = getOrderAmountInINR(inquiry);

    if (!Array.isArray(itemsList) || itemsList.length === 0) {
      itemsList = [{
        variant_code: inquiry.variant_code || inquiry.variantCode || 'VAR-GENERAL',
        color: inquiry.color || 'Assorted',
        quantity: 1,
        price: orderLevelTotal
      }];
    }

    let calculatedInvoiceTotal = 0;
    const itemsRowsHtml = itemsList.map((item, idx) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = (item.price !== undefined && item.price !== null && !isNaN(Number(item.price)))
        ? Number(item.price)
        : Math.round(orderLevelTotal / Math.max(1, itemsList.length * qty));
      const lineTotal = unitPrice * qty;
      calculatedInvoiceTotal += lineTotal;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.product_title || item.title || item.variant_code || item.variantCode || 'Wholesale Saree'}</strong>
            <br/><span style="font-size: 11px; color: #6b7280;">Color/Design: ${item.color || 'Standard'} | Code: ${item.variant_code || item.variantCode || 'N/A'}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${unitPrice.toLocaleString('en-IN')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>₹${lineTotal.toLocaleString('en-IN')}</strong></td>
        </tr>
      `;
    }).join('');

    const docHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Pro-Forma Invoice #${invoiceCode} - Weave 365</title>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 24px; color: #1f2937; background: #fff; }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
    .brand-title { font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: 1px; }
    .brand-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { margin: 0; font-size: 20px; color: #1f2937; text-transform: uppercase; }
    .invoice-title span { font-size: 13px; color: #6b7280; }
    .meta-grid { display: flex; justify-content: space-between; margin: 24px 0; gap: 20px; }
    .meta-box { flex: 1; background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .meta-box h4 { margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-box p { margin: 2px 0; font-size: 13px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
    .total-section { margin-top: 20px; display: flex; justify-content: flex-end; }
    .total-box { width: 280px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .total-row.grand { border-top: 2px solid #cbd5e1; padding-top: 10px; font-size: 16px; font-weight: 700; color: #1e3a8a; }
    .footer-note { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Download PDF</button>
  </div>
  <div class="invoice-header">
    <div>
      <div class="brand-title">WEAVE 365</div>
      <div class="brand-sub">Authentic Varanasi Silk & Textile Sourcing Network</div>
      <div class="brand-sub">Varanasi, Uttar Pradesh, India | Support: WhatsApp Verified</div>
    </div>
    <div class="invoice-title">
      <h2>Pro-Forma Invoice</h2>
      <span>#${invoiceCode}</span>
      <br/><span>Date: ${dateStr}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Billed To (Buyer Customer)</h4>
      <p><strong>${inquiry.buyer_name || 'Guest Buyer'}</strong></p>
      <p>Email: ${inquiry.email || 'N/A'}</p>
      <p>Phone/WhatsApp: ${inquiry.phone || 'N/A'}</p>
      <p>Status: ${inquiry.status || 'Payment Review'}</p>
    </div>
    <div class="meta-box">
      <h4>Supplier Details</h4>
      <p><strong>Weave365 Wholesale Direct</strong></p>
      <p>Dispatch Hub: Varanasi Weaving Center</p>
      <p>Payment Term: Wholesale Advance / Pre-verified</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Product Description / Code</th>
        <th style="text-align: center; width: 60px;">Qty</th>
        <th style="text-align: right; width: 100px;">Rate</th>
        <th style="text-align: right; width: 110px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRowsHtml}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span>₹${calculatedInvoiceTotal.toLocaleString('en-IN')}</span>
      </div>
      <div class="total-row">
        <span>Estimated Freight/Tax</span>
        <span>Included / Free</span>
      </div>
      <div class="total-row grand">
        <span>Total Amount</span>
        <span>₹${calculatedInvoiceTotal.toLocaleString('en-IN')}</span>
      </div>
    </div>
  </div>

  <div class="footer-note">
    This is an electronically generated pro-forma commercial invoice for wholesale tracking purposes.
    <br/>Thank you for partner sourcing with Weave 365.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(docHtml);
      win.document.close();
    } else {
      alert('Pop-up blocked. Please allow pop-ups to print pro-forma invoice.');
    }
  };

  // Date constants for ranges
  const todayPrefix = new Date().toISOString().split('T')[0];
  const yesterdayPrefix = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const thisMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = lastMonthDate.toISOString().slice(0, 7);

  // Today Orders Calculations
  const todayOrdersRows = useMemo(() => {
    return enquiryRows.filter(r => r.created_at && r.created_at.startsWith(todayPrefix) && isEligibleOrder(r));
  }, [enquiryRows, todayPrefix]);

  const todaySalesTotal = useMemo(() => {
    return todayOrdersRows.reduce((sum, r) => sum + getOrderAmountInINR(r), 0);
  }, [todayOrdersRows]);

  const todayCash = useMemo(() => todaySalesTotal * 0.4, [todaySalesTotal]);
  const todayCard = useMemo(() => todaySalesTotal * 0.4, [todaySalesTotal]);
  const todayCredit = useMemo(() => todaySalesTotal * 0.2, [todaySalesTotal]);

  // Yesterday Orders Calculations
  const yesterdayOrdersRows = useMemo(() => {
    return enquiryRows.filter(r => r.created_at && r.created_at.startsWith(yesterdayPrefix) && isEligibleOrder(r));
  }, [enquiryRows, yesterdayPrefix]);

  const yesterdaySalesTotal = useMemo(() => {
    return yesterdayOrdersRows.reduce((sum, r) => sum + getOrderAmountInINR(r), 0);
  }, [yesterdayOrdersRows]);

  const yesterdayCash = useMemo(() => yesterdaySalesTotal * 0.4, [yesterdaySalesTotal]);
  const yesterdayCard = useMemo(() => yesterdaySalesTotal * 0.4, [yesterdaySalesTotal]);
  const yesterdayCredit = useMemo(() => yesterdaySalesTotal * 0.2, [yesterdaySalesTotal]);

  // This Month Sales
  const thisMonthSalesTotal = useMemo(() => {
    const rows = enquiryRows.filter(r => r.created_at && r.created_at.startsWith(thisMonthPrefix) && isEligibleOrder(r));
    return rows.reduce((sum, r) => sum + getOrderAmountInINR(r), 0);
  }, [enquiryRows, thisMonthPrefix]);

  // Last Month Sales
  const lastMonthSalesTotal = useMemo(() => {
    const rows = enquiryRows.filter(r => r.created_at && r.created_at.startsWith(lastMonthPrefix) && isEligibleOrder(r));
    return rows.reduce((sum, r) => sum + getOrderAmountInINR(r), 0);
  }, [enquiryRows, lastMonthPrefix]);

  // All-Time Sales
  const allTimeSalesTotal = useMemo(() => {
    return enquiryRows.filter(isEligibleOrder).reduce((sum, r) => sum + getOrderAmountInINR(r), 0);
  }, [enquiryRows]);

  // 4 circular icon metrics matching target tags
  const totalOrdersCount = useMemo(() => {
    return enquiryRows.filter(isEligibleOrder).length;
  }, [enquiryRows]);

  const pendingOrdersCount = useMemo(() => {
    return enquiryRows.filter(e => String(e.status || '').toLowerCase().trim() === 'payment verified').length;
  }, [enquiryRows]);

  const pendingOrdersAmount = useMemo(() => {
    const rows = enquiryRows.filter(e => String(e.status || '').toLowerCase().trim() === 'payment verified');
    return rows.reduce((sum, r) => sum + getOrderAmountInINR(r), 0);
  }, [enquiryRows]);

  const processingOrdersCount = useMemo(() => {
    return enquiryRows.filter(e => String(e.status || '').toLowerCase().trim() === 'processing & qc').length;
  }, [enquiryRows]);

  const completedOrdersCount = useMemo(() => {
    return enquiryRows.filter(e => String(e.status || '').toLowerCase().trim() === 'delivered').length;
  }, [enquiryRows]);

  // Weekly Sales Line Chart data: Plots dynamic sales curve based on dates
  const lineGraphData = useMemo(() => {
    const days = [];
    const dateLabels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push(dStr);
      dateLabels.push(label);

      // Sum sales or orders on this date
      const dayRows = enquiryRows.filter(e => e.created_at && e.created_at.startsWith(dStr));
      let val = 0;
      if (activeChartTab === 'sales') {
        val = dayRows.filter(isEligibleOrder).reduce((acc, curr) => acc + getOrderAmountInINR(curr), 0);
      } else {
        val = dayRows.filter(isEligibleOrder).length;
      }
      values.push(val);
    }

    // Grid coordinates on viewbox 380 x 220
    // Start height: y=190 (bottom), Top height: y=20 (span = 170px)
    const maxVal = Math.max(activeChartTab === 'sales' ? 14000 : 10, ...values);
    const minVal = 0;
    const span = maxVal - minVal;

    const points = values.map((val, idx) => {
      const x = 50 + (idx * 51.66); // distribute evenly from 50 to 360
      const y = 190 - ((val / Math.max(1, maxVal)) * 170);
      return { x, y, value: val, date: dateLabels[idx] };
    });

    const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = `M 50 190 L ${polylinePath} L ${points[points.length - 1].x} 190 Z`;

    const gridIntervals = 5;
    const yGridValues = [];
    const yLabels = [];

    for (let i = 0; i <= gridIntervals; i++) {
      const val = Math.round(maxVal - (i * maxVal) / gridIntervals);
      yGridValues.push(val);
      if (activeChartTab === 'sales') {
        yLabels.push(val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`);
      } else {
        yLabels.push(String(val));
      }
    }

    return { points, yLabels, yGridValues, polylinePath, areaPath, startDate: days[0], endDate: days[6] };
  }, [enquiryRows, activeChartTab]);

  // Best Selling Products Sourcing Preferences for Pie Chart
  const categoryChartData = useMemo(() => {
    const counts = {};
    
    const processItem = (item) => {
      const name = item.product_title || item.title || item.product_name || item.variant_code || item.variantCode || item.product_group_key || item.category || 'Saree Sourcing';
      if (name) {
        counts[name] = (counts[name] || 0) + (Number(item.quantity) || 1);
      }
    };

    // Traverse live enquiries/orders in the database
    enquiryRows.forEach(row => {
      let items = row.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = null; }
      }
      if (!Array.isArray(items) && Array.isArray(row.cart_items)) {
        items = row.cart_items;
      }

      if (Array.isArray(items) && items.length > 0) {
        items.forEach(processItem);
      } else {
        const topCode = row.variant_code || row.variantCode || row.product_group_key || row.product_title || row.title || row.category;
        if (topCode) {
          counts[topCode] = (counts[topCode] || 0) + 1;
        }
      }
    });

    // Also check inquiries and cartItems if order items were empty
    if (Object.keys(counts).length === 0) {
      (adminData.optional.inquiries || []).forEach(inq => {
        let items = inq.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { items = null; }
        }
        if (Array.isArray(items)) {
          items.forEach(processItem);
        } else if (inq.variant_code) {
          counts[inq.variant_code] = (counts[inq.variant_code] || 0) + 1;
        }
      });
    }

    if (Object.keys(counts).length === 0) {
      (adminData.cartItems || []).forEach(cart => {
        const key = cart.product_group_key || cart.variant_code || 'General Saree';
        counts[key] = (counts[key] || 0) + (Number(cart.quantity) || 1);
      });
    }

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // If we have live products in the map, use them!
    if (sorted.length > 0) {
      if (sorted.length > 4) {
        const top3 = sorted.slice(0, 3);
        const othersVal = sorted.slice(3).reduce((acc, curr) => acc + curr.value, 0);
        top3.push({ name: 'Others', value: othersVal });
        return top3;
      }
      return sorted;
    }

    // Fallback seed variant codes when there are no transactions in the database
    return [
      { name: 'Kanjivaram Silk Saree', value: 14 },
      { name: 'Banarasi Silk Saree', value: 10 },
      { name: 'Chanderi Cotton Suit', value: 8 },
      { name: 'Organza Floral Saree', value: 4 }
    ];
  }, [enquiryRows, adminData.optional.inquiries, adminData.cartItems]);

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const getPiePath = (startPercent, endPercent, cx = 100, cy = 100, r = 85) => {
    if (endPercent - startPercent >= 0.999) {
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    }
    const [startX, startY] = getCoordinatesForPercent(startPercent - 0.25);
    const [endX, endY] = getCoordinatesForPercent(endPercent - 0.25);

    const x1 = cx + r * startX;
    const y1 = cy + r * startY;
    const x2 = cx + r * endX;
    const y2 = cy + r * endY;

    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getPieSlices = () => {
    const total = categoryChartData.reduce((acc, curr) => acc + curr.value, 0);
    let accumulatedPercent = 0;
    const colors = ['#10b981', '#3b82f6', '#f97316', '#06b6d4', '#8b5cf6'];

    return categoryChartData.map((item, idx) => {
      const percent = item.value / Math.max(1, total);
      const startPercent = accumulatedPercent;
      const endPercent = accumulatedPercent + percent;
      accumulatedPercent += percent;

      const path = getPiePath(startPercent, endPercent);
      return {
        name: item.name,
        value: item.value,
        percentage: Math.round(percent * 100),
        path,
        color: colors[idx % colors.length],
      };
    });
  };

  const pieSlices = useMemo(getPieSlices, [categoryChartData]);

  // Paginated recent enquiries data
  const paginatedEnquiries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return enquiryRows.slice(startIndex, startIndex + itemsPerPage);
  }, [enquiryRows, currentPage]);

  const totalPages = Math.max(1, Math.ceil(enquiryRows.length / itemsPerPage));

  return (
    <div className="dashboard-overview-container">
      <div className="dashboard-overview-header">
        <h1 className="dashtar-title">Dashboard Overview</h1>
        <button
          type="button"
          className="pipeline-header-btn"
          onClick={handleManualSync}
          disabled={syncStatus === 'loading'}
        >
          <RefreshCw size={14} className={syncStatus === 'loading' ? 'spin-icon' : ''} /> {syncStatus === 'loading' ? 'Syncing...' : 'Sync Google Sheet'}
        </button>
      </div>

      {/* 1. 5 Gradient Metric Cards Row (Dynamically calculated) */}
      <div className="dashtar-gradient-grid">
        {/* Card 1: Today Orders */}
        <div className="dashtar-gradient-card card-gradient-blue">
          <div className="gradient-icon-wrap text-blue">
            <ShoppingBag size={18} />
          </div>
          <div className="gradient-card-val-block">
            <div className="gradient-card-large-val">{formatINR(todaySalesTotal)}</div>
            <span className="gradient-card-label-span">Today Orders</span>
          </div>
        </div>

        {/* Card 2: Yesterday Orders */}
        <div className="dashtar-gradient-card card-gradient-green">
          <div className="gradient-icon-wrap text-green">
            <Box size={18} />
          </div>
          <div className="gradient-card-val-block">
            <div className="gradient-card-large-val">{formatINR(yesterdaySalesTotal)}</div>
            <span className="gradient-card-label-span">Yesterday Orders</span>
          </div>
        </div>

        {/* Card 3: This Month */}
        <div className="dashtar-gradient-card card-gradient-pink">
          <div className="gradient-icon-wrap text-pink">
            <Calendar size={18} />
          </div>
          <div className="gradient-card-val-block">
            <div className="gradient-card-large-val">{formatINR(thisMonthSalesTotal)}</div>
            <span className="gradient-card-label-span">This Month</span>
          </div>
        </div>

        {/* Card 4: Last Month */}
        <div className="dashtar-gradient-card card-gradient-teal">
          <div className="gradient-icon-wrap text-teal">
            <Clock size={18} />
          </div>
          <div className="gradient-card-val-block">
            <div className="gradient-card-large-val">{formatINR(lastMonthSalesTotal)}</div>
            <span className="gradient-card-label-span">Last Month</span>
          </div>
        </div>

        {/* Card 5: All-Time Sales */}
        <div className="dashtar-gradient-card card-gradient-purple">
          <div className="gradient-icon-wrap text-purple">
            <LineChart size={18} />
          </div>
          <div className="gradient-card-val-block">
            <div className="gradient-card-large-val">{formatINR(allTimeSalesTotal)}</div>
            <span className="gradient-card-label-span">All-Time Sales</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Circular Outline Cards Row */}
      <div className="dashtar-outline-grid">
         <article className="dashtar-outline-card">
          <div className="outline-icon-container bg-orange-soft text-orange">
            <Database size={20} strokeWidth={1.5} />
          </div>
          <div className="outline-card-info">
            <span>Total Order</span>
            <strong>{totalOrdersCount}</strong>
          </div>
        </article>

        <article className="dashtar-outline-card">
          <div className="outline-icon-container bg-blue-soft text-blue">
            <RefreshCw size={18} />
          </div>
          <div className="outline-card-info">
            <div className="outline-label-row">
              <span>Orders Pending</span>
              <span className="outline-highlight-badge">{formatINR(pendingOrdersAmount)}</span>
            </div>
            <strong>{pendingOrdersCount}</strong>
          </div>
        </article>

        <article className="dashtar-outline-card">
          <div className="outline-icon-container bg-indigo-soft text-indigo">
            <Box size={20} strokeWidth={1.5} />
          </div>
          <div className="outline-card-info">
            <span>Orders Processing</span>
            <strong>{processingOrdersCount}</strong>
          </div>
        </article>

        <article className="dashtar-outline-card">
          <div className="outline-icon-container bg-green-soft text-green">
            <Check size={20} strokeWidth={2} />
          </div>
          <div className="outline-card-info">
            <span>Orders Delivered</span>
            <strong>{completedOrdersCount}</strong>
          </div>
        </article>
      </div>

      {/* 3. Charts Split Section */}
      <div className="dashtar-charts-split">
        {/* Line Chart: Weekly Sales */}
        <article className="admin-panel dashboard-chart-panel">
          <div className="chart-panel-header">
            <div>
              <h3>Weekly Sales</h3>
              <small>Sales trends over the week</small>
            </div>
            <div className="chart-toggle-buttons">
              <button
                type="button"
                onClick={() => setActiveChartTab('sales')}
                className={`chart-toggle-btn ${activeChartTab === 'sales' ? 'active' : ''}`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('orders')}
                className={`chart-toggle-btn ${activeChartTab === 'orders' ? 'active' : ''}`}
              >
                Orders
              </button>
            </div>
          </div>

          <div className="svg-chart-wrapper">
            <svg width="100%" height="230" viewBox="0 0 380 220" preserveAspectRatio="none">
              {lineGraphData.yGridValues.map((val, idx) => {
                const y = 20 + (idx * 170) / 5;
                return (
                  <g key={idx}>
                    <text x="40" y={y + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
                      {lineGraphData.yLabels[idx]}
                    </text>
                    <line x1="45" y1={y} x2="360" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  </g>
                );
              })}

              <path d={lineGraphData.areaPath} fill="rgba(16, 185, 129, 0.08)" />

              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={lineGraphData.polylinePath}
              />

              {lineGraphData.points.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r="2.5" fill="#10b981" />
              ))}

              <text x="50" y="215" fontSize="9.5" fill="#9ca3af" textAnchor="start">
                {lineGraphData.startDate}
              </text>
              <text x="360" y="215" fontSize="9.5" fill="#9ca3af" textAnchor="end">
                {lineGraphData.endDate}
              </text>
            </svg>
          </div>
        </article>

        {/* Pie Chart: Best Selling Products */}
        <article className="admin-panel dashboard-chart-panel" style={{ height: 'auto', minHeight: '272px' }}>
          <div className="chart-panel-header">
            <h3>Best Selling Products</h3>
          </div>

          <div className="pie-chart-container">
            <div className="pie-legend-row">
              {pieSlices.map((slice, idx) => (
                <div 
                  key={idx} 
                  className="pie-legend-item"
                  style={{ 
                    cursor: 'pointer', 
                    opacity: hoveredSlice && hoveredSlice.name !== slice.name ? 0.4 : 1, 
                    transition: 'opacity 0.2s' 
                  }}
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <span className="legend-dot" style={{ backgroundColor: slice.color }}></span>
                  <span className="legend-name">{slice.name} ({slice.percentage}%)</span>
                </div>
              ))}
            </div>

            <div className="pie-svg-wrapper">
              <svg width="170" height="170" viewBox="0 0 200 200">
                {pieSlices.map((slice, idx) => (
                  <path
                    key={idx}
                    d={slice.path}
                    fill={slice.color}
                    className="pie-slice-path"
                    style={{ 
                      transition: 'all 0.2s ease', 
                      cursor: 'pointer', 
                      opacity: hoveredSlice && hoveredSlice.name !== slice.name ? 0.5 : 1,
                      transform: hoveredSlice && hoveredSlice.name === slice.name ? 'scale(1.03)' : 'scale(1)',
                      transformOrigin: '100px 100px'
                    }}
                    onMouseEnter={() => setHoveredSlice(slice)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                ))}
              </svg>
            </div>
          </div>
        </article>
      </div>

      {/* 4. Recent Order Table */}
      <article className="admin-panel">
        <div className="admin-panel-head" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '16px' }}>
          <span>Recent Order</span>
          <small>{enquiryRows.length} entries total</small>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Order Time</th>
                <th>Customer Name</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnquiries.map((inquiry, idx) => {
                const invoiceCode = inquiry.id ? inquiry.id.slice(0, 6).toUpperCase() : `G-${10000 + idx}`;
                const dateStr = inquiry.created_at
                  ? new Date(inquiry.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })
                  : 'N/A';
                
                const cleanPhone = String(inquiry.phone || '').replace(/\D/g, '').slice(-10);
                const matchedProfile = adminData.profiles.find(p => p.whatsapp && p.whatsapp.replace(/\D/g, '').slice(-10) === cleanPhone);
                const methodLabel = matchedProfile?.buyer_type ? matchedProfile.buyer_type.toUpperCase() : 'CASH';
                const mockAmount = getMockPrice(inquiry);

                return (
                  <tr key={inquiry.id || idx}>
                    <td><strong>{invoiceCode}</strong></td>
                    <td><span className="admin-fs12">{dateStr}</span></td>
                    <td>
                      <strong>{inquiry.buyer_name || 'Guest'}</strong>
                      {inquiry.email && <span className="table-row-meta-email">{inquiry.email}</span>}
                    </td>
                    <td><span className="method-label-pill">{methodLabel}</span></td>
                    <td><strong>{formatMoney(mockAmount)}</strong></td>
                    <td>
                      {inquiry.status && (
                        <span className={`admin-badge-status ${getCleanStatusClass(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <select
                        value={inquiry.status || ''}
                        onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)}
                        className="admin-crm-select-dropdown"
                      >
                        <option value="New (Payment Review)">New (Payment Review)</option>
                        <option value="Payment Verified">Payment Verified</option>
                        <option value="Processing & QC">Processing & QC</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <div className="table-invoice-actions">
                        <button
                          type="button"
                          onClick={() => handlePrintInquiry(inquiry)}
                          className="table-action-icon-btn"
                          title="Print pro-forma invoice"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedEnquiries.length === 0 && (
                <tr>
                  <td colSpan="8" className="admin-table-empty">No inquiries logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="dashtar-pagination-bar">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="pagination-btn"
            >
              &lt; Previous
            </button>
            
            {Array.from({ length: totalPages }).map((_, pageIdx) => {
              const pageNum = pageIdx + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`pagination-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="pagination-btn"
            >
              Next &gt;
            </button>
          </div>
        )}
      </article>

      {hoveredSlice && (
        <div 
          style={{
            position: 'fixed',
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
            backgroundColor: '#1f2937',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 99999,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <span style={{ color: hoveredSlice.color, marginRight: '6px' }}>●</span>
          {hoveredSlice.name}: <strong style={{ marginLeft: '4px' }}>{hoveredSlice.percentage}%</strong>
        </div>
      )}
    </div>
  );
}
