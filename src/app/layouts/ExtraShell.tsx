import * as m from "motion/react-m"
import { PropsWithChildren, useEffect } from "react"
import "../../features/title-menu/styles/extra.scss"
import { useStrings } from "translation/lang"
import { useLocation } from "wouter"
import { PageTitle, TitleMenuButton } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { SCREEN, displayMode } from "app/utils/display";
import { useDefaultNavBack, useNavBackRef } from "@tsukiweb/common/hooks"
import Ornament from "@assets/images/ornament.webp"
import PageBackButton from "app/components/PageBackButton"
import { viewedScene } from "engine/settings";
import { useFestivalsAccess } from "features/summer-fes/hooks/useFestivalsAccess";
import { getUnlockedDreams } from "features/dreams/components/DreamsList";


const ExtraShell = ({ children }: PropsWithChildren) => {
	const focusCurrentMenuItem = () => {
		const currentPage = "/" + window.location.pathname.split("/")[1]
		document.querySelector<HTMLElement>(`#extra-${currentPage.slice(1)}`)?.focus()
	}

	return (
		<m.div
			id="extra"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<img src={Ornament} alt="" className="leftOrnament" />
			<img src={Ornament} alt="" className="rightOrnament" />

			<m.main
				className="extra-content"
				ref={useNavBackRef(focusCurrentMenuItem)}
				initial={{y: -10, opacity: 0.4}}
				animate={{y: 0, opacity: 1}}
				exit={{y: 20, opacity: 0}}
				transition={{duration: 0.2}}
				key={window.location.pathname}
			>
				{children}
			</m.main>

			<ExtraMenu />
		</m.div>
	)
}

export default ExtraShell

function back() {
	displayMode.screen = SCREEN.TITLE
}

const ExtraMenu = () => {
	const [location, navigate] = useLocation()
	const strings = useStrings()
	const currentPage = "/" + location.split("/")[1]
	const { menuOpened, hasUnseenFes } = useFestivalsAccess()
	const unlockedDreams = getUnlockedDreams()

	useDefaultNavBack(back)

	useEffect(()=> {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				back()
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [])

	return (
		<div className="extra-menu">
			<PageTitle>
				{strings.title.extra}
			</PageTitle>
			<div className="menus" role="tablist">
				<TitleMenuButton id="extra-gallery"
					audio={audio}
					onClick={()=>navigate(SCREEN.GALLERY)}
					active={currentPage === SCREEN.GALLERY}
					aria-selected={currentPage === SCREEN.GALLERY}
					role="tab"
					nav-auto={1}>
					{strings.extra.gallery}
				</TitleMenuButton>
				<TitleMenuButton id="extra-scenes"
					audio={audio}
					onClick={()=>navigate(SCREEN.SCENES)}
					active={currentPage === SCREEN.SCENES}
					aria-selected={currentPage === SCREEN.SCENES}
					role="tab"
					nav-auto={1}>
					{strings.extra.scenes}
				</TitleMenuButton>
				{menuOpened &&
					<TitleMenuButton id="extra-summer-fes"
						audio={audio}
						onClick={()=>navigate(SCREEN.SUMMER_FES)}
						active={currentPage === SCREEN.SUMMER_FES}
						aria-selected={currentPage === SCREEN.SUMMER_FES}
						attention={hasUnseenFes}
						role="tab"
						nav-auto={1}>
						{strings.extra["summer-fes"]}
					</TitleMenuButton>
				}
				{unlockedDreams.length > 0 &&
					<TitleMenuButton id="extra-dreams"
					audio={audio}
					onClick={()=>navigate(SCREEN.DREAMS)}
					active={currentPage === SCREEN.DREAMS}
					aria-selected={currentPage === SCREEN.DREAMS}
					attention={unlockedDreams.some(({ id }) => !viewedScene(id))}
					role="tab"
					nav-auto={1}>
					{strings.extra.dreams}
				</TitleMenuButton>
				}
			</div>
			<div className="back-action">
				<PageBackButton onClick={()=>navigate(SCREEN.TITLE)} />
			</div>
		</div>
	)
}