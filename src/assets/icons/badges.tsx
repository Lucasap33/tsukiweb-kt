import { PointBadge, BadgeBaseProps, RegardBadge, FlagBadge } from "@tsukiweb/common/icons/badges";
import { PointId } from "app/utils/types";

type KtPointPadgeProps = {
	name?: PointId|""
	value?: number
} & BadgeBaseProps

export const KtPointBadge = ({name = "", value = 0, ...props}: KtPointPadgeProps)=>
  (["kagi", "kaibyo", ""].includes(name)) ?
    <PointBadge
			icon={<use href={`#${name}-icon`}/>}
			value={value}
			{...props}/>
    :
		<RegardBadge
			fill={`url(#${name}_grad)`}
			img={`./res/chars/${name}.webp`}
			value={value}
			{...props}/>

type KtFlagBadgeProps = {
	flag?: string
	negative?: boolean
} & BadgeBaseProps

export const KtFlagBadge = ({flag = "", negative = false, ...props}: KtFlagBadgeProps)=>
	<FlagBadge
		icon={(flag.length > 1) ? <use href={`#${flag}-icon`}/> : flag}
		negative={negative}
		{...props}/>