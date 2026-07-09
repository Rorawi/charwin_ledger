export default function manifest() {
  return {
    name: "Thread Ledger",
    short_name: "Ledger",
    description: "A personal ledger for clothing line credit, inventory, and content planning.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF8F5",
    theme_color: "#1A1816",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
