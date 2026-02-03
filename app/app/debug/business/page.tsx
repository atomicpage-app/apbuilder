import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DebugBusinessPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let account: any = null;
  let business: any = null;
  const errors: string[] = [];

  if (userError) {
    errors.push(`auth.getUser error: ${userError.message}`);
  }

  if (user) {
    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("id, tenant_id, status, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountError) {
      errors.push(`accounts query error: ${accountError.message}`);
    }

    account = accountData ?? null;

    if (account?.tenant_id) {
      const { data: businessData, error: businessError } = await supabase
        .from("business")
        .select("id, status, name, created_at")
        .eq("tenant_id", account.tenant_id)
        .maybeSingle();

      if (businessError) {
        errors.push(`business query error: ${businessError.message}`);
      }

      business = businessData ?? null;
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        color: "#0f172a", // slate-900
        padding: "24px",
        fontFamily: "monospace",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>
        Debug — Business State
      </h1>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontWeight: 600, marginBottom: "8px" }}>
          Auth User
        </h2>
        <pre
          style={{
            backgroundColor: "#f1f5f9",
            color: "#020617",
            padding: "16px",
            borderRadius: "6px",
            overflowX: "auto",
          }}
        >
{JSON.stringify(
  {
    exists: Boolean(user),
    id: user?.id ?? null,
    email: user?.email ?? null,
    email_confirmed_at: user?.email_confirmed_at ?? null,
  },
  null,
  2
)}
        </pre>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontWeight: 600, marginBottom: "8px" }}>
          Account
        </h2>
        <pre
          style={{
            backgroundColor: "#f1f5f9",
            color: "#020617",
            padding: "16px",
            borderRadius: "6px",
            overflowX: "auto",
          }}
        >
{JSON.stringify(account, null, 2)}
        </pre>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontWeight: 600, marginBottom: "8px" }}>
          Business
        </h2>
        <pre
          style={{
            backgroundColor: "#f1f5f9",
            color: "#020617",
            padding: "16px",
            borderRadius: "6px",
            overflowX: "auto",
          }}
        >
{JSON.stringify(business, null, 2)}
        </pre>
      </section>

      {errors.length > 0 && (
        <section>
          <h2
            style={{
              fontWeight: 600,
              marginBottom: "8px",
              color: "#b91c1c",
            }}
          >
            Errors
          </h2>
          <pre
            style={{
              backgroundColor: "#fee2e2",
              color: "#7f1d1d",
              padding: "16px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
{JSON.stringify(errors, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
