// src/app/estudante/detalhes/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User,
  BookOpen,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Btn } from '@/components/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TFCDetalhes {
  id: string;
  titulo: string;
  autor: string;
  estado: 'Submetido' | 'Em Validação' | 'Aprovado' | 'Rejeitado';
  tipo: string;
  resumo?: string;
  ficheiro_url: string;
  ficheiro_nome: string;
  created_at: string;
  area_investigacao?: {
    nome: string;
  };
  palavras_chave?: Array<{
    palavra_chave: {
      palavra: string;
    };
  }>;
  orientador?: string;
  ano_academico?: string;
}

export default function DetalheTFCPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [tfc, setTfc] = useState<TFCDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTFCDetails();
    }
  }, [params.id]);

  const fetchTFCDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('tfcs')
        .select(`
          id,
          titulo,
          autor,
          estado,
          tipo,
          resumo,
          ficheiro_url,
          ficheiro_nome,
          created_at,
          coordenador,
          ano,
          area_investigacao:areas_investigacao!area_investigacao_id(
            nome
          ),
          palavras_chave:tfc_palavras_chave(
            palavra_chave:palavras_chave!palavra_chave_id(
              palavra
            )
          )
        `)
        .eq('id', params.id)
        .eq('estudante_id', user.id)
        .single();

      if (error) throw error;

      setTfc(data);
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do TFC:', error);
      setError('Erro ao carregar detalhes do TFC.');
    } finally {
      setLoading(false);
    }
  };

  const openFile = async () => {
    if (!tfc?.ficheiro_url) return;

    setFileLoading(true);
    try {
      // Abre o ficheiro numa nova aba
      window.open(tfc.ficheiro_url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir ficheiro:', error);
      alert('Erro ao abrir o ficheiro. Tente fazer download.');
    } finally {
      setFileLoading(false);
    }
  };

  const downloadFile = async () => {
    if (!tfc?.ficheiro_url) return;

    try {
      const response = await fetch(tfc.ficheiro_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tfc.ficheiro_nome || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar ficheiro:', error);
      alert('Erro ao fazer download do ficheiro.');
    }
  };

  const getEstadoConfig = (estado: string) => {
    const configs = {
      'Submetido': {
        icon: Clock,
        variant: 'secondary' as const,
        label: 'Submetido',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      },
      'Em Validação': {
        icon: AlertCircle,
        variant: 'default' as const,
        label: 'Em Validação',
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      },
      'Aprovado': {
        icon: CheckCircle,
        variant: 'default' as const,
        label: 'Aprovado',
        className: 'bg-green-500/10 text-green-700 dark:text-green-400'
      },
      'Rejeitado': {
        icon: XCircle,
        variant: 'destructive' as const,
        label: 'Rejeitado',
        className: 'bg-red-500/10 text-red-700 dark:text-red-400'
      }
    };
    return configs[estado as keyof typeof configs] || configs['Submetido'];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">A carregar detalhes...</p>
        </div>
      </div>
    );
  }

  if (error || !tfc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold">Erro ao carregar TFC</h3>
            <p className="text-muted-foreground">{error}</p>
            <Btn asChild>
              <Link href="/estudante">Voltar ao Dashboard</Link>
            </Btn>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estadoConfig = getEstadoConfig(tfc.estado);
  const EstadoIcon = estadoConfig.icon;

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Btn variant="ghost" asChild className="mb-4">
            <Link href="/estudante">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Btn>
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <CardTitle className="text-3xl leading-tight">
                  {tfc.titulo}
                </CardTitle>
                <CardDescription className="text-base">
                  Detalhes completos do Trabalho Final de Curso
                </CardDescription>
              </div>
              <Badge 
                variant={estadoConfig.variant}
                className={`${estadoConfig.className} text-base px-4 py-2`}
              >
                <EstadoIcon className="mr-2 h-4 w-4" />
                {estadoConfig.label}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Btn 
                onClick={openFile} 
                disabled={fileLoading}
                size="lg"
                className="flex-1"
              >
                {fileLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-5 w-5" />
                )}
                Abrir Ficheiro
              </Btn>
              <Btn
                onClick={downloadFile}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Download className="mr-2 h-5 w-5" />
                Download
              </Btn>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />

            {/* Informações Principais */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <User className="h-4 w-4" />
                    Autor
                  </div>
                  <p className="text-lg font-semibold">{tfc.autor}</p>
                </div>

                {tfc.orientador && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <User className="h-4 w-4" />
                      Orientador
                    </div>
                    <p className="text-lg">{tfc.orientador}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <BookOpen className="h-4 w-4" />
                    Tipo de Trabalho
                  </div>
                  <p className="text-lg">{tfc.tipo}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Calendar className="h-4 w-4" />
                    Data de Submissão
                  </div>
                  <p className="text-lg">{formatDate(tfc.created_at)}</p>
                </div>

                {tfc.ano_academico && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <Calendar className="h-4 w-4" />
                      Ano Académico
                    </div>
                    <p className="text-lg">{tfc.ano_academico}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <FileText className="h-4 w-4" />
                    Ficheiro
                  </div>
                  <p className="text-lg break-all">{tfc.ficheiro_nome}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Área de Investigação */}
            {tfc.area_investigacao && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Área de Investigação
                </h3>
                <Badge variant="outline" className="text-base px-4 py-2">
                  {tfc.area_investigacao.nome}
                </Badge>
              </div>
            )}

            {/* Palavras-chave */}
            {tfc.palavras_chave && tfc.palavras_chave.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Palavras-chave
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tfc.palavras_chave
                      .filter(pc => pc.palavra_chave?.palavra)
                      .map((pc, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-sm px-3 py-1"
                        >
                          {pc.palavra_chave.palavra}
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Resumo */}
            {tfc.resumo && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resumo
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {tfc.resumo}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}