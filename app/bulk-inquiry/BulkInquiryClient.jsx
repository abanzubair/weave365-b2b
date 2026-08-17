'use client';

import { BulkInquiry } from '../../src/views/BulkInquiry.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function BulkInquiryClient() {
  const navigate = useAppNavigate();

  return <BulkInquiry navigate={navigate} />;
}
