import MagicLinkForm from '@/components/auth/MagicLinkForm';

export const metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Connexion</h1>
      <MagicLinkForm />
    </main>
  );
}
