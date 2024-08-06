"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'

const Redirect = () => {
  const router = useRouter();

  useEffect(() => {
    window.location.href = 'https://www.quasr.fr/'; // Redirect to the external site
  }, [router]);

  return null; // This component does not render anything
};

export default Redirect;