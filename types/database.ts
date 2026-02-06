export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      areas_investigacao: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      palavras_chave: {
        Row: {
          created_at: string | null
          id: string
          palavra: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          palavra: string
        }
        Update: {
          created_at?: string | null
          id?: string
          palavra?: string
        }
        Relationships: []
      }
      tfc_palavras_chave: {
        Row: {
          palavra_chave_id: string
          tfc_id: string
        }
        Insert: {
          palavra_chave_id: string
          tfc_id: string
        }
        Update: {
          palavra_chave_id?: string
          tfc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tfc_palavras_chave_palavra_chave_id_fkey"
            columns: ["palavra_chave_id"]
            isOneToOne: false
            referencedRelation: "palavras_chave"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tfc_palavras_chave_tfc_id_fkey"
            columns: ["tfc_id"]
            isOneToOne: false
            referencedRelation: "tfcs"
            referencedColumns: ["id"]
          },
        ]
      }
      tfcs: {
        Row: {
          ano: number | null
          area_investigacao_id: string | null
          autor: string
          coordenador: string | null
          created_at: string | null
          estado: string | null
          estudante_id: string | null
          ficheiro_nome: string
          ficheiro_url: string
          id: string
          justificativa: string | null
          resumo: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ano?: number | null
          area_investigacao_id?: string | null
          autor: string
          coordenador?: string | null
          created_at?: string | null
          estado?: string | null
          estudante_id?: string | null
          ficheiro_nome: string
          ficheiro_url: string
          id?: string
          justificativa?: string | null
          resumo?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ano?: number | null
          area_investigacao_id?: string | null
          autor?: string
          coordenador?: string | null
          created_at?: string | null
          estado?: string | null
          estudante_id?: string | null
          ficheiro_nome?: string
          ficheiro_url?: string
          id?: string
          justificativa?: string | null
          resumo?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tfcs_area_investigacao_id_fkey"
            columns: ["area_investigacao_id"]
            isOneToOne: false
            referencedRelation: "areas_investigacao"
            referencedColumns: ["id"]
          },
        ]
      }
      validacoes: {
        Row: {
          comentario: string | null
          coordenador_id: string | null
          created_at: string | null
          decisao: string | null
          id: string
          tfc_id: string | null
        }
        Insert: {
          comentario?: string | null
          coordenador_id?: string | null
          created_at?: string | null
          decisao?: string | null
          id?: string
          tfc_id?: string | null
        }
        Update: {
          comentario?: string | null
          coordenador_id?: string | null
          created_at?: string | null
          decisao?: string | null
          id?: string
          tfc_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validacoes_tfc_id_fkey"
            columns: ["tfc_id"]
            isOneToOne: false
            referencedRelation: "tfcs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      areas_mais_usadas: {
        Row: {
          nome: string | null
          total_tfcs: number | null
        }
        Relationships: []
      }
      estatisticas_tfcs: {
        Row: {
          ano: number | null
          aprovados: number | null
          em_validacao: number | null
          rejeitados: number | null
          submetidos: number | null
          total: number | null
        }
        Relationships: []
      }
      palavras_chave_mais_usadas: {
        Row: {
          palavra: string | null
          total_uso: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      make_user_coordenador: { Args: { user_email: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const



export type Tfc = Database["public"]["Tables"]["tfcs"]["Row"]
export type AreaInvestigacao = Database["public"]["Tables"]["areas_investigacao"]["Row"]
export type PalavraChave = Database["public"]["Tables"]["palavras_chave"]["Row"]
export type TfcWithRelations = Tfc & {
  area_investigacao: AreaInvestigacao | null
  palavras_chave: {
    palavra_chave: PalavraChave
  }[]
}


