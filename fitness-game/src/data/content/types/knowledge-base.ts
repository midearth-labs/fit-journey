// KnowledgeBase type definition
// Based on entities.md KnowledgeBase entity

import z from 'zod';
import { BaseContentSchema, LearnMoreLinkSchema, AffiliateLinkSchema, ImageSchema } from './common';

export const KnowledgeBaseSchema = BaseContentSchema.extend({
  slug: z.string().describe('The slug of the article. Used as part of the URL of the article and to boost SEO.'),
  content_category_id: z.string().describe('The category ID of the article.'),
  day: z.number().min(1).max(70).describe('The day number of the article as per the learning progression. 1-70.'),
  lede_image: ImageSchema.describe('The image to be displayed as the lead image for the article. Must be catchy and appropriate for the article.'),
  title: z.string().describe('The engaging title of the article.'),
  body: z.string().describe('Article text in markdown format containing image urls etc. Between 3 to 5 minutes of reading time.'),
  tags: z.array(z.string()).min(1).max(5).describe('Tags for the article, that could be used to categorize the article or to filter the articles. Between 1 and 5 tags.'),
  // @ TODO: Implement all cross-reference checks for all entities
  learn_more_links: z.array(LearnMoreLinkSchema).min(3).max(5).describe('Between 3 and 5 links.'),
  affiliate_links: z.array(AffiliateLinkSchema).min(3).max(5).describe('Between 3 and 5 affiliate links.'),
  image_urls: z.array(ImageSchema).min(0).max(10).describe('The images to be referenced in the article markdown. Between 0 to 10 images. More images are required for articles with a more visual undertone e.g. equipment and exercise identification, nutrition, etc and nutrition etc.'),
  
  // Extended fields for content management
  read_time: z.number().min(3).max(5).describe('The estimated reading time of the article in minutes between 3 and 5.'),
  word_count: z.number().describe('The word count of the article.'),
  key_takeaways: z.array(z.string()).min(1).max(3).describe('Between 1 and 3 takeaways from the article. This could include practical actions the reader can apply after reading the article.'),
  passages: z.array(z.object({
    id: BaseContentSchema.shape.id.describe('The ID of the passage. Must be a UUID, unique and immutable.'),
    title: z.string().describe('The title of the passage.'),
    passage_text: z.string().describe('Passage text in markdown format containing 0 to 2 image urls. Between 30 to 40 seconds of reading time.'),
    image_urls: z.array(ImageSchema).min(0).max(2).describe('The images to be referenced in the article markdown. Between 0 to 2 images.'),
  })).min(1).max(3).describe('Between 1 and 3 passages for each knowledge base article.'),
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
