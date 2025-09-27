import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

// ルーターのインポート
import indexRouter from './routers/index.js';
import ytRouter from './routers/yt.js';
import apiRouter from './routers/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ミドルウェア
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// EJSテンプレートエンジンの設定
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 静的ファイルの提供
app.use(express.static(join(__dirname, 'public')));

// ルーティング
app.use('/', indexRouter);
app.use('/yt', ytRouter);
app.use('/api', apiRouter);

// 404 エラーハンドリング
app.use((req, res) => {
    res.status(404).render('tube/mattev.ejs', {
        error: 'ページが見つかりません',
        details: `${req.originalUrl} は存在しないURLです。`
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!isProduction) {
        console.log('Press Ctrl-C to terminate.');
    }
});
