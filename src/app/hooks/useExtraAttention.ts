import { viewedScene } from "engine/settings"
import { useFestivalsAccess } from "features/summer-fes/hooks/useFestivalsAccess"
import { getUnlockedDreams } from "features/dreams/components/DreamsList"
import { getUnlockedHelps } from "features/help/components/HelpList"

export const useExtraAttention = () => {
	const { hasAccess, hasUnseenFes } = useFestivalsAccess()
	const unlockedDreams = getUnlockedDreams()
	const unlockedHelps = getUnlockedHelps()

	const dreams = {
		attention: unlockedDreams.some(({ id }) => !viewedScene(id)),
		locked: unlockedDreams.length == 0,
	}
	const summerFes = {
		attention: hasAccess && hasUnseenFes,
		locked: !hasAccess,
	}
	const help = {
		attention: unlockedHelps.some(({ id }) => !viewedScene(id)),
		locked: unlockedHelps.length == 0,
	}

	return {
		dreams,
		summerFes,
		help,
		any: dreams.attention || summerFes.attention || help.attention,
	}
}
