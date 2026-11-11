import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TAAI — Travel Around AI",
    short_name: "TAAI",
    description: "Your personal AI travel agency.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f2f6f5",
    theme_color: "#0b6e6a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
