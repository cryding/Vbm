import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ZYMALO Intelligence | Fashion Market Research",
  description: "Research fashion trends, competitor pricing and wholesale suppliers for ZYMALO.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}