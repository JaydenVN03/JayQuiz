// Regenerate with: supabase gen types typescript --local
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          status: Database["public"]["Enums"]["content_status"];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subjects"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["subjects"]["Row"]>;
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          slug: string;
          description: string | null;
          status: Database["public"]["Enums"]["content_status"];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chapters"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["chapters"]["Row"]>;
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          subject_id: string;
          chapter_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          status: Database["public"]["Enums"]["content_status"];
          time_limit_seconds: number | null;
          pass_score: number | null;
          version: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["quizzes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Row"]>;
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          quiz_id: string;
          question_id: string;
          sort_order: number;
          points: number;
        };
        Insert: Database["public"]["Tables"]["quiz_questions"]["Row"];
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Row"]>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          content: string;
          type: Database["public"]["Enums"]["question_type"];
          explanation: string | null;
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null;
          status: Database["public"]["Enums"]["content_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["questions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["questions"]["Row"]>;
        Relationships: [];
      };
      options: {
        Row: {
          id: string;
          question_id: string;
          content: string;
          is_correct: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["options"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["options"]["Row"]>;
        Relationships: [];
      };
      admin_profiles: {
        Row: {
          user_id: string;
          role: "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["admin_profiles"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      public_subjects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
        };
        Relationships: [];
      };
      public_chapters: {
        Row: {
          id: string;
          subject_id: string;
          subject_slug: string;
          title: string;
          slug: string;
          description: string | null;
          sort_order: number;
        };
        Relationships: [];
      };
      public_quizzes: {
        Row: {
          id: string;
          subject_id: string;
          subject_slug: string;
          subject_name: string;
          chapter_id: string | null;
          chapter_slug: string | null;
          chapter_title: string | null;
          title: string;
          slug: string;
          description: string | null;
          time_limit_seconds: number | null;
          pass_score: number | null;
          version: number;
          published_at: string | null;
        };
        Relationships: [];
      };
      public_quiz_content: {
        Row: {
          quiz_id: string;
          quiz_slug: string;
          question_id: string;
          question_content: string;
          question_type: Database["public"]["Enums"]["question_type"];
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null;
          question_sort_order: number;
          points: number;
          option_id: string;
          option_content: string;
          option_sort_order: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_save_quiz: {
        Args: {
          p_quiz_id: string;
          p_subject_id: string;
          p_chapter_id: string | null;
          p_title: string;
          p_slug: string;
          p_description: string | null;
          p_status: Database["public"]["Enums"]["content_status"];
          p_time_limit_seconds: number | null;
          p_pass_score: number | null;
          p_version: number;
          p_questions: Json;
        };
        Returns: undefined;
      };
      admin_save_question: {
        Args: {
          p_question_id: string;
          p_content: string;
          p_type: Database["public"]["Enums"]["question_type"];
          p_explanation: string | null;
          p_difficulty: Database["public"]["Enums"]["question_difficulty"] | null;
          p_status: Database["public"]["Enums"]["content_status"];
          p_options: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      content_status: "draft" | "published" | "archived";
      question_type: "single_choice" | "multiple_choice" | "true_false";
      question_difficulty: "easy" | "medium" | "hard";
    };

    CompositeTypes: Record<never, never>;
  };
};

export type PublicSubject = Database["public"]["Views"]["public_subjects"]["Row"];
export type PublicChapter = Database["public"]["Views"]["public_chapters"]["Row"];
export type PublicQuiz = Database["public"]["Views"]["public_quizzes"]["Row"];
export type PublicQuizContentRow =
  Database["public"]["Views"]["public_quiz_content"]["Row"];
