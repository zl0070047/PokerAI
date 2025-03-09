type Card = {
  value: string;
  suit: string;
};

interface HandRank {
  name: string;
  value: number[];
  cards: (string | null)[];  // 修改类型定义，允许 null 值
  rank: number;
}

// 解析牌面
function parseCard(card: string): Card {
  return {
    value: card.slice(0, -1),
    suit: card.slice(-1)
  };
}

// 获取牌值大小
function getCardValue(value: string): number {
  const values: { [key: string]: number } = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return values[value];
}

// 计算最佳牌型
// 修改所有返回 HandRank 的地方，添加 cards 属性
export function evaluateHand(playerCards: string[], communityCards: string[]): HandRank {
  const allCards = [...playerCards, ...communityCards].map(parseCard);
  
  // 检查同花顺
  const straightFlush = checkStraightFlush(allCards);
  if (straightFlush) return { 
    rank: 8, 
    name: '同花顺', 
    value: straightFlush,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 检查四条
  const fourOfAKind = checkFourOfAKind(allCards);
  if (fourOfAKind) return { 
    rank: 7, 
    name: '四条', 
    value: fourOfAKind,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 检查葫芦
  const fullHouse = checkFullHouse(allCards);
  if (fullHouse) return { 
    rank: 6, 
    name: '葫芦', 
    value: fullHouse,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 检查同花
  const flush = checkFlush(allCards);
  if (flush) return { 
    rank: 5, 
    name: '同花', 
    value: flush,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 检查顺子
  const straight = checkStraight(allCards);
  if (straight) return { 
    rank: 4, 
    name: '顺子', 
    value: straight,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 检查三条
  const threeOfAKind = checkThreeOfAKind(allCards);
  if (threeOfAKind) return { 
    rank: 3, 
    name: '三条', 
    value: threeOfAKind,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 检查两对
  const twoPair = checkTwoPair(allCards);
  if (twoPair) return { 
    rank: 2, 
    name: '两对', 
    value: twoPair,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 检查对子
  const pair = checkPair(allCards);
  if (pair) return { 
    rank: 1, 
    name: '对子', 
    value: pair,
    cards: allCards.map(card => card.value + card.suit)
  };
  
  // 高牌
  return { 
    rank: 0, 
    name: '高牌', 
    value: [Math.max(...allCards.map(card => getCardValue(card.value)))],
    cards: allCards.map(card => card.value + card.suit)
  };
}

// 各种牌型检查函数
// 检查同花顺
function checkStraightFlush(cards: Card[]): number[] | null {
  // 按花色分组
  const suitGroups = cards.reduce((acc, card) => {
    acc[card.suit] = acc[card.suit] || [];
    acc[card.suit].push(card);
    return acc;
  }, {} as { [key: string]: Card[] });

  // 检查每个花色组是否有顺子
  for (const suitCards of Object.values(suitGroups)) {
    if (suitCards.length >= 5) {
      const straightValues = checkStraight(suitCards);
      if (straightValues) return straightValues;
    }
  }
  return null;
}

// 检查四条
function checkFourOfAKind(cards: Card[]): number[] | null {
  const valueCount = countValues(cards);
  for (const [value, count] of Object.entries(valueCount)) {
    if (count === 4) {
      const kicker = findHighestKicker(cards, [value]);
      return [getCardValue(value), kicker];
    }
  }
  return null;
}

// 检查葫芦
function checkFullHouse(cards: Card[]): number[] | null {
  const valueCount = countValues(cards);
let threeOfAKindValue
  // 删除重复声明，因为后面已经声明了 pair 变量

  // 初始化为 null 以避免类型错误
  let threeOfAKind: string | null = null;
  let pair: string | null = null;

  for (const [value, count] of Object.entries(valueCount)) {
    if (count === 3 && (!threeOfAKind || getCardValue(value) > getCardValue(threeOfAKind))) {
      threeOfAKind = value;
    } else if (count >= 2 && (!pair || getCardValue(value) > getCardValue(pair))) {
      pair = value;
    }
  }

  if (threeOfAKind && pair) {
    return [getCardValue(threeOfAKind), getCardValue(pair)];
  }
  return null;
}

// 检查同花
function checkFlush(cards: Card[]): number[] | null {
  const suitGroups = cards.reduce((acc, card) => {
    acc[card.suit] = acc[card.suit] || [];
    acc[card.suit].push(card);
    return acc;
  }, {} as { [key: string]: Card[] });

  for (const suitCards of Object.values(suitGroups)) {
    if (suitCards.length >= 5) {
      return suitCards
        .map(card => getCardValue(card.value))
        .sort((a, b) => b - a)
        .slice(0, 5);
    }
  }
  return null;
}

// 检查顺子
function checkStraight(cards: Card[]): number[] | null {
  const values = [...new Set(cards.map(card => getCardValue(card.value)))].sort((a, b) => b - a);
  
  // 特殊处理 A-5 顺子
  if (values.includes(14)) {
    values.push(1);
  }

  for (let i = 0; i < values.length - 4; i++) {
    if (values[i] - values[i + 4] === 4) {
      return [values[i]];
    }
  }
  return null;
}

// 检查三条
function checkThreeOfAKind(cards: Card[]): number[] | null {
  const valueCount = countValues(cards);
  for (const [value, count] of Object.entries(valueCount)) {
    if (count === 3) {
      const kickers = findHighestKickers(cards, [value], 2);
      return [getCardValue(value), ...kickers];
    }
  }
  return null;
}

// 检查两对
function checkTwoPair(cards: Card[]): number[] | null {
  const valueCount = countValues(cards);
  const pairs = Object.entries(valueCount)
    .filter(([_, count]) => count >= 2)
    .map(([value]) => getCardValue(value))
    .sort((a, b) => b - a);

  if (pairs.length >= 2) {
    const kicker = findHighestKicker(cards, pairs.map(v => v.toString()));
    return [...pairs.slice(0, 2), kicker];
  }
  return null;
}

// 检查对子
function checkPair(cards: Card[]): number[] | null {
  const valueCount = countValues(cards);
  for (const [value, count] of Object.entries(valueCount)) {
    if (count === 2) {
      const kickers = findHighestKickers(cards, [value], 3);
      return [getCardValue(value), ...kickers];
    }
  }
  return null;
}

// 辅助函数：统计每个点数的数量
function countValues(cards: Card[]): { [key: string]: number } {
  return cards.reduce((acc, card) => {
    acc[card.value] = (acc[card.value] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
}

// 辅助函数：找出最大的踢脚牌
function findHighestKicker(cards: Card[], excludeValues: string[]): number {
  return Math.max(...cards
    .filter(card => !excludeValues.includes(card.value))
    .map(card => getCardValue(card.value)));
}

// 辅助函数：找出多个踢脚牌
function findHighestKickers(cards: Card[], excludeValues: string[], count: number): number[] {
  return cards
    .filter(card => !excludeValues.includes(card.value))
    .map(card => getCardValue(card.value))
    .sort((a, b) => b - a)
    .slice(0, count);
}

// 比较两手牌
export function compareHands(hand1: HandRank, hand2: HandRank): number {
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }
  
  // 相同牌型，比较值
  for (let i = 0; i < hand1.value.length; i++) {
    if (hand1.value[i] !== hand2.value[i]) {
      return hand1.value[i] - hand2.value[i];
    }
  }
  
  return 0; // 完全相等
}