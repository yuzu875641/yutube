import { Innertube } from 'youtubei.js';

let youtube;

async function initializeYoutube() {
    if (!youtube) {
        try {
            youtube = await Innertube.create();
            console.log('Innertubeクライアントを初期化しました。');
        } catch (error) {
            console.error('Innertubeクライアントの初期化に失敗:', error);
        }
    }
}

initializeYoutube();

export async function getVideoInfo(videoId) {
    if (!youtube) {
        throw new Error('YouTubeクライアントが利用できません。');
    }
    try {
        const info = await youtube.getInfo(videoId);
        return info;
    } catch (error) {
        console.error(`動画情報取得エラー (${videoId}):`, error);
        throw new Error('YouTube APIからの情報取得に失敗しました。');
    }
}
