import React from "react";
import "@/styles/settly/auth.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="auth-root">{children}</div>;
}
