import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 
     OVDE VRŠIMO DILATACIJU: 
     Povećavamo limit za Server Actions na 10MB 
     kako bi Vaši snimci ekrana od 1.47MB mogli da prođu.
  */
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