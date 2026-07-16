export type CharId = 'aki'|'ark'|'cel'|'his'|'koha'|'akira'|'ren'|'yume'

export type SceneName = `s${number}`|`q${number}`

type FBlockName = `f${number}`

export type LabelName = SceneName | FBlockName | 'endofplay'

export type Choice = {
	index: number
	str: string
	label: LabelName,
	disable?: boolean
}

export type GalleryImg = {
	group: CharId,
	h?: true,
	altOf?: string
}