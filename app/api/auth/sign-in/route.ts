// app/api/auth/sign-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type SignInPayload = {
  email?: string;
  password?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SignInPayload;

  const rawEmail: string = body.email ?? '';
  const rawPassword: string = body.password ?? '';

  const email = rawEmail.toLowerCase().trim();
  const password = rawPassword;

  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push('E-mail inválido.');
  }

  if (!password) {
    errors.push('Senha é obrigatória.');
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, errors },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Sign in error:', error);
    const message =
      error.message === 'Email not confirmed'
        ? 'E-mail ainda não foi confirmado. Verifique sua caixa de entrada.'
        : 'Não foi possível entrar. Verifique suas credenciais.';

    return NextResponse.json(
      { ok: false, errors: [message] },
      { status: 401 }
    );
  }

  const user = data.user;

  if (!user?.id) {
    console.error('Sign in succeeded but returned no user id');
    return NextResponse.json(
      { ok: false, errors: ['Erro interno ao autenticar.'] },
      { status: 500 }
    );
  }

  try {
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ status: 'active' })
      .eq('user_id', user.id)
      .eq('status', 'pending_email_verification');

    if (updateError) {
      console.error('Error updating account status:', updateError);
      // não falha o login por causa disso
    }
  } catch (updateException) {
    console.error('Unexpected error updating account status:', updateException);
  }

  return NextResponse.json(
    {
      ok: true,
      message: 'Login realizado com sucesso.'
    },
    { status: 200 }
  );
}