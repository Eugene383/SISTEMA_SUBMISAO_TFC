

import { Suspense} from "react";
import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning"; 
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";     
import Logo from "./logo";
import { Button } from "./ui/button";

export function NavBar() {
  

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background">
      <div className="w-full max-w-[1200px] flex justify-between items-center px-4 gap-14 text-sm">
        <div className="flex gap-6 justify-between items-center font-semibold">
          <Link href="/" className="text-xl flex justify-center items-center font-bold text-primary hover:text-primary/80 transition-colors">
            <Logo width={40} height={40} />
            <span className="ml-2">Plataforma TFC</span>
          </Link>
          
          <div className="flex gap-5 items-center">
            <Button size="lg" variant="ghost">
              <Link href="/estudante">Estudante</Link>
            </Button>
            <Button size="lg" variant="ghost">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="flex gap-5 items-center">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense fallback={<div className="h-8 w-20 animate-pulse bg-muted rounded-md" />}>
              <AuthButton />
            </Suspense>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}