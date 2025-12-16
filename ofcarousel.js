/**
 * OverflowCarousel - CSS Scroll Snap ベースのカルーセル
 * 
 * 設計思想:
 * - CSS Scroll Snap を使用してスナップ動作を実現
 * - HTML 構造は変わらず、CSS 変数でレイアウトを制御
 * - 無限ループは DOM クローンで実装
 * - JS はクローン管理とスクロール位置調整のみ担当
 * 
 * オプション:
 *   - itemsVisible: 見える個数（デフォルト: 1）
 *   - peekRatio: item幅の相対比率（例: 0.15 = 15%）
 *   - peek: 固定peek幅（px のみ、例: '60px'）
 *   - gap: item間隔（デフォルト: '16px'）
 *   - aspect: item のアスペクト比（デフォルト: 1）
 *   - aspectAuto: コンテンツに応じて高さを自動調整（デフォルト: false）
 *   - infinite: 無限ループ（デフォルト: true）
 */

class OverflowCarousel {
  constructor(selectorOrElement, options = {}) {
    // Element resolution
    if (typeof selectorOrElement === 'string') {
      this.root = document.querySelector(selectorOrElement);
    } else {
      this.root = selectorOrElement;
    }

    if (!this.root) {
      console.error('OverflowCarousel: root element not found');
      return;
    }

    // Read CSS variables from computed style (including :root defaults)
    const computedStyle = getComputedStyle(this.root);
    const cssVarItemsVisible = computedStyle.getPropertyValue('--ofc-items-visible').trim();
    const cssVarPeek = computedStyle.getPropertyValue('--ofc-peek').trim();
    const cssVarGap = computedStyle.getPropertyValue('--ofc-gap').trim();
    const cssVarAspect = computedStyle.getPropertyValue('--ofc-aspect-ratio').trim();

    // Options: CSS variables as defaults, JS options override them
    this.options = {
      itemsVisible: parseInt(cssVarItemsVisible) || 3,
      peek: cssVarPeek || '60px',
      peekRatio: undefined,  // If set, peek will be calculated dynamically
      gap: cssVarGap || '5px',
      aspect: parseFloat(cssVarAspect) || 1.78,
      aspectAuto: false,  // If true, height is determined by content instead of aspect ratio
      infinite: true,
      dots: false,
      autoplay: false,
      autoplayInterval: 3000,
      pauseOnHover: true,
      pauseOnFocus: true,
      pauseOnVisibility: true,
      ...options  // JS options have highest priority
    };

    // Apply CSS variables only if JS options explicitly override them
    if (options.itemsVisible !== undefined) {
      this.root.style.setProperty('--ofc-items-visible', this.options.itemsVisible.toString());
    }
    if (options.peek !== undefined) {
      this.root.style.setProperty('--ofc-peek', this.options.peek);
    }
    if (options.gap !== undefined) {
      this.root.style.setProperty('--ofc-gap', this.options.gap);
    }
    if (options.aspect !== undefined) {
      this.root.style.setProperty('--ofc-aspect-ratio', this.options.aspect.toString());
    }
    
    // If aspectAuto is enabled, add class to remove aspect-ratio constraint
    if (this.options.aspectAuto) {
      this.root.classList.add('ofcarousel--aspect-auto');
    }
    
    // ピクセル値をキャッシュ（後で viewport 利用可能後に再計算）
    this._gapPx = this._parsePixels(this.options.gap);

    // 無限ループの設定（有効な場合、全スライドを左右に複製）
    if (this.options.infinite) {
      this._setupInfiniteLoop();
      this._setupScrollJump();
    } else {
      // infinite: false の場合も初期化が必要（peek計算とpadding調整）
      this._setupNonInfiniteMode();
    }

    // dots（インジケーター）
    this._setupDots();

    // コントロール（ボタン・キーボード）の設定
    this._setupControls();

    // オートプレイ
    this._setupAutoplay();
    
    // aspectAuto の場合、高さを動的に計算
    if (this.options.aspectAuto) {
      this._setupDynamicHeight();
    }

    // ウィンドウリサイズ対応
    this._setupResizeHandler();

    console.log('[OverflowCarousel] Initialized:', {
      id: this.root.id,
      options: this.options
    });
  }

