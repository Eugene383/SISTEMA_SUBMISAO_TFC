
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  Calendar,
  User,
  BookOpen,
  CornerDownRight,
  TrendingUp,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Btn } from '@/components/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';


interface TFC {
  id: string;
  titulo: string;
  autor: string;
  estado: 'Submetido' | 'Em Validação' | 'Aprovado' | 'Rejeitado';
  tipo: string;
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
}

export default function EstudanteDashboard() {
  const supabase = createClient();
  const [tfcs, setTfcs] = useState<TFC[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    fetchUserData();
    fetchTFCs();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || 'Estudante');
      }
    } catch (error) {
      setUserName('Estudante');
    }
  };

  const fetchTFCs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
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
          ficheiro_url,
          ficheiro_nome,
          created_at,
          area_investigacao:areas_investigacao!area_investigacao_id(
            id,
            nome
          ),
          palavras_chave:tfc_palavras_chave(
            palavra_chave:palavras_chave!palavra_chave_id(
              id,
              palavra
            )
          )
        `)
        .eq('estudante_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTfcs(data || []);
    } catch (error) {
      toast.error('Erro ao buscar TFCs:');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoConfig = (estado: string) => {
    const configs = {
      'Submetido': {
        icon: Clock,
        variant: 'secondary' as const,
        label: 'Submetido'
      },
      'Em Validação': {
        icon: AlertCircle,
        variant: 'default' as const,
        label: 'Em Validação'
      },
      'Aprovado': {
        icon: CheckCircle,
        variant: 'default' as const,
        label: 'Aprovado',
        className: 'bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400'
      },
      'Rejeitado': {
        icon: XCircle,
        variant: 'destructive' as const,
        label: 'Rejeitado'
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

  const stats = {
    total: tfcs.length,
    submetidos: tfcs.filter(t => t.estado === 'Submetido').length,
    validacao: tfcs.filter(t => t.estado === 'Em Validação').length,
    aprovados: tfcs.filter(t => t.estado === 'Aprovado').length,
    rejeitados: tfcs.filter(t => t.estado === 'Rejeitado').length,
  };

  const filteredTFCs = tfcs.filter(tfc => {
    const matchesSearch = tfc.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tfc.autor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'todos' || tfc.estado === activeTab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">A carregar o seu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-5xl font-bold tracking-tight  bg-clip-text text-transparent">
                Olá, {userName} 
              </h1>
              <p className="text-muted-foreground text-lg">
                Gerencie os seus Trabalhos Finais de Curso
              </p>
            </div>
            <Btn size="lg" className="shadow-lg" asChild>
              <Link href="/estudante/submissao">
                <Upload className="mr-2 h-5 w-5" />
                Novo TFC
              </Link>
            </Btn>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground font-medium">Total de TFCs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 dark:border-blue-900 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.submetidos}</p>
                  <p className="text-xs text-muted-foreground font-medium">Submetidos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 dark:border-yellow-900 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.validacao}</p>
                  <p className="text-xs text-muted-foreground font-medium">Em Validação</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 dark:border-green-900 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.aprovados}</p>
                  <p className="text-xs text-muted-foreground font-medium">Aprovados</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 dark:border-red-900 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejeitados}</p>
                  <p className="text-xs text-muted-foreground font-medium">Rejeitados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* TFCs Section */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Meus TFCs
                </CardTitle>
                <CardDescription>
                  Acompanhe o progresso dos seus trabalhos
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar TFCs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Btn variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Btn>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="Submetido">Submetidos</TabsTrigger>
                <TabsTrigger value="Em Validação">Em Validação</TabsTrigger>
                <TabsTrigger value="Aprovado">Aprovados</TabsTrigger>
                <TabsTrigger value="Rejeitado">Rejeitados</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6 space-y-4">
                {filteredTFCs.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <FileText className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {activeTab === 'todos' ? 'Nenhum TFC submetido ainda' : `Nenhum TFC ${activeTab.toLowerCase()}`}
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Comece agora submetendo o seu primeiro Trabalho Final de Curso
                      </p>
                      <Btn asChild>
                        <Link href="/estudante/submissao">
                          <Upload className="mr-2 h-4 w-4" />
                          Submeter TFC
                        </Link>
                      </Btn>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTFCs.map((tfc) => {
                    const estadoConfig = getEstadoConfig(tfc.estado);
                    const EstadoIcon = estadoConfig.icon;

                    return (
                      <Card key={tfc.id} className="hover:shadow-lg transition-all duration-300 border-2">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold mb-2 leading-tight">
                                    {tfc.titulo}
                                  </h3>
                                  <Badge 
                                    variant={estadoConfig.variant}
                                    className={estadoConfig.className}
                                  >
                                    <EstadoIcon className="mr-1 h-3 w-3" />
                                    {estadoConfig.label}
                                  </Badge>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Btn variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Btn>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      <Link href={`./estudante/detalhes/${tfc.id}`}>Ver Detalhes</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <a href={tfc.ficheiro_url} target="_blank" rel="noopener noreferrer">
                                       <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </a>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <User className="h-4 w-4" />
                                  {tfc.autor}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(tfc.created_at)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <BookOpen className="h-4 w-4" />
                                  {tfc.tipo}
                                </span>
                              </div>

                              {tfc.area_investigacao && (
                                <div>
                                  <Badge variant="outline" className="font-normal">
                                    <CornerDownRight className="mr-1 h-3 w-3" />
                                    {tfc.area_investigacao.nome}
                                  </Badge>
                                </div>
                              )}

                              {tfc.palavras_chave && tfc.palavras_chave.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {tfc.palavras_chave
                                    .filter(pc => pc.palavra_chave?.palavra)
                                    .slice(0, 5)
                                    .map((pc, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="font-normal text-xs"
                                      >
                                        {pc.palavra_chave.palavra}
                                      </Badge>
                                    ))}
                                  {tfc.palavras_chave.length > 5 && (
                                    <Badge variant="secondary" className="font-normal text-xs">
                                      +{tfc.palavras_chave.length - 5}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-6 pt-4 border-t">
                            <Btn variant="default" size="sm" asChild>
                              <a href={tfc.ficheiro_url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> 
                              </a>
                            </Btn>
                            <Btn variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              <Link href={`./estudante/detalhes/${tfc.id}`}>Ver Detalhes</Link>
                            </Btn>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}