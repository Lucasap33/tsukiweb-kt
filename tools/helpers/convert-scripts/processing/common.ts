import {switch_regex, processCondition as _processCondition} from "@tsukiweb/common/tools/convert-scripts/utils.ts"
const CONDITION_REGEXP = /^(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))$/

function isLogicLabel(label: string) {
	return /^(f|skip)\d+$/.test(label) || /^quiz(\d(_\d(true|false))?)?$/.test(label)
}
function isSceneLabel(label: string) {
	return /^s\d+$/.test(label) || ['openning', 'eclipse'].includes(label) || /^quiz\d(_\d)?$/.test(label)
}

function processVarName(varName: string) {
	return switch_regex(varName, [
		["%sceneskip"			, null], // ignore sceneskip tests
		[/^%pointflag\d{2,3}$/	, null], // special variables used to increase unreset points
		[/^%([a-z]+)_point/	, (m: RegExpMatchArray)=> {
			switch (m[1]) {
				case 'ren' : case 'ark'	: case 'gojitsudan' : case 'kagi': case 'answer': case 'akira': return m[0]
				case 'akiha'	: return '%aki_point'
				case 'kohaku'	: return '%koha_point'
				case 'hisui'	: return '%his_point'
				case 'ciel'		: return '%cel_point'
				case 'kaibyo'	: return '%kaibyo_point'
				case 'nanako'	: return '%nana_point'
				case 'kissa'	: return '%flg_kissa'
				case 'kashiisyo': return '%flg_kashiisyo'
				case 'eigakan'	: return '%flg_eigakan'
				case 'onemu'	: return '%flg_onemu'
				case 'syashin'	: return '%flg_syashin'
			}
			throw Error(`regard variable ${m[0]} not recognized`)
		}],
		// ignore all other variables
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
	isLogicLabel,
	isSceneLabel,
    processVarName,
	processCondition
}