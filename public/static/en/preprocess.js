
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
    "s9": (block)=> {
        block.replaceText("somr pushups", "some pushups")
    },
    "s22": (block)=> {
        block.replaceText("wou would've guessed", "who would've guessed")
    },
    "s54": (block)=> {
        block.replaceText("big shoes too fill", "big shoes to fill")
    },
    "s57": (block)=> {
        block.replaceText("The scrounching movement", "The scrunching movement")
    },
    "s64": (block)=> {
        block.replaceText("if it's a small matter if I forget", "it's a small matter if I forget")
    },
    "s164": (block)=> {
        block.replaceText("for some reason I she seems", "for some reason she seems")
    },
    "s171": (block)=> {
        block.replaceText("I actually seriously she can even", "I seriously doubt she can even")
    },
    "s183": (block)=> {
        block.replaceText("I disslove into", "I dissolve into")
    },
    "s184": (block)=> {
        block.replaceText("A feeling of deva ju", "A feeling of déjà vu")
    },
    "s305": (block)=> {
        block.replaceText("and stagers now", "and staggers now")
    },
    "s521": (block)=> {
        block.replaceText("my way to shool", "my way to school")
    },
    "s529": (block)=> {
        block.replaceText("in this wholesome an environment", "in this wholesome environment")
    },
    "s530": (block)=> {
        block.replaceText("so dishearted", "so disheartened")
    },
    "s531": (block)=> {
        block.replaceText("ones who are threat to", "ones who are a threat to")
        block.replaceText("An foreign object", "A foreign object")
    },
    "s532": (block)=> {
        block.replaceText("Arihikio-san", "Arihiko-san")
    },
    "s534": (block)=> {
        block.replaceText("so we are want for nothing", "so we want for nothing")
    },
    "s537": (block)=> {
        block.replaceText("i am still", "I am still")
        block.replaceText("I did for Shiki!", "I did it for Shiki!")
    },
    "s546": (block)=> {
        block.replaceText("flowers that don't whither", "flowers that don't wither")
    },
    "quiz2_8": (block)=> {
        block.replaceText("Eigth question", "Eighth question")
    },
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

/**
 * Make changes to a line of a daily message.
 * @param {string} line text line of a daily message
 * @returns {string} the changed line
 */
function kt_daily_message_fixes(line) {
    return line
        .replace("beautiful twinking", "beautiful twinkling")
}

export {
    kt_raw_fixes,
    kt_daily_message_fixes,
    block_fixes,
    eroskip_pages,
}