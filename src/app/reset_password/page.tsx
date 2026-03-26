"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Basic Redirector for both /reset_password and /reset-password.
 * Performs NO verification, just moves the user to the form.
 */
export default function ResetPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    // We pass along all query parameters just in case
    const query = window.location.search;
    router.replace("/account/update-password" + query);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to secure form...</p>
      </div>
    </div>
  );
}
