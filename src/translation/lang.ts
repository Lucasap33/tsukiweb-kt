import defaultStrings from "../assets/lang/default.json"
import { settings } from "../engine/settings"
import { ImageRedirect, ResolutionId, TextImage, TranslationId, UpdateDateFormat } from "@tsukiweb/common/translation/lang"
import { PartialRecord } from "@tsukiweb/common/types"
import { APP_VERSION, SCENE_ATTRS } from "app/utils/constants";
import { LabelName } from "app/utils/types";
import { ASSETS_PATH } from "@tsukiweb/common/constants";
import { createTranslationStore } from "@tsukiweb/common/translation/langStore"

//________________________________private types_________________________________
//------------------------------------------------------------------------------

export type DailyMessageEntry = {
  text: string[]
  fg?: string
  bg?: string
}

type StringsTypeBase = {
  id: TranslationId
  lastUpdate: UpdateDateFormat
  images: {
    "redirect-ids": Record<string, ImageRedirect<`${string}\$${string}`>>
    "redirected-images": Record<string, string|ImageRedirect<string>>
    "word-subtitles": Record<string, string>
    "words": Record<string, string>
  } & Record<ResolutionId, Record<string, string>>
  choices: PartialRecord<LabelName, string[]>
  "daily-messages": {
    random: DailyMessageEntry[]
    dates: Record<string, DailyMessageEntry>
  }
  scenario: {
    days: string[]
    scenes: typeof SCENE_ATTRS['scene-names']
  }
  credits: (TextImage & {delay?: number})[]
}
type StringsType = StringsTypeBase & Omit<typeof defaultStrings, keyof StringsTypeBase>

//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

export type TrackSourceId = keyof typeof defaultStrings.audio['tracks']

export const {
  languages,
  strings,
  StringsProvider,
  useStrings,
  getLocale,
  isLanguageLoaded,
  waitLanguageLoad,
} = createTranslationStore(defaultStrings as unknown as StringsType, settings, {
  appVersion: APP_VERSION,
  assetsPath: ASSETS_PATH,
  optionalPaths: [
    "images.words",
    "images.word-subtitles",
    "images.thumb",
    "images.src",
    "audio",
  ],
  storagePrefix: "kt_"
})

window.strings = strings
