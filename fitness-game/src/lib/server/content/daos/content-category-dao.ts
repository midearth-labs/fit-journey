// Content Category DAO
// Simple content type, no filtering needed

import { BaseContentDAO } from './base-content-dao';
import { type ContentCategory } from '../types/content-category';

export class ContentCategoryDAO extends BaseContentDAO<ContentCategory> {
}
