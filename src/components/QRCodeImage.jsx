'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeImage({
  text,
  size = 200,
  alt = 'UPI Payment QR Code',
  className = '',
  style = {},
}) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!text) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(text, {
      width: Math.max(size * 2, 400), // High DPI rendering for crisp scanning
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [text, size]);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          color: '#94a3b8',
          fontSize: '0.8rem',
          ...style,
        }}
      >
        <span>Generating QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        ...style,
      }}
    />
  );
}
