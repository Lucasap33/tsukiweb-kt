import { memo, useEffect, useState, CSSProperties } from "react";
import { useObserved } from "@tsukiweb/common/utils/Observer";
import classNames from "classnames";
import { ScriptPlayer } from "engine/ScriptPlayer";
import { processImageCmd, processMonocro, processQuake } from "features/game/utils/graphics";
import { Quake, GraphicsTransition, BackgroundGraphics, ForegroundGraphics, SpriteGraphics, SPRITES_POSITIONS } from "@tsukiweb/common/graphics";
import { displayMode } from "app/utils/display";

type Props = {
	script: ScriptPlayer
}
const GraphicsLayer = ({ script }: Props) => {
	const [defaultBgAlign] = useObserved(displayMode, 'bgAlignment')
	const [bgMoveTime] = useObserved(displayMode, 'bgMoveTime')
	const [bgAlign, setBgAlign] = useState<string|undefined>(undefined)
	const [quake, setQuake] = useState<Quake|undefined>(undefined)
	const [transition, setTransition] = useState<GraphicsTransition|undefined>(undefined)
	const [monochrome] = useObserved(script.graphics, 'monochrome')
	const [topSprite, setTopSprite] = useState<'l'|'c'|'r'|undefined>(undefined)
	
	useEffect(()=> {
		const img = processImageCmd.bind(null, setTransition)
		const qk = processQuake.bind(null, setQuake)
		
		script.setCommands({
			bg: img, ld: img, cl: img,
			quakex: qk, quakey: qk, quakexy: qk,
			monocro: processMonocro,
		})
	}, [script])

	const style = {
		...(bgMoveTime > 0 && { '--bg-move-duration': `${bgMoveTime}ms` }),
		...(quake && {
			'--quake-x': `${quake.x}pt`,
			'--quake-y': `${quake.y}pt`,
			'--quake-time': `${quake.duration}ms`,
		}),
		...(monochrome && { '--monochrome-color': monochrome })
	} as CSSProperties

	useEffect(()=> {
		if (!transition)
			return

		const appearingSprite = SPRITES_POSITIONS.find(layer => {
			const nextImage = transition.to[layer]
			return typeof nextImage == 'string' && nextImage.length > 0
		})

		if (appearingSprite)
			setTopSprite(appearingSprite)

		if (transition.to.bgAlign) {
			setBgAlign(transition.to.bgAlign)
		} else {
			setBgAlign(defaultBgAlign)
		}
	}, [transition, defaultBgAlign])

	const { graphics } = script
	const [bg] = useObserved(graphics, 'bg')
	const sprites = {
		l: useObserved(graphics, 'l')[0],
		c: useObserved(graphics, 'c')[0],
		r: useObserved(graphics, 'r')[0],
	}

	return (
		<div id="layer-graphics"
			className={classNames("layer", "graphics", {quake, monochrome})}
			style={style}
			onAnimationEnd={quake?.onFinish}
		>
			<BackgroundGraphics
				image={bg}
				bgAlign={transition?.to.bg == graphics.bg ? bgAlign : defaultBgAlign}
			/>
			<SpriteGraphics
				image={sprites.l}
				transition={transition}
				pos='l'
				topLayer={topSprite === 'l'}
			/>
			<SpriteGraphics
				image={sprites.c}
				transition={transition}
				pos='c'
				topLayer={topSprite === 'c'}
			/>
			<SpriteGraphics
				image={sprites.r}
				transition={transition}
				pos='r'
				topLayer={topSprite === 'r'}
			/>
			<ForegroundGraphics
				image={graphics.bg}
				transition={transition}
				bgAlign={bgAlign}
			/>
		</div>
	)
}

export default memo(GraphicsLayer)
