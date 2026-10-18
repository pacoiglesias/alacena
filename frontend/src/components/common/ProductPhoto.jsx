import React, { useState } from 'react';
import { Package } from 'lucide-react';

/**
 * ProductPhoto — thumbnail 48-64px con foto del producto (Open Food Facts)
 * y fallback elegante al icono de la categoría si no hay foto o falla la carga.
 */
export default function ProductPhoto({ photo, alt, fallback, size = 48, className = '' }) {
  const [failed, setFailed] = useState(false);
  const px = `${size}px`;

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={alt || 'Producto'}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`rounded-xl object-cover bg-white shrink-0 ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center shrink-0 ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      {fallback || <Package className="w-1/2 h-1/2 text-gray-500" />}
    </div>
  );
}
