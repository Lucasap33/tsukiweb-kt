import { useEffect, useRef } from 'react'
import * as m from "motion/react-m"
import { DailyMessage } from '@features/title-menu/utils/daily-message'
import DailyMessageStage from '@features/title-menu/components/DailyMessageStage'
import { AmbientBackdrop } from '@tsukiweb/common/graphics'
import { useNavBackRef } from '@tsukiweb/common/hooks'

const DEFAULT_FADE_DURATION = 0.8

type Props = {
	message: DailyMessage
	onClose: () => void
	fadeDuration?: number
}

const DailyMessageScreen = ({ message, onClose, fadeDuration = DEFAULT_FADE_DURATION }: Props) => {
	const bgRef = useRef<HTMLImageElement>(null)
	const rootRef = useRef<HTMLDivElement>(null)
	const setRootRef = useNavBackRef(onClose, rootRef)

	useEffect(() => {
		const previous = document.activeElement
		rootRef.current?.focus({ preventScroll: true })
		return () => {
			if (previous instanceof HTMLElement && previous.isConnected)
				previous.focus({ preventScroll: true })
		}
	}, [])

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return
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
			ref={setRootRef}
			tabIndex={-1}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { duration: fadeDuration } }}
			exit={{ opacity: 0, transition: { duration: fadeDuration } }}
			onClick={onClose}
		>
			<DailyMessageStage message={message} bgRef={bgRef} />
			<AmbientBackdrop source={bgRef} image={message.bg} />
		</m.div>
	)
}

export default DailyMessageScreen
