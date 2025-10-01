import * as fs from 'fs';
import * as path from 'path';

/**
 * One-time script: Move/copy article files from per-article directories into a flat `articles` directory.
 *
 * For each subdirectory under `static/content/knowledge-base` that is not named `articles`,
 * copy `article.json`, `body.md`, and `passages.md` into `.../knowledge-base/articles` as
 * `{dirname}.article.json`, `{dirname}.body.md`, `{dirname}.passages.md`.
 */
async function moveArticles(): Promise<void> {
	const knowledgeBaseDir = path.join(process.cwd(), 'static', 'content', 'knowledge-base');
	const articlesDir = path.join(knowledgeBaseDir, 'articles');
	const markdownDir = path.join(knowledgeBaseDir, 'markdown');

	console.log('Knowledge base directory:', knowledgeBaseDir);
	console.log('Target articles directory:', articlesDir);

	if (!fs.existsSync(knowledgeBaseDir)) {
		throw new Error(`Knowledge base directory not found: ${knowledgeBaseDir}`);
	}

	if (!fs.existsSync(articlesDir)) {
		fs.mkdirSync(articlesDir, { recursive: true });
		console.log('Created articles directory');
	}

	if (!fs.existsSync(markdownDir)) {
		fs.mkdirSync(markdownDir, { recursive: true });
		console.log('Created markdown directory');
	}

	const entries = fs.readdirSync(knowledgeBaseDir, { withFileTypes: true });
	let movedCount = 0;

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const dirName = entry.name;
		if (dirName === 'articles') continue;

		const srcDir = path.join(knowledgeBaseDir, dirName);
		const candidates = [
			{ src: path.join(srcDir, 'article.json'), dest: path.join(articlesDir, `${dirName}.article.json`) },
			{ src: path.join(srcDir, 'body.md'), dest: path.join(markdownDir, `${dirName}.body.md`) },
			{ src: path.join(srcDir, 'passages.md'), dest: path.join(markdownDir, `${dirName}.passages.md`) },
		];

		let copiedAny = false;
		for (const { src, dest } of candidates) {
			if (!fs.existsSync(src)) {
				console.warn(`Skipping missing file: ${src}`);
				continue;
			}
			fs.copyFileSync(src, dest);
			console.log(`Copied: ${src} -> ${dest}`);
			copiedAny = true;
		}

		if (copiedAny) movedCount++;
	}

	console.log(`\n✓ Completed. Directories processed: ${movedCount}`);
}

moveArticles()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Error while moving articles:', err);
		process.exit(1);
	});


