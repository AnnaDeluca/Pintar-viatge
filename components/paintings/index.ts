import Mondrian from './Mondrian'
import Kandinsky from './Kandinsky'
import Miro from './Miro'
import Matisse from './Matisse'
import VanGogh from './VanGogh'
import Hokusai from './Hokusai'
import Lascaux from './Lascaux'
import Kahlo from './Kahlo'
import Tarsila from './Tarsila'
import Kusama from './Kusama'
import Ndebele from './Ndebele'
import type { ComponentType } from 'react'
import type { Dot } from './Kusama'

export interface PaintingProps {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
  dots?: Dot[]
  onSvgClick?: (x: number, y: number) => void
}

export const paintingComponents: Record<string, ComponentType<PaintingProps>> = {
  mondrian:  Mondrian,
  kandinsky: Kandinsky,
  miro:      Miro,
  matisse:   Matisse,
  vangogh:   VanGogh,
  hokusai:   Hokusai,
  lascaux:   Lascaux,
  kahlo:     Kahlo,
  tarsila:   Tarsila,
  kusama:    Kusama,
  ndebele:   Ndebele,
}
