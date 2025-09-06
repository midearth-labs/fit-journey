
type KnowledgeBaseSummary = {
  id: string; // The ID of the content entity. Must be a UUID, unique and immutable.
  slug: string; // The slug of the article. Used as part of the URL of the article and to boost SEO.
  content_category_id: string; // The category ID of the article.
  day: number; // The day number of the article as per the learning progression. 1-70.
  title: string; // The engaging title of the article.
  tags: string[]; // Tags for the article, that could be used to categorize the article or to filter the articles. Between 1 and 5 tags.
};

// 9 categories
type ContentCategory = {
  id: string; // The ID of the content entity. Must be unique and immutable.
  created_at: string; // The date and time the content was created.
  updated_at: string; // The date and time the content was last updated.
  is_active: boolean; // Whether the content is active and should be displayed.
  sort_order: number; // The order of the content in the list. Used for display ordering.
  name: string; // The name of the category
  description: string; // The description of the category
  icon_name: string; // The icon name of the category
  learning_objectives: string[]; // The learning objectives of the category
  related_categories: string[]; // The IDs of related categories
}

// 6 to 12 knowledge base article per category
type KnowledgeBaseDetail = {
  id: string; // The ID of the content entity. Must be a UUID, unique and immutable.
  created_at: string; // The date and time the content was created.
  updated_at: string; // The date and time the content was last updated.
  is_active: boolean; // Whether the content is active and should be displayed.
  sort_order: number; // The order of the content in the list. Used for display ordering.
  
  slug: string; // The slug of the article. Used as part of the URL of the article and to boost SEO.
  content_category_id: string; // The category ID of the article.
  day: number; // The day number of the article as per the learning progression. 1-70.
  
  lede_image: {
    path: string; // Relative path of the image. Should be relative to the content specific directory under the images directory. i.e. "/images/knowledge-base/{article-id}/{image-id}.jpeg", this relative Image URL will be used in the associated content markdown
    description: string; // The description of the image. Used for alt text and other purposes.
    width: number;
    height: number;
    prompt_generation_string: string; // The prompt that will be used to generate the image.
  }; // The image to be displayed as the lead image for the article. Must be catchy and appropriate for the article.
  
  title: string; // The engaging title of the article.
  body: string; // Article text in markdown format containing image urls etc. Between 3 to 5 minutes of reading time.
  tags: string[]; // Tags for the article, that could be used to categorize the article or to filter the articles. Between 1 and 5 tags.
  
  learn_more_links: {
    type: 'youtube_short' | 'blog' | 'article' | 'other_video' | 'tiktok_short' | 'ig_reel' | 'app_store' | 'google_play';
    url: string;
    title: string;
    description?: string;
    duration_seconds?: number; // The duration of the link in seconds. Only applicable for video content type of links.
  }[]; // Between 3 and 5 links.
  
  affiliate_links: {
    type: 'amazon' | 'gymshark' | 'temu' | 'shein' | 'other';
    url: string;
    title: string;
    description: string;
  }[]; // Between 3 and 5 affiliate links.
  
  image_urls: {
    path: string; // Relative path of the image. Should be relative to the content specific directory under the images directory. i.e. "/images/knowledge-base/{article-id}/{image-id}.jpeg", this relative Image URL will be used in the associated content markdown
    description: string; // The description of the image. Used for alt text and other purposes.
    width: number;
    height: number;
    prompt_generation_string: string; // The prompt that will be used to generate the image.
  }[]; // The images to be referenced in the article markdown. Between 0 to 10 images. More images are required for articles with a more visual undertone e.g. equipment and exercise identification, nutrition, etc and nutrition etc.
  
  // Extended fields for content management
  read_time: number; // The estimated reading time of the article in minutes between 3 and 5.
  word_count: number; // The word count of the article.
  key_takeaways: string[]; // Between 1 and 3 takeaways from the article. This could include practical actions the reader can apply after reading the article.
  
  passages: {
    id: string; // The ID of the passage. Must be a UUID, unique and immutable.
    title: string; // The title of the passage.
    passage_text: string; // Passage text in markdown format containing 0 to 2 image urls. Between 30 to 40 seconds of reading time.
    image_urls: {
      path: string; // Relative path of the image. Should be relative to the content specific directory under the images directory. i.e. "/images/knowledge-base/{article-id}/{image-id}.jpeg", this relative Image URL will be used in the associated content markdown
      description: string; // The description of the image. Used for alt text and other purposes.
      width: number;
      height: number;
      prompt_generation_string: string; // The prompt that will be used to generate the image.
    }[]; // The images to be referenced in the article markdown. Between 0 to 2 images.
  }[]; // Between 1 and 3 passages for each knowledge base article.
};

// 15 to 23 questions per knowledge base article 
type Question = {
  id: string; // The ID of the content entity. Must be a UUID, unique and immutable.
  created_at: string; // The date and time the content was created.
  updated_at: string; // The date and time the content was last updated.
  is_active: boolean; // Whether the content is active and should be displayed.
  sort_order: number; // The order of the content in the list. Used for display ordering.
  knowledge_base_id: string; // The knowledge base ID of the article which this question is based on.
  question_text: string; // The text of the question. Must be a quick read
  question_type: 'standalone' | 'passage_based'; // The type of question - either standalone or passage based
  options: string[]; // The options of the question. 2 options for true/false questions. 4 options for others
  correct_answer_index: number; // The index of the correct answer out of the options.
  explanation: string; // A concise explanation of the question.
  hints: string[]; // A list of 1 - 2 hints that could be used to help the user answer the question.
  image_urls: {
    path: string; // Relative path of the image. Should be relative to the content specific directory under the images directory. i.e. "/images/knowledge-base/{article-id}/{image-id}.jpeg", this relative Image URL will be used in the associated content markdown
    description: string; // The description of the image. Used for alt text and other purposes.
    width: number;
    height: number;
    prompt_generation_string: string; // The prompt that will be used to generate the image.
  }[]; // The images to be referenced in the question or options markdown, reserve this only for rare graphical cases, maybe exercise or equipment identification or nutrition related questions. Between 0 to 10 images.
  passage_set_id?: string; // The passage ID of the passage for which this question is based on. not defined for standalone questions
};
