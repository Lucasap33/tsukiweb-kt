
const char_swaps = {
    '｡': '¡', 'ｷ': '¡', 'ｿ': '¿', 'ﾚ': '¿',
    'ｧ': 'á', 'ｪ': 'é', 'ｨ': 'í', 'ｫ': 'ó', 'ｩ': 'ú', 'ｯ': 'ü', 'ﾃ': 'ñ',
    'ｱ': 'Á', 'ｴ': 'É', 'ｲ': 'Í', 'ｵ': 'Ó', 'ｳ': 'Ú',
    '|': '…',
}

/**
 * Make changes to the raw script of the game, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function kt_raw_fixes(text) {
    text = text
        .replace( // Text in logic, unused
            /` How did you get here?@\v*` This is an error…\\/,
            "")
        .replaceAll( // Remove manual page ranges
            /^if %eroskip<1 skip 2\r?\n[ \t]*gosub \*eroskipeffect:(?:bg [^\r\n]*:)?goto \*s\d+eroend[ \t]*\r?$/gm,
            "")
        .replaceAll( // Keep the original continuation in the same scene
            /^\*s\d+eroend[ \t]*\r?$/gm,
            "")
        .replaceAll(/^(?![`;])([ \t]*)(.*@.*)$/gm, "`$1$2") // Add missing ` before text
        .replaceAll(/(image\\[^"\r\n]+)_en\.jpg/g, "$1.jpg") // Remove _en suffix from image names
        .replaceAll('“', '"').replaceAll('”', '"')
        .replace('jump##SKIPPED, try again', 'jumpf')
        .replace(/^ \*Suspiro\* Me siento/m, '` *Suspiro* Me siento')
        .replace(/^us temblores de repente/m, '`Sus temblores de repente')
        .replace('` `"Haha---', '`"Haha---')
        .replace(/^gosub \*true_staffroll\r?\n(?=\*se523)/m, '')
        .replaceAll(/[｡ｧｨｩｪｫｯｱｲｳｴｵｷｿﾃﾚ|]/g, c => char_swaps[c])
    return text;
}

/**
 * Make changes on blocks that are easier to
 * do here than on the raw text. The chages are performed after
 * all automatic fixes. Commands can be inserted as text, they will be
 * converted to tokens afterwards.
 * @type {Record<string, (block: Block)=>void>}
 */
const block_fixes = {
    //scene: (tokens)=> { //token changes.}
}

/**
 * List the start and end pages at which eroskips must be placed in each scenes.
 * `eroskip {end-start}` is inserted right after the {start}th page break.
 * If the end page is ommited (only allowed for the last entry of the scene),
 * the end will be placed after the last page at the end of the scene.
 * @type {Record<string,
 *  [number] | [number, number] | [...[number, number][], [number]|[number, number]]>
 * }
 */
const eroskip_pages = {
    s256: [[10, 43]],
    s511: [[7, 100]],
    s544: [[1, 31]],
    s545: [[12, 39]],
    s546: [[5, 69]],
}

export {
    kt_raw_fixes,
    block_fixes,
    eroskip_pages,
}