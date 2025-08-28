// AvatarAsset type definition
// Based on entities.md AvatarAsset entity

import { BaseContent } from './common';

export interface AvatarAsset extends BaseContent {
  id: string;
  state_id: string; // FK to UserState
  gender: string; // "male", "female"
  age_range: string; // "child", "teen", "young-adult", "middle-age", "senior"
  image_url: string;
  created_at: string;
  updated_at: string;
  
  // Extended fields for content management
  asset_type?: 'full_body' | 'bust' | 'headshot' | 'icon' | 'animated';
  image_format?: 'png' | 'jpg' | 'webp' | 'svg' | 'gif';
  image_dimensions?: {
    width: number;
    height: number;
    aspect_ratio: string;
  };
  image_quality?: {
    resolution: string;
    file_size_kb: number;
    compression_ratio: number;
  };
  visual_style?: {
    art_style: string; // "cartoon", "realistic", "anime", "pixel", "minimalist"
    color_scheme: string;
    lighting: string;
    background_style: string;
  };
  avatar_features?: {
    body_type: string;
    fitness_level: string;
    clothing_style: string;
    accessories: string[];
    facial_expression: string;
    pose: string;
  };
  customization_options?: {
    color_variants: string[];
    style_variants: string[];
    seasonal_variants: string[];
    special_editions: string[];
  };
  accessibility_features?: {
    high_contrast_version: boolean;
    simplified_version: boolean;
    colorblind_friendly: boolean;
    screen_reader_compatible: boolean;
  };
  performance_metrics?: {
    load_time_ms: number;
    memory_usage_kb: number;
    rendering_complexity: number;
    animation_smoothness: number;
  };
  content_relationships?: {
    related_states: string[]; // UserState IDs
    related_achievements: string[]; // Achievement IDs
    unlock_conditions: string[];
    seasonal_availability?: string[];
  };
  asset_metadata?: {
    artist_credits?: string;
    creation_date: string;
    last_modified: string;
    version_history: string[];
    quality_assurance: {
      reviewed: boolean;
      reviewed_by: string;
      review_date: string;
      quality_score: number;
    };
  };
  usage_guidelines?: {
    allowed_use_cases: string[];
    restricted_use_cases: string[];
    attribution_requirements: string[];
    licensing_terms: string;
  };
}
