import express from 'express';
import axios from 'axios';
import ytsr from 'ytsr';

const router = express.Router();
const MAX_API_WAIT_TIME = 5000;
const testVideoId = "beFiVQcwVY8";

router.get('/suggest', async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) {
        return res.json([]);
    }
    try {
        const url = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&q=${encodeURIComponent(keyword)}`;
        const response = await axios.get(url, { timeout: 2000 });
        const data = JSON.parse(response.data.replace('/*O_o*/', '')).pop();
        if (data) {
            const suggestions = data.map(item => item[0]);
            res.json(suggestions);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('サジェストAPIエラー:', error);
        res.json([]);
    }
});

router.post("/check", async (req, res) => {
  const urls = req.body.urls;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: "APIのURLを入力してください。" });
  }

  const invidiousapis = urls.map(url => url.match(/https?:\/\/[^\s]+/g)).filter(Boolean).flat();
  if (invidiousapis.length === 0) {
    return res.status(400).json({ error: "APIのURLを入力してください。" });
  }
  
  const results = await Promise.all(invidiousapis.map(async (instance) => {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${testVideoId}`, { timeout: MAX_API_WAIT_TIME });
      if (response.data?.formatStreams) {
        return { api: instance, status: 'success' };
      } else {
        return { api: instance, status: 'fail', reason: 'Missing formatStreams' };
      }
    } catch (error) {
      return { api: instance, status: 'fail', reason: error.message };
    }
  }));

  const successUrls = results.filter(r => r.status === 'success');
  const errorUrls = results.filter(r => r.status === 'fail');
    
  res.json({ successUrls, errorUrls });
});

export default router;
