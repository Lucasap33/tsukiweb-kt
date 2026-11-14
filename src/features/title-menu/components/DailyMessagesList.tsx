import { useCallback, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence } from "motion/react"
import { Button } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { getLocale, useStrings } from "translation/lang"
import DailyMessageScreen from "app/screens/DailyMessageScreen"
import { DailyMessage, DailyMessageId, getDailyMessage, listDailyMessages } from "@features/title-menu/utils/daily-message"

const LEADER_REGEX = /…{4,}/g
const FADE_DURATION = 0.2

function messageLabel(id: DailyMessageId) {
	if (typeof id == "number")
		return `#${String(id + 1).padStart(3, '0')}`
	const [month, day] = id.split('-').map(Number)
	return new Date(2000, month - 1, day)
		.toLocaleDateString(getLocale(), { month: 'long', day: 'numeric' })
}

const DailyMessagesList = () => {
	useStrings()
	const [opened, setOpened] = useState<DailyMessage | null>(null)
	const messages = listDailyMessages()
	const close = useCallback(() => setOpened(null), [])
	const readCount = messages.filter(({ read }) => read).length

	return (
		<>
			<div className="daily-messages-count">
				{readCount} / {messages.length}
			</div>
			<div className="daily-messages-list">
				{messages.map(({ id, entry, read }) =>
					<Button key={id}
						variant="select"
						className="daily-message-item"
						disabled={!read}
						audio={audio}
						clickSound="glass"
						onClick={() => setOpened(getDailyMessage(id))}
						nav-auto={read ? 1 : undefined}
					>
						<span className="label">{messageLabel(id)}</span>
						<span className="preview">
							{read
								? entry.text.filter(line => line).join(' ').replaceAll(LEADER_REGEX, '…')
								: "？？？"}
						</span>
					</Button>
				)}
			</div>
			{createPortal(
				<AnimatePresence>
					{opened &&
						<DailyMessageScreen key={opened.id} message={opened}
							onClose={close} fadeDuration={FADE_DURATION} />
					}
				</AnimatePresence>,
				document.body
			)}
		</>
	)
}

export default DailyMessagesList
