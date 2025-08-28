// PassageSet type definition
// Based on entities.md PassageSet entity

import z from 'zod';
import { BaseContentSchema, ImageSchema } from './common';

export const PassageSetSchema = BaseContentSchema.extend({
  content_category_id: z.string(),
  landing_image: ImageSchema,
  title: z.string(),
  passage_text: z.string(),
  image_urls: z.array(ImageSchema),
});

export type PassageSet = z.infer<typeof PassageSetSchema>;
