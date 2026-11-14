import { memo, RefObject, useEffect, useRef, useState } from "react"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { ChoicesMenu } from "@tsukiweb/common/choices"
import { audio } from "engine/audio"
import { checkIfCondition } from "@tsukiweb/common/script/utils"
import { Choice, LabelName } from "app/utils/types";
import { strings } from "translation/lang";
import { history } from "engine/history"
import { VarName } from "@tsukiweb/common/script/types";

type SelectionCallback = (choice: Choice)=>void

//##############################################################################
//#region                       COMMAND HANDLERS
//##############################################################################


function processChoices<T extends Array<Choice<any>>>(
			setChoices: (choices: Choice[])=>void,
			setText: (text: string)=>void,
			onSelectionRef: RefObject<SelectionCallback | undefined>,
			onSelection: SelectionCallback,
			text: string, choices: T,
			onFinish: VoidFunction
		) {
	onSelectionRef.current = (choice)=> {
		//console.debug(choice)
		onSelectionRef.current = undefined
		onSelection(choice)
		setChoices([])
		onFinish()
		history.onChoiceSelected(choice.index)
	}

	if (choices.length == 1)
		onSelectionRef.current(choices[0])
	else {
		setText(text)
		setChoices(choices)
		
		history.onChoicePrompt(text, choices)
		return {
			next: ()=>{}, // prevent continuing to next instruction
		}
	}
}

function processSelect(setChoices: (choices: Choice[])=>void,
					   setText: (text: string)=>void,
					   onSelection: RefObject<SelectionCallback|undefined>,
					   arg: string, _cmd: string, script: ScriptPlayer,
					   onFinish: VoidFunction) {
	const currentLabel = script.currentLabel.replace(/_end$/, '') as LabelName
	const labels = arg.split(',')
	const choices: Choice<LabelName>[] = labels.map((item, index) => {
		const m = item.match(/^(\([^\)]*\))?(\[[^\]]*\])?(\*\w+)$/)
		if (!m)
			throw Error(`Unable to parse choice entry "${item}"`)
		const hideCondition = m[1]?.substring(1, m[1]!.length-1) // remove ()
		const disableCondition = m[2]?.substring(1, m[2]!.length-1) // remove []
		const label = m[3] as LabelName
		if (!label)
			throw Error(`missing label in ${item}`)
		if (hideCondition && !checkIfCondition(hideCondition, script))
			return null
		const disable = disableCondition ?
			!checkIfCondition(disableCondition, script)
			: false
		return {
			index,
			str: strings.choices[currentLabel]![index],
			value: label,
			disable
		}
	}).filter(x => x != null)

	return processChoices(setChoices, setText, onSelection, (choice)=>{
		script.setNextLabel(choice.value)
		script.skipCurrentBlock()
	}, "", choices, onFinish)
}

function processPrompt(setChoices: (choices: Choice[])=>void,
			setText: (text: string)=>void,
			onSelection: RefObject<SelectionCallback|undefined>,
			arg: string, _cmd: string, script: ScriptPlayer,
			onFinish: VoidFunction	
		) {
	let m = arg.match(/^(?<var>[%$]\w+),\s*`(?<text>[^`]+)`,/)
	if (!m)
		throw Error(`Ill-formated 'prompt' argument`)
	const varName = m.groups!['var']
	const text = m.groups!['text']
	arg = arg.substring(m[0].length)
	const choices: Choice<string|number>[] = Array.from(
		arg.matchAll(/,?`(?<text>[^`]*)`,\s*(?<val>[^,]),?/g),
		(m, index)=> {
			let {text, val} = m.groups! as {text: string, val: string|number}
			if (varName.startsWith('%'))
				val = parseInt(val as string)
			return {
				str: text, value: val, index
			} as Choice
		}
	)
	return processChoices(setChoices, setText, onSelection, (choice)=> {
		script.writeVariable(varName as VarName, choice.value)
	}, text, choices, onFinish)
}

//#endregion ###################################################################
//#region                           COMPONENT
//##############################################################################

type Props = {
	script: ScriptPlayer
	display: boolean
	navigable: boolean
}

const ChoicesLayer = ({script, display, navigable}: Props) => {
	const [choices, setChoices] = useState<Choice[]>([])
	const [text, setText] = useState<string>("")
	const onSelection = useRef<SelectionCallback|undefined>(undefined)

	useEffect(()=> {
		script.setCommand('select',
			processSelect.bind(null, setChoices, setText, onSelection))
		script.setCommand('prompt',
			processPrompt.bind(null, setChoices, setText, onSelection))
	}, [script])

	return (
		<ChoicesMenu
			show={display && choices.length > 0}
			id="layer-choices"
			className="layer"
			choices={choices}
			question={text}
			onSelect={choice => onSelection.current?.(choice)}
			navigable={navigable}
			audio={audio}
		/>
	)
}

export default memo(ChoicesLayer)