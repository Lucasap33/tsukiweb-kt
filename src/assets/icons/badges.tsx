import "./badges.scss"
import { PointBadge, BadgeBaseProps, RegardBadge, FlagBadge } from "@tsukiweb/common/icons/badges"
import { PointId } from "app/utils/types"
import { HourglassSVGIcon } from "features/flowchart/components/badges"

type KtPointPadgeProps = {
	name?: PointId|""
	value?: number
	transient?: boolean
} & BadgeBaseProps

export const KtPointBadge = ({name = "", value = 0, transient = false, ...props}: KtPointPadgeProps)=> {
	const hourglass = transient ? <HourglassSVGIcon className="hourglass"/> : undefined
	return (["kagi", "kaibyo", ""].includes(name)) ?
    	<PointBadge
			icon={<use href={`#${name}-icon`}/>}
			value={value}
			{...props}>{hourglass}</PointBadge>
    :
		<RegardBadge
			fill={`url(#${name}_grad)`}
			img={`./res/chars/${name}.webp`}
			value={value}
			{...props}>{hourglass}</RegardBadge>
}
  

type KtFlagBadgeProps = {
	flag?: string
	negative?: boolean
	transient?: boolean
} & BadgeBaseProps

export const KtFlagBadge = ({flag = "", negative = false, transient = false, ...props}: KtFlagBadgeProps)=>
	<FlagBadge
		icon={(flag.length > 1) ? <use href={`#${flag}-icon`}/> : flag}
		negative={negative}
		{...props}>{transient && <HourglassSVGIcon className="hourglass"/>}</FlagBadge>
