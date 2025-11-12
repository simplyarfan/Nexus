import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SupportPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to My Tickets page
    router.replace('/support/my-tickets');
  }, [router]);

  return null;
}
