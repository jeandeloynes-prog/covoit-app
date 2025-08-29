// src/components/auth/UserButton.tsx
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"; // <- ajout

export default function UserButton() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => { // <- typé
        setEmail(session?.user?.email ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!email) {
    return (
      <button onClick={async () => {
        await supabase.auth.signInWithOtp({ email: "john@example.com" });
      }}>
        Sign in
      </button>
    );
  }

  return (
    <button onClick={async () => { await supabase.auth.signOut(); }}>
      {email} – Sign out
    </button>
  );
}
