import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { questions, questionArticles, type Question, type NewQuestion, type NewQuestionArticle } from '$lib/server/db/schema';

export interface IQuestionsRepository {
  create(question: NewQuestion, articleIds: string[]): Promise<{id: Question['id']}>;
  findById(id: string): Promise<Question | null>;
  findByArticleId(articleId: string, page: number, limit: number): Promise<Question[]>;
}

export interface IQuestionsInternalRepository {
  updateStatus(id: string, details: { status: Question['status'], moderationNotes?: {title: string[], body: string[]}, updatedAt: Date }): Promise<boolean>;
}

export class QuestionsRepository implements IQuestionsRepository, IQuestionsInternalRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async create(question: NewQuestion, articleIds: string[]): Promise<{id: Question['id']}> {
    const result = await this.db.transaction(async (tx) => {
      // Create the question
      const [questionResult] = await tx.insert(questions)
        .values({...question, helpfulCount: 0, notHelpfulCount: 0, updatedAt: question.createdAt})
        .returning({id: questions.id});
      
      // Create article associations
      if (articleIds.length > 0) {
        await tx.insert(questionArticles).values(
          articleIds.map(articleId => ({
            questionId: questionResult.id,
            articleId,
            createdAt: question.createdAt,
          }))
        );
      }
      
      return questionResult;
    });
    
    return result;
  }

  async findById(id: string): Promise<Question | null> {
    const result = await this.db.select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  // @TODO: find all magic numbers in this code and refactor them to use constants
  async findByArticleId(articleId: string, page: number = 1, limit: number = 20): Promise<Question[]> {
    const offset = (page - 1) * limit;
    
    const result = await this.db.select({questions})
    .from(questions)
    .innerJoin(questionArticles, eq(questions.id, questionArticles.questionId))
    .where(
      and(
        eq(questionArticles.articleId, articleId),
        eq(questions.status, 'approved')
      )
    )
    .orderBy(desc(questions.createdAt))
    .limit(limit)
    .offset(offset);
    
    return result.map(row => row.questions);
  }

  // @TODO: Admin/Moderator functionality
  async updateStatus(id: string, details: { status: Question['status'], moderationNotes?: {title: string[], body: string[]}, updatedAt: Date }): Promise<boolean> {
    const updates: Partial<Question> = {
      status: details.status,
      updatedAt: details.updatedAt,
      ...(details.moderationNotes !== undefined ? { moderationNotes: details.moderationNotes } : {})
    };
    
    const result = await this.db.update(questions)
      .set(updates)
      .where(eq(questions.id, id));
    
    return result.rowCount > 0;
  }

}
