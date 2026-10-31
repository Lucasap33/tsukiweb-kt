import "../styles/progress.scss"
import { useCallback, useEffect, useState } from "react"
import { dialog } from "@tsukiweb/common/ui-core/components/ModalPrompt"
import { getLocale, useStrings } from "translation/lang"
import { settings } from "engine/settings"
import { Button, Modal } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { GameProgress, PointId } from "app/utils/types";
import { MdAddCircleOutline } from "react-icons/md";
import { KtFlagBadge, KtPointBadge } from "assets/icons/badges";

type Props = {
	show: boolean
	onSelect: (progress: GameProgress|undefined)=>void
	progress?: GameProgress
}

const POINTS = ["ren", "nana", "kagi", "kaibyo"] as const
const FLAGS = Array.from("12345678ABCDEFGHIJKLMNOPQZ")

const LOOP_ARC = <>
	<path d="M3 13V7A4 4 0 0 1 7 3H33A4 4 0 0 1 37 7V10" fill="none"/>
	<path d="M37 17L32.2 9.5H41.8z" stroke="none"/>
</>
const LoopArrows = ()=>
	<svg viewBox="-2 0 44 28" aria-hidden>
		{LOOP_ARC}
		<g transform="rotate(180 20 14)">{LOOP_ARC}</g>
	</svg>

const Diff = ({v1, v2, unit = ""}: {v1: number, v2: number, unit?: string})=>
	v1 == v2 ? null :
	<span className={`diff ${v2 > v1 ? "up" : "down"}`}>&rarr;{v2}{unit}</span>

const DiffPointBadge = ({name, v1 = 0, v2 = v1}: {name: PointId, v1?: number, v2?: number})=> {
	const changed = v2 != v1
	return (
		<span className={`point${v1 || v2 ? "" : " empty"}`}>
			<KtPointBadge name={name} value={changed ? Math.sign(v2 - v1) : 0}/>
			<span className={`value${changed ? ` diff ${v2 > v1 ? "up" : "down"}` : ""}`}>
				&times;{v2}
			</span>
		</span>
	)
}

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
					{count}
				</span>
				{change && <Diff v1={count} v2={change.count}/>}
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
			<div className="progress-percent">
				{percent(progress)}%
				{change && <Diff v1={percent(progress)} v2={percent(change)} unit="%"/>}
			</div>
		}
	</>
}

const ModalProgressSelection = ({show, onSelect, progress}: Props) => {
	const strings = useStrings()
	const [selected, setSelected] = useState<GameProgress|undefined>(undefined)

	const progresses = settings.progresses
	const empty: GameProgress = { flags: [], points: {}, count: 0, lastSave: 0 }
	const newProgress = progress
	const isEmptySelected = selected != undefined && !progresses.includes(selected)

	const handleDeleteProgress = useCallback(async (progress: GameProgress) => {
		const confirmed = await dialog.confirm({
			text: strings.saves["delete-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
			color: "#ab0000"
		})
		if (confirmed) {
			settings.progresses = settings.progresses.filter(p => p != progress)
			setSelected(undefined)
		}
	}, [strings])

	useEffect(() => {
		if (!show) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Delete" && selected && settings.progresses.includes(selected))
				handleDeleteProgress(selected)
		}
		window.addEventListener("keydown", onKeyDown, true)
		return () => window.removeEventListener("keydown", onKeyDown, true)
	}, [show, selected, handleDeleteProgress])

	return (
		<Modal
			show={show}
			onRequestClose={() => { onSelect(undefined) }}
			className="progress-modal"
		>
			<div className="progresses">
				{progresses.map((progress, i) =>
					<Button
						key={i}
						variant="select"
						onClick={setSelected.bind(undefined, progress)}
						onDoubleClick={onSelect.bind(undefined, progress)}
						className={`progress${selected == progress ? " selected" : ""}`}
						active={selected == progress}
						audio={audio}
						clickSound="glass"
						nav-auto={1}
					>
						<ProgressDisplay progress={progress}
							change={selected == progress ? newProgress : undefined}/>
					</Button>
				)}

				<Button
					variant="select"
					onClick={setSelected.bind(undefined, empty)}
					onDoubleClick={onSelect.bind(undefined, empty)}
					className={`progress create${isEmptySelected ? " selected" : ""}${isEmptySelected && newProgress ? " preview" : ""}`}
					active={isEmptySelected}
					audio={audio}
					clickSound="glass"
					nav-auto={1}
				>
					{isEmptySelected && newProgress ?
						<ProgressDisplay progress={{...newProgress, lastSave: 0}} label={strings.saves.create}/>
					: <>
						<MdAddCircleOutline aria-hidden/>
						{strings.saves.create}
					</>}
				</Button>
			</div>

			<div className="buttons">
				<Button onClick={onSelect.bind(undefined, undefined)}
					nav-auto={1}
					audio={audio}
				>
					{strings.close}
				</Button>
				<div className="separator"/>
				<Button onClick={onSelect.bind(undefined, selected)}
					nav-auto={1}
					audio={audio}
					disabled={selected == undefined}
				>
					{strings.ok}
				</Button>
			</div>
		</Modal>
	)
}

export default ModalProgressSelection
