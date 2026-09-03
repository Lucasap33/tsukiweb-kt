import { splitFirst } from "@tsukiweb/common/utils/utils"
import { settings } from "../engine/settings"
import {TrackSourceId, strings} from "./lang"
import { ResolutionId, TextImage } from "@tsukiweb/common/translation/lang"
import { closeBB } from "@tsukiweb/common/utils/Bbcode"
import { AssetsCache } from "@tsukiweb/common/utils/AssetsCache"
import { assetPath, imageFormat } from "@tsukiweb/common/utils/images"
import { WORD_IMAGE_IDS } from "@assets/game/word-images"

export const assets = new AssetsCache<{
  'audio': AudioBuffer|undefined
  'graph': string
}>()

const WORD_IMAGES = new Set<string>(WORD_IMAGE_IDS)

//##############################################################################
//#                                  PRIVATE                                   #
//##############################################################################

//______________________________private functions_______________________________
//------------------------------------------------------------------------------

function textImageToStr(textImg: TextImage): string {
  const {center, top, bottom, bg="#000000"} = textImg
  let [text, vAlign] = center ? [center, 'c'] :
                       top    ? [top   , 't'] :
                       bottom ? [bottom, 'b'] :
                       [null, '']
  if (text) {
    if (Array.isArray(text))
      text = text.map(closeBB).join('\n')
    text = `$${vAlign}\`${text}\``
  }
  return `${bg}${text??""}`
}

//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

//_______________________________public functions_______________________________
//------------------------------------------------------------------------------

export function scenesDir() {
  return assetPath(`${strings['scripts-dir']}`)
}

export function spriteSheetImgPath(file: string) {
	return `./res/flowchart-spritesheets/${file}.${imageFormat}`
}

function audioPath(formats: string|string[], trackName: string) {
  const format = typeof formats == 'string' ? formats : formats[0]
  return assetPath(`${format.replace('%', trackName)}.webm`)
}

export function audioTrackPath(track: string,
                               source: TrackSourceId = settings.trackSource) {
  return audioPath(strings.audio["tracks"][source], track)
}

export function audioSePath(se: string) {
  return audioPath(strings.audio["waves"], se)
}

/**
 * Get the image source from the translation file.
 * @param img id of the image to get its source
 * @param res desired resolution.
 * @returns the requested image's url
 */
export function imageSrc(img: string, res: ResolutionId = "src") {
  if (img.startsWith('"') && img.endsWith('"'))
    img = img.substring(1, img.length-1)

  const [dir, name] = splitFirst(img, '/')
  const root = strings.images[res]
  let srcTemplate: string

  if (Object.hasOwn(root, img)) {
    srcTemplate = root[img as keyof typeof root]
  } else {
    if (!name)
      throw Error(`Unimplemented image format ${img}`)
    if (Object.hasOwn(root, dir)) {
      const parent = root[dir as keyof typeof root] as any as Record<string, string>
      srcTemplate = Object.hasOwn(parent, name) ? parent[name as keyof typeof parent] : parent[""]
    } else {
      srcTemplate = root[""]
    }
  }

  if (srcTemplate.startsWith('#'))
    return srcTemplate

  const replaced = srcTemplate
    .replace('%0', img)
    .replace('%1', dir)
    .replace('%2', name || "")
  return assetPath(`${replaced}.${imageFormat}`)
}

/**
 * Get the formatted string that replaces the image.
 * @param img image id to convert
 * @returns the formatted string that replaces the image
 */
export function wordImage(img: string) : string {
  if (img.startsWith("word/"))
    img = img.substring("word/".length)
  if (WORD_IMAGES.has(img)) {
    const subtitle = strings.images["word-subtitles"][img]
    const text = subtitle ? `$b\`${closeBB(`[center]${subtitle}`)}\`` : ""
    return `"word/${img}"${text}`
  }
  const textImage = strings.images.words[img]
  if (!textImage) {
    throw Error(`unknown word-image ${img}`)
  }
  return textImage
}

/**
 * Get the list of formatted strings and delays for the credits.
 * @returns the list of formatted strings and delays
 */
export function credits() : [string, number][] {
  return strings.credits.map(
    ({delay=5600, ...textImage})=> [textImageToStr(textImage), delay]
  )
}