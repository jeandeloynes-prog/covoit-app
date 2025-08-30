import './globals.css';
import AuthBootstrap from './_components/AuthBootstrap';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
