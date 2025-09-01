type KnowledgeBaseSummary = {
  id: string; // The ID of the content entity. Must be a UUID, unique and immutable.
  slug: string; // The slug of the article. Used as part of the URL of the article and to boost SEO.
  content_category_id: string; // The category ID of the article.
  day: number; // The day number of the article as per the learning progression. 1-70.
  title: string; // The engaging title of the article.
  tags: string[]; // Tags for the article, that could be used to categorize the article or to filter the articles. Between 1 and 5 tags.
};

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
    id: string; // The ID of the content entity. Must be unique and immutable.
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