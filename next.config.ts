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
};

export default nextConfig;