export const metadata = {
  title: 'Desify - Your Local Marketplace',
  description: 'Buy and sell items locally on Desify. Find great deals on furniture, electronics, cars, real estate, jobs and more in your area.',
  openGraph: {
    title: 'Desify - Your Local Marketplace',
    description: 'Buy and sell items locally on Desify. Find great deals on furniture, electronics, cars, real estate, jobs and more in your area.',
    url: 'https://desify.com.au',
    siteName: 'Desify',
    images: [
      {
        url: '/desify-og-image.jpg', // You'll need to add this image
        width: 1200,
        height: 630,
        alt: 'Desify - Your Local Marketplace',
      }
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Desify - Your Local Marketplace',
    description: 'Buy and sell items locally on Desify. Find great deals in your area.',
    images: ['/desify-og-image.jpg'],
  },
};

export default function SharePage() {
  return (
    <>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Welcome to Desify</h1>
        <p style={{ marginBottom: '20px' }}>Your local marketplace for buying and selling</p>
        <p>Redirecting to homepage...</p>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `
          // Redirect after 2 seconds for real users
          // Crawlers will have time to read meta tags
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        `
      }} />
    </>
  );
}