/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  cacheOnFrontEndNav: true,
  //   aggressiveFrontEndNavCaching: true,
  // runtimeCaching: true,
  reloadOnOnline: true,
  //   swMinify: true,
  sw: "service-worker.js",
  register: true,
  disable: false,
  //   workBoxOptions: {
  //     disableDevLogs: true,
  //   },
});

const nextConfig = {};

module.exports = withPWA(nextConfig);
