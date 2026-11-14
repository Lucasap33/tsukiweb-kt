import { DY } from "@tsukiweb/common/flowchart/constants"
import { PointId } from "app/utils/types";
import { SVGProps } from "react";
import {BADGE_PATHS as BADGE_PATHS_BASE} from "@tsukiweb/common/icons/badges"

const C = DY*0.8 // unit used for condition badge
const BADGE_HALF = DY
export const QUIZ_ICON = { x: -1, scale: 0.75 }
export const QUIZ_NUMBER_X = 1.4

export const HOURGLASS = {
  x: 2.5, y: -2.3, radius: 1.75,
  background: "#160807", glass: "#fff3d0", sand: "#f2a629",
  frame: "M3.3-1.2H1.7M3.3-3.4H1.7",
  glassPath: "M3.1-3.4c0 1-.5.9-.5 1.1s.5.2.5 1.1H1.9c0-.9.5-.9.5-1.1s-.5-.1-.5-1.1Z",
  sandPath: "M2.5-2l.6.8H1.9ZM2-2.9q.1.4.5.6.4-.2.5-.6Z",
}

export const HourglassSVGIcon = (props: SVGProps<SVGGElement>)=>
  <g {...props}>
    <circle cx={HOURGLASS.x} cy={HOURGLASS.y} r={HOURGLASS.radius} fill={HOURGLASS.background} stroke="white" strokeWidth=".3"/>
    <path d={HOURGLASS.sandPath} fill={HOURGLASS.sand} stroke="none"/>
    <path d={HOURGLASS.glassPath} fill="none" stroke={HOURGLASS.glass} strokeWidth=".2" strokeLinejoin="round"/>
    <path d={HOURGLASS.frame} fill="none" stroke={HOURGLASS.glass} strokeWidth=".28" strokeLinecap="round"/>
  </g>

