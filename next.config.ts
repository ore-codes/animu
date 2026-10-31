import type { NextConfig } from 'next';

const config: NextConfig = {
  // The local embedding model ships native binaries that must not be bundled.
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node', 'sharp'],
};

export default config;
