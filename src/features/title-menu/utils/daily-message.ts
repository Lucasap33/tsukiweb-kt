import { DailyMessageEntry, strings } from "translation/lang"

const BACKGROUNDS = 6
const CHARACTERS = 7
const RARE_CHARACTERS = [8, 9]
const RARE_CHARACTER_RATE = 0.03
const HISTORY_KEY = "kt_daily_messages"
const HISTORY_LENGTH = 3

export type DailyMessage = Required<DailyMessageEntry>

const rnd = (max: number) => Math.floor(Math.random() * max)
const imageId = (prefix: string, n: number) =>
	`msg/ran_${prefix}${String(n).padStart(2, '0')}`

function readHistory(): number[] {
	try {
		const history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
		return Array.isArray(history) ? history : []
	} catch {
		return []
	}
}

function pickRandomIndex(count: number) {
	const history = readHistory()
	const candidates = Array.from({ length: count }, (_, i) => i)
		.filter(i => count <= HISTORY_LENGTH || !history.includes(i))
	const index = candidates[rnd(candidates.length)]
	try {
		localStorage.setItem(HISTORY_KEY,
			JSON.stringify([index, ...history].slice(0, HISTORY_LENGTH)))
	} catch {}
	return index
}

export function pickDailyMessage(date = new Date()): DailyMessage | null {
	const messages = strings["daily-messages"]
	if (!messages?.random?.length)
		return null

	const bg = imageId('bg', rnd(BACKGROUNDS) + 1)
	const fg = imageId('t', Math.random() < RARE_CHARACTER_RATE
		? RARE_CHARACTERS[rnd(RARE_CHARACTERS.length)]
		: rnd(CHARACTERS) + 1)
	const message = messages.dates?.[`${date.getMonth() + 1}-${date.getDate()}`]
		?? messages.random[pickRandomIndex(messages.random.length)]

	return { bg, fg, ...message }
}
