// Private/utility area (profile, email verify, password reset) — keep out of search.
export const metadata = {
  robots: { index: false, follow: true },
};

const UsersLayout = ({ children }) => {
  return <>{children}</>;
};
export default UsersLayout;
