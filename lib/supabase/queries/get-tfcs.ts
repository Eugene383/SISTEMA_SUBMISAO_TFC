import { createClient } from "../server";
import { verifySession } from "./verify-session";


export  async function useGetTfcs(){
    const user = await verifySession()
    const supabase = await createClient();
    const {data,error} = await supabase.from('tfcs')
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
            .eq('estudante_id', user?.id)
            .order('created_at', { ascending: false });
            
    if(error) throw error
    return data 

    
}