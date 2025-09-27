import express from 'express';
import ytsr from 'ytsr';
import ytdl from 'ytdl-core'; // ytdl-core をインポート
import axios from 'axios';

const router = express.Router();

// 検索ページを表示
router.get('/', (req, res) => {
  res.render('tube/search.ejs', {
    results: [],
    query: ''
  });
});

// 検索リクエストを処理
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.redirect('/');
  }

  try {
    const searchResults = await ytsr(query, {
      limit: 20,
      type: 'video'
    });
    
    res.render('tube/search.ejs', {
      results: searchResults.items,
      query: query
    });
  } catch (error) {
    console.error('検索エラー:', error);
    res.status(500).render('tube/mattev.ejs', {
      error: '検索に失敗しました',
      details: error.message
    });
  }
});

---

// 動画ページを表示（動画IDをURLから取得）
router.get('/yt/:id', async (req, res) => {
  const videoId = req.params.id;
  let videoData = null;

  // 1. 外部JSONからInvidious APIリストを取得
  let invidiousApis = [];
  try {
    const response = await axios.get('https://raw.githubusercontent.com/wakame02/wktopu/refs/heads/main/inv.json');
    invidiousApis = response.data.invidious;
  } catch (error) {
    console.error('Invidious APIリストの取得に失敗:', error.message);
  }

  // 2. Invidious APIを順番に試行
  if (invidiousApis.length > 0) {
    for (const api of invidiousApis) {
      try {
        console.log(`Trying Invidious API: ${api}`);
        const response = await axios.get(`${api}/api/v1/videos/${videoId}`);
        videoData = response.data;
        break;
      } catch (error) {
        console.error(`Failed to connect to Invidious API ${api}:`, error.message);
      }
    }
  }

  // 3. すべてのInvidious APIが失敗した場合、ytdl-coreをフォールバックとして使用
  if (!videoData) {
    console.log('All Invidious APIs failed. Falling back to ytdl-core.');
    try {
      // ytdl-core を使用して動画情報を直接取得
      const videoInfo = await ytdl.getInfo(videoId);
      
      // videoDataオブジェクトをytdl-coreの情報で構築
      videoData = {
        title: videoInfo.videoDetails.title,
        videoId: videoInfo.videoDetails.videoId,
        author: { name: videoInfo.videoDetails.author.name },
        formats: videoInfo.formats,
        // 他に必要な情報を追加
      };
      console.log('Successfully fell back to ytdl-core.');
    } catch (error) {
      console.error('ytdl-coreでのフォールバックに失敗しました:', error.message);
      return res.status(500).render('tube/mattev.ejs', {
        error: '動画の取得に失敗しました',
        details: 'すべてのデータ取得方法が失敗しました。'
      });
    }
  }

  // 4. データが見つからない場合
  if (!videoData) {
    return res.status(404).render('tube/mattev.ejs', {
      error: '動画が見つかりませんでした',
      details: `ID: ${videoId} の動画が見つかりませんでした。`
    });
  }

  // 5. 最終的なデータをレンダリング
  res.render('tube/video.ejs', { video: videoData });
});

export default router;
