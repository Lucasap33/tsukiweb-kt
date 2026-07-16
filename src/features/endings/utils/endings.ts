import { CharId, SceneName } from "../../../app/utils/types"
import { SCENE_ATTRS } from "../../../app/utils/constants"
import { strings } from "../../../translation/lang"
import { settings } from "../../../engine/settings"
import { PartialRecord } from "@tsukiweb-common/types"
import { viewedScene } from "../../../engine/settings"
import { getSceneTitle } from "engine/utils";

type EndType = "normal"|"true"|"good"|"osiete"

class Ed {
  private _scene: SceneName
  private _char: CharId|undefined
  private _illus: string|undefined
  private _type: EndType

  constructor(scene: SceneName, char?: CharId, type: EndType="osiete", illus?: string) {
    this._scene = scene
    this._type = type
    this._char = char
    this._illus = illus
  }

  get scene() { return this._scene }
  get type() { return this._type }
  get char() { return this._char }
  get image() { return this._illus }

  get seen() {
    return viewedScene(this._scene) || settings.unlockEverything
  }
  get name() {
    return getSceneTitle(this.scene)
  }
}

type Ending<T extends EndType=EndType> = Readonly<{
  scene: SceneName,
  type: T,
  seen: boolean,
  name: string,
  char: CharId | (T extends "osiete" ? undefined : CharId),
  image: string
}>
export type RouteEnding = Ending<Exclude<EndType, "osiete">>
export type OsieteEnding = Ending<"osiete">


export const endings: Record<string, Ed> = {
  //ciel_good   : new Ed("s308", "cel" , "good"  , "cel_e07a") as RouteEnding,
}

export const osiete = Object.fromEntries(
  Object.entries(SCENE_ATTRS["scene-osiete"]).map(
    ([name])=> {
      switch (name) {
        //case "s516": return [name, new Ed(name, "cel" ) as OsieteEnding] //s107,
      }
      return [name, new Ed(name as SceneName) as OsieteEnding]
    }
  )
) as Record<SceneName, OsieteEnding>