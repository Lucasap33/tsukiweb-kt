/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '@tsukiweb/common/tools/convert-scripts/parsers/nscriptr.ts';
import { Block, CommandToken, ConditionToken, LabelToken, ReturnToken, TextToken, Token } from '@tsukiweb/common/tools/convert-scripts/parsers/utils.ts'
import { generateScenes, splitBlocks, writeScenes } from '../utils/nscriptr_convert.ts';
import { logger } from '@tsukiweb/common/tools/utils/logger.ts';
import { fixContexts } from '../utils/context.ts';
import { processVarName, isSceneLabel } from './common.ts';
import { processCondition } from '@tsukiweb/common/tools/convert-scripts/utils.ts';

const outputPathPrefix = '../../../public/static/'
const outputDir = 'scenes'
const fullscripts = [
	['jp', 'fullscript-kt_jp.txt'],
	['en', 'fullscript-kt_en.txt'],
]

//#endregion ###################################################################
//#region                             FIXES
//##############################################################################


//_________________________________token fixes__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const COLOR_IMAGES = new Map(Object.entries({
	'"bg/ima_10"' : '#000000',
	'"bg/ima_11"' : '#ffffff',
}))

function commandFix(token: Token) {
	if (!(token instanceof CommandToken))
		return
	switch (token.cmd) {
		case 'bg' :
			if (COLOR_IMAGES.has(token.args[0]))
				token.args[0] = COLOR_IMAGES.get(token.args[0])!
			break
		case 'mov' :
			token.args[0] = processVarName(token.args[0])!
			if (!token.args[0])
				return false
			break
		case 'gosub' :
		case 'goto' :
			switch (token.args[0]) {
				case "*set_window_mm" : return false // TODO see effect in original game.
				case "*set_window" : return false
				case "*reset_window" : return false
				case "*eroskipeffect" : return false
				default :
					if (/^\*s\d+eroend$/.test(token.args[0]))
						return false
				throw Error(`Unknown gosub target ${token.args[0]}`)
			}
		case 'wave' : case 'waveloop' :
			const m = token.args[0].match(/^"?se(?<n>\d+)"?$/)
			if (m) {
				// se0 -> se_01
				token.args[0] = `se_${String(+m.groups!.n + 1).padStart(2, '0')}`
			} else {
				throw Error(`Unexpected wave id ${token.args[0]}`)
			}
			break
	}
}

const tokenFixes = new Map(Object.entries({
	'dummy': (token: Token)=> {
	},
}))

//_________________________________scene fixes__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const blockFixes = new Map(Object.entries({
	'dummy': (block: Block)=> {
	},
}))
// 1. Put '\' after last text of scenes (fix text skip before choices)
// and selects outside logic file. Remove '@' if present and trailing 'br'.
function cleanSceneEnd(block: Block) {
	let stop = false
	for (let i = block.length-1; i>= 0 && !stop; i--) {
		const token = block.at(i)
		if (token instanceof CommandToken) {
			switch (token.cmd) {
				case 'br':
					block.delete(i) // remove line breaks after last text
					break
				case 'ld'  : case 'bg': case 'cl':
				case 'wait': case '!w':
					stop = true
					break
				case '\\' : case '@' :
					token.cmd = '\\' // convert '@' to '\\'
					stop = true
					break
			}
			if (stop)
				break
		} else if (token instanceof TextToken) {
			if (token.text.endsWith('@'))
				token.text = token.text.substring(0, token.text.length-1)
			block.insert(i+1, new CommandToken(token.lineIndex, '\\'))
			break
		}
	}
}

function sceneFixes(block: Block) {
	//remove '@' before '\\'
	const skipStart = block.findIndex(t=>t instanceof ConditionToken && t.condition.startsWith('%sceneskip'))
	if (skipStart >= 0) {
		const skip = block.at(skipStart+1)
		if (skip instanceof CommandToken && skip.cmd == 'skip') {
			const skipLength = parseInt(skip.args[0])
			const skipEnd = block.findIndex(t=>t.lineIndex >= skip.lineIndex + skipLength)
			block.delete(skipStart, skipEnd-skipStart)
		}
	}
	for (const [token, i] of block) {
		if (token instanceof CommandToken && token.cmd == '\\') {
			const prev = block.at(i-1)
			if (prev instanceof TextToken && prev.text.endsWith('@'))
				prev.text = prev.text.substring(0, prev.text.length-1)
		}
	}
	cleanSceneEnd(block)
}

