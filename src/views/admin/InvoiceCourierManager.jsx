import { useState, useMemo } from 'react';
import {
  Truck,
  Printer,
  Search,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

/**
 * InvoiceCourierManager Component
 * Admin View for managing and generating:
 * - Pro-Forma Commercial Invoices
 * - Blind Courier Shipping Labels
 * - Delivery tracking records
 */
export function InvoiceCourierManager({ inquiries = [], products = [], loadAdminData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('orders');
  const [copyFeedback, setCopyFeedback] = useState({});

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (typeFilter === 'orders' && inq._sourceTable !== 'orders') return false;
      if (typeFilter === 'inquiries' && inq._sourceTable !== 'inquiries') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${inq.id} ${inq.buyer_name || ''} ${inq.business_name || ''} ${inq.email || ''} ${inq.phone || ''} ${inq.tracking_number || ''}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });
  }, [inquiries, typeFilter, searchQuery]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handlePrintInvoice = (inquiry) => {
    if (typeof window === 'undefined') return;
    const invoiceCode = inquiry.id ? String(inquiry.id).slice(0, 8).toUpperCase() : 'INV-1001';
    const dateStr = inquiry.created_at ? new Date(inquiry.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    const buyerName = inquiry.buyer_name || inquiry.full_name || inquiry.business_name || 'Valued B2B Client';
    const buyerBusiness = inquiry.business_name || '';
    const buyerPhone = inquiry.phone || inquiry.whatsapp || 'N/A';
    const buyerEmail = inquiry.email || 'N/A';
    const buyerCity = inquiry.city || inquiry.pincode ? `${inquiry.city || ''} - ${inquiry.pincode || ''}` : 'India';

    let itemsHtml = '';
    let totalAmt = 0;

    if (Array.isArray(inquiry.items) && inquiry.items.length > 0) {
      itemsHtml = inquiry.items.map((it, idx) => {
        const qty = Number(it.quantity || 1);
        const price = Number(it.unit_price || it.price || 1500);
        const lineTotal = qty * price;
        totalAmt += lineTotal;
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${it.product_title || it.title || 'Banarasi Handloom Textile'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${it.variant_code || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${price.toLocaleString('en-IN')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${lineTotal.toLocaleString('en-IN')}</td>
          </tr>
        `;
      }).join('');
    } else {
      totalAmt = Number(inquiry.estimated_amount || 12500);
      itemsHtml = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">1</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inquiry.message || 'Banarasi Silk Saree Wholesale Order'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${inquiry.variant_code || 'B2B-BULK'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">1 Lot</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${totalAmt.toLocaleString('en-IN')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${totalAmt.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Commercial Pro-Forma Invoice #${invoiceCode} - Weave365</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1f2937; line-height: 1.5; }
          .invoice-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #b45309; }
          .brand { font-size: 24px; font-weight: bold; color: #b45309; letter-spacing: 0.05em; }
          .subbrand { font-size: 12px; text-transform: uppercase; color: #6b7280; }
          .title { text-align: right; }
          .title h2 { margin: 0; font-size: 22px; color: #111827; }
          .title span { font-size: 14px; color: #6b7280; font-weight: 600; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
          .card { background: #fdfbf7; border: 1px solid #f3ebe0; border-radius: 6px; padding: 16px; }
          .card-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #b45309; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }
          .total-box { margin-top: 24px; text-align: right; font-size: 18px; font-weight: bold; color: #b45309; border-top: 2px solid #e2e8f0; padding-top: 12px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="brand">WEAVE 365</div>
              <div class="subbrand">Wholesale Handloom & Saree Hub · Varanasi</div>
            </div>
            <div class="title">
              <h2>PRO-FORMA INVOICE</h2>
              <span>#${invoiceCode}</span>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Date: ${dateStr}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Billed To (Buyer Profile)</div>
              <div style="font-size: 16px; font-weight: bold; color: #111827;">${buyerName}</div>
              ${buyerBusiness ? `<div style="font-weight: 600; color: #4b5563;">${buyerBusiness}</div>` : ''}
              <div>${buyerCity}</div>
              <div>Email: ${buyerEmail}</div>
              <div>Phone: ${buyerPhone}</div>
            </div>
            <div class="card">
              <div class="card-title">Supplier Details</div>
              <div style="font-size: 16px; font-weight: bold; color: #111827;">Weave365 Wholesale Central</div>
              <div>CK 12/45, Chowk, Varanasi, UP - 221001</div>
              <div>GSTIN: 09AAAAA0000A1Z5 (Pro-Forma)</div>
              <div>Contact: +91 9919101369</div>
              <div>Support: weave365@gmail.com</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Item Description</th>
                <th>SKU Code</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            Grand Total: ₹${totalAmt.toLocaleString('en-IN')}
          </div>

          <div class="footer">
            This is an official pro-forma commercial invoice generated by Weave365 Admin Portal.<br/>
            Thank you for doing business with Varanasi Master Weavers.
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    } else {
      alert('Pop-up blocked. Please allow pop-ups to print pro-forma invoice.');
    }
  };

  const handlePrintCourierSlip = (inquiry) => {
    if (typeof window === 'undefined') return;
    const slipCode = inquiry.id ? String(inquiry.id).slice(0, 8).toUpperCase() : 'SLIP-101';
    const senderName = inquiry.dropship_sender_name || inquiry.business_name || 'Weave365 Logistics Partner';
    const senderPhone = inquiry.dropship_sender_phone || inquiry.phone || '+91 9919101369';
    const recipientName = inquiry.buyer_name || inquiry.full_name || 'Valued Customer';
    const recipientPhone = inquiry.phone || inquiry.whatsapp || 'N/A';
    const carrier = inquiry.tracking_carrier || 'Delhivery Express';
    const trackingNum = inquiry.tracking_number || 'TRK-' + Math.floor(100000 + Math.random() * 900000);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Courier Dispatch Slip - #${slipCode}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
          .slip-container { border: 2px solid #0f172a; border-radius: 8px; padding: 24px; max-width: 550px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .badge { background: #2563eb; color: #fff; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          .box { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; background: #f8fafc; }
          .title { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 4px; }
          .tracking-box { border: 2px solid #2563eb; background: #eff6ff; padding: 12px; border-radius: 6px; text-align: center; margin-top: 16px; }
          .barcode { font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <div class="slip-container">
          <div class="header">
            <div>
              <h2 style="margin:0; font-size: 20px;">COURIER DISPATCH SLIP</h2>
              <div style="font-size: 12px; color: #64748b;">Ref #${slipCode}</div>
            </div>
            <div class="badge">PRIORITY SHIPMENT</div>
          </div>

          <div class="grid">
            <div class="box">
              <div class="title">SHIP FROM</div>
              <div style="font-weight: bold;">${senderName}</div>
              <div>Phone: ${senderPhone}</div>
              <div>Varanasi, Uttar Pradesh</div>
            </div>
            <div class="box">
              <div class="title">SHIP TO (RECIPIENT)</div>
              <div style="font-weight: bold;">${recipientName}</div>
              <div>Phone: ${recipientPhone}</div>
              <div>${inquiry.city || ''} ${inquiry.pincode || ''}</div>
            </div>
          </div>

          <div class="tracking-box">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #1d4ed8;">Carrier: ${carrier}</div>
            <div class="barcode">${trackingNum}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Scan or track at carrier portal</div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    }
  };

  return (
    <div className="invoice-courier-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-title" style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Invoice / Courier Slip</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>Generate Pro-Forma Invoices, print Courier Dispatch Slips, and track fulfillment.</p>
        </div>
        <button
          type="button"
          className="admin-refresh-btn"
          onClick={() => loadAdminData && loadAdminData()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by Invoice #, Buyer Name, Email, Phone or Courier Tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
        >
          <option value="all">All Records</option>
          <option value="orders">Orders Only</option>
          <option value="inquiries">Inquiries Only</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>Invoice / Ref #</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>Buyer Info</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>Courier / Tracking</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', textAlign: 'center' }}>Print & Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  No order or inquiry records found for invoice generation.
                </td>
              </tr>
            ) : (
              filteredInquiries.map((inq) => {
                const invCode = inq.id ? String(inq.id).slice(0, 8).toUpperCase() : 'INV-1001';
                const isCopied = copyFeedback[inq.id];

                return (
                  <tr key={inq.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#1f2937', background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>
                        #{invCode}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{inq.buyer_name || inq.full_name || 'B2B Buyer'}</div>
                      {inq.business_name && <div style={{ fontSize: '13px', color: '#4b5563' }}>{inq.business_name}</div>}
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{inq.email || 'No email'} · {inq.phone || 'No phone'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{inq.tracking_carrier || 'Standard Courier'}</div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#2563eb' }}>
                        {inq.tracking_number || 'No tracking ID'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', background: inq.status === 'completed' || inq.status === 'delivered' ? '#dcfce7' : '#fef3c7', color: inq.status === 'completed' || inq.status === 'delivered' ? '#166534' : '#92400e' }}>
                        {inq.status || 'Verified'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handlePrintInvoice(inq)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                          title="Print Commercial Pro-Forma Invoice"
                        >
                          <Printer size={13} /> Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintCourierSlip(inq)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                          title="Print Courier Shipping Slip"
                        >
                          <Truck size={13} /> Courier Slip
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(`Invoice #${invCode}\nBuyer: ${inq.buyer_name || ''}\nCarrier: ${inq.tracking_carrier || 'Delhivery'}\nTracking: ${inq.tracking_number || 'N/A'}`, inq.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                          title="Copy Info"
                        >
                          {isCopied ? <Check size={13} style={{ color: '#16a34a' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