  _ensureSlideElements() {
    // Add .ofc-slide class to direct children of .ofc-track if they don't have it
    if (!this.track) return;
    
    const directChildren = Array.from(this.track.children);
    let added = false;
    
    directChildren.forEach(child => {
      // Skip if already has .ofc-slide class
      if (child.classList.contains('ofc-slide')) {
        return;
      }
      
      // Add .ofc-slide class directly to the element
      child.classList.add('ofc-slide');
      added = true;
    });
    
    if (added) {
      console.log('[OverflowCarousel] Added .ofc-slide class to elements');
    }
  }

  _setupInfiniteLoop() {
    this.viewport = this.root.querySelector('.ofc-viewport');
    this.track = this.root.querySelector('.ofc-track');
    
    // Auto-wrap direct children that don't have .ofc-slide class
    this._ensureSlideElements();
    
    const originalSlides = Array.from(this.track.querySelectorAll('.ofc-slide'));

    if (originalSlides.length === 0) {
      console.warn('OverflowCarousel: no .ofc-slide found');
      return;
    }

    this._originalCount = originalSlides.length;
    
    // peekPx を計算: peekRatio が設定されていれば優先、そうでなければ peek 文字列値を使用
    if (this.options.peekRatio !== undefined) {
      // peekRatio: viewport幅と連立方程式で計算
      // peek = (viewportWidth * peekRatio) / (itemsVisible + 2 * peekRatio)
      const viewportWidth = this.viewport.offsetWidth;
      const itemsVisible = this.options.itemsVisible;
      const peekRatio = this.options.peekRatio;
      this._peekPx = (viewportWidth * peekRatio) / (itemsVisible + 2 * peekRatio);
    } else {
      // peek: 文字列値を使用（px, %, vw など）
      const viewportWidth = this.viewport.offsetWidth;
      this._peekPx = this._parsePixels(this.options.peek, viewportWidth);
    }
    
    // 計算された peek を CSS 変数に反映
    this.root.style.setProperty('--ofc-peek', this._peekPx + 'px');

    // 両端に全スライドのクローンを作成
    const startFragment = document.createDocumentFragment();
    const endFragment = document.createDocumentFragment();

    // 先頭にクローンを挿入（逆順で順序を保持）
    for (let i = originalSlides.length - 1; i >= 0; i--) {
      const clone = originalSlides[i].cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      startFragment.insertBefore(clone, startFragment.firstChild);
    }
    // 終端にクローンを追加
    for (let i = 0; i < originalSlides.length; i++) {
      const clone = originalSlides[i].cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      endFragment.appendChild(clone);
    }

    this.track.insertBefore(startFragment, this.track.firstChild);
    this.track.appendChild(endFragment);

    // クローン領域をスキップして最初の実スライドまでスクロール
    requestAnimationFrame(() => {
      const step = this._getStep();
      if (step > 0) {
        this._isAdjusting = true;
        const prevBehavior = this.viewport.style.scrollBehavior;
        this.viewport.style.scrollBehavior = 'auto';
        // 左側に部分的な前のアイテムを表示するため peek でオフセット
        this.viewport.scrollLeft = step * this._originalCount - this._peekPx;
        this.viewport.style.scrollBehavior = prevBehavior;
        this._isAdjusting = false;
      }
    });

    console.log('[OverflowCarousel] Infinite loop setup:', {
      originalCount: this._originalCount,
      peekRatio: this.options.peekRatio,
      peekPx: this._peekPx,
      step: this._getStep(),
      firstSlide: originalSlides[0]?.offsetWidth,
      trackChildren: this.track.children.length
    });
  }

