import { playScene } from "engine/savestates"
import { useStrings } from "translation/lang"
import { SceneShortcut } from "@tsukiweb/common/ui-core"
import { SceneName } from "app/utils/types";
import { settings, viewedScene } from "engine/settings";
import { SCENE_ATTRS } from "app/utils/constants";
import { FlagBadge } from "@tsukiweb/common/icons/badges";


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
		flag: "8",
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
    helps.filter(({flag})=>
        SCENE_ATTRS["scene-points"].flags[flag].some(lbl=>viewedScene(lbl))
    )

const HelpList = () => {
	const strings = useStrings()

	const play = (id: SceneName)=> {
		playScene(id, {viewedOnly: false, extra: true})
	}

	return (
		<div className="scenes-list">
			{getUnlockedHelps().map(({ id, flag, images }) =>
				<SceneShortcut
					key={id}
					unlocked={true}
					attention={!viewedScene(id)}
					images={(settings.unlockEverything || viewedScene(id)) ? images : {}}
					title={flag}
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