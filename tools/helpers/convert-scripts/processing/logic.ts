/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '@tsukiweb/common/tools/convert-scripts/parsers/nscriptr.ts';
import { Block, CommandToken, ConditionToken, LabelToken, ReturnToken, TextToken, Token } from '@tsukiweb/common/tools/convert-scripts/parsers/utils.ts'
import { generateScenes, splitBlocks } from '../utils/nscriptr_convert.ts';
import { logger } from '@tsukiweb/common/tools/utils/logger.ts';
import { updateGameJsonWithChoices } from '../utils/choices_extractor.ts';
import { isLogicLabel, isSceneLabel, processVarName } from './common.ts';
import { addChoiceCondition, processCondition } from '@tsukiweb/common/tools/convert-scripts/utils.ts';

const outputPathPrefix = '../../../public/static/'
const outputDir = 'scenes'
const fullscripts = [
	['jp', 'fullscript-kt_jp.txt'],
	['en', 'fullscript-kt_en.txt'],
]
const LOGIC_FILE = "logic"
const GEN_CHOICES_JSON = true
const GEN_TREE 		   = true
const GEN_LOGIC 	   = true

//#endregion ###################################################################
//#region                             FIXES
//##############################################################################

const redirected_scenes = {
	dummy : "dummy2",
}

function redirect(token: CommandToken) {
	for (const [i, arg] of token.args.entries()) {
		if (typeof arg == 'string' && arg.startsWith('*')) {
			let label = arg.substring(1)
			if (label in redirected_scenes) {
				label = redirected_scenes[label as keyof typeof redirected_scenes]
				if (!label)
					return false
				token.args[i] = `*${label}`
			}
		}
	}
}

function logic_tokenFixes(token: Token): void|boolean|string {
	if (token instanceof ReturnToken) return false
	if (token instanceof TextToken) return false
	if (token instanceof LabelToken) return true
	if (token instanceof ConditionToken) {
		const condition = processCondition(token.condition, processVarName)
		if (!condition)
			return false
		token.condition = condition
		return true
	}
	if (token instanceof CommandToken) {
		switch (token.cmd) {
			case 'br': case 'selgosub': case 'skip': case '!sd':
				return false// NOTE: 'selgosub' useful 7 times in KT, a solution must be found
			case 'mov': case 'add': case 'sub': case 'inc': case 'dec':
				let varName = processVarName(token.args[0])
				if (!varName) return false
				if (varName)
					token.args[0] = varName
				return true
			case 'gosub':
				
				token.cmd = 'goto'
				if (/^\*s\d+$/.test(token.args[0])) {// gosub *sXXX
					redirect(token)
				}
				return true
			case 'goto':
				return redirect(token);
			case 'select':
				token.args = token.args.map(x=>(x).trim())
				return redirect(token)
			case '\\' :
				return false; // only one occurrence on a failsafe path
			case 'rnd' :
				if (token.args[0] != '%msgno' || token.args[1] != '3')
					throw Error(`Expected arguments "%msgno,3" for "rnd" command`)
				return true
			default:
				throw Error(`Unrecognized command ${token.toString()}`)
		}
	}
	throw Error(`Unrecognized token type of ${token}`)
}
function insertSceneEnd(blocks: Map<string, Block>, block: Block) {
	for (const [token, index] of block) {
		if (token instanceof CommandToken && token.cmd == 'goto') {
			const scene = token.args[0].substring(1) // exclude '*' at the start
			if (isSceneLabel(scene)) {
				if (/^quiz\d$/.test(scene)) {
					debugger;
				} else {
					const sceneEndBlock = block.split(index+1, `${scene}_end`)
					blocks.set(sceneEndBlock.name, sceneEndBlock)
				}
			}
		}
	}
}

const blockFixes: Record<string, (block: Block)=>void> = {
	'f250' : (block)=> {
		let i = block.findIndex(t=>t instanceof CommandToken && t.args.includes("*f256"))
		if (i >= 0) {
			addChoiceCondition(block.at(i)!, "*f256", "%flg6==0")
			i = block.findLastIndex(t=>t instanceof CommandToken && t.cmd == 'select')
			block.delete(i)
		}
	}
}

function getBlockProps(
		lang_block_fixes: Map<string, (block: Block)=>void>,
		label: string) {
	const tFixes = [logic_tokenFixes]
	const bFixes: ((block: Block)=>void)[] = []
	if (Object.hasOwn(blockFixes, label))
		bFixes.push(blockFixes[label])
	if (isLogicLabel(label)) {
		switch (label) {
			case 'dummy' :
				tFixes.push((t)=> { })
				bFixes.push((block)=> { })
				break
			case 'ignored' :
				return null
		}
		if (lang_block_fixes.has(label))
			bFixes.push(lang_block_fixes.get(label)!)
		return { tokenFixes: tFixes, blockFixes: bFixes }
	} else {
		return null
	}
}

