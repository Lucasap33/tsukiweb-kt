export enum SCREEN {
  TITLE = "/",
  WINDOW = "/window",
  CONFIG = "/config",
  LOAD = "/load",
  GALLERY = "/gallery",
  SUMMER_FES = "/summer-fes",
  SCENES = "/scenes",
  DREAMS = "/dreams",
  DAILY_MESSAGES = "/daily-messages",
}

export const displayMode: {
  screen: SCREEN
  bgAlignment: 'top' | 'center' | 'bottom'
  bgMoveTime: number
  replaceNavigation: boolean
  navigationState?: unknown
} = {
  screen: SCREEN.TITLE,
  bgAlignment: 'center',
  bgMoveTime: 0,
  replaceNavigation: false,
  navigationState: undefined,
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.displayMode = displayMode
