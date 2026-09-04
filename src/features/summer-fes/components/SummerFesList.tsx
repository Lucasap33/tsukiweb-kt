import { playScene } from "engine/savestates"
import { useStrings } from "translation/lang"
import { SceneShortcut } from "@tsukiweb/common/ui-core"
import { SceneName } from "app/utils/types";
import { useFestivalsAccess } from "../hooks/useFestivalsAccess";
import { viewedScene } from "engine/settings";

const SummerFesList = () => {
	const strings = useStrings()
	const { dreamingUnlocked } = useFestivalsAccess()

	const play = (id: SceneName)=> {
		playScene(id, {viewedOnly: false, continueScript: true})
	}

	return (
		<div className="scenes-list">
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_48b",
					"c": "tachi/ark_nt03"
				}}
				title={strings.characters.ark}
				attention={!viewedScene("s538")}
				onClick={play.bind(undefined, "s538")}
				onKeyDown={e => e.key === "Enter" && play("s538")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_103",
					"c": "tachi/ciel_nt05"
				}}
				title={strings.characters.cel}
				attention={!viewedScene("s539")}
				onClick={play.bind(undefined, "s539")}
				onKeyDown={e => e.key === "Enter" && play("s539")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_103",
					"c": "tachi/aki_nt05"
				}}
				title={strings.characters.aki}
				attention={!viewedScene("s540")}
				onClick={play.bind(undefined, "s540")}
				onKeyDown={e => e.key === "Enter" && play("s540")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_106",
					"c": "tachi/his_nt04b"
				}}
				title={strings.characters.his}
				attention={!viewedScene("s541")}
				onClick={play.bind(undefined, "s541")}
				onKeyDown={e => e.key === "Enter" && play("s541")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_104",
					"c": "tachi/koha_nt07"
				}}
				title={strings.characters.koha}
				attention={!viewedScene("s542")}
				onClick={play.bind(undefined, "s542")}
				onKeyDown={e => e.key === "Enter" && play("s542")}
				nav-auto={1}
			/>
			{dreamingUnlocked &&
				<SceneShortcut
					unlocked={true}
					images={{
						"bg": "bg/ima_02"
					}}
					title={strings.scenario.scenes.s543}
					attention={!viewedScene("s543")}
					onClick={play.bind(undefined, "s543")}
					onKeyDown={e => e.key === "Enter" && play("s543")}
					nav-auto={1}
				/>
			}
		</div>
	)
}

export default SummerFesList