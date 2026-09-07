/**
 * AdPositioningManager — Singleton service for real-time ad slot positioning.
 *
 * Responsibilities:
 *  - Tracks live viewport dimensions and scroll position via window event listeners.
 *  - Calculates optimal CSS positions for each ad slot type (sticky-footer, top, center, etc.).
 *  - Reads CSS env() safe-area insets so sticky ads don't overlap notches/home bars on iOS.
 *  - Tracks arbitrary DOM elements (ResizeObserver + IntersectionObserver) to avoid
 *    overlap when computing adjusted ad positions.
 *  - Exposes responsive breakpoint helpers (isMobile / isTablet / isDesktop).
 *
 * Usage: AdPositioningManager.getInstance() — always returns the same instance.
 */

export interface ViewportDimensions {
  width: number;
  height: number;
  scrollY: number;
  scrollX: number;
}

export interface ElementBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Position {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  transform?: string;
}

export interface PositioningOptions {
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
  margin: number;
  avoidOverlap: boolean;
  respectSafeArea: boolean;
  zIndex: number;
}

export class AdPositioningManager {
  private static instance: AdPositioningManager; // Singleton instance
  private viewport: ViewportDimensions = { width: 0, height: 0, scrollY: 0, scrollX: 0 };
  private trackedElements = new Map<string, ElementBounds>(); // DOM elements registered for overlap avoidance
  private observers = new Map<string, ResizeObserver | IntersectionObserver>(); // Paired observers per element

