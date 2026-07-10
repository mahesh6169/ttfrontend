// Admin area (login + dashboard) — keep out of search.
export const metadata = {
  robots: { index: false, follow: true },
};

const AdminLayout = ({ children }) => {
  return <>{children}</>;
};
export default AdminLayout;
