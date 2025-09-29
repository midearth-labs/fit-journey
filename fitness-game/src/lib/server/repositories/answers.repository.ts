import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql } from 'drizzle-orm';
import { questionAnswers, userMetadata, type QuestionAnswer, type NewQuestionAnswer } from '$lib/server/db/schema';

export interface IAnswersRepository {
  create(data: NewQuestionAnswer): Promise<{id: QuestionAnswer['id']}>;
  findByQuestionId(questionId: string, page: number, limit: number): Promise<QuestionAnswer[]>;
  findById(questionId: string, answerId: string): Promise<QuestionAnswer | null>;
}

export interface IAnswersInternalRepository {
  updateStatus(id: string, details: { status: QuestionAnswer['status'], moderationNotes?: {answer: string[]}, updatedAt: Date }): Promise<boolean>;
}

export class AnswersRepository implements IAnswersRepository, IAnswersInternalRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async create(data: NewQuestionAnswer): Promise<{id: QuestionAnswer['id']}> {
    const result = await this.db.transaction(async (tx) => {
      const [answerResult] = await tx.insert(questionAnswers)
        .values({...data, updatedAt: data.createdAt, helpfulCount: 0, notHelpfulCount: 0})
        .returning({id: questionAnswers.id});

      // Update user metadata to increment questionsAnswered counter
      await tx
        .update(userMetadata)
        .set({
          questionsAnswered: sql`${userMetadata.questionsAnswered} + 1`,
          updatedAt: data.createdAt,
        })
        .where(eq(userMetadata.id, data.userId));
      

      return answerResult;
    });
    return result;
  }

  async findByQuestionId(questionId: string, page: number, limit: number): Promise<QuestionAnswer[]> {
    const offset = (page - 1) * limit;
    
    const result = await this.db.select()
      .from(questionAnswers)
      .where(and(
        eq(questionAnswers.questionId, questionId),
        eq(questionAnswers.status, 'approved')
      ))
      .orderBy(desc(questionAnswers.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result;
  }

  async findById(questionId: string, answerId: string): Promise<QuestionAnswer | null> {
    const result = await this.db.select()
      .from(questionAnswers)
      .where(and(
        eq(questionAnswers.questionId, questionId),
        eq(questionAnswers.id, answerId)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  // @TODO: Admin/Moderator functionality
  async updateStatus(id: string, details: { status: QuestionAnswer['status'], moderationNotes?: {answer: string[]}, updatedAt: Date }): Promise<boolean> {
    const updates: Partial<QuestionAnswer> = {
      status: details.status,
      updatedAt: details.updatedAt,
      ...(details.moderationNotes !== undefined ? { moderationNotes: details.moderationNotes } : {})
    };
    
    const result = await this.db.update(questionAnswers)
      .set(updates)
      .where(eq(questionAnswers.id, id));
    
    return result.rowCount > 0;
  }
}