  /** Returns (or creates) the single shared instance. */
  static getInstance(): AdPositioningManager {
    if (!this.instance) {
      this.instance = new AdPositioningManager();
    }
    return this.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeViewportTracking(); // Guard for SSR — no window on the server
    }
  }

  /**
   * Initialize viewport tracking
   */
  private initializeViewportTracking() {
    const updateViewport = () => {
      this.viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: window.scrollY,
        scrollX: window.scrollX,
      };
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('scroll', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
  }

  /**
   * Get current viewport dimensions
   */
  getViewport(): ViewportDimensions {
    return { ...this.viewport };
  }

  /**
   * Calculate optimal position for sticky footer ad
   */
  calculateStickyFooterPosition(
    adWidth: number,
    adHeight: number,
    options: Partial<PositioningOptions> = {}
  ): Position {
    const opts: PositioningOptions = {
      preferredPosition: 'bottom',
      margin: 10,
      avoidOverlap: true,
      respectSafeArea: true,
      zIndex: 1000,
      ...options,
    };

    const viewport = this.getViewport();
    const safeArea = this.getSafeAreaInsets();

    // Calculate horizontal centering
    const horizontalCenter = Math.max(
      opts.margin,
      (viewport.width - adWidth) / 2
    );

    // Calculate bottom position with safe area
    const bottomPosition = opts.respectSafeArea 
      ? safeArea.bottom + opts.margin
      : opts.margin;

    // Check for overlapping elements if enabled
    let adjustedBottom = bottomPosition;
    if (opts.avoidOverlap) {
      adjustedBottom = this.avoidElementOverlap(
        { left: horizontalCenter, right: horizontalCenter, bottom: bottomPosition, height: adHeight },
        'bottom'
      );
    }

    return {
      bottom: adjustedBottom,
      left: horizontalCenter,
      right: horizontalCenter,
    };
  }

  /**
   * Calculate position for any ad type
   */
  calculatePosition(
    elementId: string,
    adWidth: number,
    adHeight: number,
    options: PositioningOptions
  ): Position {
    const viewport = this.getViewport();

    switch (options.preferredPosition) {
      case 'top':
        return this.calculateTopPosition(adWidth, adHeight, options);
      case 'bottom':
        return this.calculateBottomPosition(adWidth, adHeight, options);
      case 'left':
        return this.calculateLeftPosition(adWidth, adHeight, options);
      case 'right':
        return this.calculateRightPosition(adWidth, adHeight, options);
      case 'center':
        return this.calculateCenterPosition(adWidth, adHeight, options);
      default:
        return this.calculateBottomPosition(adWidth, adHeight, options);
    }
  }

  private calculateTopPosition(width: number, height: number, options: PositioningOptions): Position {
    const viewport = this.getViewport();
    const safeArea = this.getSafeAreaInsets();

    return {
      top: options.respectSafeArea ? safeArea.top + options.margin : options.margin,
      left: Math.max(options.margin, (viewport.width - width) / 2),
    };
  }

  private calculateBottomPosition(width: number, height: number, options: PositioningOptions): Position {
    const safeArea = this.getSafeAreaInsets();
    const viewport = this.getViewport();

    return {
      bottom: options.respectSafeArea ? safeArea.bottom + options.margin : options.margin,
      left: Math.max(options.margin, (viewport.width - width) / 2),
    };
  }

  private calculateLeftPosition(width: number, height: number, options: PositioningOptions): Position {
    const viewport = this.getViewport();
    const safeArea = this.getSafeAreaInsets();

    return {
      left: options.respectSafeArea ? safeArea.left + options.margin : options.margin,
      top: Math.max(options.margin, (viewport.height - height) / 2),
    };
  }

  private calculateRightPosition(width: number, height: number, options: PositioningOptions): Position {
    const viewport = this.getViewport();
    const safeArea = this.getSafeAreaInsets();

    return {
      right: options.respectSafeArea ? safeArea.right + options.margin : options.margin,
      top: Math.max(options.margin, (viewport.height - height) / 2),
    };
  }

  private calculateCenterPosition(width: number, height: number, options: PositioningOptions): Position {
    const viewport = this.getViewport();

    return {
      left: Math.max(options.margin, (viewport.width - width) / 2),
      top: Math.max(options.margin, (viewport.height - height) / 2),
    };
  }

  /**
   * Get safe area insets (for mobile devices with notches, etc.)
   */
  getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    if (typeof window === 'undefined') {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
    };
  }

  /**
   * Track an element for overlap detection
   */
  trackElement(elementId: string, element: HTMLElement) {
    const updateBounds = () => {
      const rect = element.getBoundingClientRect();
      this.trackedElements.set(elementId, {
        top: rect.top + this.viewport.scrollY,
        left: rect.left + this.viewport.scrollX,
        right: rect.right + this.viewport.scrollX,
        bottom: rect.bottom + this.viewport.scrollY,
        width: rect.width,
        height: rect.height,
      });
    };

    // Initial bounds
    updateBounds();

    // Create observers
    const resizeObserver = new ResizeObserver(updateBounds);
    const intersectionObserver = new IntersectionObserver(updateBounds);

    resizeObserver.observe(element);
    intersectionObserver.observe(element);

    this.observers.set(`${elementId}-resize`, resizeObserver);
    this.observers.set(`${elementId}-intersection`, intersectionObserver);
  }

  /**
   * Stop tracking an element
   */
  untrackElement(elementId: string) {
    this.trackedElements.delete(elementId);
    
    const resizeObserver = this.observers.get(`${elementId}-resize`);
    const intersectionObserver = this.observers.get(`${elementId}-intersection`);

    if (resizeObserver) {
      resizeObserver.disconnect();
      this.observers.delete(`${elementId}-resize`);
    }

    if (intersectionObserver) {
      intersectionObserver.disconnect();
      this.observers.delete(`${elementId}-intersection`);
    }
  }

  /**
   * Check for element overlaps and adjust position
   */
  private avoidElementOverlap(
    proposedBounds: { left: number; right: number; bottom: number; height: number },
    direction: 'top' | 'bottom' | 'left' | 'right'
  ): number {
    const adBounds = {
      top: this.viewport.height - proposedBounds.bottom - proposedBounds.height,
      left: proposedBounds.left,
      right: proposedBounds.right,
      bottom: this.viewport.height - proposedBounds.bottom,
      width: this.viewport.width - proposedBounds.left - proposedBounds.right,
      height: proposedBounds.height,
    };

    let adjustment = 0;

    for (const [elementId, bounds] of this.trackedElements) {
      if (this.boundsOverlap(adBounds, bounds)) {
        switch (direction) {
          case 'bottom':
            adjustment = Math.max(adjustment, bounds.top - adBounds.bottom + 10);
            break;
          case 'top':
            adjustment = Math.max(adjustment, bounds.bottom - adBounds.top + 10);
            break;
          case 'left':
            adjustment = Math.max(adjustment, bounds.right - adBounds.left + 10);
            break;
          case 'right':
            adjustment = Math.max(adjustment, bounds.left - adBounds.right + 10);
            break;
        }
      }
    }

    return proposedBounds.bottom + adjustment;
  }

  /**
   * Check if two bounds overlap
   */
  private boundsOverlap(bounds1: ElementBounds, bounds2: ElementBounds): boolean {
    return !(
      bounds1.right < bounds2.left ||
      bounds1.left > bounds2.right ||
      bounds1.bottom < bounds2.top ||
      bounds1.top > bounds2.bottom
    );
  }

  /**
   * Handle viewport changes and update positions
   */
  onViewportChange(callback: (viewport: ViewportDimensions) => void) {
    if (typeof window === 'undefined') return;

    const handler = () => callback(this.getViewport());
    
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler);
    window.addEventListener('orientationchange', handler);

    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }

  /**
   * Prevent content overlap by adjusting body margins
   */
  preventContentOverlap(adHeight: number, position: 'top' | 'bottom' = 'bottom') {
    if (typeof document === 'undefined') return;

    const margin = adHeight + 20; // Add some extra margin

    if (position === 'bottom') {
      document.body.style.marginBottom = `${margin}px`;
    } else {
      document.body.style.marginTop = `${margin}px`;
    }
  }

  /**
   * Remove content overlap prevention
   */
  removeContentOverlapPrevention(position: 'top' | 'bottom' = 'bottom') {
    if (typeof document === 'undefined') return;

    if (position === 'bottom') {
      document.body.style.marginBottom = '';
    } else {
      document.body.style.marginTop = '';
    }
  }

  /**
   * Check if viewport is mobile
   */
  isMobile(): boolean {
    return this.viewport.width < 768;
  }

  /**
   * Check if viewport is tablet
   */
  isTablet(): boolean {
    return this.viewport.width >= 768 && this.viewport.width < 1024;
  }

  /**
   * Check if viewport is desktop
   */
  isDesktop(): boolean {
    return this.viewport.width >= 1024;
  }

  /**
   * Get responsive ad dimensions
   */
  getResponsiveAdDimensions(baseWidth: number, baseHeight: number): { width: number; height: number } {
    if (this.isMobile()) {
      return {
        width: Math.min(baseWidth, this.viewport.width - 20),
        height: Math.min(baseHeight, 100),
      };
    }

    if (this.isTablet()) {
      return {
        width: Math.min(baseWidth, this.viewport.width - 40),
        height: baseHeight,
      };
    }

    return { width: baseWidth, height: baseHeight };
  }

  /**
   * Cleanup all observers and event listeners
   */
  cleanup() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.trackedElements.clear();
  }
}