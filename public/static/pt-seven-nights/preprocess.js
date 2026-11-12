
/**
 * Make changes to the raw script of the game, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function kt_raw_fixes(text) {
    text = text
        .replaceAll( // Remove manual page ranges
            /^if %eroskip<1 skip 2\r?\n[ \t]*gosub \*eroskipeffect:(?:bg [^\r\n]*:)?goto \*s\d+eroend[ \t]*\r?$/gm,
            "")
        .replaceAll( // Keep the original continuation in the same scene
            /^\*s\d+eroend[ \t]*\r?$/gm,
            "")
        .replaceAll(/^(?![`;])([ \t]*)(.*@.*)$/gm, "`$1$2") // Add missing ` before text
        .replaceAll(/(image\\[^"\r\n]+)_en\.jpg/g, "$1.jpg") // Remove _en suffix from image names
        .replaceAll(/(image\\[^"\r\n]+)_pt\.jpg/g, "$1.jpg") // Remove _pt suffix from image names
        .replaceAll('“', '"').replaceAll('”', '"')
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

const HALF_WIDTH_KANA = {
    'ｦ': 'õ', 'ｧ': 'á', 'ｨ': 'í', 'ｩ': 'ú', 'ｪ': 'é', 'ｫ': 'ó', 'ｬ': 'ã',
    'ｭ': 'â', 'ｮ': 'ê', 'ｯ': 'ç', 'ｰ': 'Ç', 'ｱ': 'Á', 'ｲ': 'Í', 'ｳ': 'Ú',
    'ｴ': 'É', 'ｵ': 'Ó', 'ｷ': 'ô', 'ｹ': 'Ã', 'ｻ': 'Ê', 'ｼ': 'à', 'ｽ': 'À',
}

/**
 * Make changes to a line of a daily message.
 * @param {string} line text line of a daily message
 * @returns {string} the changed line
 */
function kt_daily_message_fixes(line) {
    return line
        .replaceAll(/[ｦ-ｽ]/g, c => HALF_WIDTH_KANA[c] ?? c)
        .replaceAll('|', '…')
}

export {
    kt_raw_fixes,
    kt_daily_message_fixes,
    block_fixes,
    eroskip_pages,
}