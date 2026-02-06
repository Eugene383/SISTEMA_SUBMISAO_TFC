"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./logo";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Validações
    if (password !== repeatPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      console.log('📝 Criando nova conta...');
      
      // Criar usuário no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome || email.split('@')[0], // Passar nome nos metadados
          },
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (signUpError) {
        console.error('❌ Erro ao criar conta:', signUpError);
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('Erro ao criar usuário');
      }

      console.log('✅ Conta criada com sucesso!');
      console.log('📧 Usuário criado:', data.user.id);
      
      // O trigger no banco de dados criará automaticamente o perfil
      // Aguardar um momento para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar se o perfil foi criado
      const { data: perfil, error: perfilError } = await (supabase
        .from('perfis_usuario' as any)
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle() as unknown) as { data: { id: string } | null; error: any };

      if (!perfil && !perfilError) {
        console.log('⚠️ Perfil não foi criado pelo trigger, criando manualmente...');
        
        // Criar perfil manualmente se o trigger falhou
        const { error: insertError } = await supabase
          .from('perfis_usuario' as any)
          .insert({
            id: data.user.id,
            nome: nome || email.split('@')[0],
            nivel_acesso: 'usuario',
            ativo: true
          });

        if (insertError) {
          console.error('❌ Erro ao criar perfil:', insertError);
        } else {
          console.log('✅ Perfil criado manualmente');
        }
      }

      // Redirecionar para login
      router.push('/auth/login');
      
    } catch (error: unknown) {
      console.error('❌ Erro no cadastro:', error);
      
      if (error instanceof Error) {
        // Traduzir mensagens comuns de erro
        if (error.message.includes('User already registered')) {
          setError('Este email já está cadastrado');
        } else if (error.message.includes('Password should be at least')) {
          setError('A senha deve ter pelo menos 6 caracteres');
        } else if (error.message.includes('Invalid email')) {
          setError('Email inválido');
        } else {
          setError(error.message);
        }
      } else {
        setError("Ocorreu um erro ao criar a conta");
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
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Crie uma conta nova</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
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
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repita a Senha</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                />
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Já tens uma conta?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Fazer Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}