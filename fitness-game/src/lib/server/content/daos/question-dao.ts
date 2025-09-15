// Question DAO
// Extends filterable DAO for questions with difficulty and passage logic
import { type Question } from '../types/question';
import { BaseContentDAO } from './base-content-dao';

export class QuestionDAO extends BaseContentDAO <Question> {
  /**
   * Get questions by passage set
   */
  getByPassageSet(passageSetId: string): Question[] {
    return this.getAll().filter(question => 
      question.passage_set_id === passageSetId
    );
  }

  /**
   * Get questions without passage (standalone questions)
   */
  getStandalone(): Question[] {
    return this.getAll().filter(question => !question.passage_set_id);
  }

}
