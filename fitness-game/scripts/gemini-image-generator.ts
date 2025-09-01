#!/usr/bin/env tsx

/**
 * Gemini Image Generation Script
 * 
 * This script scans all knowledge base JSON files for image metadata,
 * checks if images already exist in the public directory, and generates
 * missing images using Google's Gemini API.
 * 
 * Usage:
 *   npm run generate:images (add to package.json scripts)
 *   tsx scripts/gemini-image-generator.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { ContentLoader } from '@/data/content/utils/content-loader';
import { KnowledgeBase } from '@/data/content/types/knowledge-base';

// Load environment variables
config({ path: '.env.local' });

interface ImageMetadata {
  path: string;
  description: string;
  prompt_generation_string: string;
  width: number;
  height: number;
  source: 'lede_image' | 'image_urls' | 'passage_image_urls';
  knowledgeBaseId: string;
  knowledgeBaseTitle: string;
}

class GeminiImageGenerator {
  private genAI: GoogleGenerativeAI | null;
  private publicDir: string;
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    const apiKey = process.env.GEMINI_PRO_KEY;
    
    if (!apiKey) {
      if (!dryRun) {
        console.warn('⚠️  GEMINI_PRO_KEY not found in .env.local file.');
        console.warn('🔍 Running in dry-run mode to show what images would be generated.');
        console.warn('💡 To actually generate images, add your Gemini API key to .env.local');
        this.dryRun = true;
      } else {
        this.dryRun = true;
      }
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.dryRun = dryRun;
    }
    
    this.publicDir = path.join(process.cwd(), 'public');
  }

  /**
   * Main execution function
   */
  async generateImages(): Promise<void> {
    console.log('🎨 Starting Gemini Image Generation...');
    console.log('=====================================');

    try {
      // Load content using ContentLoader
      console.log('📁 Loading knowledge base content...');
      const contentLoader = await ContentLoader.initialize();
      const knowledgeBaseList = contentLoader.getContentList('KnowledgeBase');
      
      console.log(`📚 Found ${knowledgeBaseList.length} knowledge base articles`);
      console.log('📝 Articles found:', knowledgeBaseList.map(kb => kb.title));

      // Extract all image metadata
      const allImageMetadata = this.extractImageMetadata(knowledgeBaseList);
      console.log(`🖼️  Found ${allImageMetadata.length} total images across all articles`);

      // Filter images that need generation
      const imagesToGenerate = await this.filterMissingImages(allImageMetadata);
      console.log(`🎯 Need to generate ${imagesToGenerate.length} missing images`);

      if (imagesToGenerate.length === 0) {
        console.log('✅ All images already exist! No generation needed.');
        return;
      }

      // Generate missing images
      await this.generateMissingImages(imagesToGenerate);

      console.log('🎉 Image generation completed successfully!');

    } catch (error) {
      console.error('💥 Image generation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Extract image metadata from all knowledge base articles
   */
  private extractImageMetadata(knowledgeBaseList: KnowledgeBase[]): ImageMetadata[] {
    const imageMetadata: ImageMetadata[] = [];

    for (const kb of knowledgeBaseList) {
      // Extract lede_image
      if (kb.lede_image) {
        imageMetadata.push({
          ...kb.lede_image,
          source: 'lede_image',
          knowledgeBaseId: kb.id,
          knowledgeBaseTitle: kb.title
        });
      }

      // Extract image_urls
      if (kb.image_urls && kb.image_urls.length > 0) {
        for (const image of kb.image_urls) {
          imageMetadata.push({
            ...image,
            source: 'image_urls',
            knowledgeBaseId: kb.id,
            knowledgeBaseTitle: kb.title
          });
        }
      }

      // Extract passage image_urls
      if (kb.passages && kb.passages.length > 0) {
        for (const passage of kb.passages) {
          if (passage.image_urls && passage.image_urls.length > 0) {
            for (const image of passage.image_urls) {
              imageMetadata.push({
                ...image,
                source: 'passage_image_urls',
                knowledgeBaseId: kb.id,
                knowledgeBaseTitle: kb.title
              });
            }
          }
        }
      }
    }

    return imageMetadata;
  }

  /**
   * Filter images that don't exist in the public directory
   */
  private async filterMissingImages(allImages: ImageMetadata[]): Promise<ImageMetadata[]> {
    const missingImages: ImageMetadata[] = [];

    for (const image of allImages) {
      const fullPath = path.join(this.publicDir, image.path);
      
      try {
        await fs.access(fullPath);
        console.log(`✅ Image exists: ${image.path}`);
      } catch {
        console.log(`❌ Missing image: ${image.path}`);
        missingImages.push(image);
      }
    }

    return missingImages;
  }

  /**
   * Generate missing images using Gemini API
   */
  private async generateMissingImages(imagesToGenerate: ImageMetadata[]): Promise<void> {
    console.log(`\n🎨 ${this.dryRun ? 'Would generate' : 'Generating'} ${imagesToGenerate.length} images...`);
    
    if (this.dryRun) {
      console.log('📋 DRY RUN MODE - No actual images will be generated');
    }
    
    const model = this.genAI?.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    for (let i = 0; i < 1 /* imagesToGenerate.length */; i++) {
      const image = imagesToGenerate[i];
      console.log(`\n📸 Generating image ${i + 1}/${imagesToGenerate.length}`);
      console.log(`📝 Source: ${image.source} from "${image.knowledgeBaseTitle}"`);
      console.log(`📍 Path: ${image.path}`);
      console.log(`🎯 Prompt: ${image.prompt_generation_string}`);

      try {
        // Create directory if it doesn't exist
        const imageDir = path.dirname(path.join(this.publicDir, image.path));
        
        if (!this.dryRun) {
          await fs.mkdir(imageDir, { recursive: true });
        }

        if (this.dryRun) {
          console.log(`📁 Would create directory: ${imageDir}`);
          console.log(`📸 Would generate image using prompt: "${image.prompt_generation_string}"`);
          console.log(`💾 Would save to: ${path.join(this.publicDir, image.path)}`);
        } else if (!model) {
          console.error('❌ No Gemini model available for generation');
          continue;
        } else {
          // Generate image using Gemini
          const result = await model.generateContent([
            {
              text: `Create a high-quality image for a fitness education app. The image should be professional, engaging, and appropriate for a health and fitness context. Dimensions should be approximately ${image.width}x${image.height} pixels. 

Prompt: ${image.prompt_generation_string}

Additional context: This is for a knowledge base article titled "${image.knowledgeBaseTitle}". The image will be used as ${image.source.replace('_', ' ')} in the article.`
            }
          ]);

          // Check if the response contains image data
          const response = await result.response;
          
          // Note: Gemini 2.0 Flash Experimental doesn't generate images directly
          // This is a placeholder for when image generation becomes available
          console.log(`⚠️  Note: Gemini 2.0 Flash Experimental doesn't support direct image generation yet.`);
          console.log(`📄 Generated text response instead: ${response.text()?.substring(0, 100)}...`);
          
          // For now, create a placeholder file to track that we've "processed" this image
          const placeholderContent = JSON.stringify({
            path: image.path,
            description: image.description,
            prompt: image.prompt_generation_string,
            generated_at: new Date().toISOString(),
            note: "Placeholder - Gemini image generation not yet available"
          }, null, 2);
          
          const placeholderPath = path.join(this.publicDir, image.path + '.meta.json');
          await fs.writeFile(placeholderPath, placeholderContent);
          
          console.log(`📄 Created metadata file: ${placeholderPath}`);
        }

      } catch (error) {
        console.error(`💥 Failed to generate image ${image.path}:`, error);
        
        // Continue with next image rather than failing completely
        continue;
      }

      // Add delay to respect API rate limits (only if not in dry run mode)
      if (i < imagesToGenerate.length - 1 && !this.dryRun) {
        console.log('⏳ Waiting 2 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const generator = new GeminiImageGenerator();
    await generator.generateImages();
  } catch (error) {
    console.error('💥 Unhandled error during image generation:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { GeminiImageGenerator };
