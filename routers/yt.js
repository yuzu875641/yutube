import express from 'express';
import { getYouTubeData } from '../server/wakame.js';
import ytdl from 'ytdl-core'; // ytdl-core を使用
import miniget from 'miniget';

const router = express.Router();

const validateVideoId = (id) => /^[a-zA-Z0-9_-]{11}$/.test(id);

router.get('/:id', async (req, res) => {
    const videoId = req.params.id;
    const { playbackMode } = req.cookies;

    if (!validateVideoId(videoId)) {
        return res.status(400).render('tube/mattev.ejs', {
            error: '無効な動画ID',
            details: '動画IDは11文字の英数字です。'
        });
    }

    switch (playbackMode) {
        case 'edu':
            return res.redirect(`/yt/edu/${videoId}`);
        case 'nocookie':
            return res.redirect(`/yt/nocookie/${videoId}`);
    }

    try {
        const videoData = await getYouTubeData(videoId);
        const streamUrl = videoData.hlsUrl ? `/yt/live/s/${videoId}` : videoData.formatStreams.reverse()[0].url;
        
        // ytdl-coreで動画情報を取得する
        const videoInfo = await ytdl.getInfo(videoId);

        res.render('tube/watch.ejs', {
            streamUrl,
            videoData,
            videoInfo,
            videoId,
            baseUrl: 'direct'
        });
    } catch (error) {
        console.error('動画取得エラー:', error);
        res.status(500).render('tube/mattev.ejs', {
            error: '動画の取得に失敗しました',
            details: error.message
        });
    }
});

router.get('/edu/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    // ytdl-coreで動画情報を取得
    const videoInfo = await ytdl.getInfo(videoId);
    const videosrc = `https://www.youtubeeducation.com/embed/${videoId}`;
          
    res.render('umekomi/edu.ejs', { videosrc, videoInfo, videoId });
  } catch (error) {
     res.status(500).render('tube/mattev.ejs', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

router.get('/nocookie/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    // ytdl-coreで動画情報を取得
    const videoInfo = await ytdl.getInfo(videoId);
    const videosrc = `https://www.youtube-nocookie.com/embed/${videoId}`;
          
    res.render('umekomi/nocookie.ejs', { videosrc, videoInfo, videoId });
  } catch (error) {
     res.status(500).render('tube/mattev.ejs', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

router.get('/live/s/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
      const videoInfo = await getYouTubeData(videoId);
      const hlsUrl = videoInfo.hlsUrl;
      if (!hlsUrl) {
          return res.status(500).send("No live stream URL available.");
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      miniget(hlsUrl).pipe(res);
  } catch (error) {
      console.error("ライブストリームエラー:", error);
      res.status(500).send(error.toString());
  }
});

export default router;
