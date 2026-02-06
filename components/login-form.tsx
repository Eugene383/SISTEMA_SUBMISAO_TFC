"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./logo";
import { Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Iniciando login...');
      
      // 1. Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erro ao autenticar usuário');
      }

      console.log('✅ Autenticação bem-sucedida, ID:', authData.user.id);

      // 2. Buscar o perfil do usuário
      console.log('🔍 Buscando perfil do usuário...');
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('nivel_acesso, ativo')
        .eq('id', authData.user.id)
        .maybeSingle(); // Usar maybeSingle() em vez de single()

      console.log('📊 Resultado da busca de perfil:', { perfil, perfilError });

      // 3. Se não encontrou perfil, criar um
      if (!perfil) {
        console.log('⚠️ Perfil não encontrado, criando novo perfil...');
        
        const { data: novoPerfil, error: createError } = await supabase
          .from('perfil_usuario')
          .insert({
            id: authData.user.id,
            nome: authData.user.email?.split('@')[0] || 'Usuário',
            nivel_acesso: 'usuario',
            ativo: true
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar perfil:', createError);
          console.error('Detalhes do erro:', {
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code
          });
          
          // Fazer logout se não conseguiu criar perfil
          await supabase.auth.signOut();
          
          throw new Error(`Erro ao criar perfil: ${createError.message}`);
        }

        console.log('✅ Perfil criado com sucesso:', novoPerfil);
        
        // Redirecionar novo usuário para página principal
        router.push('/');
        return;
      }

      // 4. Verificar se a conta está ativa
      if (!perfil.ativo) {
        console.warn('⚠️ Conta inativa');
        await supabase.auth.signOut();
        throw new Error('Sua conta está inativa. Entre em contato com o administrador.');
      }

      // 5. Redirecionar baseado no nível de acesso
      console.log('✅ Login bem-sucedido! Nível:', perfil.nivel_acesso);
      
      if (perfil.nivel_acesso === 'admin') {
        console.log('🔑 Redirecionando para dashboard admin...');
        router.push('/dashboard');
      } else {
        console.log('👤 Redirecionando para página principal...');
        router.push('/');
      }
      
    } catch (error: unknown) {
      console.error('❌ Erro no login:', error);
      
      if (error instanceof Error) {
        // Traduzir mensagens comuns de erro
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login');
        } else {
          setError(error.message);
        }
      } else {
        setError("Ocorreu um erro ao fazer login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="flex justify-center items-center flex-col">
          <Logo width={200} height={200} />
          <CardTitle className="text-2xl">Faça login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceste a palavra passe?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Não tens uma conta?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Criar conta
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}