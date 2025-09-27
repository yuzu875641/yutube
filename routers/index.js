import express from 'express';
import ytsr from 'ytsr';
import ytpl from 'ytpl';

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
    const filters = await ytsr.getFilters(query);
    const filter = filters.get('Type').find(f => f.name === 'Video');
    const searchResults = await ytsr(filter.url, { limit: 20 });
    
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
