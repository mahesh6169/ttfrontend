// Legacy /coupons/views/[campaignId] is the pre-slug campaign detail route, kept
// alive for internal flows but noindex so Google drops the duplicate in favour of the
// canonical /coupons/[slug] page. The page is a client component and cannot export
// metadata itself, so the noindex is emitted from this server layout.
// Plan: featureplans/shared-seo-plumbing.md (S3/S4). Guide: designguide/06-seo/sharedseo.md.
export const metadata = {
  robots: { index: false, follow: true },
};

export default function CouponsViewsNoindexLayout({ children }) {
  return children;
}
