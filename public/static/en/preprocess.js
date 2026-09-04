
/**
 * Make changes to the raw script of Kagetsu Tohya, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function kt_raw_fixes(text) {
    text = text
        .replace( // Text in logic, unused
            /` How did you get here?@\v*` This is an error…\\/,
            "")
        .replaceAll( // Eroskips added manually in all languages
            /if %eroskip<1 skip 2\v*\s*gosub \*eroskipeffect:goto *\w+eroend/gm,
            "")
        .replaceAll(/^(?![`;])([ \t]*)(.*@.*)$/gm, "`$1$2") // Add missing ` before text
        .replaceAll(/(image\\word\\[^"\r\n]+)_en\.jpg/g, "$1.jpg") // Remove _en suffix from image names
        .replaceAll('“', '"').replaceAll('”', '"')
    return text;
}

/**
 * Make changes on blocks (both for Tsukihime and Plus-Disc) that are easier to
 * do here than on the raw text. The chages are performed after
 * all automatic fixes. Commands can be inserted as text, they will be
 * converted to tokens afterwards.
 * @type {Record<string, (block: Block)=>void>}
 */
const block_fixes = {
    "f79": (block)=> {
        block.delete(block.indexOf("inc %guest_image8"))
    },
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

}

export {
    kt_raw_fixes,
    block_fixes,
    eroskip_pages,
}