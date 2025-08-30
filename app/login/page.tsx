export default function LoginPage() {
  return (
    <main>
      <h1>Se connecter</h1>
      {/* @ts-expect-error Server/Client boundary if needed */}
      {/* Le composant est client, la page peut rester server */}
      <MagicLinkForm />
    </main>
  );
}
