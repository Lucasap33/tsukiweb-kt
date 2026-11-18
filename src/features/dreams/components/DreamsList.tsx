import { playScene } from "engine/savestates"
import { useStrings } from "translation/lang"
import { SceneShortcut } from "@tsukiweb/common/ui-core"
import { SceneName } from "app/utils/types";
import { settings, viewedScene } from "engine/settings";


type Dream = {
	id: SceneName
	unlock?: SceneName[]
	unlockCount?: number
	images: Record<string, string>
}

export const dreams: Dream[] = [
	{ // Ciel−sensei
		id: "s528",
		unlock: ["s48"],
		images: {
			bg: "bg/bg_10a",
			c: "tachi/kuga_t02",
		},
	},
	{ // A Story for the Evening
		id: "s529",
		unlock: ["s61", "s65", "s229", "s164"],
		unlockCount: 2,
		images: {
			bg: "bg/ima_08",
		},
	},
	{ // Crimson Moon
		id: "s530",
		unlock: ["s159"],
		images: {
			bg: "bg/ima_30a",
		},
	},
	{ // Red Demon God
		id: "s531",
		unlock: ["s172"],
		images: {
			bg: "bg/bg_98",
		},
	},
	{ // Nanako−chan SOS!
		id: "s532",
		unlock: ["s13"],
		images: {
			bg: "bg/bg_06a",
		},
	},
	{ // Imogirisou
		id: "s533",
		unlock: ["s133", "s116"],
		images: {
			bg: "bg/bg_100",
			c: "tachi/man_t01",
		},
	},
	{ // Flower of Thanatos
		id: "s534",
		unlock: ["s258", "s523"],
		images: {
			bg: "bg/bg_34a",
			l: "tachi/koha_t05",
			r: "tachi/his_t04",
		},
	},
	{ // Hisui−chan, Inversion Inpulse!
		id: "s535",
		unlock: ["s199"],
		images: {
			bg: "bg/bg_34a",
			c: "tachi/his_t03",
		},
	},
	{ // The Tohno Family Con Game
		id: "s536",
		unlock: ["s211"],
		images: {
			bg: "bg/bg_53",
			c: "tachi/koha_t05b",
		},
	},
	{ // Dawn
		id: "s537",
		unlock: ["s220", "s221"],
		images: {
			bg: "bg/bg_28b",
			c: "tachi/ark_t05b",
		},
	},
]

export const getUnlockedDreams = () => dreams.filter(({ unlock = [], unlockCount = 1 }) =>
	settings.unlockEverything || unlock.filter(viewedScene).length >= unlockCount)

const DreamsList = () => {
	const strings = useStrings()

	const play = (id: SceneName)=> {
		playScene(id, {viewedOnly: false, extra: true})
	}

	return (
		<div className="scenes-list">
			{getUnlockedDreams().map(({ id, images }) =>
				<SceneShortcut
					key={id}
					unlocked={true}
					attention={!viewedScene(id)}
					images={(settings.unlockEverything || viewedScene(id)) ? images : {}}
					title={strings.scenario.scenes[id]}
					onClick={() => play(id)}
					onKeyDown={e => e.key === "Enter" && play(id)}
					nav-auto={1}
				/>
			)}
		</div>
	)
}

export default DreamsList