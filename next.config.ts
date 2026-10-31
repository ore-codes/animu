import type { NextConfig } from 'next';

const config: NextConfig = {
  // The local embedding model ships native binaries that must not be bundled.
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node', 'sharp'],
  // Production uses the hosted embedder. Keep the local model's native binaries out of the
  // serverless functions so they stay under Vercel's size limit.
  outputFileTracingExcludes: {
    '*': ['node_modules/onnxruntime-node/**', 'node_modules/onnxruntime-web/**', 'node_modules/@huggingface/**', 'node_modules/sharp/**', 'node_modules/@img/**'],
  },
};

export default config;
