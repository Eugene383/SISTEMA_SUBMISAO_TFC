'use client';

import { UploadCloud, FileText, Trello, Search, Key, ShieldCheck, CornerDownLeft, BookOpen, FileType } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

import { Btn } from '@/components/button';

import { useRouter } from "next/navigation";
import { toast } from 'sonner';

interface AreaInvestigacao {
  id: string;
  nome: string;
}

export default function SubmissionPage() {
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    tipo: 'Licenciatura' as 'Licenciatura' | 'Mestre' | 'Doutoramento',
    areaInvestigacao: '',
    coordenador: '',
    justificativa: '',
    resumo: '',
  });
  
  const [palavrasChave, setPalavrasChave] = useState<string[]>([]);
  const [palavraInput, setPalavraInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [areas, setAreas] = useState<AreaInvestigacao[]>([]);
  
  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Fetch áreas de investigação
  useEffect(() => {
    fetchAreas();
    fetchUserData();
  }, []);

  const fetchAreas = async () => {
    const { data} = await supabase
      .from('areas_investigacao')
      .select('*')
      .order('nome');
    
    if (data) setAreas(data);
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        autor: user.user_metadata?.full_name || user.email || ''
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validar tamanho (50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('Ficheiro muito grande. Máximo: 50MB');
        return;
      }
      
      // Validar tipo
      if (!selectedFile.name.match(/\.(pdf|zip|docx)$/i)) {
        setError('Apenas ficheiros PDF, ZIP ou DOCX são permitidos');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const addPalavraChave = () => {
    const palavras = palavraInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0 && !palavrasChave.includes(p));
    
    if (palavras.length > 0) {
      setPalavrasChave([...palavrasChave, ...palavras]);
      setPalavraInput('');
    }
  };

  const removePalavraChave = (palavra: string) => {
    setPalavrasChave(palavrasChave.filter(p => p !== palavra));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validações
    if (!file) {
      setError('Por favor, selecione um ficheiro para submeter');
      return;
    }

    if (!formData.titulo || !formData.autor || !formData.areaInvestigacao) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload do ficheiro para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `tfcs/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tfcs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública do ficheiro
      const { data: { publicUrl } } = await supabase.storage
        .from('tfcs')
        .getPublicUrl(filePath);

      // 3. Obter user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado');

      // 4. Inserir TFC na base de dados
      const { data: tfcData, error: tfcError } = await supabase
        .from('tfcs')
        .insert([
          {
            titulo: formData.titulo,
            autor: formData.autor,
            tipo: formData.tipo,
            area_investigacao_id: formData.areaInvestigacao,
            coordenador: formData.coordenador || null,
            justificativa: formData.justificativa || null,
            resumo: formData.resumo || null,
            ficheiro_url: publicUrl,
            ficheiro_nome: file.name,
            estudante_id: user.id,
            estado: 'Submetido',
            ano: new Date().getFullYear()
          }
        ])
        .select()
        .single();

      if (tfcError) throw tfcError;

      // 5. Inserir palavras-chave
      if (palavrasChave.length > 0 && tfcData) {
        for (const palavra of palavrasChave) {
          // Verificar se palavra já existe
          let { data: palavraData, error: searchError } = await supabase
            .from('palavras_chave')
            .select('id')
            .eq('palavra', palavra)
            .maybeSingle();

          // Se não existe, criar
          if (!palavraData) {
            const { data: newPalavra, error: insertError } = await supabase
              .from('palavras_chave')
              .insert([{ palavra }])
              .select()
              .single();
            
            if (!insertError && newPalavra) {
              palavraData = newPalavra;
            }
          }

          // Associar ao TFC
          if (palavraData) {
            await supabase
              .from('tfc_palavras_chave')
              .insert([{ tfc_id: tfcData.id, palavra_chave_id: palavraData.id }]);
          }
        }
      }

      // Sucesso!
      setSuccess(true);
      
      // Resetar formulário após 2 segundos
      setTimeout(() => {
        setFormData({
          titulo: '',
          autor: formData.autor, // Manter autor
          tipo: 'Licenciatura',
          areaInvestigacao: '',
          coordenador: '',
          justificativa: '',
          resumo: '',
        });
        setPalavrasChave([]);
        setFile(null);
        setSuccess(false);
      }, 3000);

      toast.success('TFC submetido com sucesso!');

      router.push("/estudante/");

    } catch (err:any) {
      toast.error('Erro ao submeter TFC:', err);
      setError(err.message || 'Erro ao submeter TFC. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 md:py-20">
      
      {/* Cabeçalho */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-foreground mb-2 flex items-center justify-center gap-3">
          Submissão de TFC
        </h1>
        <p className="text-xl text-foreground/70">
          Preencha os campos e envie o seu TFC para validação.
        </p>
      </header>
      
      {/* Botão de Volta */}
      <Link href="/estudante" className="flex items-center gap-2 text-sm text-foreground/70 hover:text-primary mb-6">
        <CornerDownLeft className="h-4 w-4" />
        Voltar para a Área do Estudante
      </Link>

      {/* Mensagens de Feedback */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/50 text-green-500">
          <p className="font-medium">✓ TFC submetido com sucesso! Redirecionando...</p>
        </div>
      )}

      {/* Formulário Principal com Glassmorphism */}
      <form 
        onSubmit={handleSubmit} 
        className="p-6 md:p-10 rounded-2xl shadow-xl 
                   border border-foreground/10 dark:border-foreground/5
                   bg-background/90 backdrop-blur-xl dark:bg-background/70
                   space-y-6"
      >
        {/* Seção 1: Metadados Essenciais */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" /> Detalhes do Trabalho
          </h2>
          
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-foreground/80 mb-2">
              Título do TFC *
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Ex: Análise de Similaridade de Documentos usando IA"
              required
              className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background/50 
                         focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <div>
            <label htmlFor="autor" className="block text-sm font-medium text-foreground/80 mb-2">
              Autor (Seu Nome Completo) *
            </label>
            <input
              id="autor"
              name="autor"
              type="text"
              value={formData.autor}
              onChange={handleInputChange}
              placeholder="Ex: Nkanga Pedro"
              required
              readOnly
              className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background/30 
                         text-foreground/70 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-foreground/80 mb-2">
              Tipo de Trabalho *
            </label>
            <div className="relative">
              <FileType className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-foreground/20 bg-background/50 
                           focus:outline-none focus:ring-2 focus:ring-primary/50 transition appearance-none"
              >
                <option value="Licenciatura">Licenciatura</option>
                <option value="Mestre">Mestrado</option>
                <option value="Doutoramento">Doutoramento</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="resumo" className="block text-sm font-medium text-foreground/80 mb-2">
              Resumo (Opcional)
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-3 h-5 w-5 text-foreground/50" />
              <textarea
                id="resumo"
                name="resumo"
                value={formData.resumo}
                onChange={handleInputChange}
                placeholder="Breve descrição do seu trabalho (recomendado para pesquisas)"
                rows={4}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-foreground/20 bg-background/50 
                           focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
              />
            </div>
          </div>
        </section>

        {/* Seção 2: Validação e Classificação */}
        <section className="space-y-4 pt-6 border-t border-foreground/10">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Trello className="h-5 w-5" /> Classificação e Validação
          </h2>
          
          <div>
            <label htmlFor="areaInvestigacao" className="block text-sm font-medium text-foreground/80 mb-2">
              Área de Investigação *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <select
                id="areaInvestigacao"
                name="areaInvestigacao"
                value={formData.areaInvestigacao}
                onChange={handleInputChange}
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-foreground/20 bg-background/50 
                           focus:outline-none focus:ring-2 focus:ring-primary/50 transition appearance-none"
              >
                <option value="">Selecione uma área</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="palavras" className="block text-sm font-medium text-foreground/80 mb-2">
              Palavras-Chave
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <input
                  id="palavras"
                  type="text"
                  value={palavraInput}
                  onChange={(e) => setPalavraInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPalavraChave();
                    }
                  }}
                  placeholder="Separe por vírgulas (Ex: IA, Machine Learning)"
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-foreground/20 bg-background/50 
                             focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>
              <Btn
                type="button"
                onClick={addPalavraChave}
                className="px-6 py-3 rounded-lg bg-primary/20 text-primary font-medium
                           hover:bg-primary/30 transition"
              >
                Adicionar
              </Btn>
            </div>
            
            {palavrasChave.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {palavrasChave.map((palavra, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                               bg-primary/10 text-primary text-sm border border-primary/30"
                  >
                    {palavra}
                    <Btn
                      type="button"
                      onClick={() => removePalavraChave(palavra)}
                      className="hover:text-primary/70 font-bold"
                    >
                      ×
                    </Btn>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="coordenador" className="block text-sm font-medium text-foreground/80 mb-2">
              Orientador/Coordenador
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <input
                id="coordenador"
                name="coordenador"
                type="text"
                value={formData.coordenador}
                onChange={handleInputChange}
                placeholder="Nome do seu orientador principal"
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-foreground/20 bg-background/50 
                           focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="justificativa" className="block text-sm font-medium text-foreground/80 mb-2">
              Justificativa (Opcional)
            </label>
            <textarea
              id="justificativa"
              name="justificativa"
              value={formData.justificativa}
              onChange={handleInputChange}
              placeholder="Justificativa para a escolha do tema e orientador"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background/50 
                         focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
            />
          </div>
        </section>

        {/* Seção 3: Upload do Ficheiro */}
        <section className="space-y-4 pt-6">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <UploadCloud className="h-5 w-5" /> Envio do Ficheiro
          </h2>
          
          <label 
            htmlFor="file-upload"
            className={`block w-full p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-all
                        ${file 
                          ? 'border-green-500 text-green-500 bg-green-500/10' 
                          : 'border-foreground/30 text-foreground/70 hover:border-primary hover:text-primary hover:bg-primary/5'}
                        dark:border-foreground/50 dark:hover:border-primary
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".pdf,.zip,.docx" 
              className="sr-only" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file ? (
              <>
                <p className="font-semibold text-lg mb-1">
                  ✓ {file.name}
                </p>
                <p className="text-sm opacity-70">
                  {(file.size / 1024 / 1024).toFixed(2)} MB - Pronto para enviar!
                </p>
              </>
            ) : (
              <>
                <UploadCloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-lg mb-1">
                  Clique ou arraste o ficheiro aqui
                </p>
                <p className="text-sm opacity-70">
                  PDF, ZIP ou DOCX • Máximo 50MB
                </p>
              </>
            )}
          </label>
        </section>

        {/* Botão de Submissão */}
        <button
          type="submit"
          disabled={!file || isUploading || !formData.titulo || !formData.areaInvestigacao}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold rounded-full 
                     bg-primary text-primary-foreground transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-primary/90 shadow-lg shadow-primary/30 dark:shadow-primary/50
                     hover:scale-[1.02] active:scale-[0.98]"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              A Submeter...
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" />
              Submeter e Iniciar Validação
            </>
          )}
        </button>

        <p className="text-center text-sm text-foreground/50">
          Ao submeter, o seu TFC será enviado para validação pelos coordenadores.
        </p>
      </form>
    </div>
  );
}