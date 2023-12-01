/** @type {import('next').NextConfig} */
const nextConfig = {
    // See https://stackoverflow.com/questions/64926174/module-not-found-cant-resolve-fs-in-next-js-application
    webpack: (config) => {
      config.resolve.fallback = { 
        fs: false, 
        path: false,
    };
  
      return config;
    },

}

module.exports = nextConfig
