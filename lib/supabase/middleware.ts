// middleware.ts - Coloque na raiz do seu projeto Next.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificar sessão do usuário
  const { data: { user } } = await supabase.auth.getUser()

  // Rotas protegidas do admin
  if (request.nextUrl.pathname.startsWith('/dashbord')) {
    if (!user) {
      // Redirecionar para login se não estiver autenticado
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Verificar se é admin
    const { data: perfil } = await supabase
      .from('perfis_usuario')
      .select('nivel_acesso')
      .eq('id', user.id)
      .single()

    if (!perfil || perfil.nivel_acesso !== 'admin') {
      // Redirecionar para página principal se não for admin
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Rotas de autenticação - redirecionar se já estiver logado
  if (request.nextUrl.pathname.startsWith('/auth/login') || 
      request.nextUrl.pathname.startsWith('/auth/sign-up')) {
    if (user) {
      // Buscar perfil para redirecionar corretamente
      const { data: perfil } = await supabase
        .from('perfis_usuario')
        .select('nivel_acesso')
        .eq('id', user.id)
        .single()

      if (perfil?.nivel_acesso === 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/estudante', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}