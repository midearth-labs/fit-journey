import * as fs from 'fs';
import * as path from 'path';

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
	icon: string;
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

async function extractArticles() {
	// Define paths
	const knowledgeBaseDir = path.join(process.cwd(), 'static', 'content', 'knowledge-base');
	const articlesDir = path.join(knowledgeBaseDir, 'articles');
	const markdownDir = path.join(knowledgeBaseDir, 'markdown');
	const rawDir = path.join(knowledgeBaseDir, '_raw_');
	const articlesJsonPath = path.join(knowledgeBaseDir, 'articles.json');

	console.log('Starting article extraction...');
	console.log('Knowledge base directory:', knowledgeBaseDir);
	console.log('Raw directory:', rawDir);
	console.log('Articles output directory:', articlesDir);
	console.log('Markdown output directory:', markdownDir);

	// Ensure articles directory exists
	if (!fs.existsSync(articlesDir)) {
		fs.mkdirSync(articlesDir, { recursive: true });
	}

	// Ensure markdown directory exists
	if (!fs.existsSync(markdownDir)) {
		fs.mkdirSync(markdownDir, { recursive: true });
	}

	// Step 1: Delete existing articles.json if it exists
	if (fs.existsSync(articlesJsonPath)) {
		console.log('Deleting existing articles.json...');
		fs.unlinkSync(articlesJsonPath);
	}

	// Step 2: Read all JSON files from _raw_ directory
	const rawFiles = fs.readdirSync(rawDir).filter((file) => file.endsWith('.json'));
	console.log(`Found ${rawFiles.length} JSON files to process`);

	const articleSummaries: ArticleSummary[] = [];
	let totalArticles = 0;

	// Step 3: Process each file
	for (const file of rawFiles) {
		const filePath = path.join(rawDir, file);
		console.log(`\nProcessing: ${file}`);

		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const articles: Article[] = JSON.parse(fileContent);

		console.log(`  Found ${articles.length} articles in ${file}`);

		// Process each article
		for (const article of articles) {
			totalArticles++;
			console.log(`  Processing article: ${article.id} - ${article.title}`);

			// Use flat articles directory with {id}.* naming

			// TRANSFORM_RULES1: Extract summary fields for articles.json
			const articleSummary: ArticleSummary = {
				id: article.id,
				created_at: article.created_at,
				updated_at: article.updated_at,
				is_active: article.is_active,
				sort_order: article.sort_order,
				slug: article.slug,
				content_category_id: article.content_category_id,
				day: article.day,
				title: article.title,
				icon: article.icon,
				tags: article.tags,
				read_time: article.read_time,
				word_count: article.word_count,
				key_takeaways: article.key_takeaways
			};
			articleSummaries.push(articleSummary);

			// TRANSFORM_RULES2: Write full article to articles/{id}.article.json
			const articleJsonOutPath = path.join(articlesDir, `${article.id}.article.json`);
			fs.writeFileSync(articleJsonOutPath, JSON.stringify(article, null, 2), 'utf-8');
			console.log(`    ✓ Wrote article.json`);

			// TRANSFORM_RULES3: Extract body field and write to markdown/{id}.body.md
			const bodyMdPath = path.join(markdownDir, `${article.id}.body.md`);
			fs.writeFileSync(bodyMdPath, article.body, 'utf-8');
			console.log(`    ✓ Wrote body.md`);

			// TRANSFORM_RULES4 (labeled as RULES2 in requirements): Extract passages
			if (article.passages && article.passages.length > 0) {
				const passagesMdPath = path.join(markdownDir, `${article.id}.passages.md`);
				const passagesContent = article.passages
					.map((passage) => {
						// Enclose each passage text with delimiter
						return `\n\n# ${passage.id}\n\n${passage.passage_text}\n\n# ${passage.id}\n\n`;
					})
					.join('');

				fs.writeFileSync(passagesMdPath, passagesContent, 'utf-8');
				console.log(`    ✓ Wrote passages.md (${article.passages.length} passages)`);
			} else {
				console.log(`    ⚠ No passages found for this article`);
			}
		}
	}

	// Step 4: Write all article summaries to articles.json
	console.log(`\nWriting articles.json with ${articleSummaries.length} articles...`);
	fs.writeFileSync(articlesJsonPath, JSON.stringify(articleSummaries, null, 2), 'utf-8');
	console.log(`✓ Successfully wrote articles.json`);

	// Summary
	console.log('\n' + '='.repeat(50));
	console.log('EXTRACTION COMPLETE');
	console.log('='.repeat(50));
	console.log(`Total files processed: ${rawFiles.length}`);
	console.log(`Total articles extracted: ${totalArticles}`);
	console.log(`Articles directory: ${knowledgeBaseDir}`);
	console.log('='.repeat(50));
}

// Run the extraction
extractArticles()
	.then(() => {
		console.log('\n✅ Article extraction completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Error during article extraction:', error);
		process.exit(1);
	});

