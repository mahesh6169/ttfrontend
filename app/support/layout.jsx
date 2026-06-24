import FormsContentShell from '@/components/layout/FormsContentShell';

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
