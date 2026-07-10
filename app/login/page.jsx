import LoginClient from './LoginClient';
import BaseContentShell from '@/components/layout/BaseContentShell';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Login',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <div className="container mx-auto">
      <BaseContentShell>
        <LoginClient />
      </BaseContentShell>
      <Footer />
    </div>
  );
}
