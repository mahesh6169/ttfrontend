import { redirect } from 'next/navigation';

// redirect to /listings.......

export default function Home() {
  redirect('/listings');
}
