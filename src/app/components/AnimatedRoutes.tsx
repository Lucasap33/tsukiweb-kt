import { Switch, Route, Redirect, useLocation } from "wouter";
import { AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import '@tsukiweb/common/styles/main.scss'
import '../styles/App.scss'
import '@tsukiweb/common/graphics/styles/graphics.scss'
import ExtraShell from "app/layouts/ExtraShell";
import { useCallback, useEffect, useState } from "react";
import HarvestWind from "app/components/HarvestWind";
import ConfigScreen from "app/screens/ConfigScreen";
import DisclaimerScreen from "app/screens/DisclaimerScreen";
import GalleryScreen from "app/screens/GalleryScreen";
import LoadScreen from "app/screens/LoadScreen";
import SceneReplayScreen from "app/screens/SceneReplayScreen";
import TitleMenuScreen from "app/screens/TitleMenuScreen";
import Window from "app/screens/Window";
import { SCREEN } from "app/utils/display";
import DreamsScreen from "app/screens/DreamsScreen";
import SummerFesScreen from "app/screens/SummerFesScreen";

const AnimatedRoutes = () => {
	const [location] = useLocation()
	const pathname = location.split('?')[0]
	
	// Show disclaimer only if: first page of session was "/" AND disclaimer not yet seen this session
	const [showDisclaimer, setShowDisclaimer] = useState(() => {
		const entryPath = sessionStorage.getItem('app_entry_path')
		const disclaimerSeen = sessionStorage.getItem('app_disclaimer_seen')
		return entryPath === '/' && !disclaimerSeen
	})

	useEffect(() => {
		if (showDisclaimer) {
			document.documentElement.dataset.preloading = 'disclaimer'
			return
		}

		delete document.documentElement.dataset.preloading
	}, [showDisclaimer])

	const markDisclaimerAsSeen = useCallback(() => {
		sessionStorage.setItem('app_disclaimer_seen', 'true')
		setShowDisclaimer(false)
	}, [])

	const isExtra = [SCREEN.GALLERY, SCREEN.SCENES, SCREEN.SUMMER_FES, SCREEN.DREAMS].some(path =>
		pathname.startsWith(path)
	)
	const keyPresence = isExtra ? "extra" : pathname
	const showBackdrop = pathname !== "/window"
	const titleKey = showDisclaimer ? "title-behind-disclaimer" : "title"

	return (
		<LazyMotion features={domAnimation} strict>
			<HarvestWind active={showBackdrop && !showDisclaimer} />
			<div className="page-backdrop" data-variant={pathname === "/" ? "title" : "default"} aria-hidden />
			<AnimatePresence mode="wait">
				<Switch location={pathname} key={keyPresence}>
					<Route path="/">
						<TitleMenuScreen key={titleKey} />
					</Route>
					<Route path={SCREEN.LOAD}>
						<LoadScreen />
					</Route>
					<Route path={SCREEN.CONFIG}>
						<ConfigScreen />
					</Route>

					<Route path={SCREEN.GALLERY}>
						<ExtraShell><GalleryScreen /></ExtraShell>
					</Route>
					<Route path={`${SCREEN.SCENES}/:sceneId`}>
						<ExtraShell><SceneReplayScreen /></ExtraShell>
					</Route>
					<Route path={SCREEN.SCENES}>
						<ExtraShell>WIP</ExtraShell>
					</Route>
					<Route path={SCREEN.SUMMER_FES}>
						<ExtraShell><SummerFesScreen /></ExtraShell>
					</Route>
					<Route path={SCREEN.DREAMS}>
						<ExtraShell><DreamsScreen /></ExtraShell>
					</Route>

					<Route path={SCREEN.WINDOW}>
						<Window />
					</Route>

					<Route>
						<Redirect to="/" />
					</Route>
				</Switch>
			</AnimatePresence>
			<AnimatePresence>
				{showDisclaimer && <DisclaimerScreen onAccept={markDisclaimerAsSeen} />}
			</AnimatePresence>
		</LazyMotion>
	)
}

export default AnimatedRoutes