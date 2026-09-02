import { memo, useCallback, useLayoutEffect, useRef } from 'react';
import classNames from 'classnames';
import { Button, FixedFooter } from '@tsukiweb/common/ui-core';
import { playScene } from 'engine/savestates';
import { strings } from 'translation/lang';
import PageElement from '../history/PageElement';
import { ProgressPanel } from '../shared/ProgressPanel';
import { History } from 'engine/history';
import { InGameLayersHandler } from "@tsukiweb/common/utils/InGameLayersHandler";
import { LabelName, SceneName } from 'app/utils/types';
import { settings } from 'engine/settings';


type Props = {
	display: boolean
	history: History
	onRewind: VoidFunction
	layers: InGameLayersHandler
	continueScript?: boolean
	show?: Partial<{
		flowchart: boolean
	}>
	divProps?: React.HTMLProps<HTMLDivElement>
}
const HistoryLayer = ({ display, history, onRewind, layers, continueScript = true, show, divProps }: Props) => {
	const rootRef = useRef<HTMLDivElement>(null)

	const handleClose = useCallback(()=> {
		layers.back()
	}, [layers])

	const loadPage = useCallback((index: number)=> {
		history.onPageLoad(index)
		handleClose()
		onRewind()
	}, [handleClose, history, onRewind])

	const loadScene = useCallback((label: LabelName)=> {
		if (!continueScript) {
			playScene(label, { continueScript: false, viewedOnly: false })
		} else {
			history.onSceneLoad(label)
		}
		handleClose()
		onRewind()
	}, [continueScript, handleClose, history, onRewind])
	
	return (
		<div
			id="layer-history"
			{...divProps}
			className={classNames("layer", {"show": display}, divProps?.className)}
			aria-hidden={!display}
			ref={rootRef}>
			{layers.history && history.pagesLength > 0 ?
				<HistoryTab key={history.lastPage.page}
					history={history}
					onPageSelect={loadPage}
				/>
			: null
			}

			<FixedFooter style={{ background: "var(--transparent-layer)" }}>
				{layers.history && <>
					<Button
						variant="default"
						className="back-button"
						onClick={handleClose}
						nav-x={-2} nav-y={10000} // 10k prevents overlapping with flowchart nodes
					>
						{`<<`} {strings.back}
					</Button>
				</>}
			</FixedFooter>
		</div>
	)
}

export default memo(HistoryLayer)


type HistoryTabProps = {
	history: History
	onPageSelect: (pageIndex: number) => void
}
const HistoryTab = ({
		history,
		onPageSelect
	}: HistoryTabProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const pagesArray = Array.from(history.allPages)
	const [ratioWidth, ratioHeight] = settings.fixedRatio.split('/').map(Number)
	const gameTextWidth = ratioWidth ? `min(100%, calc(${100 * ratioWidth / ratioHeight}vh - 12cqmin))` : undefined

	useLayoutEffect(() => {
		if (containerRef.current) {
			const { scrollHeight, clientHeight } = containerRef.current
			containerRef.current.scrollTo({ 
				top: scrollHeight - clientHeight,
				behavior: 'instant' 
			})
		}
	}, [history.pagesLength])

	const handlePageClick = (index: number) => {
		onPageSelect(index)
	}

	return (
		<div id="history" className="scroll-container" ref={containerRef}>
			<div className="text-container" style={{ minHeight: "calc(100% + 2px)", width: gameTextWidth }}>
				{pagesArray.map((page, i) =>
					<PageElement key={i} history={history} content={page}
						onLoad={() => handlePageClick(i)}
						navY={i - history.pagesLength}
					/>
				)}
			</div>
		</div>
	)
}

type FlowchartTabProps = {
	history: History
	continueScript: boolean
	onSceneSelect: (label: LabelName)=>void
}
const FlowchartTab = ({ history, continueScript }: FlowchartTabProps) => {
	const isSceneReplay = !continueScript

	useLayoutEffect(()=> {
		const activeNode = document.querySelector(`.fc-scene.active`)
		if (activeNode) {
			activeNode.scrollIntoView({ behavior: "instant", block: "center" })
		}
	}, [history])

	return (
		<div id="flowchart-progress" className="scroll-container">
			{!isSceneReplay && settings.flowchartBadges && (
				<div className="progress-container">
					<ProgressPanel script={history.script!}/>
				</div>
			)}
		</div>
	)
}