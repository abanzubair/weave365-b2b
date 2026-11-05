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
} from '../../components/icons.jsx';
import AdminLoadingScreen from './AdminLoadingScreen.jsx';

export default function DashboardOverview({
  adminData,
  updateInquiryStatus,
  loadAdminData,
  setSelectedUserList,
  handleManualSync,
  syncStatus,
  loading = false,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Hover and selection states for the Best Selling Products Donut Chart
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const activeSlice = hoveredSlice || selectedSlice;

  const handleSliceClick = (slice) => {
    setSelectedSlice((prev) => (prev?.name === slice.name ? null : slice));
  };

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  // Active chart toggle: 'sales' | 'orders'
  const [activeChartTab, setActiveChartTab] = useState('sales');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const enquiryRows = useMemo(() => {
    const orders = (adminData.optional.orders || [])
      .filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s !== 'pending_payment' && s !== 'payment_pending' && s !== 'draft' && s !== 'unpaid';
      })
      .map(o => ({ ...o, _sourceTable: 'orders' }));
    const apiOrders = (adminData.optional.api_orders || [])
      .filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s !== 'pending_payment' && s !== 'payment_pending' && s !== 'draft' && s !== 'unpaid';
      })
      .map(o => ({ ...o, _sourceTable: 'api_orders' }));
    const sorted = [...orders, ...apiOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted;
  }, [adminData.optional.orders, adminData.optional.api_orders]);

  // Price Calculation helper (returns raw amount in INR)
  const getOrderAmountInINR = (row) => {
    let amtInINR = 0;
    if (row.total_amount !== undefined && row.total_amount !== null && Number(row.total_amount) > 0) {
      amtInINR = Number(row.total_amount);
    } else if (row.amount !== undefined && row.amount !== null && Number(row.amount) > 0) {
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
      status === 'paid' ||
      status === 'payment_received' ||
      status === 'payment received' ||
      status === 'verified' ||
      status === 'payment verified' ||
      status === 'processing & qc' ||
      status === 'processing' ||
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
    return enquiryRows.filter(e => {
      const s = String(e.status || '').toLowerCase().trim();
      return s === 'payment verified' || s === 'verified' || s === 'paid' || s === 'payment_received' || s === 'payment received';
    }).length;
  }, [enquiryRows]);

  const pendingOrdersAmount = useMemo(() => {
    const rows = enquiryRows.filter(e => {
      const s = String(e.status || '').toLowerCase().trim();
      return s === 'payment verified' || s === 'verified' || s === 'paid' || s === 'payment_received' || s === 'payment received';
    });
    return rows.reduce((sum, r) => sum + getOrderAmountInINR(r), 0);
  }, [enquiryRows]);

  const processingOrdersCount = useMemo(() => {
    return enquiryRows.filter(e => String(e.status || '').toLowerCase().trim() === 'processing & qc').length;
  }, [enquiryRows]);

  const completedOrdersCount = useMemo(() => {
    return enquiryRows.filter(e => String(e.status || '').toLowerCase().trim() === 'delivered').length;
  }, [enquiryRows]);

  // Weekly Sales Line Chart data: Plots dynamic smooth spline curve based on dates
  const lineGraphData = useMemo(() => {
    const isSales = activeChartTab === 'sales';
    const dayData = [];
    let totalWeekly = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayMonth = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Sum sales or orders on this date
      const dayRows = enquiryRows.filter(e => e.created_at && e.created_at.startsWith(dStr));
      let val = 0;
      if (isSales) {
        val = dayRows.filter(isEligibleOrder).reduce((acc, curr) => acc + getOrderAmountInINR(curr), 0);
      } else {
        val = dayRows.filter(isEligibleOrder).length;
      }
      totalWeekly += val;
      dayData.push({
        dStr,
        dayName,
        dayMonth,
        fullDate: `${dayName}, ${dayMonth}`,
        val,
      });
    }

    const rawMax = Math.max(...dayData.map(d => d.val));
    let maxVal = rawMax;
    if (isSales) {
      if (rawMax <= 10000) maxVal = 10000;
      else if (rawMax <= 14000) maxVal = 14000;
      else if (rawMax <= 20000) maxVal = 20000;
      else {
        const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
        maxVal = Math.ceil(rawMax / step) * step;
      }
    } else {
      maxVal = Math.max(10, Math.ceil(rawMax / 5) * 5);
    }

    // Grid coordinates on viewbox 400 x 220
    const startX = 52;
    const endX = 382;
    const topY = 24;
    const bottomY = 175;
    const xStep = (endX - startX) / 6;

    const points = dayData.map((item, idx) => {
      const x = startX + idx * xStep;
      const ratio = maxVal > 0 ? item.val / maxVal : 0;
      const y = bottomY - ratio * (bottomY - topY);
      return {
        id: `point-${idx}`,
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        value: item.val,
        displayVal: isSales ? formatMoney(item.val) : `${item.val} ${item.val === 1 ? 'order' : 'orders'}`,
        dayName: item.dayName,
        dayMonth: item.dayMonth,
        fullDate: item.fullDate,
      };
    });

    // Generate smooth cubic bezier spline curve
    let smoothCurve = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      // Clamp Y to stay within chart boundaries
      cp1y = Math.min(bottomY, Math.max(topY, cp1y));
      cp2y = Math.min(bottomY, Math.max(topY, cp2y));

      smoothCurve += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const areaPath = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y} ${smoothCurve.replace(/^M [^ ]+ [^ ]+/, '')} L ${points[points.length - 1].x} ${bottomY} Z`;

    const gridIntervals = 5;
    const yGrid = [];
    for (let i = 0; i <= gridIntervals; i++) {
      const val = Math.round(maxVal - (i * maxVal) / gridIntervals);
      const y = topY + (i * (bottomY - topY)) / gridIntervals;
      let label = '';
      if (isSales) {
        label = val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`;
      } else {
        label = String(val);
      }
      yGrid.push({ val, y: Number(y.toFixed(1)), label });
    }

    return {
      points,
      smoothCurve,
      areaPath,
      yGrid,
      totalWeekly,
      isSales,
      accentColor: isSales ? '#10b981' : '#4f46e5',
      gradId: isSales ? 'salesTrendGrad' : 'ordersTrendGrad',
      displayTotal: isSales ? formatMoney(totalWeekly) : `${totalWeekly} ${totalWeekly === 1 ? 'order' : 'orders'}`,
    };
  }, [enquiryRows, activeChartTab]);

  // Best Selling Products Sourcing Preferences for Donut Chart
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

    // If we have live products in the map, prioritize top sellers
    if (sorted.length > 0) {
      if (sorted.length > 4) {
        const top = sorted.slice(0, 4);
        const othersVal = sorted.slice(4).reduce((acc, curr) => acc + curr.value, 0);
        if (othersVal > 0) {
          top.push({ name: 'Others', value: othersVal });
        }
        return top;
      }
      return sorted;
    }

    return [];
  }, [enquiryRows, adminData.optional.inquiries, adminData.cartItems]);

  const totalCategoryUnits = useMemo(() => {
    return categoryChartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryChartData]);

  // SVG Donut Path math: generates smooth curved donut segments with outer and inner radii
  const getDonutPath = (startPercent, endPercent, cx = 100, cy = 100, outerR = 82, innerR = 54) => {
    const span = endPercent - startPercent;
    if (span >= 0.999) {
      return `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 0 ${cx} ${cy + outerR} A ${outerR} ${outerR} 0 1 0 ${cx} ${cy - outerR} M ${cx} ${cy - innerR} A ${innerR} ${innerR} 0 1 1 ${cx} ${cy + innerR} A ${innerR} ${innerR} 0 1 1 ${cx} ${cy - innerR} Z`;
    }

    const angle1 = (startPercent * 2 * Math.PI) - (Math.PI / 2);
    const angle2 = (endPercent * 2 * Math.PI) - (Math.PI / 2);

    const x1 = (cx + outerR * Math.cos(angle1)).toFixed(2);
    const y1 = (cy + outerR * Math.sin(angle1)).toFixed(2);
    const x2 = (cx + outerR * Math.cos(angle2)).toFixed(2);
    const y2 = (cy + outerR * Math.sin(angle2)).toFixed(2);

    const ix1 = (cx + innerR * Math.cos(angle1)).toFixed(2);
    const iy1 = (cy + innerR * Math.sin(angle1)).toFixed(2);
    const ix2 = (cx + innerR * Math.cos(angle2)).toFixed(2);
    const iy2 = (cy + innerR * Math.sin(angle2)).toFixed(2);

    const largeArcFlag = span > 0.5 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`;
  };

  const pieSlices = useMemo(() => {
    if (!categoryChartData || categoryChartData.length === 0 || totalCategoryUnits === 0) {
      return [];
    }

    // Modern curated palette with accessible contrast
    const MODERN_PALETTE = [
      '#4f46e5', // Royal Indigo
      '#06b6d4', // Vibrant Cyan
      '#10b981', // Emerald Green
      '#f59e0b', // Warm Amber
      '#ec4899', // Rich Pink
      '#8b5cf6', // Soft Violet
    ];

    // Compute exact percentages ensuring sum is strictly 100%
    const rawPercentages = categoryChartData.map(item => (item.value / totalCategoryUnits) * 100);
    const roundedPercentages = rawPercentages.map(p => Math.round(p));
    const sumP = roundedPercentages.reduce((a, b) => a + b, 0);
    if (sumP !== 100 && roundedPercentages.length > 0) {
      const maxIdx = roundedPercentages.indexOf(Math.max(...roundedPercentages));
      roundedPercentages[maxIdx] += (100 - sumP);
    }

    let accumulatedPercent = 0;
    let paletteIdx = 0;

    return categoryChartData.map((item, idx) => {
      const sliceFraction = item.value / totalCategoryUnits;
      const startPercent = accumulatedPercent;
      const endPercent = accumulatedPercent + sliceFraction;
      accumulatedPercent += sliceFraction;

      const isOthers = item.name.toLowerCase() === 'others';
      const color = isOthers ? '#64748b' : MODERN_PALETTE[paletteIdx++ % MODERN_PALETTE.length];
      const path = getDonutPath(startPercent, endPercent);

      return {
        id: `slice-${idx}`,
        name: item.name,
        value: item.value,
        percentage: roundedPercentages[idx] || Math.round(sliceFraction * 100),
        path,
        color,
      };
    });
  }, [categoryChartData, totalCategoryUnits]);

  // Paginated recent enquiries data
  const paginatedEnquiries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return enquiryRows.slice(startIndex, startIndex + itemsPerPage);
  }, [enquiryRows, currentPage]);

  const totalPages = Math.max(1, Math.ceil(enquiryRows.length / itemsPerPage));

  if (loading || syncStatus === 'loading') {
    return (
      <AdminLoadingScreen
        title={syncStatus === 'loading' ? 'Syncing Google Sheets Catalog...' : 'Loading Dashboard Overview...'}
        subtitle={syncStatus === 'loading' ? 'Updating inventory and synchronizing Supabase tables…' : 'Calculating sales volume, order metrics, and pending tasks…'}
      />
    );
  }

  return (
    <div className="dashboard-overview-container">
      <div className="dashboard-overview-header">
        <h1 className="dashtar-title">Dashboard Overview</h1>
        <button
          type="button"
          className="admin-sync-sheets-btn"
          onClick={handleManualSync}
          disabled={syncStatus === 'loading'}
          title="Manually trigger Google Sheets sync to refresh live inventory & pricing"
        >
          <RefreshCw size={13.5} className={`sync-icon ${syncStatus === 'loading' ? 'spin-icon' : ''}`} />
          <span>{syncStatus === 'loading' ? 'Syncing...' : 'Sync Google Sheet'}</span>
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
            <span>Total Orders</span>
            <strong>{totalOrdersCount}</strong>
          </div>
        </article>

        <article className="dashtar-outline-card">
          <div className="outline-icon-container bg-blue-soft text-blue">
            <RefreshCw size={18} />
          </div>
          <div className="outline-card-info">
            <span>Orders Pending</span>
            <div className="outline-val-row">
              <strong>{pendingOrdersCount}</strong>
              {pendingOrdersAmount > 0 && (
                <span className="outline-highlight-badge">{formatINR(pendingOrdersAmount)}</span>
              )}
            </div>
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
        {/* Smooth Spline Chart: Weekly Trends */}
        <article className="admin-panel dashboard-chart-panel">
          <div className="chart-panel-header">
            <div>
              <div className="chart-panel-title-row">
                <h3>Weekly {activeChartTab === 'sales' ? 'Sales' : 'Orders'}</h3>
                <span
                  className="chart-metric-pill"
                  style={{
                    color: lineGraphData.accentColor,
                    backgroundColor: `${lineGraphData.accentColor}14`,
                    border: `1px solid ${lineGraphData.accentColor}25`,
                  }}
                >
                  {lineGraphData.displayTotal}
                </span>
              </div>
              <small>
                {hoveredPoint
                  ? `${hoveredPoint.fullDate}: ${hoveredPoint.displayVal}`
                  : 'Trends & volume over the past 7 days'}
              </small>
            </div>
            <div className="chart-segmented-control">
              <button
                type="button"
                onClick={() => {
                  setActiveChartTab('sales');
                  setHoveredPoint(null);
                }}
                className={`chart-segment-btn ${activeChartTab === 'sales' ? 'active' : ''}`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveChartTab('orders');
                  setHoveredPoint(null);
                }}
                className={`chart-segment-btn ${activeChartTab === 'orders' ? 'active' : ''}`}
              >
                Orders
              </button>
            </div>
          </div>

          <div className="svg-chart-wrapper" onMouseLeave={() => setHoveredPoint(null)}>
            <svg
              width="100%"
              height="230"
              viewBox="0 0 400 220"
              preserveAspectRatio="none"
              className="trend-svg"
            >
              <defs>
                <linearGradient id="salesTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="ordersTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
                <filter id="trendPointGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={lineGraphData.accentColor} floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Horizontal grid lines */}
              {lineGraphData.yGrid.map((grid, idx) => (
                <g key={idx}>
                  <text
                    x="44"
                    y={grid.y + 3.5}
                    fontSize="9.5"
                    fontWeight="500"
                    fill="#9ca3af"
                    textAnchor="end"
                  >
                    {grid.label}
                  </text>
                  <line
                    x1="50"
                    y1={grid.y}
                    x2="385"
                    y2={grid.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={idx === lineGraphData.yGrid.length - 1 ? 'none' : '3 3'}
                  />
                </g>
              ))}

              {/* Gradient area fill under curve */}
              <path
                d={lineGraphData.areaPath}
                fill={`url(#${lineGraphData.gradId})`}
              />

              {/* Smooth cubic spline line */}
              <path
                d={lineGraphData.smoothCurve}
                fill="none"
                stroke={lineGraphData.accentColor}
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active vertical guideline & tooltip bubble */}
              {hoveredPoint && (
                <g className="chart-active-guide">
                  <line
                    x1={hoveredPoint.x}
                    y1={24}
                    x2={hoveredPoint.x}
                    y2={175}
                    stroke={lineGraphData.accentColor}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  {/* Tooltip bubble on chart */}
                  <g transform={`translate(${Math.min(340, Math.max(64, hoveredPoint.x))}, ${hoveredPoint.y < 55 ? hoveredPoint.y + 14 : hoveredPoint.y - 28})`}>
                    <rect
                      x="-38"
                      y="0"
                      width="76"
                      height="22"
                      rx="5"
                      fill="#0f172a"
                      filter="drop-shadow(0 2px 5px rgba(0,0,0,0.2))"
                    />
                    <text
                      x="0"
                      y="14.5"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {hoveredPoint.displayVal}
                    </text>
                  </g>
                </g>
              )}

              {/* Data points, labels & hit targets */}
              {lineGraphData.points.map((p) => {
                const isHovered = hoveredPoint?.id === p.id;
                return (
                  <g key={p.id}>
                    {/* Visual point circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5.5 : 3}
                      fill="#ffffff"
                      stroke={lineGraphData.accentColor}
                      strokeWidth={isHovered ? 2.75 : 2}
                      filter={isHovered ? 'url(#trendPointGlow)' : 'none'}
                      style={{ transition: 'all 0.15s ease' }}
                    />

                    {/* X Axis Day Label */}
                    <text
                      x={p.x}
                      y="198"
                      fontSize="10"
                      fontWeight={isHovered ? '700' : '500'}
                      fill={isHovered ? '#0f172a' : '#9ca3af'}
                      textAnchor="middle"
                      style={{ transition: 'all 0.15s ease' }}
                    >
                      {p.dayName}
                    </text>

                    {/* Enlarged invisible hit target for comfortable mouse hover & mobile tap */}
                    <rect
                      x={p.x - 22}
                      y="20"
                      width="44"
                      height="185"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint(p)}
                      onClick={() => setHoveredPoint((prev) => (prev?.id === p.id ? null : p))}
                      onTouchStart={() => setHoveredPoint(p)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </article>

        {/* Donut Chart: Best Selling Products */}
        <article className="admin-panel dashboard-chart-panel">
          <div className="chart-panel-header">
            <div>
              <h3>Best Selling Products</h3>
              <small>Top products by wholesale volume</small>
            </div>
            {totalCategoryUnits > 0 && (
              <span className="pie-header-pill">
                {totalCategoryUnits} {totalCategoryUnits === 1 ? 'unit' : 'units'} sold
              </span>
            )}
          </div>

          {pieSlices.length === 0 ? (
            <div className="donut-empty-state">
              <div className="donut-empty-icon-wrap">
                <Box size={22} strokeWidth={1.5} />
              </div>
              <p className="donut-empty-title">No Product Data Yet</p>
              <span className="donut-empty-sub">
                Best-selling products will appear here as customer orders are verified.
              </span>
            </div>
          ) : (
            <div className="pie-chart-container">
              <div className="pie-svg-wrapper">
                <svg width="180" height="180" viewBox="0 0 200 200" className="donut-svg">
                  {pieSlices.map((slice) => {
                    const isSelected = activeSlice?.name === slice.name;
                    const isMuted = activeSlice && !isSelected;
                    return (
                      <path
                        key={slice.id}
                        d={slice.path}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="donut-slice-path"
                        style={{
                          opacity: isMuted ? 0.35 : 1,
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: '100px 100px',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={() => handleSliceClick(slice)}
                        onMouseEnter={() => setHoveredSlice(slice)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                <div
                  className="donut-center-overlay"
                  onClick={() => setSelectedSlice(null)}
                  title={activeSlice ? 'Click to show total' : 'Total units sold'}
                >
                  <span
                    className="donut-center-val"
                    style={{ color: activeSlice ? activeSlice.color : '#111827' }}
                  >
                    {activeSlice ? `${activeSlice.percentage}%` : totalCategoryUnits}
                  </span>
                  <span className="donut-center-label">
                    {activeSlice ? `${activeSlice.value} pcs` : 'Units Sold'}
                  </span>
                </div>
              </div>

              <div className="modern-pie-legend">
                {pieSlices.map((slice) => {
                  const isSelected = activeSlice?.name === slice.name;
                  const isMuted = activeSlice && !isSelected;
                  return (
                    <div
                      key={slice.id}
                      className={`modern-legend-item ${isSelected ? 'is-selected' : ''} ${isMuted ? 'is-muted' : ''}`}
                      onClick={() => handleSliceClick(slice)}
                      onMouseEnter={() => setHoveredSlice(slice)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="legend-left">
                        <span
                          className="legend-swatch"
                          style={{
                            backgroundColor: slice.color,
                            boxShadow: isSelected ? `0 0 0 2px #ffffff, 0 0 0 4px ${slice.color}` : 'none',
                          }}
                        />
                        <span className="legend-title" title={slice.name}>
                          {slice.name}
                        </span>
                      </div>
                      <div className="legend-right">
                        <span className="legend-count">{slice.value} pcs</span>
                        <span
                          className="legend-badge"
                          style={{
                            backgroundColor: isSelected ? slice.color : `${slice.color}18`,
                            color: isSelected ? '#ffffff' : slice.color,
                          }}
                        >
                          {slice.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}        </article>
      </div>

      {/* 4. Recent Order Table */}
      <article className="admin-panel">
        <div className="admin-panel-head" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '16px' }}>
          <span>Recent Orders</span>
          <small>{enquiryRows.length} {enquiryRows.length === 1 ? 'entry' : 'entries'} total</small>
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
          className="pie-floating-tooltip"
          style={{
            left: `${Math.min(tooltipPos.x + 15, typeof window !== 'undefined' ? window.innerWidth - 240 : tooltipPos.x)}px`,
            top: `${Math.max(12, tooltipPos.y - 42)}px`,
          }}
        >
          <span className="tooltip-dot" style={{ backgroundColor: hoveredSlice.color }} />
          <span className="tooltip-name">{hoveredSlice.name}</span>
          <span className="tooltip-val">{hoveredSlice.value} pcs ({hoveredSlice.percentage}%)</span>
        </div>)}
    </div>
  );
}
