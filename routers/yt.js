import express from 'express';
import { getYouTubeData } from '../server/wakame.js';
import { getVideoInfo } from '../server/youtube.js';
import { getYtInfo } from '../server/wakame.js';
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
        const [videoData, videoInfo] = await Promise.all([
            getYouTubeData(videoId),
            getVideoInfo(videoId)
        ]);
        
        const streamUrl = videoData.hlsUrl ? `/yt/live/s/${videoId}` : videoData.formatStreams.reverse()[0].url;

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
    const ytinfo = await getYtInfo();
    const videosrc = `https://www.youtubeeducation.com/embed/${videoId}${ytinfo}`;
    const videoInfo = await getVideoInfo(videoId);
          
    res.render('umekomi/edu.ejs', {videosrc, videoInfo, videoId});
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
    const videosrc = `https://www.youtube-nocookie.com/embed/${videoId}`;
    const videoInfo = await getVideoInfo(videoId);
          
    res.render('umekomi/nocookie.ejs', {videosrc, videoInfo, videoId});
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
