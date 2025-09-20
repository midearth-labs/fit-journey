import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { questionArticles, type QuestionArticle } from '$lib/server/db/schema';

export interface IQuestionArticlesRepository {
  // This repository is now only used internally by QuestionsRepository
  // All public methods have been optimized into single queries with JOINs
}

export class QuestionArticlesRepository implements IQuestionArticlesRepository {
  constructor(private db: NodePgDatabase<any>) {}

  // All methods have been optimized into single queries with JOINs in QuestionsRepository
  // This class is kept for potential future internal use but has no public methods
}
