import path from 'path'
import { processImages } from '@tsukiweb/common/tools/convert-images/processor.ts'
import { mergeVertical } from '@tsukiweb/common/tools/convert-images/editor.ts'
import { logger } from '@tsukiweb/common/tools/utils/logger.ts'

/**
 * Put in the "input" folder: bg, event and tachi folders.
 * Put in the "input_x2" folder: bg, event and tachi folders (upscaled).
 * Run this script to generate "images_thumb" and "images" directories.
 */

const outputDir = '../../../public/static/jp/'

const thumbConfig = {
  inputDir: 'input',
  outputDir: path.join(outputDir, 'images_thumb'),
  options: {
    resize: {
      width: 200,
      kernel: 'lanczos3' as const,
    },
    avif: {
      quality: 60,
      alphaQuality: 50,
      effort: 8,
      chromaSubsampling: '4:4:4' as const,
    }
  }
}

const x2Config = {
  inputDir: 'input_x2',
  outputDir: path.join(outputDir, 'images'),
  options: {
    avif: {
      quality: 60,
      alphaQuality: 70,
      effort: 8,
      chromaSubsampling: '4:4:4' as const,
    }
  }
}

async function main() {
  try {
    logger.section('Images processing')
    
    await processImages(thumbConfig.inputDir, thumbConfig.outputDir, thumbConfig.options)
    await processImages(x2Config.inputDir, x2Config.outputDir, x2Config.options)

    logger.log('Done ✓')
  } catch (error) {
    logger.error(`An error occurred: ${(error as Error).message}`)
  }
}

main()
