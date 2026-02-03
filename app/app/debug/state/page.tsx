// app/app/_debug/state/page.tsx
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AuthState =
  | { ok: false }
  | { ok: true; userId: string; email: string | null };

type AccountState =
  | { ok: false }
  | {
      ok: true;
      id: string;
      tenantId: string;
      status: string;
    };

type BusinessState =
  | { ok: false }
  | {
      ok: true;
      id: string;
      tenantId: string;
    };

export default async function DebugStatePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const auth: AuthState = user
    ? {
        ok: true,
        userId: user.id,
        email: user.email ?? null,
      }
    : { ok: false };

  let account: AccountState = { ok: false };
  let business: BusinessState = { ok: false };

  if (user) {
    const { data: accountRow } = await supabase
      .from("accounts")
      .select("id, tenant_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountRow) {
      account = {
        ok: true,
        id: accountRow.id,
        tenantId: accountRow.tenant_id,
        status: accountRow.status,
      };

      const { data: businessRow } = await supabase
        .from("business")
        .select("id, tenant_id")
        .eq("tenant_id", accountRow.tenant_id)
        .maybeSingle();

      if (businessRow) {
        business = {
          ok: true,
          id: businessRow.id,
          tenantId: businessRow.tenant_id,
        };
      }
    }
  }

  const verdict =
    auth.ok &&
    account.ok &&
    business.ok &&
    account.tenantId === business.tenantId
      ? "OK"
      : "INCONSISTENT";

  return (
    <pre style={{ padding: 24, fontSize: 14 }}>
      {JSON.stringify(
        {
          auth,
          account,
          business,
          verdict,
        },
        null,
        2
      )}
    </pre>
  );
}
