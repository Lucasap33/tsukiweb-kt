import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as m from "motion/react-m"
import '@features/title-menu/styles/daily-message.scss'
import { DailyMessage } from '@features/title-menu/utils/daily-message'
import { imageSrc } from 'translation/assets'
import { getLocale } from 'translation/lang'
import { AmbientBackdrop } from '@tsukiweb/common/graphics'

const LEADER_REGEX = /^(…{4,})\s*(.*)$/
const WIDE_LOCALES = ['ja', 'zh', 'ko']
const MAX_TEXT_HEIGHT = 0.64
const MIN_TEXT_SCALE = 0.5
const TEXT_SCALE_STEP = 0.05

type Props = {
	message: DailyMessage
	onClose: () => void
}

const MessageLine = ({ line }: { line: string }) => {
	const leader = line.match(LEADER_REGEX)
	if (leader) {
		return (
			<p className="leader">
				<span className="dots" aria-hidden>{"…".repeat(60)}</span>
				{leader[2] && <span>{leader[2]}</span>}
			</p>
		)
	}
	return <p>{line || " "}</p>
}

const DailyMessageScreen = ({ message, onClose }: Props) => {
	const [showCharacter, setShowCharacter] = useState(true)
	const textRef = useRef<HTMLDivElement>(null)
	const bgRef = useRef<HTMLImageElement>(null)
	const wide = WIDE_LOCALES.includes(getLocale().split('-')[0])

	useLayoutEffect(() => {
		const text = textRef.current
		const stage = text?.parentElement
		if (!text || !stage) return
		const fit = () => {
			const maxHeight = stage.clientHeight * MAX_TEXT_HEIGHT
			let scale = 1
			text.style.removeProperty('--scale')
			while (text.scrollHeight > maxHeight && scale > MIN_TEXT_SCALE) {
				scale -= TEXT_SCALE_STEP
				text.style.setProperty('--scale', scale.toFixed(2))
			}
		}
		fit()
		document.fonts?.ready.then(fit)
		window.addEventListener('resize', fit)
		return () => window.removeEventListener('resize', fit)
	}, [message])

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Enter' && e.key !== ' ') return
			e.preventDefault()
			e.stopPropagation()
			onClose()
		}
		window.addEventListener('keydown', onKeyDown, true)
		return () => window.removeEventListener('keydown', onKeyDown, true)
	}, [onClose])

	return (
		<m.div
			className="page" id="daily-message"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { duration: 0.8 } }}
			exit={{ opacity: 0, transition: { duration: 0.8 } }}
			onClick={onClose}
		>
			<div className="stage" data-wide={wide || undefined}>
				<img className="bg" ref={bgRef} src={imageSrc(message.bg)} alt="" draggable={false} />
				{showCharacter &&
					<img className="fg" src={imageSrc(message.fg)} alt="" draggable={false}
						onError={() => setShowCharacter(false)} />
				}
				<div className="text" ref={textRef}>
					{message.text.map((line, i) => <MessageLine key={i} line={line} />)}
				</div>
			</div>
			<AmbientBackdrop source={bgRef} image={message.bg} />
		</m.div>
	)
}

export default DailyMessageScreen
