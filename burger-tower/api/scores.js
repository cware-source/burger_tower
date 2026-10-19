// Vercel 서버리스 함수: 랭킹을 Notion 데이터베이스에 저장하고 읽어 옵니다.
// 환경변수: NOTION_TOKEN (Notion API 토큰), NOTION_DB_ID (데이터베이스 ID)
// Notion 데이터베이스 열: 닉네임(제목), 기록(숫자), 플레이어ID(텍스트)

const NOTION = 'https://api.notion.com/v1';

async function notion(path, method, body) {
  const res = await fetch(NOTION + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Notion API error');
    err.status = res.status;
    throw err;
  }
  return data;
}

const text = (prop) => (prop?.rich_text?.[0]?.plain_text ?? '');

module.exports = async (req, res) => {
  const DB = process.env.NOTION_DB_ID;
  if (!process.env.NOTION_TOKEN || !DB) {
    return res.status(500).json({ error: 'NOTION_TOKEN / NOTION_DB_ID 환경변수가 없습니다.' });
  }

  try {
    if (req.method === 'GET') {
      const pid = String(req.query?.pid || '');
      const data = await notion(`/databases/${DB}/query`, 'POST', {
        sorts: [{ property: '기록', direction: 'descending' }],
        page_size: 50,
      });
      const list = data.results.map((p) => ({
        nickname: p.properties['닉네임']?.title?.[0]?.plain_text || '익명',
        best: p.properties['기록']?.number ?? 0,
        me: !!pid && text(p.properties['플레이어ID']) === pid,
      }));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(list);
    }

    if (req.method === 'POST') {
      const { playerId, nickname, best } = req.body || {};
      if (!/^[\w-]{8,40}$/.test(String(playerId)) || !Number.isInteger(best) || best < 1 || best > 500) {
        return res.status(400).json({ error: '잘못된 요청입니다.' });
      }
      const name = String(nickname || '익명').trim().slice(0, 12) || '익명';
      const properties = {
        닉네임: { title: [{ text: { content: name } }] },
        기록: { number: best },
        플레이어ID: { rich_text: [{ text: { content: playerId } }] },
      };

      const found = await notion(`/databases/${DB}/query`, 'POST', {
        filter: { property: '플레이어ID', rich_text: { equals: playerId } },
        page_size: 1,
      });
      const old = found.results[0];
      if (!old) {
        await notion('/pages', 'POST', { parent: { database_id: DB }, properties });
      } else if (best > (old.properties['기록']?.number ?? 0)) {
        await notion(`/pages/${old.id}`, 'PATCH', { properties });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    return res.status(502).json({ error: '랭킹 저장소에 연결하지 못했습니다.' });
  }
};
