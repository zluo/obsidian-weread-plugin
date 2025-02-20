import { Notice, parseYaml, stringifyYaml, TFile } from 'obsidian';
import type { Notebook } from '../models';
import { formatTimeDuration, formatTimestampToDate } from './dateUtil';

type FrontMatterContent = {
	doc_type: string;
	bookId: string;
	author: string;
	cover: string;
	noteCount: number;
	reviewCount: number;
	readingStatus?: string;
	progress?: string;
	readingTime?: string;
	totalReadDay?: number;
	readingDate?: string;
	finishedDate?: string;
};

export const frontMatterDocType = 'weread-highlights-reviews';

enum ReadingStatus {
	'未标记' = 1,
	'在读' = 2,
	'读过' = 3,
	'读完' = 4
}

export const buildFrontMatter = (
	markdownContent: string,
	noteBook: Notebook,
	existFile?: TFile
) => {
	const frontMatter: FrontMatterContent = {
		doc_type: frontMatterDocType,
		bookId: noteBook.metaData.bookId,
		author: noteBook.metaData.author,
		cover: noteBook.metaData.cover,
		reviewCount: noteBook.metaData.reviewCount,
		noteCount: noteBook.metaData.noteCount
	};

	const readInfo = noteBook.metaData.readInfo;
	if (readInfo) {
		frontMatter.readingStatus = ReadingStatus[readInfo.markedStatus];
		frontMatter.progress = readInfo.readingProgress + '%';
		frontMatter.totalReadDay = readInfo.totalReadDay;
		frontMatter.readingTime = formatTimeDuration(readInfo.readingTime);
		frontMatter.readingDate = formatTimestampToDate(readInfo.readingBookDate);
		if (readInfo.finishedDate) {
			frontMatter.finishedDate = formatTimestampToDate(readInfo.finishedDate);
		}
	}
	let existFrontMatter = Object();
	if (existFile) {
		const cache = app.metadataCache.getFileCache(existFile);
		existFrontMatter = cache.frontmatter;
		if (existFrontMatter === undefined) {
			new Notice('weread front matter invalid');
			throw Error('weread front matter invalid');
		}
		delete existFrontMatter['position'];
	}

	const idx = markdownContent.indexOf('---');
	let templateFrontMatter = Object();
	if (idx !== -1) {
		const startInd = markdownContent.indexOf('---') + 4;
		const endInd = markdownContent.substring(startInd).indexOf('---') - 1;
		const templateYmlRaw = markdownContent.substring(startInd, startInd + endInd);
		templateFrontMatter = parseYaml(templateYmlRaw);
		const freshMarkdownContent = markdownContent.substring(endInd + 4);
		const freshFrontMatter = { ...existFrontMatter, ...frontMatter, ...templateFrontMatter };
		const frontMatterStr = stringifyYaml(freshFrontMatter);
		return '---\n' + frontMatterStr + freshMarkdownContent;
	}

	const frontMatterStr = stringifyYaml(frontMatter);
	return '---\n' + frontMatterStr + '---\n' + markdownContent;
};
