"use client";

import React from "react";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { Toaster } from "@/components/toast/Toaster";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  );
}
