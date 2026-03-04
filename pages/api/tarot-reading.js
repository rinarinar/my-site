function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function fallbackReading(question, cards) {
  const opening = `问题「${question}」的核心在于先看清现状，再做稳定推进。`;
  const cardReadings = cards.map((c) => ({
    position: c.position,
    card: c.nameZh,
    orientation: c.orientation,
    analysis: c.orientation === '逆位'
      ? '当前能量偏阻滞，提示你先处理卡点，再考虑推进速度。'
      : '当前能量较顺畅，建议你主动把握并落实关键动作。',
  }));
  return {
    opening,
    cardReadings,
    conclusion: '整体可行，但先把风险与节奏管理好会更稳。',
    advice: '先完成一个最关键的小目标，再根据结果迭代下一步。',
    nextSteps: ['明确 1 个短期目标', '设定一周行动计划', '复盘结果并调整策略'],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { question, cards } = req.body || {};
  if (!question || !Array.isArray(cards) || cards.length < 3) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return res.status(200).json(fallbackReading(question, cards));
  }

  const prompt = `你是专业塔罗顾问。请基于用户问题与三张牌（含正逆位）输出简体中文 JSON 解析。
要求：
1) 分别解析三张牌（每张 2-3 句，贴合该位置含义）。
2) 明确给出结论（是否建议推进、风险点、时间节奏）。
3) 给出可执行建议（具体动作，不空泛）。
4) 仅输出 JSON，不要 markdown。

JSON schema:
{
  "opening": "string",
  "cardReadings": [
    {"position":"string","card":"string","orientation":"正位|逆位","analysis":"string"}
  ],
  "conclusion": "string",
  "advice": "string",
  "nextSteps": ["string","string","string"]
}

用户问题：${question}
三张牌：${JSON.stringify(cards, null, 2)}
`;

  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: '你是擅长塔罗解读的顾问，回答务实、清晰。' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!r.ok) throw new Error(`llm error ${r.status}`);
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const parsed = extractJson(text);
    if (!parsed) return res.status(200).json(fallbackReading(question, cards));
    return res.status(200).json(parsed);
  } catch (_) {
    return res.status(200).json(fallbackReading(question, cards));
  }
}
