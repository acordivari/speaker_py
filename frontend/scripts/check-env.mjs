// Netlify build guard: fail fast if VITE_API_URL is not configured.
// Runs only from the Netlify build command (see netlify.toml); local
// `npm run build` does not invoke this script.

const apiUrl = process.env.VITE_API_URL;

if (!apiUrl || apiUrl.trim() === '') {
  console.error(
    'ERROR: VITE_API_URL is not set.\n\n' +
      'Netlify builds require VITE_API_URL to point at the Render backend URL\n' +
      '(e.g. https://sound-design-api.onrender.com). Without it the deployed\n' +
      'frontend has no API to talk to.\n\n' +
      'Set it in the Netlify UI: Site configuration > Environment variables.'
  );
  process.exit(1);
}

console.log(`check-env: building with VITE_API_URL=${apiUrl}`);
