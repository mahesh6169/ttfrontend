import FormsContentShell from '@/components/layout/FormsContentShell';

// Support pages (contact / report / removal forms + terms / privacy) — utility
// pages, kept out of search so Google focuses on the verticals + detail pages.
export const metadata = {
  robots: { index: false, follow: true },
};

// Support content pages (contact / report / removal forms + terms / privacy text).
// Frame + FormsContentShell (768) applied here so the whole group conforms; pages
// keep their own cards inside the shell. No footer on this group.
const SupportLayout = ({ children }) => {
  return (
    <main className="container mx-auto">
      <FormsContentShell>{children}</FormsContentShell>
    </main>
  );
};

export default SupportLayout;
