import RegisterClient from './RegisterClient';
import BaseContentShell from '@/components/layout/BaseContentShell';

export const metadata = {
  title: 'Register',
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto">
      <BaseContentShell>
        <RegisterClient />
      </BaseContentShell>
    </div>
  );
}
