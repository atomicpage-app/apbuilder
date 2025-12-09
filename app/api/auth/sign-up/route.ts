// app/api/auth/sign-up/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// SITE_URL sempre string, nunca undefined
const SITE_URL: string = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

function createAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function createAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

type SignUpPayload = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SignUpPayload;

  // Normalização garantindo sempre string
  const rawName: string = body.name ?? '';
  const rawEmail: string = body.email ?? '';
  const rawPhone: string = body.phone ?? '';
  const rawPassword: string = body.password ?? '';

  const name: string = rawName.trim();
  const email: string = rawEmail.toLowerCase().trim();
  const phone: string = rawPhone.trim();
  const password: string = rawPassword;

  const errors: string[] = [];

  if (!name) {
    errors.push('Nome é obrigatório.');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('E-mail inválido.');
  }

  if (!password || password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres.');
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, errors },
      { status: 400 }
    );
  }

  const supabaseAnon = createAnonClient();

  try {
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return NextResponse.json(
        {
          ok: false,
          errors: ['Não foi possível criar a conta. Verifique os dados ou tente novamente mais tarde.']
        },
        { status: 400 }
      );
    }

    const user = signUpData.user;

    if (!user?.id) {
      console.error('Sign up succeeded but returned no user id');
      return NextResponse.json(
        { ok: false, errors: ['Erro interno ao criar a conta.'] },
        { status: 500 }
      );
    }

    const userId: string = user.id;

    const supabaseAdmin = createAdminClient();

    const { error: accountError } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: userId,
        email,
        name,
        phone,
        status: 'pending_email_verification'
      });

    if (accountError) {
      console.error('Error inserting account row:', accountError);
      // rollback auth user para evitar usuário órfão
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { ok: false, errors: ['Erro ao salvar os dados da conta. Tente novamente.'] },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error on sign-up:', error);
    return NextResponse.json(
      { ok: false, errors: ['Erro inesperado ao criar a conta. Tente novamente mais tarde.'] },
      { status: 500 }
    );
  }
}
