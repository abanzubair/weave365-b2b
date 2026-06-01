/**
 * @file API route for B2B Vendor Partner Registration and Onboarding pipeline.
 * Completely database-driven: writes to and reads from Supabase directly,
 * bypassing and eliminating Google Sheets completely.
 */

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Safe server-side client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service_role key to bypass RLS for administrative updates and file uploads
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// Helper to parse base64 file payloads and upload them directly to Supabase Storage
async function uploadBase64ToStorage(base64Str, path) {
  if (!base64Str) return '';
  if (!base64Str.startsWith('data:')) {
    // If it's already a public URL or clean pointer, return it as is
    return base64Str;
  }
  
  try {
    const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) return '';
    
    const contentType = matches[1];
    const base64Data = matches[2];
    
    // Standard Edge runtime-compatible binary decoding using atob
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: contentType });
    
    const { data, error } = await supabase.storage
      .from('vendor-onboarding')
      .upload(path, blob, {
        contentType: contentType,
        upsert: true
      });
      
    if (error) {
      console.error(`[uploadBase64ToStorage] Storage upload failed for ${path}:`, error);
      return '';
    }
    
    const { data: urlData } = supabase.storage
      .from('vendor-onboarding')
      .getPublicUrl(data.path);
      
    return urlData.publicUrl || '';
  } catch (err) {
    console.error(`[uploadBase64ToStorage] Runtime error uploading ${path}:`, err);
    return '';
  }
}


/**
 * Sends a beautifully styled B2B email notification to weave365@gmail.com
 * when a new supplier completes Step 1 of the trusted partner registration.
 * Edge-compatible fetch POST payload directly to Resend API endpoint.
 */
