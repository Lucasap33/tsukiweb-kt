import { playScene } from "engine/savestates"
import { useStrings } from "translation/lang"
import { SceneShortcut } from "@tsukiweb/common/ui-core"
import { SceneName } from "app/utils/types";

const DreamsList = () => {
	const strings = useStrings()

	const play = (id: SceneName)=> {
		playScene(id, {viewedOnly: false, continueScript: false})
	}

	return (
		<div className="scenes-list">
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_10a",
					"c": "tachi/kuga_t02"
				}}
				title={strings.scenario.scenes.s528}
				onClick={play.bind(undefined, "s528")}
				onKeyDown={e => e.key === "Enter" && play("s528")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/ima_08"
				}}
				title={strings.scenario.scenes.s529}
				onClick={play.bind(undefined, "s529")}
				onKeyDown={e => e.key === "Enter" && play("s529")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/ima_30a",
				}}
				title={strings.scenario.scenes.s530}
				onClick={play.bind(undefined, "s530")}
				onKeyDown={e => e.key === "Enter" && play("s530")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_98"
				}}
				title={strings.scenario.scenes.s531}
				onClick={play.bind(undefined, "s531")}
				onKeyDown={e => e.key === "Enter" && play("s531")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_06a"
				}}
				title={strings.scenario.scenes.s532}
				onClick={play.bind(undefined, "s532")}
				onKeyDown={e => e.key === "Enter" && play("s532")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_100",
					"c": "tachi/man_t01"
				}}
				title={strings.scenario.scenes.s533}
				onClick={play.bind(undefined, "s533")}
				onKeyDown={e => e.key === "Enter" && play("s533")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_34a",
					"l": "tachi/koha_t05",
					"r": "tachi/his_t04"
				}}
				title={strings.scenario.scenes.s534}
				onClick={play.bind(undefined, "s534")}
				onKeyDown={e => e.key === "Enter" && play("s534")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_34a",
					"c": "tachi/his_t03"
				}}
				title={strings.scenario.scenes.s535}
				onClick={play.bind(undefined, "s535")}
				onKeyDown={e => e.key === "Enter" && play("s535")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_53",
					"c": "tachi/koha_t05b"
				}}
				title={strings.scenario.scenes.s536}
				onClick={play.bind(undefined, "s536")}
				onKeyDown={e => e.key === "Enter" && play("s536")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_28b",
					"c": "tachi/ark_t05b"
				}}
				title={strings.scenario.scenes.s537}
				onClick={play.bind(undefined, "s537")}
				onKeyDown={e => e.key === "Enter" && play("s537")}
				nav-auto={1}
			/>
		</div>
	)
}

export default DreamsList