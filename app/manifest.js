// WEB APP MANIFEST - Makes the site installable as an app on Android/iPhone home screens.
// This only adds the "install / add to home screen" option; normal website visitors are unaffected.
// Next.js automatically injects <link rel="manifest"> into <head> because this file exists.

const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';

export default function manifest() {
  return {
    name: siteName,        // shown in the install prompt / app settings
    short_name: siteName,  // home-screen icon label
    description:
      'Buy and sell for free, list services and businesses, get discovered locally, explore events, sell tickets, find deals, and join community discussions.',
    start_url: '/',           // page opened when launched from the icon
    display: 'standalone',    // fullscreen, no browser bar - looks like a native app
    background_color: '#ffffff', // splash screen background while the app loads
    theme_color: '#ffffff',      // colors the phone status bar in app mode (light UI). Set to '#0f766e' for a teal bar.
    icons: [
      { src: '/fav192.png', type: 'image/png', sizes: '192x192', purpose: 'any maskable' },
      { src: '/fav512.png', type: 'image/png', sizes: '512x512', purpose: 'any maskable' },
    ],
  };
}
