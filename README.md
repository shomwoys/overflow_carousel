# Overflow Carousel — デモ

このリポジトリは、CSS Scroll Snap を使用した軽量な無限カルーセルの実装デモです。

## 含まれるファイル

- `index.html`: デモページ（3つのカルーセル例）
- `ofcarousel.css`: CSS Scroll Snap ベースのスタイル
- `ofcarousel.js`: カルーセルコントローラー（ES6 クラス）

## 使い方（ブラウザでの確認）

1. ファイルをローカルでホストする：

```bash
cd /workspaces/overflow_carousel
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

2. 各デモを確認：
   - **Demo 1**: 1アイテム + peek (固定 60px)
   - **Demo 2**: 3アイテム + peek (item幅の 15%)
   - **Demo 3**: 2アイテム + peek (固定 40px、JS設定)

## 実装の特徴

### CSS Scroll Snap ベース

- `scroll-snap-type: x proximity` でスナップ動作を実装
- `scroll-snap-align: start` でアイテムの左端に揃える
- 左右のスクロール領域は CSS padding で確保

### 無限ループ

- **DOM クローン**: 全スライドセットを前後に複製
- **スクロール検出**: 100ms デバウンスされたスクロールハンドラ
- **シームレス復帰**: クローン領域に到達時、位置をジャンプさせて実スライド領域に戻す

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|---------|
| `itemsVisible` | 見える個数 | 1 |
| `peekRatio` | item幅に対するpeek比率（例: 0.15 = 15%） | undefined |
| `peek` | 固定peek幅（px のみ、例: '60px'） | '60px' |
| `gap` | item間隔 | '16px' |
| `aspect` | itemのアスペクト比 | 1 |
| `infinite` | 無限ループ有効 | true |
| `dots` | ドットインジケーターを表示 | false |
| `autoplay` | 一定間隔で自動スクロール | false |
| `autoplayInterval` | オートプレイの間隔（ms） | 3000 |
| `pauseOnHover` | ホバー時にオートプレイを一時停止 | true |
| `pauseOnFocus` | フォーカス時にオートプレイを一時停止 | true |
| `pauseOnVisibility` | タブ非表示時にオートプレイを一時停止 | true |

## レイアウト計算フロー

1. **viewport幅**: 600px（CSS固定）
2. **CSS変数設定**: `--ofc-items-visible`, `--ofc-gap`, `--ofc-aspect-ratio`
3. **slide幅計算**（CSS calc）:
   ```css
   flex: 0 0 calc((100% - (var(--ofc-items-visible) - 1) * var(--ofc-gap)) / var(--ofc-items-visible))
   ```
4. **slide高さ計算**: `aspect-ratio: var(--ofc-aspect-ratio)` で自動
5. **peekPx計算**（JS）:
   - `peekRatio` が設定: `peek = slideWidth × peekRatio`
   - そうでなければ: `peek` 文字列値（px/vw/%）をピクセル変換
6. **CSS変数更新**: `--ofc-peek` を動的に反映

## 操作方法

- **左右ボタン**: `.ofc-prev` / `.ofc-next` をクリック
- **キーボード**: ArrowLeft / ArrowRight キー

## 注意点

- `peekRatio` を使う場合、peek計算は実際のslide幅に基づきます
- 固定 peek を使う場合は `peek: '60px'` のように px 単位で指定してください
- viewport幅は CSS で固定（`max-width: 600px`）されていますが、必要に応じて変更可能
