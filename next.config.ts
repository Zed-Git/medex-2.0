import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 
     OVDE VRŠIMO DILATACIJU: 
     Povećavamo limit za Server Actions na 10MB 
     kako bi Vaši snimci ekrana od 1.47MB mogli da prođu.
  */
  // [favicon] Safari/Chrome često traže tačno /favicon.ico; bez toga neki tabovi ostaju na starom Next "N".
  // Interno serviramo isti sadržaj kao /icon.svg (SVG).
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // [DODATO vs Zlatni standard] next/image mora eksplicitno da dozvoli remote host
  // ako koristimo Supabase Storage public URL za hero sliku iz CMS-a.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jbgfcouecypnusqenvkw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;