import "../styles/progress.scss"
import { ReactNode, useCallback, useEffect, useState } from "react"
import { dialog } from "@tsukiweb/common/ui-core/components/ModalPrompt"
import { getLocale, useStrings } from "translation/lang"
import { settings } from "engine/settings"
import { Button, Modal } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { GameProgress, PointId } from "app/utils/types"
import { MdAddCircleOutline, MdArrowBack, MdCheck, MdClose, MdDeleteOutline, MdPlayArrow } from "react-icons/md"
import { KtFlagBadge, KtPointBadge } from "assets/icons/badges"
import { useEventActions } from "@tsukiweb/common/input/eventActions"
import { savesKeyMap } from "features/game/utils/keybind"

type Props = {
	show: boolean
	onSelect: (progress: GameProgress|undefined)=>void
	progress?: GameProgress
}

const POINTS = ["ren", "nana", "his", "kagi", "kaibyo"] as const
const FLAGS = [..."12345678ABCDEFGHIJKLMNOPQZ", "quiz1", "quiz2", "quiz3"]

const LOOP_ARC = <>
	<path d="M3 13V7A4 4 0 0 1 7 3H33A4 4 0 0 1 37 7V10" fill="none"/>
	<path d="M37 17L32.2 9.5H41.8z" stroke="none"/>
</>
const LoopArrows = ()=>
	<svg viewBox="-2 0 44 28" aria-hidden>
		{LOOP_ARC}
		<g transform="rotate(180 20 14)">{LOOP_ARC}</g>
	</svg>

const Diff = ({v1, v2, className = "", children}: {v1: number, v2: number,
		className?: string, children: ReactNode})=>
	<span className={`${className}${v1 == v2 ? "" : ` diff ${v2 > v1 ? "up" : "down"}`}`}>
		{children}
	</span>

const DiffPointBadge = ({name, v1 = 0, v2 = v1}: {name: PointId, v1?: number, v2?: number})=>
	<span className={`point${v1 || v2 ? "" : " empty"}`}>
		<KtPointBadge name={name} value={Math.sign(v2 - v1)}/>
		<Diff v1={v1} v2={v2} className="value">&times;{v2}</Diff>
	</span>

const DiffFlagBadge = ({flag, v1 = false, v2 = v1}: {flag: string, v1?: boolean, v2?: boolean})=> {
	const state = v1 && v2 ? "set"
		: v1 ? "lost"
		: v2 ? "gained"
		: "unset"
	return (
		<KtFlagBadge flag={flag} negative={state == "lost"} className={`badge ${state}`}/>
	)
}

type DisplayProps = {
	progress: GameProgress
	change?: GameProgress
	label?: string
}
const ProgressDisplay = ({progress, change, label}: DisplayProps)=> {
	const {lastSave, count, points, flags} = progress
	const date = lastSave ? new Date(lastSave) : undefined
	const flagCount = (p: GameProgress)=> p.flags.filter(f => FLAGS.includes(f)).length
	const percent = (p: GameProgress)=> Math.round(flagCount(p) * 100 / FLAGS.length)
	return <>
		<div className="progress-header">
			{date ?
				<time dateTime={date.toISOString()} className="progress-date">
					{date.toLocaleDateString(getLocale())} {date.toLocaleString(getLocale(), {hour: 'numeric', minute: '2-digit'})}
				</time>
			:	<span className="progress-date">
					<MdAddCircleOutline aria-hidden/> {label}
				</span>
			}
			<span className="progress-count">
				<span className="loop">
					<LoopArrows/>
					<Diff v1={count} v2={change?.count ?? count}>{change?.count ?? count}</Diff>
				</span>
			</span>
		</div>
		{settings.flowchartBadges ? <>
			<div className="progress-points">
				{POINTS.map(x=>
					<DiffPointBadge key={x} name={x}
						v1={points[x]} v2={change ? change.points[x] ?? 0 : undefined}/>
				)}
			</div>
			<div className="progress-flags">
				<div className="progress-flags-grid">
					{FLAGS.map(f=>
						<DiffFlagBadge key={f} flag={f}
							v1={flags.includes(f)} v2={change?.flags.includes(f)}/>
					)}
				</div>
			</div>
		</> :
			<Diff v1={percent(progress)} v2={percent(change ?? progress)} className="progress-percent">
				{percent(change ?? progress)}%
			</Diff>
		}
	</>
}
type ProgressButtonProps = {
	progress?: GameProgress
	newProgress?: GameProgress
} & Parameters<typeof Button>[0]