function eroskip_fixes(pages: ([number, number]|[number]|number)[], block: Block) {
	const pageIndices = [-1] // -1 to insert eroskip at the start if necessary
	for (const [token, i] of block) {
		if (token instanceof CommandToken && token.cmd == '\\')
			pageIndices.push(i)
	}
	for (const entry of pages.reverse()) {
		let start, end;
		if (typeof entry == 'number') {
			start = entry
			end = pageIndices.length
		} else if (entry.length == 1) {
			start = entry[0]
			end = pageIndices.length
		} else {
			[start, end] = entry
		}
		block.insert(pageIndices[start]+1, `eroskip ${+end - start}`);
	}
}

function interScenesFixes(blocks: Map<string, Block>) {
	
	// Merge scene sX with seX
	const sceneEnds = blocks.values().filter(b=>/^se\d+$/.test(b.name))
	for (const block of sceneEnds) {
		blocks.get(`s${block.name.substring(2)}`)?.extend(block)
		block.delete(0, block.length)
		blocks.delete(block.name)
	}
	// Merge quizX_Y into quizX
	for (let i=1; i <= 3; i++) {
		const quiz = blocks.get(`quiz${i}`)!
		for (let j = 1; j <= 10; j++) {
			const subquiz = blocks.get(`quiz${i}_${j}`)!
			quiz.extend(subquiz)
			subquiz.delete(0, subquiz.length)
			blocks.delete(subquiz.name)
		}
	}
}

//#endregion ###################################################################
//#region                            MAIN
//##############################################################################

const kept_commands = [
	'play', 'playstop', 'wave', 'waveloop', 'wavestop', 'mp3loop', 'stop', // audio
	'bg', 'ld', 'cl','quakex', 'quakey', 'monocro', // graphics
	'if', 'skip', 'jumpf', 'jumpb', '~', // in-scene movements
	'gosub', // used for phase transitions
	'@', '\\', 'click', 'br', 'textcolor', // text commands, wait click
	'!w', 'wait', 'waittimer', 'delay', // delay
	'mov', 'add', 'sub', 'inc', 'dec', // set variables
	'lsp', 'lsph', 'vsp', 'print', // replaced with ld, cl or bg
	'select', // used for quiz, to be replaced with special command
]
// TODO: selgosub commands should be removed. They are only useful in KT
// in some contexts (7 occurrences), for which a solution must be found

const ignored_commands = [
	'setwindow', 'windoweffect',
	'setcursor', 'autoclick',
	'selnum',
	'!s', '!sd',
	'resettimer',
	'goto', 'osiete', 'return', 'selgosub', //logic-only commands
	'saveon', 'saveoff', // (en/dis)able saving to improve perf. on NScr engine. Useless here
	'btndef', 'blt', // used in s530, whole section replaced with scrolling background
	'csp', // useless: needs 'print' to work, but immediately followed by bg
	
]
const deleted_scenes = [
	'dummy'
]

function token_filter(token: Token) {
	if (token == null) return false
	if (token instanceof ReturnToken) return false
	if (token instanceof TextToken  ) return true
	if (token instanceof LabelToken) return false
	if (token instanceof ConditionToken) {
		token.condition = processCondition(token.condition, processVarName)!
		if (!token.condition) return false
		return true
	}
	if (token instanceof CommandToken) {
		if (   kept_commands.includes(token.cmd)) return true
		if (ignored_commands.includes(token.cmd)) return false
		throw Error(`unrecognized command ${token.cmd} (line ${token.lineIndex})`)
	}
	throw Error(`Unrecognized token type of ${token}`)
}