async function sendNotificationEmail(reviewData) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[vendor-registration API] RESEND_API_KEY environment variable is not configured. Skipping email notification.');
    return;
  }

  // Fallback to onboarding@resend.dev (Resend's default sandbox domain sender) if no custom verified sender is supplied
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const targetEmail = 'weave365@gmail.com';

  const emailBody = {
    from: `Weave365 Onboarding <${fromEmail}>`,
    to: targetEmail,
    subject: `🔔 New Supplier Partner Application: ${reviewData.full_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Supplier Partner Application</title>
        <style>
          body {
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            background-color: #FAF8F5;
            color: #1A1715;
            margin: 0;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border: 1px solid #EADECC;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          }
          .email-header {
            background-color: #756F4F;
            color: #FFFFFF;
            padding: 30px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0 0 5px 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .email-header p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .email-body {
            padding: 30px;
          }
          .welcome-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #756F4F;
            border-bottom: 2px solid #FAF8F5;
            padding-bottom: 8px;
            margin-top: 28px;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .field-group {
            margin-bottom: 16px;
            line-height: 1.5;
          }
          .field-label {
            font-weight: 600;
            color: #777777;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .field-value {
            color: #1A1715;
            font-size: 16px;
          }
          .image-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 16px;
          }
          .image-slot {
            aspect-ratio: 4 / 3;
            border: 1px solid #EADECC;
            border-radius: 8px;
            overflow: hidden;
            background-color: #FAF8F5;
          }
          .image-slot img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .cta-box {
            text-align: center;
            margin-top: 36px;
            padding-top: 24px;
            border-top: 1px solid #FAF8F5;
          }
          .cta-button {
            display: inline-block;
            background-color: #756F4F;
            color: #FFFFFF !important;
            text-decoration: none;
            padding: 12px 30px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 6px;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 10px rgba(117, 111, 79, 0.15);
          }
          .email-footer {
            background-color: #FAF8F5;
            color: #777777;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #EADECC;
          }
          .email-footer p {
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Weave 365</h1>
            <p>New Supplier Review Application (Step 1)</p>
          </div>
          <div class="email-body">
            <div class="welcome-text">
              <p>Hello Admin,</p>
              <p>A new supplier has completed the <strong>Step 1: Submit Products for Review</strong> onboarding form on <strong>/weaver-registration</strong>. Please find the application details below:</p>
            </div>
            
            <div class="section-title">Supplier Information</div>
            
            <div class="field-group">
              <div class="field-label">Full Name</div>
              <div class="field-value">${reviewData.full_name}</div>
            </div>
            
            <div class="field-group">
              <div class="field-label">WhatsApp Number</div>
              <div class="field-value">+91 ${reviewData.whatsapp_number}</div>
            </div>
            
            <div class="field-group">
              <div class="field-label">City & Pincode</div>
              <div class="field-value">${reviewData.city} - ${reviewData.pincode}</div>
            </div>
            
            <div class="section-title">Product Details</div>
            
            <div class="field-group">
              <div class="field-label">Product Categories</div>
              <div class="field-value">${reviewData.categories}</div>
            </div>
            
            <div class="field-group">
              <div class="field-label">Approximate Price Range</div>
              <div class="field-value">${reviewData.price_range}</div>
            </div>
            
            <div class="section-title">Uploaded Sample Photos</div>
            <p style="font-size: 13px; color: #777777; margin-top: -8px; margin-bottom: 16px;">Click any image to view it in full resolution:</p>
            
            <div class="image-grid">
              <div class="image-slot">
                ${reviewData.image1 ? `<a href="${reviewData.image1}" target="_blank"><img src="${reviewData.image1}" alt="Sample 1"></a>` : `<div style="padding: 24px; text-align: center; color: #999; font-size: 13px;">No Photo</div>`}
              </div>
              <div class="image-slot">
                ${reviewData.image2 ? `<a href="${reviewData.image2}" target="_blank"><img src="${reviewData.image2}" alt="Sample 2"></a>` : `<div style="padding: 24px; text-align: center; color: #999; font-size: 13px;">No Photo</div>`}
              </div>
              <div class="image-slot">
                ${reviewData.image3 ? `<a href="${reviewData.image3}" target="_blank"><img src="${reviewData.image3}" alt="Sample 3"></a>` : `<div style="padding: 24px; text-align: center; color: #999; font-size: 13px;">No Photo</div>`}
              </div>
              <div class="image-slot">
                ${reviewData.image4 ? `<a href="${reviewData.image4}" target="_blank"><img src="${reviewData.image4}" alt="Sample 4"></a>` : `<div style="padding: 24px; text-align: center; color: #999; font-size: 13px;">No Photo</div>`}
              </div>
            </div>
            
            <div class="cta-box">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in'}/admin" class="cta-button">Open Admin Dashboard</a>
            </div>
          </div>
          <div class="email-footer">
            <p>This is an automated notification from your Weave 365 B2B Portal backend.</p>
            <p>&copy; ${new Date().getFullYear()} Weave 365. All Rights Reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(emailBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[vendor-registration API] Resend email dispatch failed:', errText);
    } else {
      console.log(`[vendor-registration API] Partner registration email notification successfully sent to ${targetEmail}.`);
    }
  } catch (err) {
    console.error('[vendor-registration API] Error dispatching notification email:', err);
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const action = payload.action;

    if (!action) {
      return Response.json(
        { status: 'error', error: 'Action parameter is required.' },
        { status: 400 }
      );
    }

    // 1. STEP 1: Submit Product for Review
    if (action === 'product_review') {
      const cleanWhatsapp = String(payload.whatsapp || '').trim().replace(/\D/g, '').slice(-10);
      
      // Upload product review sample images to Storage first
      const image1Url = await uploadBase64ToStorage(payload.image1, `reviews/${cleanWhatsapp}/sample1.png`);
      const image2Url = await uploadBase64ToStorage(payload.image2, `reviews/${cleanWhatsapp}/sample2.png`);
      const image3Url = await uploadBase64ToStorage(payload.image3, `reviews/${cleanWhatsapp}/sample3.png`);
      const image4Url = await uploadBase64ToStorage(payload.image4, `reviews/${cleanWhatsapp}/sample4.png`);

      const { data, error } = await supabase
        .from('vendor_reviews')
        .insert({
          full_name: payload.fullName,
          whatsapp_number: cleanWhatsapp,
          city: payload.city,
          pincode: payload.pincode,
          categories: payload.categories,
          price_range: payload.priceRange,
          image1: image1Url,
          image2: image2Url,
          image3: image3Url,
          image4: image4Url,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[vendor-registration API] vendor_reviews insert error:', error);
        return Response.json({ status: 'error', error: error.message }, { status: 400 });
      }

      // Fire off B2B partner registration notification email to weave365@gmail.com
      if (data) {
        // In edge/serverless runtime, we MUST await async fetch calls to guarantee they complete before the response is returned!
        await sendNotificationEmail(data);
      }

      return Response.json({ status: 'success', data });
    }

    // 1.5. STEP 2: Save Signed Payment Terms Agreement & PDF Upload
    if (action === 'submit_agreement') {
      const cleanWhatsapp = String(payload.whatsapp || '').trim().replace(/\D/g, '').slice(-10);
      
      // Upload the signed agreement HTML copy to Storage first
      const documentUrl = await uploadBase64ToStorage(payload.agreementDoc, `agreements/${cleanWhatsapp}/signed_terms.html`);

      const { data, error } = await supabase
        .from('vendor_agreements')
        .upsert({
          whatsapp_number: cleanWhatsapp,
          vendor_signed_name: payload.vendorName,
          signed_date: payload.date,
          agreed_terms: { agreeAll: true },
          document_url: documentUrl
        }, { onConflict: 'whatsapp_number' })
        .select()
        .single();

      if (error) {
        console.error('[vendor-registration API] vendor_agreements upsert error:', error);
        return Response.json({ status: 'error', error: error.message }, { status: 400 });
      }

      return Response.json({ status: 'success', data });
    }

    // 2. STEP 3: Complete Advanced Onboarding Profile (Includes Step 2 Payment Terms Agreement)
    if (action === 'vendor_registration') {
      const cleanWhatsapp = String(payload.whatsapp || '').trim().replace(/\D/g, '').slice(-10);

      // Upload ID verification scans and bank cheques to Storage first
      const idProofUrl = await uploadBase64ToStorage(payload.idProof, `verification/${cleanWhatsapp}/id_proof.png`);
      const cancelledChequeUrl = await uploadBase64ToStorage(payload.cancelledCheque, `verification/${cleanWhatsapp}/cancelled_cheque.png`);

      // A. Save/Register Vendor Profile Details
      const { error: profileError } = await supabase
        .from('vendor_profiles')
        .insert({
          whatsapp_number: cleanWhatsapp,
          full_name: payload.fullName,
          alternate_contact: payload.alternateContact,
          email: payload.email,
          business_name: payload.businessName,
          business_type: payload.businessType,
          business_address: payload.businessAddress,
          city: payload.city,
          pincode: payload.pincode,
          gst_number: payload.gstNumber,
          pan_number: payload.panNumber || '',
          years_in_business: payload.yearsInBusiness,
          fabric_specialisation: payload.fabricSpecialisation || '',
          monthly_capacity: payload.monthlyCapacity,
          dispatch_timeline: payload.dispatchTimeline,
          preferred_courier: payload.preferredCourier,
          dispatch_address_same: payload.dispatchAddressSame,
          dispatch_address_different: payload.dispatchAddressDifferent,
          
          bank_account_holder: payload.bankAccountHolder,
          bank_name: payload.bankName,
          bank_account_number: payload.bankAccountNumber,
          bank_ifsc: payload.bankIfsc,
          upi_id: payload.bankUpi,
          
          id_proof_url: idProofUrl,
          cancelled_cheque_url: cancelledChequeUrl,
          status: 'submitted'
        });

      if (profileError) {
        console.error('[vendor-registration API] vendor_profiles insert error:', profileError);
        return Response.json({ status: 'error', error: profileError.message }, { status: 400 });
      }

      return Response.json({ status: 'success' });
    }

    // 3. STEP 1 approval trigger from Admin dashboard
    if (action === 'update_review_status') {
      const cleanWhatsapp = String(payload.whatsapp || '').trim().replace(/\D/g, '').slice(-10);

      const { data, error } = await supabase
        .from('vendor_reviews')
        .update({ status: payload.status })
        .eq('whatsapp_number', cleanWhatsapp)
        .select();

      if (error) {
        return Response.json({ status: 'error', error: error.message }, { status: 400 });
      }

      return Response.json({ status: 'success', data });
    }

    // 4. STEP 3 approval trigger from Admin dashboard
    if (action === 'update_onboarding_status') {
      const cleanWhatsapp = String(payload.whatsapp || '').trim().replace(/\D/g, '').slice(-10);

      const { data, error } = await supabase
        .from('vendor_profiles')
        .update({ status: payload.status })
        .eq('whatsapp_number', cleanWhatsapp)
        .select();

      if (error) {
        return Response.json({ status: 'error', error: error.message }, { status: 400 });
      }

      return Response.json({ status: 'success', data });
    }

    // 4.5. STEP 3 product listing drive link update trigger from Admin dashboard
    if (action === 'update_drive_url') {
      const cleanWhatsapp = String(payload.whatsapp || '').trim().replace(/\D/g, '').slice(-10);

      const { data, error } = await supabase
        .from('vendor_profiles')
        .update({ drive_folder_url: payload.drive_folder_url })
        .eq('whatsapp_number', cleanWhatsapp)
        .select();

      if (error) {
        return Response.json({ status: 'error', error: error.message }, { status: 400 });
      }

      return Response.json({ status: 'success', data });
    }

    return Response.json(
      { status: 'error', error: `Unsupported action parameter: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error('[vendor-registration API POST] Server Crash:', err);
    return Response.json(
      { status: 'error', error: err.message || 'Server proxy encountered a runtime crash.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const whatsapp = searchParams.get('whatsapp');
    const gid = searchParams.get('gid');

    // 1. Single candidate status lookup
    if (whatsapp) {
      const cleanWhatsapp = String(whatsapp).trim().replace(/\D/g, '').slice(-10);
      if (cleanWhatsapp.length !== 10) {
        return Response.json({ status: 'error', error: 'Invalid WhatsApp number format.' }, { status: 400 });
      }

      const [reviewRes, agreementRes, profileRes] = await Promise.all([
        supabase.from('vendor_reviews').select('*').eq('whatsapp_number', cleanWhatsapp).maybeSingle(),
        supabase.from('vendor_agreements').select('*').eq('whatsapp_number', cleanWhatsapp).maybeSingle(),
        supabase.from('vendor_profiles').select('*').eq('whatsapp_number', cleanWhatsapp).maybeSingle()
      ]);

      if (reviewRes.error) console.error('[vendor-registration API GET] review check error:', reviewRes.error);
      if (agreementRes.error) console.error('[vendor-registration API GET] agreement check error:', agreementRes.error);
      if (profileRes.error) console.error('[vendor-registration API GET] profile check error:', profileRes.error);

      return Response.json({
        status: 'success',
        review: reviewRes.data || null,
        agreement: agreementRes.data || null,
        profile: profileRes.data || null
      });
    }

    // 2. Fetch all reviews (Admin view)
    if (type === 'reviews' || gid === '1133055182' || gid === process.env.NEXT_PUBLIC_PRODUCT_REVIEWS_GID) {
      const { data: reviews, error } = await supabase
        .from('vendor_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[vendor-registration API GET] vendor_reviews load error:', error);
        return Response.json({ status: 'error', error: error.message }, { status: 500 });
      }

      return Response.json({ status: 'success', data: reviews });
    }

    // 3. Fetch all onboarding profiles (Admin view)
    if (type === 'onboardings' || gid === '0' || gid === process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_GID) {
      const { data: onboardings, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[vendor-registration API GET] vendor_profiles load error:', error);
        return Response.json({ status: 'error', error: error.message }, { status: 500 });
      }

      return Response.json({ status: 'success', data: onboardings });
    }

    return Response.json(
      { status: 'error', error: 'Missing or invalid request parameters (type, whatsapp, or gid).' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[vendor-registration API GET] Server Crash:', err);
    return Response.json(
      { status: 'error', error: err.message || 'Server proxy encountered a runtime crash.' },
      { status: 500 }
    );
  }
}
