import { redirect } from 'next/navigation';

// redirect to /adverts..

export default function Home() {
  redirect('/adverts');
}
