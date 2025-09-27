import express from 'express';
import ytsr from 'ytsr';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('tube/search.ejs', {
    results: [],
    query: ''
  });
});

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.redirect('/');
  }

  try {
    // 検索クエリで直接動画検索を実行
    const searchResults = await ytsr(query, { 
      limit: 20,
      type: 'video' // 直接 'video' フィルタを指定
    });
    
    // searchResultsオブジェクトは、アイテムの配列を直接含んでいます
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

export default router;
