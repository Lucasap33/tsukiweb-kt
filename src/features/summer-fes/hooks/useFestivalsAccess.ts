import { useMemo } from "react"
import { settings, viewedScene } from "engine/settings"
import { festivalFinale, festivals } from "../utils/summer-fes";

export const useFestivalsAccess = () => {
	return useMemo(()=> {
		const menuOpened = settings.unlockEverything || viewedScene("s523")
		const hasUnseenFes = festivals.some(({ id }) => !viewedScene(id)) || !viewedScene(festivalFinale.id)
		const sawAllFes = settings.unlockEverything || festivals.every(({ id }) => viewedScene(id))
		return {
			menuOpened,
			hasUnseenFes,
			dreamingUnlocked: sawAllFes
		}
	}, [settings.completedScenes, settings.unlockEverything])
}