const ProgressButton = ({progress, newProgress, className, active, ...props}: ProgressButtonProps)=> {
	const [displayDiff, setDisplayDiff] = useState(0)
	const strings = useStrings()
	const onEnter = useCallback(()=> {
		setDisplayDiff(displayDiff+1)
	}, [])
	const onLeave = useCallback(()=> {
		setDisplayDiff(displayDiff-1)
	}, [])

	return <Button
		variant="select"
		onFocus={onEnter} onPointerEnter={onEnter}
		onBlur={onLeave} onPointerLeave={onLeave}
		className={`progress ${className ?? ""}`}
		audio={audio}
		clickSound="glass"
		nav-auto={1} {...props}
	>
		{progress ?
			<ProgressDisplay progress={progress}
				change={(displayDiff > 0 || active) ? newProgress : undefined}/>
		: newProgress ?
			<ProgressDisplay progress={{...newProgress, lastSave: 0}}
				label={strings.saves.create}/>
		: <>
			<MdAddCircleOutline aria-hidden/>
			{strings.saves.create}
		</>}
	</Button>
}

const ModalProgressSelection = ({show, onSelect, progress}: Props) => {
	const strings = useStrings()
	const [selected, setSelected] = useState<GameProgress|undefined>(undefined)

	const progresses = settings.progresses
	const empty: GameProgress = { flags: [], points: {}, count: 0, lastSave: 0 }
	const newProgress = progress
	const isEmptySelected = selected != undefined && !progresses.includes(selected)
	const deleteEnabled = show && !progress && selected != undefined && !isEmptySelected

	const handleDeleteProgress = useCallback(async (progress: GameProgress) => {
		const confirmed = await dialog.confirm({
			text: strings.saves["delete-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
			color: "#ab0000"
		})
		if (confirmed) {
			const i = settings.progresses.indexOf(progress)
			settings.progresses.splice(i, 1)
			setSelected(undefined)
		}
	}, [strings])

	useEventActions(savesKeyMap, (action: string)=> {
		if (action == "delete") {
			handleDeleteProgress(progress!)
			return true
		}
		return false
	}, document, {capture: true}, deleteEnabled,
	[progress, handleDeleteProgress])
	const onClick = useCallback((p: GameProgress)=> {
		if (selected == p) {
			setSelected(undefined)
			onSelect(p)
		} else {
			setSelected(p)
		}
	}, [selected])

	return (
		<Modal
			show={show}
			onRequestClose={() => { onSelect(undefined) }}
			className="progress-modal"
		>
			<div className="progresses">
				{progresses.map((progress, i) =>
					<ProgressButton key={i}
						progress={progress} newProgress={newProgress}
						onClick={onClick.bind(undefined, progress)}
						active={selected == progress}
						className={selected == progress ? " selected" : ""}/>
				)}
				
				<ProgressButton newProgress={newProgress}
					onClick={onClick.bind(undefined, empty)}
					active={isEmptySelected}
					className={`create${isEmptySelected ? " selected" : ""}${newProgress ? " preview" : ""}`}/>
			</div>

			<div className="buttons">
				<Button onClick={()=> {
						setSelected(undefined)
						onSelect(undefined)
					}}
					nav-auto={1}
					audio={audio}
				>
					{newProgress ? <MdClose/> : <MdArrowBack/>}
				</Button>
				{selected && <>
					<div className="separator"/>
					<Button onClick={onSelect.bind(undefined, selected)}
						nav-auto={1}
						audio={audio}
						className={"accept"}
					>
						{newProgress ? <MdCheck/> : <MdPlayArrow/>}
						
					</Button>
				</>}
				{deleteEnabled && <>
					<div className="separator"/>
					<Button onClick={handleDeleteProgress.bind(undefined, selected)}
						nav-auto={1}
						audio={audio}
					>
						<MdDeleteOutline/>
					</Button>
				</>}
			</div>
		</Modal>
	)
}

export default ModalProgressSelection