  _setupNonInfiniteMode() {
    // infinite: false の場合の初期化
    // 最初と最後で余白を削除し、自然な見た目にする
    this.viewport = this.root.querySelector('.ofc-viewport');
    this.track = this.root.querySelector('.ofc-track');
    
    // Auto-wrap direct children that don't have .ofc-slide class
    this._ensureSlideElements();
    
    const originalSlides = Array.from(this.track.querySelectorAll('.ofc-slide'));

    if (originalSlides.length === 0) {
      console.warn('OverflowCarousel: no .ofc-slide found');
      return;
    }

    this._originalCount = originalSlides.length;
    
    // peekPx を計算
    if (this.options.peekRatio !== undefined) {
      const viewportWidth = this.viewport.offsetWidth;
      const itemsVisible = this.options.itemsVisible;
      const peekRatio = this.options.peekRatio;
      this._peekPx = (viewportWidth * peekRatio) / (itemsVisible + 2 * peekRatio);
    } else {
      const viewportWidth = this.viewport.offsetWidth;
      this._peekPx = this._parsePixels(this.options.peek, viewportWidth);
    }
    
    // CSS変数に反映
    this.root.style.setProperty('--ofc-peek', this._peekPx + 'px');
    
    // infinite: false の場合、最初のスライドの前に左margin、最後のスライドの後に右marginを削除
    // 中間ではpeekが見えるようにtrackのpaddingは維持
    const firstSlide = originalSlides[0];
    const lastSlide = originalSlides[originalSlides.length - 1];
    
    if (firstSlide) {
      // 最初のスライドを左端に寄せる（負のmarginでtrack paddingをキャンセル）
      firstSlide.style.marginLeft = `-${this._peekPx}px`;
    }
    if (lastSlide) {
      // 最後のスライドを右端に寄せる
      lastSlide.style.marginRight = `-${this._peekPx}px`;
    }
    
    console.log('[OverflowCarousel] Non-infinite mode setup:', {
      originalCount: this._originalCount,
      peekPx: this._peekPx,
      infinite: false
    });
  }

