import { PartialRecord } from "@tsukiweb/common/types";

export type PointId = 'akira' | 'answer' | 'ark' | 'cel' | 'his' | 'aki' | 'kagi'
					| 'kaibyo' | 'nana' | 'ren' | 'gojitsudan'

export type SceneName = `s${number}`

type FBlockName = `f${number}`|`${SceneName}_end`

export type LabelName = SceneName | FBlockName | 'endofplay'

export type GameProgress = {
  flags: string[]
  points: PartialRecord<PointId, number>
  lastSave: number
  count: number
}

export type Choice<T = any> = {
	index: number
	str: string
	value: T,
	disable?: boolean
}

export type GalleryImg = {
	group: 'yume' | 'ren',
	h?: true,
	altOf?: string
}