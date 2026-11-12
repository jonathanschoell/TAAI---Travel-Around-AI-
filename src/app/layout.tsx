import type { Metadata, Viewport } from "next";
import { Figtree, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

/** Plays the plane intro once per browser session, never for people who prefer reduced motion. */
const INTRO_SCRIPT = `try{var d=document.documentElement;if(!sessionStorage.getItem("jovia-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("jovia-intro");sessionStorage.setItem("jovia-intro","1");setTimeout(function(){d.classList.remove("jovia-intro")},4200)}}catch(e){}`;

export const metadata: Metadata = {
  title: {
    default: "Jovia",
    template: "%s · Jovia",
  },
  description:
    "Jovia is your personal AI travel agency. Tell us who is travelling and what you love, and get a day-by-day itinerary made for you.",
  applicationName: "Jovia",
  appleWebApp: { capable: true, title: "Jovia", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fd" },
    { media: "(prefers-color-scheme: dark)", color: "#16223f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
