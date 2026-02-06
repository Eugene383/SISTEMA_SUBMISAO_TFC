"use client"
import Link from "next/link";
import Image from "next/image";
import HeroCard from "./hero-card";
import { ArrowRight, BookOpen, UploadCloud } from "lucide-react";

export function Hero(){
  
  return(
    <section className="relative w-full max-w-7xl px-4 py-5 md:py-32 flex flex-col items-center justify-center text-center backdrop-blur-md">
      {/* Elemento de fundo para o efeito de desfoque */}
      <div className="absolute  inset-0 bg-primary/5 dark:bg-primary/10 backdrop-blur-2xl backdrop-brightness-50   rounded-3xl opacity-60 pointer-events-none z-0">
        <Image src="/image/hero.jpg" alt="Hero Image" className=" object-cover   rounded-3xl" fill  / >
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 max-w-4xl">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Sistema de Submissão de <span className="text-primary">TFCs</span>
        </h1>
        <p className="text-lg sm:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
          Simplifique o processo de entrega e avaliação dos seus Trabalhos de Fim de Curso. Uma plataforma eficiente e segura para estudantes e docentes.
        </p>

        {/* Chamadas para Ação (CTAs) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={"../estudante/submissao/"}
            className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-lg shadow-primary/30 dark:shadow-primary/50"
          >
            <UploadCloud className="h-5 w-5" />
            Submeter TFC Agora
          </Link>
          <Link
            href="/documentacao"
            className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-semibold rounded-full border border-current text-foreground/80 hover:bg-foreground/10 transition duration-300 dark:hover:bg-foreground/10"
          >
            <BookOpen className="h-5 w-5" />
            Ver Documentação
          </Link>
        </div>
      </div>

      {/* Cartões Glassmorphism - Exemplo de Efeito de Vidro */}
      <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
        <HeroCard 
          title="Fácil Submissão" 
          description="Faça o upload do seu trabalho em poucos passos, com validação automática."
        />
        <HeroCard 
          title="Acompanhamento" 
          description="Monitore o estado da sua submissão em tempo real, do envio à avaliação final."
        />
        <HeroCard 
          title="Feedback Rápido" 
          description="Receba notas e comentários detalhados dos professores diretamente na plataforma."
        />
      </div>

    </section>
  );
}
