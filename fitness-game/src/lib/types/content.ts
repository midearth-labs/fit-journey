export interface Article {
  id: string;
  title: string;
  body: string;
  day: number;
  content_category_id: string;
  read_time: number;
  tags: string[];
  lede_image: {
    path: string;
    description: string;
  };
  passages?: Array<{
    id: string;
    title: string;
    passage_text: string;
  }>;
  key_takeaways?: string[];
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'standalone' | 'passage_based';
  options: string[];
  correct_answer_index: number;
  knowledge_base_id: string;
  passage_set_id?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  learning_objectives: string[];
}

export interface LearningPhase {
  id: string;
  name: string;
  description: string;
  dayRange: [number, number];
  categories: string[];
  articles: Article[];
}
