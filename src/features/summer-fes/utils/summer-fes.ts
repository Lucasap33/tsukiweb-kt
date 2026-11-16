import { SceneName } from "app/utils/types"

export type Festival = {
	id: SceneName
	character: "ark" | "cel" | "aki" | "his" | "koha"
	images: Record<string, string>
}

export const festivals: Festival[] = [
	{
		id: "s538",
		character: "ark",
		images: { bg: "bg/bg_48b", c: "tachi/ark_nt03" },
	},
	{
		id: "s539",
		character: "cel",
		images: { bg: "bg/bg_103", c: "tachi/ciel_nt05" },
	},
	{
		id: "s540",
		character: "aki",
		images: { bg: "bg/bg_103", c: "tachi/aki_nt05" },
	},
	{
		id: "s541",
		character: "his",
		images: { bg: "bg/bg_106", c: "tachi/his_nt04b" },
	},
	{
		id: "s542",
		character: "koha",
		images: { bg: "bg/bg_104", c: "tachi/koha_nt07" },
	},
]

export const festivalFinale: Pick<Festival, "id" | "images"> = {
	id: "s543",
	images: { bg: "bg/ima_02" },
}
