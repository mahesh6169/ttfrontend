import LoginClient from './LoginClient';

export const metadata = {
  title: 'Login',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
