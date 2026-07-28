'use client';

import React from 'react';
import { VisualPageEditor } from './VisualPageEditor.jsx';

export function SiteCustomizerTab({ user, navigate }) {
  return <VisualPageEditor user={user} navigate={navigate} />;
}
