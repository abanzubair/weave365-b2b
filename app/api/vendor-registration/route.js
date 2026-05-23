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
          pan_number: payload.panNumber,
          years_in_business: payload.yearsInBusiness,
          fabric_specialisation: payload.fabricSpecialisation,
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

      // B. Save Signed Payment Terms Agreement
      const { error: agreementError } = await supabase
        .from('vendor_agreements')
        .insert({
          whatsapp_number: cleanWhatsapp,
          vendor_signed_name: payload.paymentVendorName,
          signed_date: payload.paymentAgreementDate,
          agreed_terms: { agreeAll: true }
        });

      if (agreementError) {
        console.warn('[vendor-registration API] vendor_agreements insert skipped/failed:', agreementError.message);
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
