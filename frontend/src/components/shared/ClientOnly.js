import { useState, useEffect } from 'react';

/**
 * ClientOnly component - prevents SSR/build-time rendering
 * Use this to wrap components that use browser-only features like useRouter
 */
export default function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )
    );
  }

  return children;
}
