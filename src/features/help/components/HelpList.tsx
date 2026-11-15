import { playScene } from "engine/savestates"
import { SceneShortcut } from "@tsukiweb/common/ui-core"
import { SceneName } from "app/utils/types";
import { settings, viewedScene } from "engine/settings";
import { SCENE_ATTRS } from "app/utils/constants";
import { KtFlagBadge } from "assets/icons/badges";


type Help = {
	id: SceneName
	flag: string
	images: Record<string, string>
}

const helps: Help[] = [
	{
		id: "s524",
		flag: "4",
		images: {
			bg: "bg/bg_06a",
			r: "tachi/tiel_t04",
			l: "tachi/ark_t30"
		},
	},
	{
		id: "s525",
		flag: "5",
		images: {
			bg: "bg/bg_06a",
			r: "tachi/tiel_t04",
			l: "tachi/neko_t01a"
		},
	},
	{
		id: "s526",
		flag: "6",
		images: {
			bg: "bg/bg_06a",
			r: "tachi/tiel_t04"
		},
	},
	{
		id: "s527",
		flag: "finish",
		images: {
			bg: "bg/bg_06a",
			r: "tachi/tiel_t04",
			l: "tachi/ark_t31a"
		},
	},
		{
			id: "s547",
			flag: "",
			images: {
			bg: "bg/bg_06b",
			r: "tachi/tiel_t04",
		},
	}
]
export const getUnlockedHelps = ()=> settings.unlockEverything ? helps :
		helps.slice(1).filter((_, i)=> (i == 0) ||
			SCENE_ATTRS["scene-points"].flags[helps[i-1].flag]?.some(lbl=>viewedScene(lbl))
		)

const HelpList = () => {
	const play = (id: SceneName)=> {
		playScene(id, {viewedOnly: false, extra: true})
	}

	return (
		<div className="scenes-list">
			{getUnlockedHelps().map(({ id, flag, images }, i) =>
				<SceneShortcut
					key={id}
					unlocked={true}
					attention={!viewedScene(id)}
					images={(settings.unlockEverything || viewedScene(id)) ? images : {}}
					title={flag ? <KtFlagBadge flag={flag}/> : undefined}
					onClick={() => play(id)}
					onKeyDown={e => e.key === "Enter" && play(id)}
					nav-auto={1}
				/>
			)}
			{
				//TODO chose progress save then display appropriate help
			}
		</div>
	)
}

export default HelpList