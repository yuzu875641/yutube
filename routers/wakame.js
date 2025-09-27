import axios from 'axios';

let apis = [];
const INV_API_URLS = [
  'https://raw.githubusercontent.com/wakame02/wktopu/refs/heads/main/inv.json'
];
const YOUTUBE_EDU_URLS = [
  'https://raw.githubusercontent.com/wakame02/wktopu/refs/heads/main/edu.text',
  'https://gitlab.com/wer02/wktopu/-/raw/main/edu.text'
];
const MAX_API_WAIT_TIME = 5000;

export async function fetchApis() {
    for (const url of INV_API_URLS) {
        try {
            const response = await axios.get(url);
            apis = response.data.filter(url => url.startsWith('http'));
            console.log('APIリストを更新しました。');
            return;
        } catch (error) {
            console.error(`APIリストの取得に失敗 (${url}): ${error.message}`);
        }
    }
    console.error('すべてのAPIリスト取得URLが失敗しました。');
}

export async function getYtInfo() {
    for (const url of YOUTUBE_EDU_URLS) {
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error(`YT Info取得失敗 (${url}): ${error.message}`);
      }
    }
    throw new Error('必要なデータを取得できませんでした。');
}

fetchApis();
setInterval(fetchApis, 3600000);

export async function getYouTubeData(videoId) {
    if (apis.length === 0) {
        await fetchApis();
        if (apis.length === 0) {
            throw new Error('利用可能なInvidious APIがありません。');
        }
    }

    const shuffledApis = [...apis].sort(() => 0.5 - Math.random());
    
    for (const instance of shuffledApis) {
        try {
            const url = `${instance}/api/v1/videos/${videoId}`;
            const response = await axios.get(url, { timeout: MAX_API_WAIT_TIME });
            if (response.data?.formatStreams) {
                console.log(`成功: ${instance}`);
                return response.data;
            }
        } catch (error) {
            console.error(`失敗: ${instance} - ${error.message}`);
        }
    }
    
    throw new Error('すべてのAPIインスタンスで動画情報が取得できませんでした。');
}