  _setupDynamicHeight() {
    // aspectAuto モード: コンテンツに基づいて高さを動的に計算
    if (!this.viewport || !this.track) {
      this.viewport = this.root.querySelector('.ofc-viewport');
      this.track = this.root.querySelector('.ofc-track');
    }
    
    if (!this.viewport || !this.track) return;
    
    // 高さを計算して適用
    this._updateDynamicHeight();
    
    // リサイズ時に再計算（デバウンス付き）
    this._onResize = () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this._updateDynamicHeight();
      }, 150);
    };
    window.addEventListener('resize', this._onResize);
    
    console.log('[OverflowCarousel] Dynamic height mode enabled');
  }

  _updateDynamicHeight() {
    // 全スライドの高さを測定し、最も高いものに合わせる
    if (!this.track) return;
    
    const slides = Array.from(this.track.querySelectorAll('.ofc-slide'));
    if (slides.length === 0) return;
    
    // 一時的にauto heightにして実際のコンテンツの高さを測定
    slides.forEach(slide => {
      slide.style.height = 'auto';
    });
    
    // requestAnimationFrame で次のフレームで高さを測定（レンダリング後）
    requestAnimationFrame(() => {
      let maxHeight = 0;
      slides.forEach(slide => {
        const height = slide.offsetHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      
      // 全スライドに最大高さを適用
      if (maxHeight > 0) {
        slides.forEach(slide => {
          slide.style.height = `${maxHeight}px`;
        });
        console.log('[OverflowCarousel] Dynamic height updated:', maxHeight + 'px');
      }
    });
  }

  _setupScrollJump() {
    if (!this.viewport || !this.track) return;
    const getMaxRealScroll = () => this._getStep() * this._originalCount;

    // デバウンス処理されたスクロールハンドラー: スクロール終了後に位置調整
    // スクロール中の連続呼び出しを避けることで、振動を防止
    this._onScroll = () => {
      if (this._isAdjusting) return;
      clearTimeout(this._scrollTimer);
      this._scrollTimer = setTimeout(() => {
        const left = this.viewport.scrollLeft;
        const step = this._getStep();
        const maxReal = getMaxRealScroll();
        const totalBefore = step * this._originalCount;
        // 実スライド領域の境界（peek オフセットを考慮）
        const realStartLeft = totalBefore - this._peekPx;
        const realEndLeft = totalBefore + maxReal - this._peekPx;

        // 開始クローン領域に到達した
        if (left < realStartLeft) {
          const offsetIntoClones = left - realStartLeft;
          const newLeft = realStartLeft + maxReal + offsetIntoClones;
          this._isAdjusting = true;
          const prevBehavior = this.viewport.style.scrollBehavior;
          this.viewport.style.scrollBehavior = 'auto';
          this.viewport.scrollLeft = newLeft;
          this.viewport.style.scrollBehavior = prevBehavior;
          this._isAdjusting = false;
        }
        // 終端クローン領域に到達した
        else if (left > realEndLeft) {
          const offsetIntoClones = left - realEndLeft;
          const newLeft = realStartLeft + offsetIntoClones;
          this._isAdjusting = true;
          const prevBehavior = this.viewport.style.scrollBehavior;
          this.viewport.style.scrollBehavior = 'auto';
          this.viewport.scrollLeft = newLeft;
          this.viewport.style.scrollBehavior = prevBehavior;
          this._isAdjusting = false;
        }

        // dots のアクティブ状態を更新（必要な場合のみ実行）
        this._updateActiveDot(this._getCurrentIndex());
      }, 100);
    };

    this.viewport.addEventListener('scroll', this._onScroll, { passive: true });
  }

  _getStep() {
    // 1つのスライド移動距離 = スライド幅 + gap
    const first = this.track.querySelector('.ofc-slide');
    const gap = this._gapPx;
    const w = first ? first.getBoundingClientRect().width : 0;
    return w + gap;
  }

  _setupControls() {
    const viewport = this.root.querySelector('.ofc-viewport');
    const prevBtn = this.root.querySelector('.ofc-nav.ofc-prev');
    const nextBtn = this.root.querySelector('.ofc-nav.ofc-next');

    if (!viewport) {
      console.warn('OverflowCarousel: .ofc-viewport not found');
      return;
    }

    // スクロール距離計算: 1スライド幅 + gap
    const calculateScrollDistance = () => {
      const track = this.root.querySelector('.ofc-track');
      const firstSlide = track.querySelector('.ofc-slide');
      if (firstSlide) {
        return firstSlide.offsetWidth + this._parsePixels(this.options.gap);
      }
      return 0;
    };

    // 前ボタン
    prevBtn && prevBtn.addEventListener('click', () => {
      const distance = calculateScrollDistance();
      viewport.scrollBy({ left: -distance, behavior: 'smooth' });
      this._restartAutoplay();
    });

    // 次ボタン
    nextBtn && nextBtn.addEventListener('click', () => {
      const distance = calculateScrollDistance();
      viewport.scrollBy({ left: distance, behavior: 'smooth' });
      this._restartAutoplay();
    });

    // キーボード操作対応（carousel内のフォーカスのみ反応）
    this._keyboardListener = (e) => {
      // carousel内にフォーカスがない場合は無視
      if (!this.root.contains(document.activeElement)) return;
      
      const distance = calculateScrollDistance();
      if (e.key === 'ArrowLeft') {
        viewport.scrollBy({ left: -distance, behavior: 'smooth' });
        this._restartAutoplay();
      }
      if (e.key === 'ArrowRight') {
        viewport.scrollBy({ left: distance, behavior: 'smooth' });
        this._restartAutoplay();
      }
    };
    document.addEventListener('keydown', this._keyboardListener);
  }

  _setupDots() {
    if (!this.options.dots) return;
    this.viewport = this.viewport || this.root.querySelector('.ofc-viewport');
    this.track = this.track || this.root.querySelector('.ofc-track');
    if (!this.viewport || !this.track) return;

    const count = this._originalCount || this.track.querySelectorAll('.ofc-slide').length;
    if (!count) return;

    this._dotButtons = [];
    const container = document.createElement('div');
    container.className = 'ofc-dots';
    container.setAttribute('role', 'tablist');
    container.setAttribute('aria-label', 'Carousel navigation dots');

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ofc-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        this._scrollToIndex(i);
        this._restartAutoplay();
      });
      container.appendChild(dot);
      this._dotButtons.push(dot);
    }

    // .ofc-navs 内に dots を配置
    const navsContainer = this.root.querySelector('.ofc-navs');
    if (navsContainer) {
      const prevBtn = navsContainer.querySelector('.ofc-prev');
      const nextBtn = navsContainer.querySelector('.ofc-next');
      // prevBtn と nextBtn の間に dots を挿入
      if (nextBtn) {
        navsContainer.insertBefore(container, nextBtn);
      } else {
        navsContainer.appendChild(container);
      }
    } else {
      this.root.appendChild(container);
    }

    this._attachActiveTracker();
    this._updateActiveDot(this._getCurrentIndex());
  }

  _attachActiveTracker() {
    if (!this.viewport || this._activeTrackerAttached) return;
    let ticking = false;
    this._onActiveScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        this._updateActiveDot(this._getCurrentIndex());
        ticking = false;
      });
    };
    this.viewport.addEventListener('scroll', this._onActiveScroll, { passive: true });
    this._activeTrackerAttached = true;
  }

  _updateActiveDot(index) {
    if (!this._dotButtons || !this._dotButtons.length) return;
    this._dotButtons.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('is-active');
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.classList.remove('is-active');
        dot.removeAttribute('aria-current');
      }
    });
  }

  _getCurrentIndex() {
    if (!this.viewport) return 0;
    const step = this._getStep();
    if (!step || !this._originalCount) return 0;
    const left = this.viewport.scrollLeft;

    if (this.options.infinite) {
      const base = step * this._originalCount - this._peekPx;
      const raw = Math.round((left - base) / step);
      const normalized = ((raw % this._originalCount) + this._originalCount) % this._originalCount;
      return normalized;
    }

    const raw = Math.round(left / step);
    return Math.min(this._originalCount - 1, Math.max(0, raw));
  }

  _scrollToIndex(index, behavior = 'smooth') {
    if (!this.viewport) return;
    const step = this._getStep();
    if (!step) return;

    const clampedIndex = Math.min(this._originalCount - 1, Math.max(0, index));
    const base = this.options.infinite ? step * this._originalCount - this._peekPx : 0;
    const target = base + step * clampedIndex;
    this.viewport.scrollTo({ left: target, behavior });
  }

  _scrollByStep(direction = 1, behavior = 'smooth') {
    if (!this.viewport || !this.track) return;
    const step = this._getStep();
    if (!step) return;

    const target = this.viewport.scrollLeft + step * direction;
    const maxLeft = this.track.scrollWidth - this.viewport.clientWidth;
    const clamped = Math.min(Math.max(0, target), maxLeft);

    // 端に達した non-infinite のときは停止
    if (!this.options.infinite && Math.abs(clamped - this.viewport.scrollLeft) < 1) {
      this._clearAutoplayTimer();
      return;
    }

    this.viewport.scrollTo({ left: clamped, behavior });
  }

  _setupAutoplay() {
    if (!this.options.autoplay || !this.viewport) return;

    this._pauseReasons = new Set();

    if (this.options.pauseOnHover) {
      this._onMouseEnter = () => {
        this._pauseReasons.add('hover');
        this._clearAutoplayTimer();
      };
      this._onMouseLeave = () => {
        this._pauseReasons.delete('hover');
        this._startAutoplayTimer();
      };
      this.root.addEventListener('mouseenter', this._onMouseEnter);
      this.root.addEventListener('mouseleave', this._onMouseLeave);
    }

    if (this.options.pauseOnFocus) {
      this._onFocusIn = () => {
        this._pauseReasons.add('focus');
        this._clearAutoplayTimer();
      };
      this._onFocusOut = () => {
        this._pauseReasons.delete('focus');
        this._startAutoplayTimer();
      };
      this.root.addEventListener('focusin', this._onFocusIn);
      this.root.addEventListener('focusout', this._onFocusOut);
    }

    if (this.options.pauseOnVisibility) {
      this._onVisibilityChange = () => {
        if (document.hidden) {
          this._pauseReasons.add('visibility');
          this._clearAutoplayTimer();
        } else {
          this._pauseReasons.delete('visibility');
          this._startAutoplayTimer();
        }
      };
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    this._startAutoplayTimer();
  }

  _startAutoplayTimer() {
    if (!this.options.autoplay) return;
    if (this._pauseReasons && this._pauseReasons.size > 0) return;
    this._clearAutoplayTimer();
    this._autoplayTimer = setInterval(() => {
      this._scrollByStep(1);
    }, this.options.autoplayInterval);
  }

  _clearAutoplayTimer() {
    if (this._autoplayTimer) {
      clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
  }

  _restartAutoplay() {
    if (!this.options.autoplay) return;
    if (this._pauseReasons && this._pauseReasons.size > 0) return;
    this._startAutoplayTimer();
  }

  _setupResizeHandler() {
    if (!this.viewport) return;

    // リサイズ処理をデバウンス（150ms）
    this._onResize = () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this._handleResize();
      }, 150);
    };

    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _handleResize() {
    if (!this.viewport || !this.track) return;

    // 現在のスライドインデックスを保存
    const currentIndex = this._getCurrentIndex();

    // viewport幅を取得
    const viewportWidth = this.viewport.offsetWidth;

    // peekPx を再計算
    if (this.options.peekRatio !== undefined) {
      // peekRatio: viewport幅と連立方程式で計算
      const itemsVisible = this.options.itemsVisible;
      const peekRatio = this.options.peekRatio;
      this._peekPx = (viewportWidth * peekRatio) / (itemsVisible + 2 * peekRatio);
    } else {
      // peek: 文字列値を使用（px, %, vw など）
      this._peekPx = this._parsePixels(this.options.peek, viewportWidth);
    }

    // 計算された peek を CSS 変数に反映
    this.root.style.setProperty('--ofc-peek', this._peekPx + 'px');

    // gap値も再計算（%やvwの場合に対応）
    this._gapPx = this._parsePixels(this.options.gap, viewportWidth);

    // スクロール位置を現在のスライドインデックスに合わせて調整
    // requestAnimationFrame で次のフレームで実行（レイアウト計算後）
    // instant を使用してリサイズ中のスクロールアニメーションを防ぐ
    requestAnimationFrame(() => {
      this._scrollToIndex(currentIndex, 'instant');
    });

    console.log('[OverflowCarousel] Resized:', {
      id: this.root.id,
      peekPx: this._peekPx,
      currentIndex: currentIndex
    });
  }

  _parsePixels(value, base = window.innerWidth) {
    // CSS 値（px, %, vw, em）をピクセルに変換
    // base パラメータは % や vw の計算基準を指定
    if (typeof value === 'number') return value;
    const match = String(value).trim().match(/^([\d.]+)(px|%|vw|em)?$/);
    if (!match) return 0;
    const [, num, unit] = match;
    const n = parseFloat(num);
    if (!unit || unit === 'px') return n;
    if (unit === '%') return (base * n) / 100;
    if (unit === 'vw') return (base * n) / 100;
    if (unit === 'em') return n * 16;
    return 0;
  }

  destroy() {
    // イベントリスナーをクリーンアップ
    document.removeEventListener('keydown', this._keyboardListener);
    this.viewport && this._onScroll && this.viewport.removeEventListener('scroll', this._onScroll);

    this.viewport && this._onActiveScroll && this.viewport.removeEventListener('scroll', this._onActiveScroll);
    this.root && this._onMouseEnter && this.root.removeEventListener('mouseenter', this._onMouseEnter);
    this.root && this._onMouseLeave && this.root.removeEventListener('mouseleave', this._onMouseLeave);
    this.root && this._onFocusIn && this.root.removeEventListener('focusin', this._onFocusIn);
    this.root && this._onFocusOut && this.root.removeEventListener('focusout', this._onFocusOut);
    this._onVisibilityChange && document.removeEventListener('visibilitychange', this._onVisibilityChange);
    this._onResize && window.removeEventListener('resize', this._onResize);

    this._clearAutoplayTimer();
    clearTimeout(this._resizeTimer);
  }
}

// data-carousel 属性を持つ要素を自動初期化
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-carousel]').forEach((el) => {
    const options = JSON.parse(el.dataset.carousel || '{}');
    new OverflowCarousel(el, options);
  });
});

// グローバルに公開
window.OverflowCarousel = OverflowCarousel;
