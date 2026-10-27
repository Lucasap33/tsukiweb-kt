import {switch_regex, processCondition as _processCondition} from "@tsukiweb/common/tools/convert-scripts/utils.ts"
const CONDITION_REGEXP = /^(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))$/

function preprocessRawScript(text: string) {
	return text
		.replaceAll('ren_e01z', 'ren_e01')
		.replaceAll('ren_e05z', 'ren_e05')
		.replaceAll('yume_e01z', 'yume_e01')
		.replaceAll('yume_e03z', 'yume_e03')
		.replaceAll('yume_e04z', 'yume_e04')
		.replaceAll('yume_e06z', 'yume_e06a')
		.replaceAll('yume_e16z', 'yume_e16')
		.replaceAll('yume_e19z', 'yume_e19')
}

function isLogicLabel(label: string) {
	return /^(f|skip)\d+$/.test(label)
		|| /^twilight_(ep|op(_\d)?)$/.test(label)
		|| ["quiz"].includes(label)
}
function isSceneLabel(label: string) {
	return /^se?\d+$/.test(label) || ['openning', 'eclipse'].includes(label) || /^quiz\d(_\d+)?$/.test(label)
}

function processVarName(varName: string) {
	return switch_regex(varName, [
		[/^%twilight/,null],
		["%finish_ep",null],
		[/^%guest_image/, null], // remove guest images unlocks
		//["%sceneskip"			, null], // ignore sceneskip tests
		[/^%pointflg\d{1,3}$/	, null], // special variables used to increase unreset points
		[/^%yume\d+$/, null], // yume scenes unlock uses veiwed scenes
		[/^%([a-z_]+)_point$/	, (m: RegExpMatchArray)=> {
			switch (m[1]) {
				case 'ren' : case 'ark'	: case 'akira': case 'gojitsudan' :
				case 'kagi': case 'kaibyo': case 'answer': return m[0]
				case 'hisui'	: return '%his_point'
				case 'ciel'		: return '%cel_point'
				case 'nanako'	: return '%nana_point'
				case 'akiha'	: return '%aki_point'
				case 'kissa'	: return '%flg_kissa'
				case 'kashiisyo': return '%flg_kashiisyo'
				case 'eigakan'	: return '%flg_eigakan'
				case 'onemu'	: return '%flg_onemu'
				case 'syashin'	: return '%flg_syashin'
				case 'bunka_info': return '%flg_bunka'
			}
			throw Error(`regard variable ${m[0]} not recognized`)
		}],
		// keep all other variables as-is
	], varName)
}

function processCondition(condition: string): string|null {
	condition = condition.trim()
	/** @type {string[]} */
	let subConditions = condition.split('&&')
	if (subConditions.length > 1)
		return subConditions.map(processCondition).filter(c => c).join(' && ')
	subConditions = condition.split('||')
	if (subConditions.length > 1)
		return subConditions.map(processCondition).filter(c => c).join(' || ')
	let match = CONDITION_REGEXP.exec(condition)
	if (!match) throw Error(
		`Unable to parse condition "${condition}"`)

	let {lhs, op, rhs} = match.groups as Record<'lhs'|'op'|'rhs', string|null>
	if (lhs!.startsWith('%'))
		lhs = processVarName(lhs!)
	if (rhs!.startsWith('%'))
		rhs = processVarName(rhs!)
	if (!lhs || !rhs)
		return null
	return `${lhs}${op}${rhs}`
}

export {
	preprocessRawScript,
	isLogicLabel,
	isSceneLabel,
    processVarName,
	processCondition
}