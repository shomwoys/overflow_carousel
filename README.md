# Overflow Carousel

CSS Scroll Snap を使用した軽量で高性能なカルーセルコンポーネント。無限ループ、ドットインジケーター、オートプレイなど豊富な機能を提供します。

## デモサイト

🚀 **ライブデモ**: https://shomwoys.github.io/overflow_carousel/

- [基本デモ（13パターン）](https://shomwoys.github.io/overflow_carousel/index.html)
- [実用的な例（商品・ブログ・お客様の声）](https://shomwoys.github.io/overflow_carousel/examples.html)
- [無限ループ検証](https://shomwoys.github.io/overflow_carousel/test-infinite.html)
- [aspectAuto検証](https://shomwoys.github.io/overflow_carousel/test-aspect-auto.html)
- [リサイズ対応テスト](https://shomwoys.github.io/overflow_carousel/test-resize.html)
- [レスポンシブブレークポイントテスト](https://shomwoys.github.io/overflow_carousel/test-responsive.html)
- [スクロールインジケーターテスト](https://shomwoys.github.io/overflow_carousel/test-scrolling-indicator.html)

## 含まれるファイル

### コア
- `ofcarousel.js`: カルーセルコントローラー（ES6 クラス）
- `ofcarousel.css`: CSS Scroll Snap ベースのライブラリスタイル

### デモ・ドキュメント
- `index.html`: 13個のデモ（デフォルト値、itemsVisible、aspect、peek、peekRatio、dots、autoplay）
- `index.css`: デモページ用スタイル
- `test-infinite.html`: infinite オプション検証テスト
- `test-aspect-auto.html`: aspectAuto オプション検証テスト（可変高さコンテンツ）
- `test-resize.html`: **ウィンドウリサイズ対応テスト**（動的再計算の検証）
- `test-responsive.html`: **レスポンシブブレークポイントテスト**（画面幅に応じた設定切り替え）
- `test-scrolling-indicator.html`: **スクロールインジケーターテスト**（スクロール中のクラス付与）
- `examples.html`: 実用的なカルーセルパターン例（商品、ブログ、お客様の声）
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
- **`http://localhost:8000/test-aspect-auto.html`**: aspectAuto オプションの検証
- **`http://localhost:8000/test-resize.html`**: ウィンドウリサイズ対応の検証
- **`http://localhost:8000/test-responsive.html`**: レスポンシブブレークポイントの検証
- **`http://localhost:8000/test-scrolling-indicator.html`**: スクロールインジケーターの検証

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

#### .ofc-slide クラスの自動付与

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

#### スクロール中のクラス付与

カルーセルがスクロールされている間、自動的にクラスが付与されます：

- **`.ofc-scrolling-prev`**: 前（左）方向へスクロール中にルート要素に付与
- **`.ofc-scrolling-next`**: 次（右）方向へスクロール中にルート要素に付与

スクロール終了後（100msデバウンス後）に自動的に削除されます。これらのクラスを使用して、スクロール中のアニメーションやスタイリングをカスタマイズできます。

```css
/* スクロール中のスタイル例 */
.ofcarousel.ofc-scrolling-prev .ofc-nav-prev {
  background: rgba(102, 126, 234, 0.9);
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
}

.ofcarousel.ofc-scrolling-next .ofc-nav-next {
  background: rgba(102, 126, 234, 0.9);
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
}
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
- **レスポンシブブレークポイント**: 画面幅に応じた設定の自動切り替え
- **ウィンドウリサイズ対応**: viewport幅変更時の動的再計算（デバウンス処理付き）
- キーボード操作（ArrowLeft/Right）
- スクリーンリーダー対応（aria-label、role）
- Intersection Observer での可視状態追跡（準備中）

## ウィンドウリサイズ対応

ウィンドウサイズ変更時に、カルーセルが自動的に再レイアウトされます。

### 主な機能
- **現在位置の維持**: リサイズ後も現在のスライドインデックスを保持
- **動的再計算**: `peekRatio`、`gap`（%, vw）、`aspectAuto` を正しく再計算
- **デバウンス処理**: throttle（50ms）+ debounce（150ms）で最適化
- **サブピクセル対応**: `peekRatio` 計算時に0.5px単位で丸めて一貫性を確保

### 対応シーン
- レスポンシブデザイン（モバイル↔デスクトップ）
- ブラウザウィンドウのリサイズ
- 開発者ツールのレスポンシブモード
- デバイスの向き変更（縦↔横）

詳細は `test-resize.html` を参照してください。

## レスポンシブブレークポイント

画面幅に応じてカルーセルの設定を自動的に切り替えることができます。

### 基本的な使い方

`responsive` オプションを使用して、ブレークポイント（画面幅）ごとに異なる設定を指定します。

```javascript
new OverflowCarousel('#carousel', {
  // デフォルト設定（デスクトップ）
  itemsVisible: 4,
  peekRatio: 0.1,
  gap: '20px',
  
  // レスポンシブ設定
  responsive: {
    // 480px以下の場合
    480: {
      itemsVisible: 1,
      peekRatio: 0,
      gap: '10px'
    },
    // 768px以下の場合
    768: {
      itemsVisible: 2,
      peekRatio: 0.05,
      gap: '15px'
    },
    // 1024px以下の場合
    1024: {
      itemsVisible: 3,
      peekRatio: 0.08,
      gap: '18px'
    }
  }
});
```

### 動作の仕組み

- **max-width方式**: 画面幅がブレークポイント以下のとき、そのブレークポイントの設定を適用
- **カスケード**: 複数のブレークポイントにマッチする場合、画面幅に最も近い（最大の）ブレークポイントの設定を適用
- **自動切り替え**: ウィンドウリサイズ時に自動的に最適な設定に切り替わる
- **位置保持**: ブレークポイント切り替え時も現在のスライド位置を維持

### 設定可能なオプション

レスポンシブブレークポイント内で設定できるオプション：
- `itemsVisible`: 表示するアイテム数
- `peekRatio`: 相対的なpeek比率
- `peek`: 固定peek幅
- `gap`: アイテム間隔
- `aspect`: アスペクト比
- その他のカルーセルオプション

### 実用例

#### モバイルファースト設計
```javascript
new OverflowCarousel('#products', {
  itemsVisible: 4,        // デスクトップ: 4枚表示
  peekRatio: 0.1,
  infinite: true,
  dots: true,
  responsive: {
    768: {
      itemsVisible: 2,    // タブレット: 2枚表示
      peekRatio: 0.05
    },
    480: {
      itemsVisible: 1,    // モバイル: 1枚表示（フルスクリーン）
      peekRatio: 0,
      gap: '0px'
    }
  }
});
```

#### peek無しモバイル表示
```javascript
// スマホでは peek を完全に無効化して、
// コンテンツを最大限に表示
new OverflowCarousel('#testimonials', {
  itemsVisible: 3,
  peekRatio: 0.15,
  responsive: {
    480: {
      itemsVisible: 1,
      peekRatio: 0        // peek無し = フルスクリーン表示
    }
  }
});
```

### 注意点

- ブレークポイントの数値はピクセル単位で指定（単位は不要）
- デフォルト設定（ベースオプション）は、画面幅がすべてのブレークポイントより大きい場合に適用される
- `responsive` オプションで指定されていないプロパティは、ベースオプションの値を継承する
- リサイズ時のパフォーマンスは最適化済み（throttle + debounce処理）

詳細は `test-responsive.html` を参照してください。

## オプション一覧

| オプション | 説明 | デフォルト |
|-----------|------|---------|
| `itemsVisible` | 見える個数 | 3 |
| `aspect` | スライドのアスペクト比（例: 16/9） | 16/9 |
| `aspectAuto` | コンテンツに応じて高さを自動調整（`true` の場合 `aspect` は無視） | false |
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
| `responsive` | レスポンシブブレークポイント設定（画面幅に応じた設定の切り替え） | undefined |

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

### aspectAuto（動的高さ調整）

`aspectAuto: true` を指定すると、固定のアスペクト比ではなく、コンテンツの高さに応じて動的に高さが決まります。

**動作:**
1. 最初のスライドの高さを測定（画像の読み込み完了後）
2. viewport の高さをその値に設定
3. ウィンドウリサイズ時に再計算

**使用例:**
```javascript
new OverflowCarousel('#carousel', {
  itemsVisible: 3,
  aspectAuto: true,  // コンテンツに応じて高さを自動調整
  gap: '16px'
});
```

**適用シーン:**
- テキスト量が異なるカード
- 画像サイズが統一されていないコンテンツ
- 動的に生成されるコンテンツ
- 任意のHTML構造（画像、テキスト、複雑なレイアウト）

**注意点:**
- `aspectAuto: true` の場合、`aspect` オプションは無視されます
- viewport の高さのみを制御し、スライド自体は `height: auto` を維持
- 画像が含まれる場合、すべての画像の読み込み完了を待ってから高さを設定
- 詳細は `test-aspect-auto.html` を参照

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
├── test-aspect-auto.html   # aspectAuto 検証テスト
├── test-resize.html        # ウィンドウリサイズ検証テスト
├── AGENT_RULES.md          # AI エージェント向けルール
└── README.md               # このファイル
```

## ブラウザサポート

- Chrome/Edge: ✅ 完全対応
- Firefox: ✅ 完全対応
- Safari: ✅ 完全対応
- IE11: ⚠️ CSS Scroll Snap 未対応（フォールバック必須）

## パフォーマンス

- **レンダリング**: CSS Scroll Snap によるネイティブ実装
- **イベント処理**: スクロール（100ms デバウンス）、リサイズ（50ms throttle + 150ms debounce）
- **メモリ**: DOM クローン最小化（3倍に拡張）
- **スムージング**: `scroll-behavior: smooth` 非使用（ユーザーの意図を尊重）
- **サブピクセル最適化**: 0.5px単位の丸めでレンダリング一貫性を確保

## 今後の拡張予定

- [ ] Intersection Observer による動的可視状態クラス付与
- [ ] タッチジェスチャー検出（スワイプ）
- [ ] ループ位置のスムーズなアニメーション
