export async function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
  
  return {
    title: `${siteName} - Your Local Marketplace`,
    description: `Buy and sell items locally on ${siteName}. Find great deals on furniture, electronics, cars, real estate, jobs and more in your area.`,
    // Thin redirect-to-homepage page — keep out of search (don't compete with the homepage).
    robots: { index: false, follow: true },
    openGraph: {
      title: 'Your Local Marketplace',
      description: 'Buy and sell items locally. Find great deals in your area.',
      url: `${siteUrl}/share`,
      siteName: siteName,
      images: [
        {
          url: `${siteUrl}/desify-og-default.jpg`,
          width: 1200,
          height: 630,
          alt: `${siteName} - Your Local Marketplace`,
        }
      ],
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} - Your Local Marketplace`,
      description: `Buy and sell items locally on ${siteName}. Find great deals in your area.`,
      images: [`${siteUrl}/desify-og-default.jpg`],
    },
  };
}

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