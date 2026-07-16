import sceneAttrs from '@assets/game/scene_attrs.json'
import { PartialRecord } from '@tsukiweb-common/types'
import { SceneName } from './types';
import { ThumbnailsGraphics } from '@tsukiweb-common/graphics/types';

export const APP_VERSION = import.meta.env.VITE_PACKAGE_VERSION

export const SAVE_EXT = "ktweb"
export const FULLSAVE_EXT = "ktfull"
export const HISTORY_MAX_PAGES = 20
export const APP_INFO = {
  GITHUB_URL: "https://github.com/loicfrance/tsukiweb-kt",
  GITHUB_STARS: "https://img.shields.io/github/stars/loicfrance/tsukiweb-kt",
  FEEDBACK_URL: "https://forms.gle/MJorV8oNbnKo22469",
  REMAKE_URL: "http://typemoon.com/products/tsukihime/",
  GAME_VNDB: "https://vndb.org/r346"
}

export const SCENE_ATTRS: {
  'scene-names': PartialRecord<SceneName, string>,
  'scene-graphs': PartialRecord<SceneName, ThumbnailsGraphics>,
  'scene-deadEnds': Array<SceneName>,
  'scene-osiete': Array<SceneName>,
  'scene-ero': Array<SceneName>,
} = sceneAttrs as any