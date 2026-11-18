import { useMemo } from "react"
import { settings, viewedScene } from "engine/settings"
import { festivalFinale, festivals } from "../utils/summer-fes";
import { dreams } from "features/dreams/components/DreamsList";

export const useFestivalsAccess = () => {
	return useMemo(()=> {
		const hasAccess = settings.unlockEverything || (viewedScene("s523") && dreams.every(({id})=>viewedScene(id)))
		const hasUnseenFes = festivals.some(({ id }) => !viewedScene(id)) || !viewedScene(festivalFinale.id)
		const sawAllFes = settings.unlockEverything || festivals.every(({ id }) => viewedScene(id))
		return {
			hasAccess,
			hasUnseenFes,
			dreamingUnlocked: sawAllFes
		}
	}, [settings.completedScenes, settings.unlockEverything])
}