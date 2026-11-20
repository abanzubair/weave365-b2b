import { redirect } from 'next/navigation';

export default function RegisterPageRoute() {
  redirect('/signup?mode=register');
}
