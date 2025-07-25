# WikiGaiaLab Animation System
*UI Animation Specifications & Guidelines*

## 📋 Table of Contents
- [Philosophy](#philosophy)
- [Technical Foundation](#technical-foundation)
- [Animation Principles](#animation-principles)
- [Component Patterns](#component-patterns)
- [Performance Guidelines](#performance-guidelines)
- [Implementation Examples](#implementation-examples)
- [Quality Standards](#quality-standards)

---

## 🌱 Philosophy

WikiGaiaLab animations embody our core values of **human connection**, **gentle technology**, and **community warmth**. Every animation should feel:

- **Natural & Organic** - Movements inspired by nature, not machines
- **Purposeful** - Each animation serves user understanding or delight
- **Accessible** - Respectful of motion preferences and accessibility needs
- **Performant** - Smooth 60fps experience across all devices

### Brand Animation DNA
- **Flowing motions** over sharp mechanical movements
- **Subtle organic curves** using easeInOut and spring physics
- **Staggered timing** to create natural rhythm
- **Color transitions** that reinforce WikiGaia brand identity (#00B894)

---

## ⚙️ Technical Foundation

### Primary Library
```typescript
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
```

**Why Framer Motion:**
- Hardware-accelerated animations (60fps guaranteed)
- Declarative API matching React patterns
- Built-in accessibility support (respects `prefers-reduced-motion`)
- Advanced features: scroll-based animations, layout animations
- Excellent bundle size optimization

### Fallback Strategy
```css
/* CSS fallbacks for browsers without JavaScript */
@media (prefers-reduced-motion: no-preference) {
  .fade-in { animation: fadeIn 0.5s ease-in-out; }
  .slide-up { animation: slideUp 0.6s ease-out; }
}
```

---

## 🎭 Animation Principles

### 1. **Natural Timing**
```typescript
// Good: Natural, organic timing
const naturalTiming = {
  duration: 0.8,
  ease: "easeOut"
};

// Avoid: Mechanical, abrupt timing
const mechanicalTiming = {
  duration: 0.2,
  ease: "linear"
};
```

### 2. **Purposeful Motion**
Every animation must serve one of these purposes:
- **Feedback** - Confirm user actions (button clicks, form submissions)
- **Navigation** - Guide user attention and flow
- **Context** - Show relationships between elements
- **Delight** - Add personality without overwhelming

### 3. **Layered Sophistication**
```typescript
// Progressive enhancement approach
const basicAnimation = { opacity: [0, 1] };
const enhancedAnimation = { 
  opacity: [0, 1], 
  y: [20, 0],
  scale: [0.95, 1]
};
```

### 4. **Respect User Preferences**
```typescript
// Always respect motion preferences
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const motionConfig = shouldReduceMotion 
  ? { duration: 0.01 } 
  : { duration: 0.8, ease: "easeOut" };
```

---

## 🧩 Component Patterns

### Hero Sections
**Purpose:** Create engaging first impressions while maintaining professionalism

```typescript
// Staggered text reveal
<motion.h1
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
>
  Main Headline
</motion.h1>

// Floating background elements
<motion.div
  animate={{ 
    y: [0, -20, 0],
    rotate: [0, 180, 360]
  }}
  transition={{ 
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

**Specifications:**
- **Entry Duration:** 0.8s for headlines, 0.6s for subtext
- **Stagger Delay:** 0.2s between elements
- **Background Motion:** 8-12s cycles for ambient elements

### Interactive Cards
**Purpose:** Provide tactile feedback and visual hierarchy

```typescript
// Card hover interaction
<motion.div
  whileHover={{ 
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    y: -8
  }}
  transition={{ type: "spring", stiffness: 300 }}
>
  Card Content
</motion.div>
```

**Specifications:**
- **Hover Scale:** 1.02-1.05 (subtle lift effect)
- **Shadow Growth:** Soft, extended shadows on hover
- **Spring Physics:** stiffness: 300, damping: 30
- **Color Transitions:** 300ms duration

### Navigation Elements
**Purpose:** Smooth state transitions and clear interaction feedback

```typescript
// Menu item interactions
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400 }}
>
  Menu Item
</motion.button>
```

### Form Interactions
**Purpose:** Guide users through input flows with clear feedback

```typescript
// Input focus states
<motion.input
  whileFocus={{
    borderColor: "#00B894",
    boxShadow: "0 0 0 3px rgba(0, 184, 148, 0.1)"
  }}
  transition={{ duration: 0.2 }}
/>

// Form submission feedback
<motion.button
  whileTap={{ scale: 0.98 }}
  animate={isSubmitting ? { opacity: 0.7 } : { opacity: 1 }}
>
  {isSubmitting ? <Spinner /> : "Submit"}
</motion.button>
```

### Scroll-Based Animations
**Purpose:** Create engaging storytelling experiences

```typescript
// Scroll-triggered reveals
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  viewport={{ once: true, margin: "-100px" }}
>
  Content that appears on scroll
</motion.div>
```

**Specifications:**
- **Trigger Point:** 100px before element enters viewport
- **Animation Once:** `once: true` to prevent re-triggering
- **Duration:** 0.6-0.8s for most scroll animations

---

## ⚡ Performance Guidelines

### 1. **Hardware Acceleration**
```typescript
// Prefer transform properties (GPU accelerated)
const goodPerformance = {
  x: 100,        // transform: translateX()
  scale: 1.2,    // transform: scale()
  rotate: 45     // transform: rotate()
};

// Avoid layout-triggering properties
const poorPerformance = {
  left: 100,     // triggers layout
  width: 200,    // triggers layout
  height: 150    // triggers layout
};
```

### 2. **Animation Optimization**
```typescript
// Use will-change for complex animations
<motion.div
  style={{ willChange: "transform" }}
  animate={{ x: [0, 100, 0] }}
  transition={{ duration: 2, repeat: Infinity }}
/>

// Clean up will-change after animation
useEffect(() => {
  const element = ref.current;
  const cleanup = () => {
    element.style.willChange = "auto";
  };
  
  return cleanup;
}, []);
```

### 3. **Conditional Animation Loading**
```typescript
// Lazy load complex animations
const ComplexAnimation = lazy(() => import('./ComplexAnimation'));

// Reduce animations on low-end devices
const isLowEndDevice = navigator.hardwareConcurrency < 4;
const animationConfig = isLowEndDevice 
  ? { duration: 0.3 } 
  : { duration: 0.8, ease: "easeOut" };
```

---

## 💻 Implementation Examples

### Page Transitions
```typescript
// App-level page transitions
<AnimatePresence mode="wait">
  <motion.div
    key={router.pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <PageComponent />
  </motion.div>
</AnimatePresence>
```

### Loading States
```typescript
// Skeleton loading with pulse
<motion.div
  className="bg-gray-200 rounded"
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 1.5, repeat: Infinity }}
/>

// Progress indicators
<motion.div
  className="bg-primary-500 h-2 rounded"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>
```

### Micro-interactions
```typescript
// Heart animation for likes
<motion.button
  whileTap={{ scale: 0.9 }}
  animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
  transition={{ duration: 0.3 }}
>
  <Heart className={isLiked ? "text-red-500" : "text-gray-400"} />
</motion.button>

// Success feedback
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: "spring", stiffness: 200 }}
>
  <CheckCircle className="text-green-500" />
</motion.div>
```

---

## 🎯 Quality Standards

### Testing Checklist
- [ ] **60fps Performance** - No dropped frames during animations
- [ ] **Accessibility** - Respects `prefers-reduced-motion`
- [ ] **Cross-browser** - Works in Chrome, Safari, Firefox, Edge
- [ ] **Mobile Performance** - Smooth on iOS and Android devices
- [ ] **Battery Impact** - Minimal CPU usage, especially for infinite animations

### Code Review Standards
```typescript
// Good: Clear, purposeful animation
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.2 }}
>
  Interactive Element
</motion.div>

// Avoid: Excessive or purposeless animation
<motion.div
  animate={{ 
    rotate: [0, 360],
    scale: [1, 2, 1],
    x: [0, 100, -100, 0]
  }}
  transition={{ duration: 0.5, repeat: Infinity }}
>
  Distracting Element
</motion.div>
```

### Performance Metrics
- **Animation Duration:** 0.2-0.8s for most interactions
- **Infinite Animations:** Max 12s cycle duration
- **Stagger Delays:** 0.1-0.2s between elements
- **CPU Usage:** <5% for ambient animations
- **Bundle Impact:** <10KB for animation utilities

---

## 🔄 Version History

**v1.0** - Initial implementation with homepage animations
- Hero section floating elements
- Card hover interactions
- Step-by-step process animations
- CTA button magnetic effects

**Roadmap:**
- [ ] Page transition system
- [ ] Form animation patterns
- [ ] Loading state animations
- [ ] Notification animations
- [ ] Advanced scroll-triggered effects

---

## 📞 Support & Contribution

For questions about animation implementation:
1. Check existing patterns in `/src/app/page.tsx`
2. Reference Framer Motion documentation
3. Test on multiple devices before deployment
4. Consider accessibility impact of all animations

**Remember:** Great animations are invisible - they enhance the experience without drawing attention to themselves.

---

*Last updated: 2025-07-25 | WikiGaiaLab Design System v1.0*