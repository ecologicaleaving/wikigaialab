# UX Iteration Task

## Purpose

Implement an automated iterative UX analysis and improvement cycle that evaluates UI screens against technical specifications, coordinates approval workflows, and manages implementation cycles until quality standards are met.

## Instructions

When entering UX iteration mode (*ux-iteration <screenshot_path>), follow these steps:

### 1. Initialize Analysis Environment

Announce entering UX iteration mode and prepare the analysis environment:
- Verify `/docs/ui` folder exists and contains specification documents
- Set up Playwright environment for screen analysis
- Initialize iteration tracking and logging

### 2. Execute UX Expert Analysis

Trigger the UX Expert agent to perform comprehensive analysis:

**UX Expert Agent Tasks:**
- Use MPC Playwright to analyze the provided screenshot
- Load and cross-reference all documents in `/docs/ui` for technical specifications
- Evaluate the screen on a 0-100 scale considering:
  * Compliance with technical specifications
  * Usability and accessibility standards
  * Design consistency and patterns
  * Perceived performance indicators
  * UX best practices adherence

**Required Output:**
- Numerical UX score (0-100)
- Detailed analysis report with identified issues
- Prioritized intervention recommendations

### 3. Apply Quality Gate Logic

Implement automated decision logic based on UX score:

```python
if ux_score > 90:
    print("✅ SUCCESS: UX quality standards met")
    print(f"Final UX Score: {ux_score}/100")
    log_success_metrics()
    exit(0)
else:
    print(f"⚠️ Quality gate failed: {ux_score}/100")
    print("Initiating improvement workflow...")
    proceed_to_planning()
```

### 4. Generate Improvement Plan

If quality gate fails, UX Expert creates detailed improvement plan:
- Structured intervention tasks with clear objectives
- Effort estimation and timeline projections
- Technical dependencies and resource requirements
- Implementation priority matrix
- Risk assessment and mitigation strategies

### 5. Execute Product Owner Approval

Submit improvement plan to Product Owner agent for business validation:

**Product Owner Agent Tasks:**
- Evaluate alignment with product roadmap and objectives
- Analyze impact on user journey and key business metrics
- Assess resource allocation and ROI considerations
- Validate intervention priorities against business goals
- Consider market timing and competitive factors

**Decision Output:** APPROVE/REJECT with detailed business rationale

### 6. Handle Approval Workflow

Process Product Owner decision:

```python
if po_decision == "REJECT":
    print("❌ Plan rejected by Product Owner")
    log_rejection_feedback(po_rationale)
    request_plan_revision()
    return_to_planning()
else:
    print("✅ Plan approved - proceeding to implementation")
    initiate_development_phase()
```

### 7. Execute Implementation Phase

Trigger Development agent with approved specifications:

**Development Agent Tasks:**
- Implement interventions according to approved plan
- Maintain compliance with technical specifications
- Follow established coding standards and practices
- Document all changes and implementation decisions
- Ensure comprehensive testing coverage

### 8. Restart Iteration Cycle

Upon implementation completion:
- Log implementation details and metrics
- Automatically restart analysis cycle with updated screen
- Continue until UX score > 90 or maximum iterations reached

### 9. Monitor and Log Progress

Throughout the cycle, maintain comprehensive tracking:
- Iteration timestamps and duration metrics
- UX score progression across iterations
- Product Owner approval/rejection history
- Implementation change logs
- Performance and quality indicators

### 10. Handle Exit Conditions

Manage cycle termination scenarios:
- **Success**: UX score > 90 achieved
- **Escalation**: Too many consecutive rejections (>3)
- **Timeout**: Maximum iteration limit reached (>10)
- **Manual override**: User intervention requested

## Example Interaction

**User**: *ux-iteration screenshots/checkout-page.png

**Assistant**: 
```
🔄 UX Iteration Cycle Started
📁 Loading specifications from /docs/ui
🎯 Target: UX Score > 90

🔍 UX Expert Analysis in progress...
📊 Current UX Score: 67/100

❌ Quality gate failed (67 < 90)
📋 Issues identified:
- Accessibility: Missing ARIA labels (High Priority)
- Design: Inconsistent button styling (Medium Priority)  
- Performance: Large image assets (Low Priority)

🎯 Product Owner review initiated...
✅ Improvement plan APPROVED
⚡ Development phase starting...

🔄 Restarting analysis cycle...
```

**User**: *ux-iteration --show-log

**Assistant**: 
```
📈 UX Iteration Log - checkout-page.png
════════════════════════════════════════
Iteration 1: 67/100 → Plan approved → Dev in progress
Iteration 2: 78/100 → Plan approved → Dev completed  
Iteration 3: 94/100 → ✅ SUCCESS!

Total iterations: 3
Duration: 45 minutes
Final score: 94/100
```

## Utility Commands

- `*ux-iteration <screenshot_path>` - Start iteration cycle
- `*ux-iteration --debug <screenshot_path>` - Verbose debugging mode
- `*ux-iteration --show-log` - Display iteration history
- `*ux-iteration --reset` - Reset iteration counters
- `*ux-iteration --score-only <screenshot_path>` - Quick score check only