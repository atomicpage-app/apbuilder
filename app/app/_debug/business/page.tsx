import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DebugBusinessPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <pre>Usuário não autenticado</pre>;
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("id, tenant_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    return (
      <pre>
        Usuário autenticado
        {"\n"}Account: NÃO EXISTE
      </pre>
    );
  }

  const { data: businessByTenant } = account.tenant_id
    ? await supabase
        .from("business")
        .select("id")
        .eq("tenant_id", account.tenant_id)
        .maybeSingle()
    : { data: null };

  const { data: businessByAccount } = await supabase
    .from("business")
    .select("id")
    .eq("account_id", account.id)
    .maybeSingle();

  return (
    <pre>
      Usuário autenticado
      {"\n"}Account ID: {account.id}
      {"\n"}Tenant ID: {account.tenant_id ?? "null"}
      {"\n"}Status: {account.status}
      {"\n\n"}Business por tenant_id:{" "}
      {businessByTenant ? "SIM" : "NÃO"}
      {"\n"}Business por account_id:{" "}
      {businessByAccount ? "SIM" : "NÃO"}
    </pre>
  );
}
