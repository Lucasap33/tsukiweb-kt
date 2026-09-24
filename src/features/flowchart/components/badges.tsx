import { DY } from "@tsukiweb/common/flowchart/constants"
import { PointId } from "app/utils/types";

const HEART_PATH = `m0,2.5l-2.5,-2.5a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2`
const C = DY*0.8 // unit used for condition badge
export const FLAG_BACKGROUND = "#000000"
export const POINT_BACKGROUND = "#000000"

function characterGradient(char: PointId) {
  return <linearGradient id={`${char}_grad`} x1="0" x2="1" y1="1" y2="0">
    <stop offset="0" stopColor={`color-mix(in oklch, var(--color-${char}) 80%, white)`} />
    <stop offset="1" stopColor={`color-mix(in oklch, var(--color-${char}) 80%, black)`} />
  </linearGradient>
}

export const BADGES_DEFINES = <defs>
  {characterGradient('ark')}
  {characterGradient('cel')}
  {characterGradient('his')}
  {characterGradient('aki')}
  {characterGradient('ren')}
  {characterGradient('akira')}
  {characterGradient('nana')}
  <path id="point_+" d="m1.75,0.75l0,1.75m-0.875,-0.875l1.75,0" stroke="var(--regard-plus-color, #00ff00)" fill="none"/>
  <path id="point_-" d="m1.75,0.85m-0.875,0.5l1.75,0" stroke="var(--regard-minus-color, #ff0000)" fill="none"/>
  <circle id="point_icon" cx="0" cy="0" r="3" fill={POINT_BACKGROUND}/>
  <g id="point_1">
    <circle id="point_icon" cx="0" cy="0" r="3" fill={POINT_BACKGROUND}  stroke="none"/>
    <path d="M0 3a3 3 0 113-3" fill="none"/>
    <use href="#point_+"/>
  </g>
  <path id="regard_icon" d={`${HEART_PATH}z`}/>
  {[1, 2, 3].map(n=>
    <g key={`regard_${n}`} id={`regard_${n}`}>
      <path d={`${HEART_PATH}
        ${"m-5,-2.2a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2".repeat(n-1)}`}/>
      <use href="#point_+"/>
    </g>
  )}
  {[-4, -1].map(n=>
    <g key={`regard_${n}`} id={`regard_${n}`}>
      <path d={`${HEART_PATH}
        m-2.5,0.5l0.6,-0.5l-1.3,-1l0.7,-1.2
        ${`m-2.5,0a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2
        m-2.29,-0.3l-0.91,-0.7l0.7,-1.2`.repeat(-n-1)}`}/>
      <use href="#point_-"/>
    </g>
  )}

  {// costume icon (hanger)
  }
  <path id="kashiisyo-icon" d="M0 .16l1.34 1.01h-2.69m3.5.05L.22-.23v-.2
      a.78.78 90 00-.04-1.51.78.78 90 00-.97.76h.45c0-.18.15-.34.34-.34
      s.34.15.34.34c0 .19-.15.34-.34.34-.12 0-.22.1-.22.22v.39l-1.93 1.45
      c-.18.13-.08.4.14.4h4.03c.22 0 .3-.27.14-.4m-3.5-.05L0 .16"
      fill="white" stroke="none"/>
  {// movie icon
  }
  <path id="eigakan-icon" d="M1.79-1.54v2.69c0 .21-.17.38-.38.38h-2.82
      c-.21 0-.38-.17-.38-.38l0-2.3c0-.21.17-.38.38-.38h.19l.38.77h.58l-.38-.77
      h.38l.38.77h.58l-.38-.77h.38l.38.77h.58l-.38-.77Z"
      fill="white" stroke="none"/>
  {// tea icon
  }
  <path id="kissa-icon_old" d="m-.94 1.4h1.6c.44 0 .8-.36.8-.8h.26
      C2.32.6 2.79.12 2.79-.46s-.48-1.06-1.06-1.06h-3.26c-.11 0-.2.09-.2.2V.61
      c0 .44.36.8.8.79zM1.73-1c.3 0 .54.24.54.54s-.24.54-.54.54h-.26V-.99h.26z"
      fill="white" stroke="none"/>
  {// tea icon (2)
  }
  <path id="kissa-icon" d="M-.2 1.2c.8 0 1.44-.6 1.44-1.4v-.2h.1
      c.39 0 .7-.31.7-.7s-.36-.7-.74-.7m-.5.4v.6h-2v-.6zm.5.6h-.1v-.6h.1
      c.17 0 .3.13.3.3s-.13.3-.3.3m-2.9 2.2h3.2v.4h-3.2zm2.9-3.2h-2.5
      c-.22 0-.4.18-.4.4v1.14c0 .86.6 1.46 1.4 1.46"
      fill="white" stroke="none"/>
  {// paint icon
  }
  <path id="bunka-icon" d="M-1-.5v-.6q0-.17.12-.28t.28-.12h.4v.4h.4v-.4h.2v.8h.4
      v-.8h.2v1h-2zm1 2.4q.17 0 .28-.12t.12-.28v-.8h.6q.17 0 .28-.12t.12-.28
      v-2.2h-2q-.33 0-.56.23t-.24.57v1.4q0 .16.12.28t.28.12h.6v.8q0 .16.12.28
      t.28.12"
      fill="white" stroke="none"/>
  {// picture icon
  }
  <path id="syashin-icon" d="M-1.5 1.5q-.17 0-.28-.12t-.12-.28v-2.2q0-.17.12-.28
      t.28-.12h3q.17 0 .28.12t.12.28v2.2q0 .17-.12.28t-.28.12h-3.6zm.1-.6h2.8
      l-.9-1.2-.7.9-.5-.6-.7.9z"
      fill="white" stroke="none"/>
  {// bed icon
  }
  <path id="onemu-icon" d="M-1.98 1.35v-2.7h.36v1.8h1.44v-1.44h1.44q.3 0 .51.21
      t.21.51v1.62h-.36v-.54h-3.06v.54zm.7-1.24q-.16-.15-.16-.38t.16-.38
      q.15-.16.38-.16t.38.16q.16.16.16.38t-.16.38q-.16.16-.38.16t-.38-.16z"
      fill="white" stroke="none"/>
  {// key icon
  }
  <path id="kagi-icon" d="M-.2-.3c-.18-.38-.12-.9.2-1.22.4-.4 1.05-.38 1.45.02
      s.41 1.06.01 1.46c-.32.32-.82.37-1.2.19l-.73.73.45.45-.49.49-.45-.45
      -.3.3-.45-.45 1.52-1.52zm1.16-.22c.13-.13.13-.35 0-.49s-.35-.13-.49
      0-.13.35 0 .49.35.13.49 0z"
      fill="white" stroke="none"/>
  <polygon id="flag-icon" points="0,-3.14 3,-1 1.85,2.53 -1.85,2.53 -3,-1" fill={FLAG_BACKGROUND} />
  <path id="flag-neg-icon" d="m-1.85,2.53 -1.15,-3.53 3,-2.14 3,2.14 -1.15,3.53zl3.35,-4.60" fill="#000" stroke="#800"/>
  <g id="sel-icon">
    <polygon points="0,-2.8 2.7,0 0,2.7 -2.7,0" fill="var(--active-connection)"/>
    <text y="1.6" stroke="none" fill="white" textAnchor="middle">
    ?
    </text>
  </g>
  <polygon id="cond-icon" points={`0,${C*1.5} ${-C},${C} ${-C},${-C} ${C},${-C} ${C},${C}`}/>
  <path id="cond-neg" d={`m ${-C},0l${C*2},0`} stroke="#500000"/>
</defs>
