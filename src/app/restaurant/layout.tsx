"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "owner") {
      router.push("/");
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (role !== "owner") {
    return null;
  }

  return <>{children}</>;
}
