import { Switch, Route, Redirect, useLocation } from "wouter";
import { AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import '@tsukiweb/common/styles/main.scss'
import '../styles/App.scss'
import '@tsukiweb/common/graphics/styles/graphics.scss'
import ExtraShell from "app/layouts/ExtraShell";
import { useCallback, useEffect, useRef, useState } from "react";
import HarvestWind from "app/components/HarvestWind";
import ConfigScreen from "app/screens/ConfigScreen";
import DisclaimerScreen from "app/screens/DisclaimerScreen";
import FlowchartScreen from "app/screens/FlowchartScreen";
import GalleryScreen from "app/screens/GalleryScreen";
import LoadScreen from "app/screens/LoadScreen";
import SceneReplayScreen from "app/screens/SceneReplayScreen";
import TitleMenuScreen from "app/screens/TitleMenuScreen";
import Window from "app/screens/Window";
import { SCREEN } from "app/utils/display";
import DreamsScreen from "app/screens/DreamsScreen";
import SummerFesScreen from "app/screens/SummerFesScreen";
import DailyMessageScreen from "app/screens/DailyMessageScreen";
import { DailyMessage, markDailyMessageRead, pickDailyMessage } from "@features/title-menu/utils/daily-message";
import DailyMessagesScreen from "app/screens/DailyMessagesScreen";
import { imageSrc } from "translation/assets";
import { waitLanguageLoad } from "translation/lang";
import { settings } from "engine/settings";
import HelpScreen from "app/screens/HelpScreen";

const AnimatedRoutes = () => {
	const [location] = useLocation()
	const pathname = location.split('?')[0]
	
	// Show disclaimer only if: first page of session was "/" AND disclaimer not yet seen this session
	const [showDisclaimer, setShowDisclaimer] = useState(() => {
		const entryPath = sessionStorage.getItem('app_entry_path')
		const disclaimerSeen = sessionStorage.getItem('app_disclaimer_seen')
		return entryPath === '/' && !disclaimerSeen
	})

	const [dailyMessage, setDailyMessage] = useState<DailyMessage | null>(null)
	const dailyMessageRef = useRef<DailyMessage | null>(null)
	const [showDailyMessage, setShowDailyMessage] = useState(false)
	const showIntro = showDisclaimer || showDailyMessage

	useEffect(() => {
		if (showIntro) {
			document.documentElement.dataset.preloading = 'disclaimer'
			return
		}

		delete document.documentElement.dataset.preloading
	}, [showIntro])

	useEffect(() => {
		if (!showDisclaimer || !settings.dailyMessage) return
		let cancelled = false
		waitLanguageLoad().then(() => {
			if (cancelled) return
			const message = pickDailyMessage()
			if (!message) return
			for (const id of [message.bg, message.fg])
				new Image().src = imageSrc(id)
			dailyMessageRef.current = message
			setDailyMessage(message)
		})
		return () => { cancelled = true }
	}, [])

	const markDisclaimerAsSeen = useCallback(() => {
		sessionStorage.setItem('app_disclaimer_seen', 'true')
		if (dailyMessageRef.current)
			markDailyMessageRead(dailyMessageRef.current.id)
		setShowDailyMessage(dailyMessageRef.current != null)
		setShowDisclaimer(false)
	}, [])

	const closeDailyMessage = useCallback(() => {
		setShowDailyMessage(false)
	}, [])

	const isExtra = [SCREEN.GALLERY, SCREEN.SCENES, SCREEN.SUMMER_FES, SCREEN.DREAMS, SCREEN.DAILY_MESSAGES].some(path =>
		pathname.startsWith(path)
	)
	const keyPresence = isExtra ? "extra" : pathname
	const showBackdrop = pathname !== "/window"
	const titleKey = showIntro ? "title-behind-disclaimer" : "title"

	return (
		<LazyMotion features={domAnimation} strict>
			<HarvestWind active={showBackdrop && !showIntro} still={pathname !== "/"} />
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
						<ExtraShell><FlowchartScreen /></ExtraShell>
					</Route>
					<Route path={SCREEN.SUMMER_FES}>
						<ExtraShell><SummerFesScreen /></ExtraShell>
					</Route>
					<Route path={SCREEN.DREAMS}>
						<ExtraShell><DreamsScreen /></ExtraShell>
					</Route>
					<Route path={SCREEN.HELP}>
						<ExtraShell><HelpScreen /></ExtraShell>
					</Route>
					<Route path={SCREEN.DAILY_MESSAGES}>
						<ExtraShell><DailyMessagesScreen /></ExtraShell>
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
				{showDisclaimer && <DisclaimerScreen key="disclaimer" onAccept={markDisclaimerAsSeen} />}
				{showDailyMessage && dailyMessage &&
					<DailyMessageScreen key="daily-message" message={dailyMessage} onClose={closeDailyMessage} />
				}
			</AnimatePresence>
		</LazyMotion>
	)
}

export default AnimatedRoutes