function getBlockProps(
		lang_block_fixes: Map<string, (block: Block)=>void>,
		eroskip_pages: Map<string, ([number, number]|[number]|number)[]>,
		label: string) {
	if (!isSceneLabel(label)) {
		return null // logic blocks handled in separate script
	}
	if (deleted_scenes.includes(label)) {
		return null
	}
	const token_fixes = [ token_filter, commandFix ] as Array<(t: Token)=>void|boolean>
	const block_fixes = [ sceneFixes ] as Array<(block: Block)=>void>
	if (tokenFixes.has(label))
		token_fixes.push(tokenFixes.get(label)!)
	if (blockFixes.has(label))
		block_fixes.push(blockFixes.get(label)!)
	if (lang_block_fixes.has(label))
		block_fixes.push(lang_block_fixes.get(label)!)
	if (eroskip_pages.has(label))
		block_fixes.push(eroskip_fixes.bind(undefined, eroskip_pages.get(label)!))
	
	return {
		tokenFixes: token_fixes,
		blockFixes: block_fixes
	}
}
function getFileName(label: string) {
	if (/^s\d+?$/.test(label))
		return `s${label.substring(1).padStart(3, '0')}`
	if (['quiz1', 'quiz2', 'quiz3'].includes(label))
		return label
	
	throw Error(`Unexpected label ${label}`)
}


async function processSingleScript(folder: string, filename: string,
		outputDir: string|null,
		blocksTree: Map<string, {parents: string[], children: string[], endContext: object|null}>) {
	const fullscriptPath = path.join(outputPathPrefix, folder, 'sources', filename)

	if (!fs.existsSync(fullscriptPath)) {
		logger.error(`Input file not found: ${fullscriptPath}`)
		return null
	}

	let txt = fs.readFileSync(fullscriptPath, 'utf-8')
				.replaceAll('\n\t', '\n')
				.replaceAll(/^select\s*(\r?\n([`"][^`"]*[`"],\s*\*\w+,\s*\r?\n)*([`"][^`"]*[`"],\s*\*\w+))$/gm, (m)=> m.replaceAll(/\r?\n/g, ' '))
	let eroskip_pages = {}
	let block_fixes = {}
	let preprocess_module_path = path.join(process.cwd(), outputPathPrefix, folder, 'preprocess.js')
	if (fs.existsSync(preprocess_module_path)) {
		preprocess_module_path = path.relative(import.meta.dirname, preprocess_module_path)
		const lang_module = await import(preprocess_module_path.replaceAll('\\', '/'))
		if ('kt_raw_fixes' in lang_module)
			txt = lang_module.kt_raw_fixes(txt) || txt
		if ('eroskip_pages' in lang_module)
			eroskip_pages = lang_module.eroskip_pages
		if ('block_fixes' in lang_module)
			block_fixes = lang_module.block_fixes
	}
	const tokens = parseScript(txt)
	
	const blocks = splitBlocks(tokens, getBlockProps.bind(undefined,
		new Map(Object.entries(block_fixes)),
		new Map(Object.entries(eroskip_pages))
	))
	interScenesFixes(blocks)
	fixContexts(blocksTree, blocks)
	const fileContents = generateScenes(blocks, getFileName)

	const outputPath = outputDir
		? path.join(outputPathPrefix, folder, outputDir)
		: null

	if (outputPath) {
		const scenesList = new Map(fileContents)
		writeScenes(outputPath, scenesList)
	}
}


export async function main() {

	//1. Retrieve scenes tree
	const treeFilePath = path.join('.', "logic_tree.txt")
	if (!fs.existsSync(treeFilePath))
		throw Error(`Missing tree file. Extract logic first`)
	const treeFileContent = fs.readFileSync(treeFilePath, 'utf-8')
	const tree = new Map(treeFileContent.split('\n').map(line=> {
		line = line.trim()
		if (line.length == 0)
			return null
		const match = line.trim().match(/^(\w+):([^|]*)\|(.*)$/)
		if (!match)
			throw Error(`unable to parse line ${line} from tree file`)
		return [ match[1] as string, {
			parents: match[2].split(',').filter(x=>x) as string[],
			children: match[3].split(',').filter(x=>x) as string[],
			endContext: null as null|object}
		] as const
	}).filter(x=>x != null))

	//2. Extract scenes, fix start contexts
	const totalScripts = fullscripts.length
	let processedCount = 0
	for (const [folder, filename] of fullscripts) {
		processedCount++
		logger.progress(`Processing fullscripts: ${processedCount}/${totalScripts} (${filename})`)
		try {
			await processSingleScript(folder, filename, outputDir, tree)
		} catch (e) {
			logger.error(`Error processing ${filename}: ${(e as Error).message}`)
		}
	}
	logger.progress(`Processing fullscripts: ${processedCount}/${totalScripts}\n`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
	main()
}
