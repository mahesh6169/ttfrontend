import RegisterClient from './RegisterClient';

export const metadata = {
  title: 'Register',
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
