# Overflow Carousel

CSS Scroll Snap を使用した軽量で高性能なカルーセルコンポーネント。無限ループ、ドットインジケーター、オートプレイなど豊富な機能を提供します。

## 含まれるファイル

### コア
- `ofcarousel.js`: カルーセルコントローラー（ES6 クラス、560行）
- `ofcarousel.css`: CSS Scroll Snap ベースのライブラリスタイル

### デモ・ドキュメント
- `index.html`: 13個のデモ（デフォルト値、itemsVisible、aspect、peek、peekRatio、dots、autoplay）
- `index.css`: デモページ用スタイル
- `test-infinite.html`: infinite オプション検証テスト（3パターン）
- `examples.html`: **実用的なカルーセルパターン例**（商品、ブログ、お客様の声）
- `examples.css`: 実用例用スタイル

## 使い方（ブラウザでの確認）

```bash
cd /workspaces/overflow_carousel
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

### デモページ
- **`http://localhost:8000/index.html`**: 機能テストと各オプションの動作確認
- **`http://localhost:8000/examples.html`**: 実務的なカルーセルパターン3種類
- **`http://localhost:8000/test-infinite.html`**: 無限ループオプションの検証

## 基本的な使い方

```html
<section class="ofcarousel" id="my-carousel" aria-roledescription="carousel">
  <div class="ofc-viewport">
    <div class="ofc-track">
      <div class="ofc-slide">Slide 1</div>
      <div class="ofc-slide">Slide 2</div>
      <div class="ofc-slide">Slide 3</div>
    </div>
  </div>
  <div class="ofc-navs">
    <button class="ofc-nav ofc-prev" aria-label="前">◀</button>
    <button class="ofc-nav ofc-next" aria-label="次">▶</button>
  </div>
</section>

<script src="ofcarousel.js"></script>
<script>
  const carousel = new OverflowCarousel('#my-carousel', {
    itemsVisible: 3,
    aspect: 16/9,
    gap: '5px',
    infinite: true,
    dots: true,
    autoplay: false
  });
</script>
```

### 自動クラス付与機能

`.ofc-track` の直下の子要素に `.ofc-slide` クラスがない場合、自動的に `.ofc-slide` クラスが付与されます。

```html
<!-- この記法でも動作します -->
<div class="ofc-track">
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
</div>

<!-- 自動的に以下のようにクラスが付与されます -->
<div class="ofc-track">
  <div class="ofc-slide">Slide 1</div>
  <div class="ofc-slide">Slide 2</div>
  <div class="ofc-slide">Slide 3</div>
</div>
```

## 実装の特徴

### CSS Scroll Snap ベース
- `scroll-snap-type: x proximity` でスナップ動作を実装
- `scroll-snap-align: start` で左端揃え
- CSS変数による動的レイアウト調整

### 無限ループ
- **DOM クローン**: 全スライドを前後に複製して3倍に拡張
- **スクロール検出**: 100ms デバウンスされたハンドラで境界を監視
- **シームレス復帰**: クローン領域到達時、位置をジャンプして実スライド領域に戻す

### レスポンシブ & アクセシビリティ
- モバイル対応（タッチスクロール対応）
- キーボード操作（ArrowLeft/Right）
- スクリーンリーダー対応（aria-label、role）
- Intersection Observer での可視状態追跡（準備中）

## オプション一覧

| オプション | 説明 | デフォルト |
|-----------|------|---------|
| `itemsVisible` | 見える個数 | 3 |
| `aspect` | スライドのアスペクト比（例: 16/9） | 16/9 |
| `gap` | スライド間隔（CSS値） | '5px' |
| `peek` | 固定peek幅（px のみ、例: '60px'） | '60px' |
| `peekRatio` | アイテム幅に対する相対peek比率（例: 1/3） | undefined |
| `infinite` | 無限ループ有効 | true |
| `dots` | ドットインジケーター表示 | false |
| `autoplay` | 自動スクロール有効 | false |
| `autoplayInterval` | 自動スクロール間隔（ms） | 3000 |
| `pauseOnHover` | ホバー時に一時停止 | true |
| `pauseOnFocus` | フォーカス時に一時停止 | true |
| `pauseOnVisibility` | ページ非表示時に一時停止 | true |

## CSS変数（デフォルト値）

`ofcarousel.css` の `:root` で定義：

```css
--ofc-items-visible: 3;        /* 見える個数 */
--ofc-peek: 60px;              /* 左右 peek 幅 */
--ofc-gap: 5px;                /* スライド間隔 */
--ofc-aspect-ratio: 1.78;      /* スライドアスペクト比（16:9） */
```

JSオプションが指定された場合、これらを上書きします。

## レイアウト計算

### スライド幅（CSS calc）
```css
flex: 0 0 calc((100% - (var(--ofc-items-visible) - 1) * var(--ofc-gap)) / var(--ofc-items-visible))
```

### Peek値の決定
1. **`peekRatio` 指定時**:
   ```
   peek = (viewportWidth × peekRatio) / (itemsVisible + 2 × peekRatio)
   ```
   → viewport幅に応じて動的に計算

2. **`peek` 指定時**:
   → 固定ピクセル値（デフォルト: 60px）

## 実用的なパターン例（examples.html）

### 1. 商品紹介カルーセル
- **構成**: 画像 + タイトル + 価格 + ボタン
- **設定**: `itemsVisible: 3, aspect: 3/4`
- **特徴**: ホバーで画像ズーム、カード浮上効果

### 2. ブログ/ニュースカルーセル
- **構成**: 背景画像 + オーバーレイ（カテゴリ + タイトル + 抜粋 + 日付）
- **設定**: `itemsVisible: 2, aspect: 16/9, dots: true`
- **特徴**: グラデーション背景で読みやすさ確保

### 3. お客様の声
- **構成**: アバター + 名前 + 職位 + 評価 + コメント
- **設定**: `itemsVisible: 1, aspect: 16/9, autoplay: true, autoplayInterval: 5000`
- **特徴**: 単一表示、オートプレイ、ホバーで一時停止

## 操作方法

- **ナビゲーションボタン**: `.ofc-prev` / `.ofc-next` でスクロール
- **キーボード**: ArrowLeft / ArrowRight（フォーカス時）
- **ドット**: `.ofc-dot` をクリックして該当スライドに移動
- **オートプレイ**: マウスホバー時に自動一時停止

## ファイル構成

```
/workspaces/overflow_carousel/
├── ofcarousel.js           # メインライブラリ
├── ofcarousel.css          # ライブラリスタイル（汎用）
├── index.css               # デモページ用スタイル
├── examples.css            # 実用例用スタイル
├── index.html              # デモページ（13パターン）
├── examples.html           # 実務的なパターン例
├── test-infinite.html      # 無限ループ検証テスト
└── README.md               # このファイル
```

## ブラウザサポート

- Chrome/Edge: ✅ 完全対応
- Firefox: ✅ 完全対応
- Safari: ✅ 完全対応
- IE11: ⚠️ CSS Scroll Snap 未対応（フォールバック必須）

## パフォーマンス

- **レンダリング**: CSS Scroll Snap によるネイティブ実装
- **イベント処理**: デバウンス（100ms）で効率化
- **メモリ**: DOM クローン最小化（3倍に拡張）
- **スムージング**: `scroll-behavior: smooth` 非使用（ユーザーの意図を尊重）

## 今後の拡張予定

- [ ] Intersection Observer による動的可視状態クラス付与
- [ ] タッチジェスチャー検出（スワイプ）
- [ ] ループ位置のスムーズなアニメーション
- [ ] レスポンシブブレークポイント自動調整
