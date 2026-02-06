"use client"
import Link from "next/link";
import Logo from "./logo";
import { useEffect, useState } from "react";


export  function Footer() {
 
  return (
   
    <footer className="w-full mt-20 px-4">
        <div 
             className="w-full max-w-7xl mx-auto py-10 md:py-16 rounded-t-3xl 
                   border-t border-x border-foreground/20 dark:border-foreground/10
                   bg-background/80 backdrop-blur-md dark:bg-background/60"
        >
            <div className="flex flex-col md:flex-row justify-between items-center  px-6">

              {/* Coluna 1: Logo e Marca */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <Link href="/" className="text-xl flex justify-center items-center font-bold text-primary hover:text-primary/80 transition-colors">
					            <Logo width={100} height={100} />
            	  		  Plataforma TFC
            	  	  </Link>
                    <p className="mt-2 text-sm text-foreground/70 max-w-xs">
                      Sua solução moderna para gestão de Trabalhos de Fim de Curso.
                    </p>
                </div>
           
                <div className="text-sm text-foreground/80 font-medium">
                    <div className="flex items-start flex-col gap-3">
                        <span className="font-semibold text-foreground mb-1">Páginas</span>
                        {/*
                          email=="eugenioadaoteca@gmail.com" ?(
                            
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                        
                          ):(
                            <Link href="/estudante" className="hover:text-primary transition-colors">Estudante</Link>
                          )
                        */}
                        
                    </div>
                </div>
            </div>

           
            <div className="w-full h-px bg-foreground/10 my-2"></div>

            <div className="text-center text-xs text-foreground/60 px-5 py-5">
                <p>
                  &copy;2025  Plataforma TFC. Todos os direitos reservados.
                </p>
                <p className="mt-1">
                  Desenvolvido pelos alunos 4º Ano de engenharia informatica da Unikiv .
                </p>
            </div>
        </div>
    </footer>
  );
}

