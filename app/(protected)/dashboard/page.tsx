'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, BarChart3, Calendar,
  PieChart as PieChartIcon, Eye, Download, MessageSquare, Send, X, ExternalLink, 
  FileCheck, AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'sonner';

interface TFC {
  id: string;
  titulo: string;
  autor: string;
  estado: 'Submetido' | 'Em Validação' | 'Aprovado' | 'Rejeitado';
  tipo: string;
  ano: number;
  resumo?: string;
  ficheiro_url?: string;
  coordenador?: string;
  justificativa?: string;
  created_at: string;
  area_investigacao?: {
    id: string;
    nome: string;
  };
  palavras_chave?: Array<{ palavra: string }>;
  validacoes?: Array<{
    id: string;
    decisao: string;
    comentario: string;
    created_at: string;
    coordenador_id: string;
  }>;
}

interface Comentario {
  id: string;
  texto: string;
  created_at: string;
  coordenador_id: string;
  coordenador_nome?: string;
}

export default function CoordenadorDashboard() {
  const supabase = createClient();
  const [tfcs, setTfcs] = useState<TFC[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [coordenadorName, setCoordenadorName] = useState('');
  const [coordenadorId, setCoordenadorId] = useState('');
  
  // Modal states
  const [selectedTFC, setSelectedTFC] = useState<TFC | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'comments' | 'history'>('details');
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Validation modal
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationType, setValidationType] = useState<'aprovar' | 'rejeitar' | 'justificar'>('aprovar');
  const [validationComment, setValidationComment] = useState('');

  useEffect(() => {
    fetchCoordenadorData();
    fetchDashboardData();
  }, []);

  const fetchCoordenadorData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCoordenadorId(user.id);
      setCoordenadorName(user.user_metadata?.full_name || user.email || 'Coordenador');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tfcs')
        .select(`
          *,
          area_investigacao:areas_investigacao!area_investigacao_id(id, nome),
          palavras_chave:tfc_palavras_chave(palavra_chave:palavras_chave(palavra)),
          validacoes(id, decisao, comentario, created_at, coordenador_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTfcs(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComentarios = async (tfcId: string) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .select('*')
        .eq('tfc_id', tfcId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComentarios(data || []);
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenModal = async (tfc: TFC) => {
    setSelectedTFC(tfc);
    setShowModal(true);
    setModalTab('details');
    await fetchComentarios(tfc.id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTFC(null);
    setComentarios([]);
    setNovoComentario('');
  };

  const handleAddComentario = async () => {
    if (!novoComentario.trim() || !selectedTFC) return;

    try {
      const { error } = await supabase
        .from('comentarios')
        .insert([{
          tfc_id: selectedTFC.id,
          coordenador_id: coordenadorId,
          texto: novoComentario,
          coordenador_nome: coordenadorName
        }]);

      if (error) throw error;

      // Notificar estudante
      await enviarNotificacao(selectedTFC.id, 'comentario', `Novo comentário adicionado ao seu TFC "${selectedTFC.titulo}"`);

      toast.success('Comentário adicionado!');
      setNovoComentario('');
      await fetchComentarios(selectedTFC.id);
    } catch (err) {
      toast.error('Erro ao adicionar comentário');
      console.error(err);
    }
  };

  const handleValidar = (tfc: TFC, tipo: 'aprovar' | 'rejeitar' | 'justificar') => {
    setSelectedTFC(tfc);
    setValidationType(tipo);
    setValidationComment('');
    setShowValidationModal(true);
  };

  const confirmarValidacao = async () => {
    if (!selectedTFC) return;

    const novoEstado = 
      validationType === 'aprovar' ? 'Aprovado' :
      validationType === 'rejeitar' ? 'Rejeitado' :
      'Em Validação';

    const comentarioObrigatorio = validationType !== 'aprovar' && !validationComment.trim();
    if (comentarioObrigatorio) {
      toast.error('Por favor, adicione um comentário para esta ação');
      return;
    }

    try {
      // Atualizar estado do TFC
      const { error: updateError } = await supabase
        .from('tfcs')
        .update({ estado: novoEstado })
        .eq('id', selectedTFC.id);

      if (updateError) throw updateError;

      // Registrar validação
      const { error: validationError } = await supabase
        .from('validacoes')
        .insert([{
          tfc_id: selectedTFC.id,
          coordenador_id: coordenadorId,
          acao: validationType,
          comentario: validationComment || null,
          coordenador: coordenadorName
        }]);

      if (validationError) throw validationError;

      // Enviar notificação ao estudante
      const mensagemNotificacao = 
        validationType === 'aprovar' ? `Seu TFC "${selectedTFC.titulo}" foi aprovado!` :
        validationType === 'rejeitar' ? `Seu TFC "${selectedTFC.titulo}" foi rejeitado. Motivo: ${validationComment}` :
        `Solicitada justificativa adicional para o TFC "${selectedTFC.titulo}". ${validationComment}`;

      await enviarNotificacao(selectedTFC.id, validationType, mensagemNotificacao);

      // Atualizar lista local
      setTfcs(tfcs.map(tfc => 
        tfc.id === selectedTFC.id ? { ...tfc, estado: novoEstado } : tfc
      ));

      toast.success(
        validationType === 'aprovar' ? 'TFC aprovado com sucesso!' :
        validationType === 'rejeitar' ? 'TFC rejeitado' :
        'Justificativa solicitada'
      );

      setShowValidationModal(false);
      setValidationComment('');
      handleCloseModal();
    } catch (err) {
      toast.error('Erro ao processar validação');
      console.error(err);
    }
  };

  const enviarNotificacao = async (tfcId: string, tipo: string, mensagem: string) => {
    try {
      await supabase
        .from('notificacoes')
        .insert([{
          tfc_id: tfcId,
          tipo,
          mensagem,
          lida: false
        }]);
    } catch (err) {
      console.error('Erro ao enviar notificação:', err);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  // Estatísticas
  const stats = {
    total: tfcs.length,
    submetidos: tfcs.filter(t => t.estado === 'Submetido').length,
    validacao: tfcs.filter(t => t.estado === 'Em Validação').length,
    aprovados: tfcs.filter(t => t.estado === 'Aprovado').length,
    rejeitados: tfcs.filter(t => t.estado === 'Rejeitado').length,
  };

  const estadoData = [
    { name: 'Submetido', value: stats.submetidos, color: '#3b82f6' },
    { name: 'Em Validação', value: stats.validacao, color: '#f59e0b' },
    { name: 'Aprovado', value: stats.aprovados, color: '#10b981' },
    { name: 'Rejeitado', value: stats.rejeitados, color: '#ef4444' },
  ];

  const areaData = Object.entries(
    tfcs.reduce((acc, tfc) => {
      const area = tfc.area_investigacao?.nome || 'Sem área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([area, count]) => ({ area, count }));

  const trendData = Object.entries(
    tfcs.reduce((acc, tfc) => {
      acc[tfc.ano] = (acc[tfc.ano] || 0) + 1;
      return acc;
    }, {} as Record<number, number>)
  ).map(([ano, total]) => ({ ano, total })).sort((a, b) => Number(a.ano) - Number(b.ano));

  const getEstadoBadge = (estado: string) => {
    const styles = {
      'Submetido': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'Em Validação': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      'Aprovado': 'bg-green-500/10 text-green-700 border-green-200',
      'Rejeitado': 'bg-red-500/10 text-red-700 border-red-200',
    };
    return styles[estado as keyof typeof styles] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground font-medium">A carregar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Dashboard do Coordenador</h1>
          <p className="text-muted-foreground text-lg italic">Gestão centralizada de TFCs</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-slate-500">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-muted-foreground"/>
              <TrendingUp className="h-4 w-4 text-green-500"/>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-muted-foreground text-xs font-semibold uppercase">Total</div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2 text-blue-500">
              <Clock className="h-5 w-5"/>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.submetidos}</div>
            <div className="text-muted-foreground text-xs font-semibold uppercase">Submetidos</div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2 text-yellow-500">
              <AlertCircle className="h-5 w-5"/>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.validacao}</div>
            <div className="text-muted-foreground text-xs font-semibold uppercase">Em Análise</div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2 text-green-500">
              <CheckCircle className="h-5 w-5"/>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
            <div className="text-muted-foreground text-xs font-semibold uppercase">Aprovados</div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2 text-red-500">
              <XCircle className="h-5 w-5"/>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.rejeitados}</div>
            <div className="text-muted-foreground text-xs font-semibold uppercase">Rejeitados</div>
          </div>
        </div>

        <div className="bg-card rounded-xl border-2 shadow-sm p-6">
          <div className="flex space-x-2 mb-8 bg-muted/50 p-1 rounded-lg w-fit border">
            <button 
              onClick={() => setSelectedTab('overview')} 
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                selectedTab === 'overview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Visão Geral
            </button>
            <button 
              onClick={() => setSelectedTab('list')} 
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                selectedTab === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Lista de Trabalhos
            </button>
            <button 
              onClick={() => setSelectedTab('pending')} 
              className={`px-4 py-2 rounded-md text-sm font-medium transition relative ${
                selectedTab === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Pendentes
              {stats.submetidos > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.submetidos}
                </span>
              )}
            </button>
          </div>

          {selectedTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                  <PieChartIcon className="h-5 w-5 text-primary"/> Status Atual
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={estadoData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {estadoData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                  <BarChart3 className="h-5 w-5 text-primary"/> Áreas Temáticas
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={areaData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="area" hide />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Calendar className="h-5 w-5 text-primary"/> Evolução Anual
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="ano" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : selectedTab === 'pending' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">TFCs Pendentes de Validação</h3>
              {tfcs.filter(t => t.estado === 'Submetido').length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum TFC pendente de validação</p>
                </div>
              ) : (
                tfcs.filter(t => t.estado === 'Submetido').map((tfc) => (
                  <div key={tfc.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{tfc.titulo}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Autor:</strong> {tfc.autor}</p>
                          <p><strong>Área:</strong> {tfc.area_investigacao?.nome || 'Não especificada'}</p>
                          <p><strong>Ano:</strong> {tfc.ano}</p>
                          {tfc.coordenador && <p><strong>Orientador:</strong> {tfc.coordenador}</p>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoBadge(tfc.estado)}`}>
                        {tfc.estado.toUpperCase()}
                      </span>
                    </div>
                    
                    {tfc.resumo && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{tfc.resumo}</p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleOpenModal(tfc)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() => handleValidar(tfc, 'aprovar')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleValidar(tfc, 'justificar')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Solicitar Justificativa
                      </button>
                      <button
                        onClick={() => handleValidar(tfc, 'rejeitar')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-muted-foreground text-sm">
                    <th className="pb-4">Trabalho / Autor</th>
                    <th className="pb-4">Área</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tfcs.map((tfc) => (
                    <tr key={tfc.id} className="group hover:bg-muted/40 transition-colors">
                      <td className="py-4">
                        <p className="font-semibold text-sm">{tfc.titulo}</p>
                        <p className="text-xs text-muted-foreground">{tfc.autor} • {tfc.ano}</p>
                      </td>
                      <td className="py-4">
                        <span className="text-sm">{tfc.area_investigacao?.nome || 'N/A'}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getEstadoBadge(tfc.estado)}`}>
                          {tfc.estado.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(tfc)}
                            className="p-1.5 hover:bg-primary/10 text-primary rounded-md transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-5 w-5"/>
                          </button>
                          {tfc.estado === 'Submetido' && (
                            <>
                              <button
                                onClick={() => handleValidar(tfc, 'aprovar')}
                                className="p-1.5 hover:bg-green-500/10 text-green-600 rounded-md transition-colors"
                                title="Aprovar"
                              >
                                <CheckCircle className="h-5 w-5"/>
                              </button>
                              <button
                                onClick={() => handleValidar(tfc, 'rejeitar')}
                                className="p-1.5 hover:bg-red-500/10 text-red-600 rounded-md transition-colors"
                                title="Rejeitar"
                              >
                                <XCircle className="h-5 w-5"/>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do TFC */}
      {showModal && selectedTFC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Detalhes do TFC</h2>
              <button onClick={handleCloseModal} className="hover:bg-muted rounded-full p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setModalTab('details')}
                className={`px-6 py-3 font-medium transition ${
                  modalTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
              >
                <Info className="h-4 w-4 inline mr-2" />
                Informações
              </button>
              <button
                onClick={() => setModalTab('comments')}
                className={`px-6 py-3 font-medium transition ${
                  modalTab === 'comments' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Comentários ({comentarios.length})
              </button>
              <button
                onClick={() => setModalTab('history')}
                className={`px-6 py-3 font-medium transition ${
                  modalTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Histórico
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {modalTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedTFC.titulo}</h3>
                    <div className="flex gap-2 items-center mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoBadge(selectedTFC.estado)}`}>
                        {selectedTFC.estado.toUpperCase()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Submetido em {new Date(selectedTFC.created_at).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Autor</p>
                      <p className="font-medium">{selectedTFC.autor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                      <p className="font-medium">{selectedTFC.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ano</p>
                      <p className="font-medium">{selectedTFC.ano}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Área de Investigação</p>
                      <p className="font-medium">{selectedTFC.area_investigacao?.nome || 'Não especificada'}</p>
                    </div>
                    {selectedTFC.coordenador && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Orientador</p>
                        <p className="font-medium">{selectedTFC.coordenador}</p>
                      </div>
                    )}
                  </div>

                  {selectedTFC.palavras_chave && selectedTFC.palavras_chave.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Palavras-chave</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTFC.palavras_chave.map((pk, idx) => (
                          <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            {pk.palavra}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTFC.resumo && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Resumo</p>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm leading-relaxed">{selectedTFC.resumo}</p>
                      </div>
                    </div>
                  )}

                  {selectedTFC.justificativa && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Justificativa</p>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm leading-relaxed">{selectedTFC.justificativa}</p>
                      </div>
                    </div>
                  )}

                  {selectedTFC.ficheiro_url && (
                    <div>
                      <button
                        onClick={() => handleDownload(selectedTFC.ficheiro_url!)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Documento Completo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'comments' && (
                <div className="space-y-4">
                  <div className="space-y-3 mb-6">
                    {loadingComments ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                        <p className="text-sm">Carregando comentários...</p>
                      </div>
                    ) : comentarios.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum comentário ainda</p>
                      </div>
                    ) : (
                      comentarios.map((comentario) => (
                        <div key={comentario.id} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">{comentario.coordenador_nome || 'Coordenador'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comentario.created_at).toLocaleString('pt-PT')}
                            </p>
                          </div>
                          <p className="text-sm">{comentario.texto}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Adicionar Comentário</p>
                    <div className="flex gap-2">
                      <textarea
                        value={novoComentario}
                        onChange={(e) => setNovoComentario(e.target.value)}
                        placeholder="Digite seu comentário ou feedback..."
                        className="flex-1 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:outline-none"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleAddComentario}
                      disabled={!novoComentario.trim()}
                      className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      Enviar Comentário
                    </button>
                  </div>
                </div>
              )}

              {modalTab === 'history' && (
                <div className="space-y-4">
                  {selectedTFC.validacoes && selectedTFC.validacoes.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTFC.validacoes.map((validacao) => (
                        <div key={validacao.id} className="p-4 border-l-4 border-primary bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              validacao.decisao === 'Aprovado' ? 'bg-green-500/10 text-green-700' :
                              validacao.decisao === 'Rejeitado' ? 'bg-red-500/10 text-red-700' :
                              'bg-yellow-500/10 text-yellow-700'
                            }`}>
                              {validacao.decisao}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {new Date(validacao.created_at).toLocaleString('pt-PT')}
                            </p>
                          </div>
                          {validacao.comentario && (
                            <p className="text-sm mt-2">{validacao.comentario}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma ação registrada ainda</p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-500/10 border border-blue-200 rounded-lg">
                    <p className="text-sm"><strong>Data de submissão:</strong> {new Date(selectedTFC.created_at).toLocaleString('pt-PT')}</p>
                  </div>
                </div>
              )}
            </div>

            {modalTab === 'details' && selectedTFC.estado === 'Submetido' && (
              <div className="border-t p-6">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleValidar(selectedTFC, 'aprovar')}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleValidar(selectedTFC, 'justificar')}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Solicitar Justificativa
                  </button>
                  <button
                    onClick={() => handleValidar(selectedTFC, 'rejeitar')}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Validação */}
      {showValidationModal && selectedTFC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {validationType === 'aprovar' ? 'Aprovar TFC' :
               validationType === 'rejeitar' ? 'Rejeitar TFC' :
               'Solicitar Justificativa'}
            </h3>

            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="font-medium text-sm mb-1">{selectedTFC.titulo}</p>
              <p className="text-xs text-muted-foreground">{selectedTFC.autor}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {validationType === 'aprovar' ? 'Comentário (opcional)' : 'Motivo/Feedback *'}
              </label>
              <textarea
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                placeholder={
                  validationType === 'aprovar' ? 'Adicione um comentário positivo...' :
                  validationType === 'rejeitar' ? 'Explique os motivos da rejeição...' :
                  'Explique quais justificativas adicionais são necessárias...'
                }
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:outline-none"
                rows={4}
                required={validationType !== 'aprovar'}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarValidacao}
                className={`px-4 py-2 rounded-md text-white transition-colors ${
                  validationType === 'aprovar' ? 'bg-green-600 hover:bg-green-700' :
                  validationType === 'rejeitar' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}