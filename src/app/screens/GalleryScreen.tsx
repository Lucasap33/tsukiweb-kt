import { useEffect, useMemo, useRef } from 'react'
import '@features/gallery/styles/gallery.scss'
import * as m from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import { TabsBar } from '@tsukiweb/common/ui-core'
import GalleryImage from 'features/gallery/components/GalleryImage'
import { audio } from 'engine/audio'
import { GalleryTotal } from 'features/gallery/components/GalleryComponents'
import { useQueryParam } from '@tsukiweb/common/hooks'
import { settings } from 'engine/settings';
import cg from 'features/gallery/utils/gallery';
import { strings, useStrings } from 'translation/lang';
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import { GALLERY_IMAGES } from 'features/gallery/utils/gallery-data';
import { GalleryImg } from 'app/utils/types';

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.5
		}
	}
}

const isShown = (image: string) =>
	cg.isUnlocked(image) || settings.unlockEverything

const getImgDetails = (image: string) => {
	let alts: string[] = [image, ...cg.getAlts(image)]
	let shownAlts: string[] = alts.filter(isShown)

	return { alts, shownAlts }
}
const galleryTabs = new Set(Object.values(GALLERY_IMAGES).map(img=>img.group))

const GalleryScreen = () => {
	useScreenAutoNavigate(SCREEN.GALLERY)
	const strings = useStrings()
	const [selectedTab, setSelectedTab] = useQueryParam<GalleryImg['group']>("tab", "ren")
	const rootRef = useRef<HTMLDivElement>(null)

	const tabImages: string[] = useMemo(() => {
		const imagesTmp = cg.getByGroup(selectedTab)
		
		return imagesTmp.filter(image => !cg.getImg(image).altOf)
	}, [selectedTab])

	const tabs = Array.from(galleryTabs, char => ({
		label: strings.characters[char],
		value: char,
		audio: audio
	}))

	useEffect(() => {
		requestAnimationFrame(() => rootRef.current?.scrollTo({ top: 0, behavior: "instant" }))
	}, [selectedTab])

	return (
		<div id="gallery" ref={rootRef}>
			<TabsBar tabs={tabs} selected={selectedTab} setSelected={setSelectedTab} />
			<section>
				<AnimatePresence mode="popLayout">
					<m.div
						key={selectedTab}
						variants={container}
						initial="hidden"
						animate="show"
						exit="hidden"
						className="gallery-container">
						{tabImages?.map(image => {
							const {alts, shownAlts} = getImgDetails(image)

							if (shownAlts.length > 0) {
								const mainImage = shownAlts[0]

								return (
									<GalleryImage
										key={image}
										image={mainImage}
										gallery={alts}
										galleryUnlocked={shownAlts}
										blurred={cg.shouldBlur(mainImage)}
										showTotal={true}
										getGalleryImg={cg.getImg}
										nav-auto={1}
									/>
								)
							}

							return (
								<div key={image} className="placeholder" tabIndex={0} nav-auto={1}>
									{alts.length > 1 &&
										<GalleryTotal
											nbUnlocked={shownAlts.length}
											nbTotal={alts.length}
										/>
									}
								</div>
							)
						})}
					</m.div>
				</AnimatePresence>
			</section>
		</div>
	)
}

export default GalleryScreen