import type { ReactNode } from "react";

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="public-layout flex min-h-screen flex-col">{children}</div>
  );
}