function interBlockFixes(blocks: Map<string, Block>) {
	for (const block of blocks.values()) {
		insertSceneEnd(blocks, block)
	}
	{ // f135 handles quiz result. Move to quiz_end
		
		const s135_end = blocks.get('s135_end')!
		const i = s135_end.indexOf('goto *quiz')
		if (i < 0) throw Error(`Expected 'gosub *quiz' in f135`)
		const quizEnd = s135_end.split(i+1, 'quiz_end')
		blocks.set('quiz_end', quizEnd)
	}

	//sort block again
	const entries = [...blocks.entries()].sort(([_1, b1], [_2, b2])=>b1.firstLineIndex - b2.firstLineIndex)
	blocks.clear()
	for (const [label, block] of entries) {
		blocks.set(label, block)
	}
}

//#endregion ###################################################################
//#region                       SIDE GENERATIONS
//##############################################################################

const destinationRegex = /^((\[[^\]]+\])|(\([^\]]+\)))?\*(?<target>\w+)$/ // [...]*X | (...)*X | *X

function extractDestinations(token: Token) {
	if (token instanceof ConditionToken)
		token = token.command
	if (!(token instanceof CommandToken))
		return []
	return token.args.map((a: string)=> {
		return a.match(destinationRegex)?.groups!.target ?? null
	}).filter(a=>a != null)
}

function genTree(blocks: Map<string, Block>) {
	//1. extract block children links
	const tree = new Map(Array.from(blocks.entries()).map(([label, block], i)=> {
		const children = block.tokens.flatMap(extractDestinations)
		const scenes = children.filter(lbl=>isSceneLabel(lbl))
		const others = [...new Set(children.filter(lbl=>!scenes.includes(lbl) && lbl != 'endofplay')).values()]
		return [label, {scenes, children: new Set(others), parents: new Set<string>(), index: -1}]
	}))
	//2. add link to parent
	for (const [label, {children}] of tree.entries()) {
		for (const child of children) {
			if (!tree.has(child))
				debugger;
			tree.get(child)!.parents.add(label)
		}
	}
	//3. move links before scenes to parent nodes, link to skip nodes
	for (const [label, {scenes, children, parents}] of tree.entries()) {
		if (scenes.length > 0) {
			if (children.size > 0) {
				if (parents.size == 0)
					throw Error(`link before scenes ${scenes}, but no parent`)
				for (const parent of parents) {
					const parentNode = tree.get(parent)!
					for (const child of children)
						parentNode.children.add(child)
					// link from parent to scene is kept
				}
				for (const child of children) {
					const childNode = tree.get(child)!
					for (const parent of parents)
						childNode.parents.add(parent)
					childNode.parents.delete(label) // delete link from scene to child (might be restored in skip)
				}
				children.clear()
			}
			let endLabel
			if (scenes.length > 1) {
				if (scenes.some(lbl=>!(/^quiz\d$/.test(lbl))))
					throw Error(`Unexpected multiple scenes for node ${label}`)
				endLabel = "quiz_end"
			} else {	
				endLabel = `${scenes[0]}_end`
			}
			
			const endNode = tree.get(endLabel)
			if (!endNode)
				throw Error(`missing ${endLabel} for scenes ${scenes}`)
			endNode.parents.add(label)
			children.add(endLabel)
		}
	}
	//4. bypass non-scene blocks
	for (const [label, {scenes, parents, children}] of tree.entries()) {
		if (scenes.length == 0) {
			for (const child of children) {
				const childNode = tree.get(child)!
				for (const parent of parents)
					childNode.parents.add(parent)
			}
			for (const parent of parents) {
				const parentNode = tree.get(parent)!
				for (const child of children)
					parentNode.children.add(child)
			}
			for (const parent of parents)
				tree.get(parent)!.children.delete(label)
			for (const child of children)
				tree.get(child)!.parents.delete(label)
		}
	}
	tree.get('f500')?.children.forEach(lbl=>tree.get(lbl)!.index = 0)


	//5. determine order index, easier for creating contexts when parsing scenes
	const queue = Array.from(tree.get('f500')!.children, lbl=>tree.get(lbl))
	while (queue.length > 0) {
		const currentNode = queue.shift()!
		for (const child of currentNode.children) {
			const node = tree.get(child)!
			if (node.index >= 0) continue
			let index = -1
			for (const parent of node.parents) {
				const parentNode = tree.get(parent)!
				if (parentNode.index < 0) {
					index = -1
					break
				} else {
					index = Math.max(index, parentNode.index)
				}
			}
			if (index >= 0) {
				node.index = index+1
				queue.push(node)
			}
		}
	}
	//6. filter and sort labels
	const sceneNodes = Array.from(tree.values()).filter(({scenes})=>scenes.length > 0)
		 .sort(({index: i1}, {index: i2})=>i1 - i2)

	return sceneNodes.map(({scenes, parents, children, index})=> {
		if (index < 0) throw Error(`node of ${scenes} was not assigned an index`)
		const pStr = Array.from(parents.values(), l=>tree.get(l)!.scenes).flat().sort().join(',')
		const cStr = Array.from(children.values(), l=>tree.get(l)!.scenes).flat().sort().join(',')
		return scenes.map(s=>`${s}:${pStr}|${cStr}`)
	}).flat().join('\n')
}

