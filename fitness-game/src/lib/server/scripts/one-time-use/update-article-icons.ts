import * as fs from 'fs';
import * as path from 'path';

interface ArticleSummary {
	id: string;
	created_at: string;
	updated_at: string;
	is_active: boolean;
	sort_order: number;
	slug: string;
	content_category_id: string;
	day: number;
	title: string;
	icon: string;
	tags: string[];
	read_time: number;
	word_count: number;
	key_takeaways: string[];
}

interface Article {
	id: string;
	created_at: string;
	updated_at: string;
	is_active: boolean;
	sort_order: number;
	slug: string;
	content_category_id: string;
	day: number;
	lede_image: any;
	title: string;
	body: string;
	tags: string[];
	read_time: number;
	word_count: number;
	key_takeaways: string[];
	passages?: Array<{
		id: string;
		title: string;
		passage_text: string;
		image_urls: any[];
	}>;
	[key: string]: any;
}

async function updateArticleIcons() {
	// Define paths
	const knowledgeBaseDir = path.join(process.cwd(), 'static', 'content', 'knowledge-base');
	const articlesJsonPath = path.join(knowledgeBaseDir, 'articles.json');

	console.log('Starting article icon updates...');
	console.log('Knowledge base directory:', knowledgeBaseDir);

	// Step 1: Load articles.json
	if (!fs.existsSync(articlesJsonPath)) {
		console.error('❌ articles.json not found at:', articlesJsonPath);
		process.exit(1);
	}

	const articlesJsonContent = fs.readFileSync(articlesJsonPath, 'utf-8');
	const articleSummaries: ArticleSummary[] = JSON.parse(articlesJsonContent);

	console.log(`Found ${articleSummaries.length} articles in articles.json`);

	// Create a map of article ID to icon for quick lookup
	const iconMap = new Map<string, string>();
	for (const summary of articleSummaries) {
		iconMap.set(summary.id, summary.icon);
	}

	let updatedCount = 0;
	let skippedCount = 0;
	let errorCount = 0;

	// Step 2: Process each article directory
	for (const summary of articleSummaries) {
		const articleDir = path.join(knowledgeBaseDir, summary.id);
		const articleJsonPath = path.join(articleDir, 'article.json');

		console.log(`\nProcessing: ${summary.id} - ${summary.title}`);

		// Check if article directory exists
		if (!fs.existsSync(articleDir)) {
			console.log(`  ⚠ Directory not found: ${articleDir}`);
			skippedCount++;
			continue;
		}

		// Check if article.json exists
		if (!fs.existsSync(articleJsonPath)) {
			console.log(`  ⚠ article.json not found: ${articleJsonPath}`);
			skippedCount++;
			continue;
		}

		try {
			// Load the individual article.json
			const articleJsonContent = fs.readFileSync(articleJsonPath, 'utf-8');
			const article: Article = JSON.parse(articleJsonContent);

			// Check if icon field already exists
			if (article.icon) {
				console.log(`  ⚠ Icon already exists: ${article.icon}`);
				skippedCount++;
				continue;
			}

			// Add the icon field
			const iconValue = iconMap.get(summary.id);
			if (!iconValue) {
				console.log(`  ⚠ No icon found in articles.json for ID: ${summary.id}`);
				skippedCount++;
				continue;
			}

			article.icon = iconValue;

			// Write the updated article back to file
			fs.writeFileSync(articleJsonPath, JSON.stringify(article, null, 2), 'utf-8');
			console.log(`  ✓ Updated with icon: ${iconValue}`);
			updatedCount++;

		} catch (error) {
			console.error(`  ❌ Error processing ${summary.id}:`, error);
			errorCount++;
		}
	}

	// Summary
	console.log('\n' + '='.repeat(50));
	console.log('ICON UPDATE COMPLETE');
	console.log('='.repeat(50));
	console.log(`Total articles processed: ${articleSummaries.length}`);
	console.log(`Successfully updated: ${updatedCount}`);
	console.log(`Skipped (already had icon or missing files): ${skippedCount}`);
	console.log(`Errors: ${errorCount}`);
	console.log('='.repeat(50));
}

// Run the update
updateArticleIcons()
	.then(() => {
		console.log('\n✅ Article icon updates completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Error during icon updates:', error);
		process.exit(1);
	});
