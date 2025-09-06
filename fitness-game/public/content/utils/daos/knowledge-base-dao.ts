// Knowledge Base DAO
// Extends both filterable and searchable DAOs for comprehensive functionality

import { KnowledgeBase } from '../../types/knowledge-base';
import { BaseContentDAO } from '../base-content-dao';

export class KnowledgeBaseDAO extends BaseContentDAO <KnowledgeBase> {
}
