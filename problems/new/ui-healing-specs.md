# UI Healing Specifications - Problems/New Page
*Focus Area: /problems/new - Story Creation Form*

## Page-Specific Configuration

### Primary Target
- **URL Path**: `/problems/new`
- **Page Name**: `problems-new` 
- **Description**: "Modulo per raccontare un nuovo problema"
- **Authentication**: Required (true)
- **Priority**: HIGH (Critical user journey)

### WikiGaiaLab Brand Integration Requirements

#### Core Identity Elements
- **Primary Colors**: Verde WikiGaia (#00B894), Verde Scuro (#00695C)
- **Supporting Colors**: Verde Natura (#26A69A), Teal Collaborativo (#4DB6AC)
- **Background Palette**: Verde Chiaro (#80CBC4), Verde Ghiaccio (#B2DFDB)
- **Accent Color**: Giallo Ecologico (#FFB74D) for important CTAs

#### Typography Standards
- **Primary Font**: Inter (clean, modern, Italian-friendly)
- **Fallback**: Roboto 
- **Code Font**: JetBrains Mono
- **Hierarchy**: 
  - Title: 2.5rem, weight 700
  - Subtitle: 2rem, weight 600
  - Section: 1.5rem, weight 600
  - Body: 1rem, weight 400
  - Small: 0.875rem, weight 400

#### Language & Tone (Italian Artisan Laboratory)
- **Voice**: Caloroso, familiare, come un maestro artigiano
- **Form**: Familiare Amichevole ("tu", "Dai che ci riusciamo")
- **Emotions**: Incoraggiante ("Brava!", "Ce la puoi fare!")
- **Style**: Compagno di laboratorio ("Mettiamoci insieme")
- **Confidence**: Rassicurante Umile ("Ho visto problemi così, si può fare")

## Problems/New Page Evaluation Criteria

### 1. Visual Design Compliance (30% weight)

#### Brand Integration
- [ ] WikiGaia logo correctly positioned and sized (180px max width)
- [ ] Verde WikiGaia primary color (#00B894) used for main CTAs
- [ ] Verde Scuro (#00695C) for active states and important text
- [ ] Teal Collaborativo (#4DB6AC) for hover states
- [ ] Verde Ghiaccio (#B2DFDB) for subtle backgrounds
- [ ] Proper color contrast ratios (WCAG AA compliance)

#### Layout & Spacing
- [ ] 12-column grid system maintained
- [ ] 24px spacing between major sections
- [ ] All measurements in 4px multiples (4, 8, 12, 16, 24, 32, 48, 64, 96px)
- [ ] Content max-width: 4xl (896px) for optimal readability
- [ ] Proper form field spacing and hierarchy

#### Typography Implementation
- [ ] Inter font family correctly loaded and applied
- [ ] Consistent text hierarchy throughout form
- [ ] Proper line-heights (1.6 for body text, 1.2 for headings)
- [ ] Italian text rendering without truncation
- [ ] Form labels appropriately sized (1rem, weight 500)

### 2. UX & Interaction Design (30% weight)

#### Artisan Laboratory Language
- [ ] Form title uses laboratory metaphor: "Che problema hai portato nel nostro laboratorio?"
- [ ] Input placeholder examples in Italian artisan style
- [ ] Success messages: "Perfetto! Ora contribuisci a creare una soluzione"
- [ ] Error messages: patient and understanding tone
- [ ] Submit button: "Porta il problema al laboratorio"

#### Form Interaction Patterns
- [ ] Intelligent validation with real-time feedback
- [ ] Field border colors: Grey → Blue (active) → Green (valid) → Red (needs attention)
- [ ] Encouraging word counter with motivational text
- [ ] Category selection with visual previews and colored themes
- [ ] Auto-save indication: "Salvataggio automatico..."
- [ ] Progressive button transformation through form states

#### Micro-interactions & Animations
- [ ] Form fields respond immediately (under 100ms)
- [ ] Validation messages slide down with gentle bounce
- [ ] Category cards expand with hover elevation (8px shadow)
- [ ] Success heart animation on form completion
- [ ] Word counter grows smoothly and celebrates milestones
- [ ] Submit button scales with satisfaction (1.0 → 1.05 → 1.0)

### 3. Laboratory Workshop Environment (25% weight)

#### Storytelling Context
- [ ] Workshop tips section with laboratory language
- [ ] "Consigli dal Laboratorio" section properly styled
- [ ] Tips use artisan metaphors and neighborhood solidarity
- [ ] Visual hierarchy guides through story creation process
- [ ] Form feels conversational, not bureaucratic

#### Community Integration Messaging
- [ ] Clear connection between individual problem and community solution
- [ ] "Problema → Soluzione condivisa" messaging visible
- [ ] Reference to voting system ("cuori") and community thresholds
- [ ] Laboratory roles referenced ("maestro", "compagni", "vicini")
- [ ] Encouraging community participation language

#### Visual Laboratory Atmosphere
- [ ] Warm gradient backgrounds (orange-50 to amber-50 to yellow-50)
- [ ] Workshop-style card designs with appropriate shadows
- [ ] Natural, organic feeling animations and transitions
- [ ] Icon usage consistent with laboratory theme
- [ ] Overall feeling of warmth and craftsmanship

### 4. Technical Implementation & Performance (15% weight)

#### Code Quality
- [ ] React components properly structured
- [ ] TypeScript types correctly defined
- [ ] Error boundaries implemented
- [ ] Proper loading states with skeleton screens
- [ ] Form validation with clear error handling

#### Performance Standards
- [ ] Page loads in under 3 seconds (3G network)
- [ ] Interactive elements respond under 100ms
- [ ] Animations run at 60fps consistently
- [ ] Images optimized (WebP format when possible)
- [ ] JavaScript bundle size optimized

#### Accessibility (WCAG AA Compliance)
- [ ] All form fields have proper labels and aria-attributes
- [ ] Tab navigation works correctly through all elements
- [ ] Focus indicators visible and high contrast (2px border)
- [ ] Screen reader compatibility with descriptive text
- [ ] Touch targets minimum 44px for mobile devices
- [ ] Color contrast ratios meet AA standards (4.5:1 minimum)

## Responsive Design Requirements

### Mobile (320px - 767px)
- [ ] Form fields stack vertically with appropriate spacing
- [ ] Touch-friendly buttons (min 44px height)
- [ ] Category selection works well with touch
- [ ] No horizontal scrolling
- [ ] Workshop tips remain accessible but condensed

### Tablet (768px - 1023px)
- [ ] Balanced layout between mobile and desktop
- [ ] Form maintains comfortable width
- [ ] Touch interactions optimized
- [ ] Good use of available screen space

### Desktop (1024px+)
- [ ] Form centered with max-width constraint
- [ ] Hover states work properly
- [ ] Workshop tips displayed prominently
- [ ] Efficient use of screen real estate

## Success Metrics & Scoring

### Scoring Breakdown (Total: 10 points)
- **Visual Design Compliance (3.0 points)**
  - Brand Integration: 1.0 point
  - Layout & Spacing: 1.0 point  
  - Typography: 1.0 point

- **UX & Interaction Design (3.0 points)**
  - Artisan Laboratory Language: 1.0 point
  - Form Interaction Patterns: 1.0 point
  - Micro-interactions & Animations: 1.0 point

- **Laboratory Workshop Environment (2.5 points)**
  - Storytelling Context: 1.0 point
  - Community Integration Messaging: 0.8 points
  - Visual Laboratory Atmosphere: 0.7 points

- **Technical Implementation & Performance (1.5 points)**
  - Code Quality: 0.5 points
  - Performance Standards: 0.5 points
  - Accessibility: 0.5 points

### Passing Threshold
- **Minimum Score for Approval**: 8.0/10
- **Target Score for Excellence**: 9.0/10

## Healing Priority Actions

### Critical Issues (Fix Immediately)
1. Brand color inconsistencies
2. Missing artisan laboratory language
3. Poor mobile responsiveness
4. Accessibility violations
5. Performance bottlenecks

### Important Improvements
1. Enhanced micro-interactions
2. Better category selection UX  
3. Improved workshop tips integration
4. Form validation enhancements
5. Loading state improvements

### Nice-to-Have Enhancements
1. Advanced animations
2. Additional community messaging
3. Enhanced visual polish
4. Performance optimizations
5. Extra accessibility features

---

*This specification focuses specifically on the /problems/new page as requested by the --specs /problems/new parameter, ensuring comprehensive evaluation of the story creation form within the WikiGaiaLab artisan laboratory context.*