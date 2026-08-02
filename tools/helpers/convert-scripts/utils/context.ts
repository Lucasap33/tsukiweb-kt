import { Block, CommandToken, ConditionToken, LabelToken, TextToken, Token } from "@tsukiweb/common/tools/convert-scripts/parsers/utils.ts";

function processContext(block: Block,
        cmdToProps: (cmd:string, args:string[])=>[object, boolean],
        propsToCmds: (props:Map<string,any>)=>string[],
        previousContexts: object[]) {
    let ctx = new Map()
    let startContext = ctx
    let endContext = null
    for (let [token, i] of block) {
        let delay = false
        if (token instanceof ConditionToken)
            token = token.command
        if (token instanceof TextToken)
            delay = true
        else if (token instanceof CommandToken) {
            let props
            [props, delay] = cmdToProps(token.cmd, token.args)
            for (const [prop, value] of Object.entries(props)) {
                if (ctx == endContext || !ctx.has(prop))
                    ctx.set(prop, value)
            }
        }
        if (delay && ctx == startContext) {
            endContext = ctx = new Map(ctx)
        }
    }
    const missing_props = new Map()
    const overridden_props = []
    for (const ctx of previousContexts) {
        for (const [prop, value] of Object.entries(ctx)) {
            if (!startContext.has(prop)) {
                if (!missing_props.has(prop))
                    missing_props.set(prop, value)
                else if (missing_props.get(prop) != value)
                    throw Error(`Differences in previous end contexts on property ${prop})`)
            } else {
                overridden_props.push(prop)
            }
        }
    }
    const insert = propsToCmds(missing_props)
    block.insert(0, insert.join('\n'))
    // add properties in end context from previous scenes that were not changed in the scene
    for (const [prop, value] of missing_props) {
        if (!endContext!.has(prop)) {
            endContext!.set(prop, value)
        }
    }
    // remove null end context properties that were not specified in end contexts of previous scenes
    for (const [prop, value] of endContext!) {
        if (value == null && !missing_props.has(prop) && !overridden_props.includes(prop))
            endContext!.delete(prop)
    }
    return Object.fromEntries(endContext!.entries())
}

const PROP_CMDS = ['monocro', 'bg', 'a', 'l', 'c', 'r', 'track', 'waveloop']

/**
 * Calculates the context applied by the command, and check if the command
 * introduces a visible delay that ends the start context of the scene.
 * @param cmd command name.
 * @param args command arguments.
 * @returns An array where the first element is the context applied
 *          by the command, and the second element is boolean that is true if
 *          the command introduces a visible delay.
 */
function cmdToProps(cmd: string, args: string[]): [object, boolean] {
	switch (cmd) {
		case 'bg' : {
			const [img, , time] = args
			return [{'bg': img, 'l': null, 'c': null, 'r': null}, +time > 0]
		}
		case 'ld' : {
			const [pos, img, , time] = args
			return [{[pos]: img}, +time > 0]
		}
		case 'cl' : {
			const [pos, , time] = args
			if (pos == 'a')
				return [{'l': null, 'c': null, 'r': null}, +time > 0]
			else
				return [{[pos]: null}, +time > 0]
		}
		case 'play': return [{'track': args[0]}, false]
		case 'playstop' : return [{'track': null}, false]
		case 'waveloop' : return [{'waveloop': args[0]}, false]
		case 'wavestop' : case 'wave' : return [{'waveloop': null}, false]
		case 'monocro' :
			return [{'monocro': (args[0]=='off')? null : args[0]}, false]
		case 'phase' :
			return [{'bg': null, 'l': null, 'c': null, 'r': null,
				'track': null, 'waveloop': null, 'monocro': null}, true]
		case 'wait' : case '!w' : return [{}, true]
		default : return [{}, false]
	}
}

/**
 * Calculate the command to execute at the beginning of the scene to apply
 * the specified context.
 * @param props Context to apply to the scene.
 * @returns The commands to insert in the scene.
 */
function propsToCmds(props: Map<string, any>) {
	const spritePos = ['l', 'c', 'r']
	// If at least one sprite position is specified, but all of them are null:
	if (spritePos.some(p=>props.has(p))
		&& !(spritePos.some(p=> props.get(p) != null))) {
		props = new Map(props) // clone props to avoid side-effects of modifying parameter
		// remove all sprites ...
		props.delete('l')
		props.delete('c')
		props.delete('r')
		if (!props.has('bg')) // ... and specify empty position 'a' if no bg
			props.set('a', null)
	}
	const propsArray = [...props.entries()].sort(([k1,],[k2,])=>{
		return PROP_CMDS.indexOf(k1) - PROP_CMDS.indexOf(k2)
	})
	const insertCmds = propsArray.map(([key, value])=> {
		switch(key) {
			case 'bg' : return `bg ${value || '#000000'},notrans,0`
			case 'a' : case 'l' : case 'c' : case 'r' :
				return value ?
					`ld ${key},${value},notrans,0` :
					`cl ${key},notrans,0`
			case 'track' : return value ? `play ${value}` : `playstop`
			case 'waveloop' : return value ? `waveloop ${value}` : `wavestop`
			case 'monocro' : return `monocro ${value || 'off'}`
		}
	})
	
	return insertCmds.filter(cmd=>cmd) as string[]
}

/**
 * Make sure scenes start with the correct context by re-applying
 * the end context of the previous scene if not set by the scene.
 * @param blocksTree A mapping of all scenes to their parent and child scenes,
 *                   and the context the scene ends with
 * @param blocks A mapping of scene labels to their blocks
 */
export function fixContexts(
        blocksTree: Map<string, {parents: string[], children: string[], endContext: object|null}>,
        blocks: Map<string, Block>) {
    for (const [label, {parents}] of blocksTree) { // nodes are already ordered correctly
        const block = blocks.get(label)
        if (!block)
            throw Error(`Error: no block named ${label}`)
        const parentContexts = parents.map(p=>blocksTree.get(p)!.endContext!)
        if (parentContexts.some((c=>c == null)))
            throw Error(`Incomplete previous contexts of ${label}`)
        try {
            const endContext = processContext(block, cmdToProps, propsToCmds, parentContexts)
            blocksTree.get(label)!.endContext = endContext
        } catch (e) {
            console.error(`error while fixing contexts of ${label}`)
        }
    }
}
