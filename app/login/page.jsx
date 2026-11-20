import { redirect } from 'next/navigation';

export default function LoginPageRoute() {
  redirect('/signup?mode=login');
}