export const BADGE_PATHS = {...BADGE_PATHS_BASE,
  select: "M-4.6,0 -2,-2.5 2,-2.5 4.6,0 2,2.5 -2,2.5Z",
  cond: `M0,${C*1.5} ${-BADGE_HALF},${C} ${-BADGE_HALF},${-C} ${BADGE_HALF},${-C} ${BADGE_HALF},${C}Z`,
  icons: {
    kashiisyo: `M0 .16l1.34 1.01h-2.69m3.5.05L.22-.23v-.2
      a.78.78 90 00-.04-1.51.78.78 90 00-.97.76h.45c0-.18.15-.34.34-.34
      s.34.15.34.34c0 .19-.15.34-.34.34-.12 0-.22.1-.22.22v.39l-1.93 1.45
      c-.18.13-.08.4.14.4h4.03c.22 0 .3-.27.14-.4m-3.5-.05L0 .16`,
    eigakan: `M1.79-1.54v2.69c0 .21-.17.38-.38.38h-2.82
      c-.21 0-.38-.17-.38-.38l0-2.3c0-.21.17-.38.38-.38h.19l.38.77h.58l-.38-.77
      h.38l.38.77h.58l-.38-.77h.38l.38.77h.58l-.38-.77Z`,
    kissa: `M-.2 1.2c.8 0 1.44-.6 1.44-1.4v-.2h.1
      c.39 0 .7-.31.7-.7s-.36-.7-.74-.7m-.5.4v.6h-2v-.6zm.5.6h-.1v-.6h.1
      c.17 0 .3.13.3.3s-.13.3-.3.3m-2.9 2.2h3.2v.4h-3.2zm2.9-3.2h-2.5
      c-.22 0-.4.18-.4.4v1.14c0 .86.6 1.46 1.4 1.46`,
    bunka: `M-1-.5v-.6q0-.17.12-.28t.28-.12h.4v.4h.4v-.4h.2v.8h.4
      v-.8h.2v1h-2zm1 2.4q.17 0 .28-.12t.12-.28v-.8h.6q.17 0 .28-.12t.12-.28
      v-2.2h-2q-.33 0-.56.23t-.24.57v1.4q0 .16.12.28t.28.12h.6v.8q0 .16.12.28
      t.28.12`,
    syashin: `M-1.5 1.5q-.17 0-.28-.12t-.12-.28v-2.2q0-.17.12-.28
      t.28-.12h3q.17 0 .28.12t.12.28v2.2q0 .17-.12.28t-.28.12h-3.6zm.1-.6h2.8
      l-.9-1.2-.7.9-.5-.6-.7.9z`,
    onemu: `M-1.98 1.35v-2.7h.36v1.8h1.44v-1.44h1.44q.3 0 .51.21
      t.21.51v1.62h-.36v-.54h-3.06v.54zm.7-1.24q-.16-.15-.16-.38t.16-.38
      q.15-.16.38-.16t.38.16q.16.16.16.38t-.16.38q-.16.16-.38.16t-.38-.16z`,
    kagi: `M-.2-.3c-.18-.38-.12-.9.2-1.22.4-.4 1.05-.38 1.45.02
      s.41 1.06.01 1.46c-.32.32-.82.37-1.2.19l-.73.73.45.45-.49.49-.45-.45
      -.3.3-.45-.45 1.52-1.52zm1.16-.22c.13-.13.13-.35 0-.49s-.35-.13-.49
      0-.13.35 0 .49.35.13.49 0z`,
    quiz: `M-.7.8h2v.8h-2zm-.4.4c0 .22-.18.4-.4.4
      s-.4-.18-.4-.4.18-.4.4-.4.4.18.4.4m.4-2.8h2v.8h-2zm-.4.4c0 .22-.18.4-.4.4
      s-.4-.18-.4-.4.18-.4.4-.4.4.18.4.4m.4.8h2v.8h-2zm-.4.4c0 .22-.18.4-.4.4
      s-.4-.18-.4-.4.18-.4.4-.4.4.18.4.4`,
    kaibyo: `M0-1.67c-.24.01-.48.05-.71.13-.32-.25-.88-.45-1.17
      -.44 0 0-.02.11 0 .17-.04 0-.11.02-.14.04.01.07.03.13.06.2-.15.6.04 1.02
      .06 1.07-.43.8-.6 1.56-.6 1.65.12-.01.24-.04.33-.11-.02.37.1.7.11.7.1-.06
      .19-.13.27-.21.01.21.08.43.1.42.05-.01.39-.15.46-.23.04.11.23.44.31.44.03
      0 .2-.27.22-.3.04.13.13.36.18.4.07 0 .29-.16.44-.26.07.07.24.26.3.26.03 0
      .2-.23.24-.28.11.09.37.28.42.26.03-.02.07-.31.1-.44.02.03.24.34.29.33.04 0
      .21-.45.23-.66.11.15.31.4.45.45.04-.14.07-.62.1-.92.06.08.22.27.32.29-.01
      -.67-.33-1.62-.52-1.91.14-.43.12-.6.02-.97.04-.05.05-.11.06-.17-.04-.03
      -.12-.05-.14-.07 0-.03-.01-.18-.03-.19-.03-.01-.76.17-1.18.43-.01 0-.02 0
      -.04-.01.33-.38.54-.41.66-.45-.2-.07-.64-.13-.88.4-.01 0-.03 0-.06-.01-.06
      -.25.03-.46.14-.67-.26.01-.47.41-.4.66zm-.57.46c.01.06-.67.74-.99.87.07
      -.19.05-.25.12-.39-.08-.01-.31-.09-.33-.18.05-.06.18-.13.25-.18-.1-.06-.16
      -.13-.26-.29.09-.02.19-.03.29-.05-.06-.1-.14-.24-.14-.38.21-.03 1 .48 1.04
      .58zm2.18-.51c-.02.04-.06.13-.12.25.02.01.2.02.25.04 0 .02-.09.18-.2.26
      -.19-.19-.4-.28-.68-.29.22-.23.36-.28.74-.27zm-1.32 2.54c0 .21-.39.49-.7.5
      -.33.02-.74-.18-.74-.51 0-.33.44-.45.51-.45-.22.44.02.9.1.89.19-.01.26-.59
      .08-.91.27-.04.75.11.75.48zm1.29-.05c-.01.42-.56.53-.83.47.17-.07.22-.64
      .11-.84.38-.09.72.1.72.37zm-.91-.3c-.11.19-.15.49.02.75-.14-.06-.31-.25-.3
      -.39.03-.21.19-.32.28-.36zm.06.8c.12.08-.07.55-.37.19-.16.3-.7.15-.51-.13
      -.06.32.44.3.5.05.14.21.33.19.38-.11z`,
    celroom: `M-.6-.45a1.1 1.1 90 10.1.5A.65.65 90 01.5.05
      a1.1 1.1 90 10.1-.5A1.1 1.1 90 00-.6-.45Z`,
    arkroom: `M-.35-2A2.01 2.01 90 002 .35 2.01 2.01 90 11-.35-2Z`,
    finish: `M-.41-2.11q.41-.59.82 0l.39.57q.15.23.42.31l.66.2q.68.19.25.77
      l-.42.55q-.17.21-.16.48l.02.7q.01.72-.66.47l-.65-.23q-.26-.09-.51 0
      l-.66.23q-.67.25-.66-.47l.03-.7q0-.27-.17-.48l-.42-.55q-.43-.58.25-.77
      l.66-.2q.27-.08.42-.31z`
  } as Record<string, string>,
}

const GRADIENT_CHARS: PointId[] = ['ark', 'cel', 'his', 'aki', 'ren', 'seo', 'nana']

export const flagPersists = (flag: string) =>
  flag.length == 1 || flag.startsWith('quiz') || flag == "finish"

export const pointPersists = (point: PointId) =>
  !['ark', 'cel', 'aki', 'seo'].includes(point)

export const BADGES_DEFINES = <defs>
  {GRADIENT_CHARS.map(char =>
    <linearGradient key={char} id={`${char}_grad`} x1="0" x2="1" y1="1" y2="0">
      <stop offset="0" stopColor={`color-mix(in oklch, var(--color-${char}) 80%, white)`} />
      <stop offset="1" stopColor={`color-mix(in oklch, var(--color-${char}) 80%, black)`} />
    </linearGradient>
  )}
  {Object.entries(BADGE_PATHS.icons).map(([name, d]) =>
    <path key={name} id={`${name}-icon`} d={d} fill="white" stroke="none"/>
  )}
  {[1,2,3].map(n=>
    <g id={`quiz${n}-icon`} key={n}>
      <use href="#quiz-icon" transform={`translate(${QUIZ_ICON.x},0) scale(${QUIZ_ICON.scale})`}/>
      <text x={QUIZ_NUMBER_X} y="1.6" stroke="none" fill="white" fontSize={4}
            textAnchor="middle">
        {n}
      </text>
    </g>
  )}
</defs>
