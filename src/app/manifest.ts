import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jovia — AI travel planner",
    short_name: "Jovia — AI travel planner",
    description: "Your personal AI travel agency.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f8fd",
    theme_color: "#1d4fd8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
