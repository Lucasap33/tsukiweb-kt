import { useMemo } from "react"
import { settings, viewedScene } from "engine/settings"
import { festivalFinale, festivals } from "../utils/summer-fes";

export const useFestivalsAccess = () => {
	return useMemo(()=> {
		const menuOpened = settings.unlockEverything || viewedScene("s523")
		const hasUnseenFes = festivals.some(fes => !viewedScene(fes)) || !viewedScene(festivalFinale)
		const sawAllFes = settings.unlockEverything || festivals.every(fes => viewedScene(fes))
		return {
			menuOpened,
			hasUnseenFes,
			dreamingUnlocked: sawAllFes
		}
	}, [settings.completedScenes, settings.unlockEverything])
}