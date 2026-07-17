
/**
 * Make changes to the raw script of Tsukihime, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function th_raw_fixes(text) {
    return null;
}

/**
 * Make changes on blocks (both for Tsukihime and Plus-Disc) that are easier to
 * do here than on the raw text. The chages are performed after
 * all automatic fixes. Commands can be inserted as text, they will be
 * converted to tokens afterwards.
 * @type {Record<string, (tokens: Token[])=>void>}
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

}

export {
    th_raw_fixes,
    block_fixes,
    eroskip_pages,
}