import { settings } from "engine/settings"
import { DailyMessageEntry, strings } from "translation/lang"

const BACKGROUNDS = 6
const CHARACTERS = 7
const RARE_CHARACTERS = [8, 9]
const RARE_CHARACTER_RATE = 0.03
const HISTORY_KEY = "kt_daily_messages"
const HISTORY_LENGTH = 3

export type DailyMessageId = number | string
export type DailyMessage = Required<DailyMessageEntry> & { id: DailyMessageId }
export type DailyMessageItem = {
	id: DailyMessageId
	entry: DailyMessageEntry
	read: boolean
}

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

function withImages(id: DailyMessageId, entry: DailyMessageEntry): DailyMessage {
	const bg = imageId('bg', rnd(BACKGROUNDS) + 1)
	const fg = imageId('t', Math.random() < RARE_CHARACTER_RATE
		? RARE_CHARACTERS[rnd(RARE_CHARACTERS.length)]
		: rnd(CHARACTERS) + 1)
	return { bg, fg, ...entry, id }
}

function getEntry(id: DailyMessageId): DailyMessageEntry | undefined {
	const messages = strings["daily-messages"]
	return typeof id == "number" ? messages?.random?.[id] : messages?.dates?.[id]
}

export function getDailyMessage(id: DailyMessageId): DailyMessage | null {
	const entry = getEntry(id)
	return entry ? withImages(id, entry) : null
}

export function pickDailyMessage(date = new Date()): DailyMessage | null {
	const messages = strings["daily-messages"]
	if (!messages?.random?.length)
		return null

	const dateId = `${date.getMonth() + 1}-${date.getDate()}`
	return getDailyMessage(messages.dates?.[dateId]
		? dateId
		: pickRandomIndex(messages.random.length))
}

export function markDailyMessageRead(id: DailyMessageId) {
	if (!settings.readDailyMessages.includes(id))
		settings.readDailyMessages.push(id)
}

function dateOrder(id: string) {
	const [month, day] = id.split('-').map(Number)
	return month * 100 + day
}

export function listDailyMessages(): DailyMessageItem[] {
	const messages = strings["daily-messages"]
	const isRead = (id: DailyMessageId) =>
		settings.unlockEverything || settings.readDailyMessages.includes(id)
	return [
		...(messages?.random ?? []).map((entry, id) => ({ id, entry, read: isRead(id) })),
		...Object.entries(messages?.dates ?? {})
			.sort(([a], [b]) => dateOrder(a) - dateOrder(b))
			.map(([id, entry]) => ({ id, entry, read: isRead(id) })),
	]
}