function extractChoices(blocks: Map<string, Block>) {
	return Object.fromEntries(Array.from(blocks.entries(), ([label, block])=> {
		const selects = block.filter(t => t instanceof CommandToken && t.cmd == 'select') as CommandToken[]
		if (selects.length == 0)
			return null
		if (selects.length > 1)
			throw Error(`multiple 'select' in label ${label}`)
		const [select] = selects
		const args = select.args

		// Labels may also contain disable or hide conditions
		const isText = (a: string)=> !['*', '(', '['].includes(a.charAt(0))

		const texts = args.filter(isText).map(txt => {
			const startChar = txt.charAt(0)
			if (startChar == '`')
				txt = txt.substring(1, txt.length-1)
			return txt
		})
		const labels = args.filter(a => !isText(a))
		select.args = labels
		return [label.replace('_end', ''), texts]
	}).filter(x=>x != null))
}


//#endregion ###################################################################
//#region                             MAIN
//##############################################################################

/**
 * @returns blocks tree, choice texts, logic script
 */
async function processSingleScript(folder: string, filename: string): Promise<[string, Record<string, string[]>, string]> {
	const fullscriptPath = path.join(outputPathPrefix, folder, filename)

	if (!fs.existsSync(fullscriptPath)) {
		const errMsg = `Input file not found: ${fullscriptPath}`
		logger.error(errMsg)
		throw Error(errMsg)
	}

	let txt = fs.readFileSync(fullscriptPath, 'utf-8')
				.replaceAll('\n\t', '\n')
				.replaceAll(/^select\s*(\r?\n([`"][^`"]*[`"],\s*\*\w+,\s*\r?\n)*([`"][^`"]*[`"],\s*\*\w+))$/gm, (m)=> m.replaceAll(/\r?\n/g, ' '))
	let block_fixes = {}
	let preprocess_module_path = path.join(process.cwd(), outputPathPrefix, folder, 'preprocess.js')
	if (fs.existsSync(preprocess_module_path)) {
		preprocess_module_path = path.relative(import.meta.dirname, preprocess_module_path)
		const lang_module = await import(preprocess_module_path.replaceAll('\\', '/'))
		if ('raw_fixes' in lang_module)
			txt = lang_module.th_raw_fixes(txt) || txt
		if ('block_fixes' in lang_module)
			block_fixes = lang_module.block_fixes
	}
	const tokens = parseScript(txt)
	const blocks = splitBlocks(tokens, getBlockProps.bind(undefined,
		new Map(Object.entries(block_fixes))
	))
	interBlockFixes(blocks)
	const tree = genTree(blocks)
	const choices = extractChoices(blocks)
	const fileContents = generateScenes(blocks, ()=>LOGIC_FILE)

	return [tree, choices, fileContents.get(LOGIC_FILE)!]
}

export async function main() {
	const totalScripts = fullscripts.length
	let logicScript = null
	let blocksTree = null

	let processedCount = 0
	for (const [folder, filename] of fullscripts) {
		processedCount++
		logger.progress(`Processing logic scripts: ${processedCount}/${totalScripts} (${filename})`)

		try {
			//1. Extract blocks tree, choice texts and logic script
			const [tree, choices, logicContent] = await processSingleScript(folder, filename)

			//2. Compare blocks tree and logic script with previous languages
			if (blocksTree == null && logicScript == null)
				[blocksTree, logicScript] = [tree, logicContent]
			else if (logicScript != logicContent || blocksTree != tree)
				throw Error(`logic script from language ${folder} does not match previous languages`)

			//3. Update language game.json with choice texts
			if (GEN_CHOICES_JSON) {
				const gameJsonPath = path.join(outputPathPrefix, folder, 'game.json')
				updateGameJsonWithChoices(gameJsonPath, choices)
			}
		} catch (e) {
			logger.error(`Error processing ${filename}: ${(e as Error).message}`)
			throw e
		}
	}
	logger.progress(`Processing logic scripts: ${processedCount}/${totalScripts}\n`)

	//4. Save logic script file and blocks tree
	if (GEN_LOGIC) {
		const centralLogicPath = path.join(outputPathPrefix, LOGIC_FILE + '.txt')
		const dir = path.dirname(centralLogicPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		fs.writeFileSync(centralLogicPath, logicScript!)
	}
	if (GEN_TREE) {
		fs.writeFileSync(path.join('.', "logic_tree.txt"), blocksTree!)
	}
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
	main()
}
export { LOGIC_FILE }
