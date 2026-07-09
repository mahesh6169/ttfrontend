import FormsContentShell from '@/components/layout/FormsContentShell';

// Blog (marketing articles) — centered content band inside the global
// nav/footer from the root layout. Minimal shell, no card chrome; each post
// page supplies its own hero + prose.
const BlogLayout = ({ children }) => {
  return (
    <main className="container mx-auto">
      <FormsContentShell>{children}</FormsContentShell>
    </main>
  );
};

export default BlogLayout;
