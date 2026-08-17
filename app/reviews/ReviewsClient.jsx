'use client';

import { ReviewsPage } from '../../src/views/ReviewsPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function ReviewsClient() {
  const navigate = useAppNavigate();
  return <ReviewsPage navigate={navigate} />;
}
