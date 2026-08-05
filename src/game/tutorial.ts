import type { CardDef, Coord, FruitColor, Rotation } from './types'
import { cellsFromColors } from './generateCard'

const A = 'apple' as FruitColor
const L = 'lemon' as FruitColor
const P = 'plum' as FruitColor

function card(
  id: string,
  colors: [FruitColor, FruitColor, FruitColor, FruitColor, FruitColor, FruitColor],
): CardDef {
  return { id, cells: cellsFromColors(colors) }
}

/** 起始果园 */
export const TUTORIAL_STARTER = card('tut-start', [A, A, L, L, P, P])

/** 第一步：学习重叠放置 */
export const TUTORIAL_CARD_PLACE = card('tut-place', [A, L, P, A, L, P])

/** 第二步：同色重叠结出果实 */
export const TUTORIAL_CARD_FRUIT = card('tut-fruit', [A, A, A, A, L, L])

/** 第三步：异色重叠产生坏果 */
export const TUTORIAL_CARD_ROTTEN = card('tut-rotten', [L, L, L, L, L, L])

export type TutorialGuide = {
  id: string
  title: string
  body: string
  requiredCardId: string
  requiredRotation: Rotation
  requiredOrigin: Coord
  allowRotate: boolean
  /** 高亮区域文案 */
  highlightHint: string
}

/**
 * 三步强制引导（固定牌序 + 固定落点）。
 * 手牌始终只有当前步骤需要的那一张。
 */
export const TUTORIAL_GUIDES: TutorialGuide[] = [
  {
    id: 'place',
    title: '第一步：放置与重叠',
    body: '请选择高亮的手牌，放到棋盘金色高亮位置。新牌必须至少盖住已有树木一格。',
    requiredCardId: 'tut-place',
    requiredRotation: 0,
    requiredOrigin: { x: 1, y: 0 },
    allowRotate: false,
    highlightHint: '点击金色高亮区域放置',
  },
  {
    id: 'fruit',
    title: '第二步：果实得分',
    body: '将高亮手牌放到金色位置。同色树重叠会结出骰子（1→3→6→10）。观察红色苹果如何得分。',
    requiredCardId: 'tut-fruit',
    requiredRotation: 0,
    requiredOrigin: { x: 0, y: 0 },
    allowRotate: false,
    highlightHint: '叠在起始果园上，制造同色得分',
  },
  {
    id: 'rotten',
    title: '第三步：坏果惩罚',
    body: '将高亮手牌放到金色位置。异色覆盖会变成坏果，终局每个坏果扣 3 分。',
    requiredCardId: 'tut-rotten',
    requiredRotation: 0,
    requiredOrigin: { x: 0, y: 0 },
    allowRotate: false,
    highlightHint: '故意用柠檬盖住苹果，生成坏果',
  },
]

export const TUTORIAL_STEPS = TUTORIAL_GUIDES

export const TUTORIAL_DONE = {
  title: '教程完成',
  body: '你已经掌握放置、果实得分与坏果规则。可以回到主界面挑战任务模式或无限模式了！',
}

export function getTutorialGuide(step: number): TutorialGuide | null {
  if (step < 0 || step >= TUTORIAL_GUIDES.length) return null
  return TUTORIAL_GUIDES[step]!
}
