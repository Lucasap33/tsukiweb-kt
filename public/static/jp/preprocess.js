
/**
 * Make changes to the raw script of the game, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function th_raw_fixes(text) {
    return null;
}

/**
 * Make changes on blocks that are easier to
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
    s256: [[10, 43]],
    s511: [[7, 76]],
    s544: [[1, 31]],
    s545: [[12, 39]],
    s546: [[5, 69]],
}

export {
    th_raw_fixes,
    block_fixes,
    eroskip_pages,
}