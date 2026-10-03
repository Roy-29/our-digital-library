import { redirect } from 'next/navigation';

export default function PeoplePage() {
  redirect('/dashboard/lending?tab=borrowers');
}
