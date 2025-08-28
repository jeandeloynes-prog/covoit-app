export const metadata = { title: 'Covoit École', description: 'Groupes et messages' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'system-ui', margin: 0, padding: 20, background: '#f7f7f7' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>Covoit École</h1>
            <a href="/" style={{ textDecoration: 'none' }}>Accueil</a>
          </header>
          <main style={{ background: 'white', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
