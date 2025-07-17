# WikiGaiaLab Workflow System - Story 3.5 Implementation

## Overview

The Vote-Based Problem Workflow system automates problem status changes based on vote milestones and provides comprehensive admin workflow management tools.

## System Architecture

### Core Components

1. **Automatic Status Progression**
   - 50 votes → "Under Review"
   - 75 votes → "Priority Queue"
   - 100 votes → "In Development"

2. **Development Queue Management**
   - Priority-based queue system
   - Admin queue management interface
   - Real-time queue position tracking

3. **Admin Workflow Tools**
   - Manual status override capabilities
   - Workflow history tracking
   - Comprehensive queue management

4. **Notification System**
   - Status change notifications
   - Milestone notifications
   - Admin alerts

## API Endpoints

### Workflow Management

#### `/api/workflow/status-update`
**POST** - Automatic status updates and admin overrides
```json
{
  "problemId": "uuid",
  "newVoteCount": 75,
  "adminOverride": false,
  "targetStatus": "Priority Queue",
  "reason": "Manual override reason"
}
```

**GET** - Get workflow information for a problem
```
/api/workflow/status-update?problemId=uuid
```

#### `/api/workflow/development-queue`
**POST** - Add problem to development queue
```json
{
  "problemId": "uuid",
  "priority": "high",
  "estimatedHours": 40,
  "notes": "High priority implementation"
}
```

**GET** - Get development queue with filters
```
/api/workflow/development-queue?priority=high&status=queued&adminView=true
```

**PATCH** - Update queue item (admin only)
```json
{
  "problemId": "uuid",
  "priority": "urgent",
  "status": "in_progress",
  "estimatedHours": 60
}
```

**DELETE** - Remove from queue (admin only)
```
/api/workflow/development-queue?problemId=uuid
```

### Admin APIs

#### `/api/admin/workflow/stats`
**GET** - Workflow statistics for admin dashboard

#### `/api/admin/workflow/logs`
**GET** - Workflow history logs with filtering
```
/api/admin/workflow/logs?triggerType=milestone_triggered&page=1&limit=20
```

## Status Transition Rules

### Valid Transitions
```
Proposed → [Under Review, Rejected]
Under Review → [Priority Queue, Rejected]
Priority Queue → [In Development, Rejected]
In Development → [Completed, Rejected]
Completed → []
Rejected → []
```

### Automatic Triggers
- **50 votes**: Proposed → Under Review
- **75 votes**: Under Review → Priority Queue
- **100 votes**: Priority Queue → In Development

### Manual Override
Admins can manually change status with:
- Required reason/justification
- Audit trail logging
- Notification to stakeholders

## Queue Management

### Priority Levels
1. **Urgent** - Critical issues requiring immediate attention
2. **High** - Important features with high vote count
3. **Medium** - Standard development items
4. **Low** - Nice-to-have features

### Queue Status
- **Queued** - Waiting for development
- **In Progress** - Currently being developed
- **Completed** - Development finished
- **Blocked** - Development blocked by dependencies

## Notification System

### Status Change Notifications
- **To Proposer**: Status change with context
- **To Admins**: Important status changes (In Development, Completed, Rejected)

### Email Templates
- `status_change_proposer` - For problem proposers
- `status_change_admin` - For administrators
- `vote_milestone_*` - For vote milestones
- `admin_alert_100_votes` - For 100-vote admin alerts

## Integration Points

### Vote System Integration
1. Vote API calls milestone notification endpoint
2. Milestone endpoint triggers workflow status update
3. Status update triggers notifications
4. Development queue automatically populated

### Admin Dashboard Integration
- Workflow management tab in admin panel
- Real-time statistics and queue status
- Comprehensive workflow history
- Manual override capabilities

## Database Schema Requirements

### New Tables

#### `workflow_logs`
```sql
CREATE TABLE workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id),
  previous_status TEXT,
  new_status TEXT,
  trigger_type TEXT, -- 'milestone_triggered', 'admin_override', 'queue_added', etc.
  triggered_by UUID REFERENCES users(id),
  vote_count_at_change INTEGER,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `development_queue`
```sql
CREATE TABLE development_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id) UNIQUE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  queue_position INTEGER,
  status TEXT CHECK (status IN ('queued', 'in_progress', 'completed', 'blocked')),
  estimated_hours INTEGER,
  estimated_completion TIMESTAMP,
  notes TEXT,
  added_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Enhanced Tables

#### `problems` - New status values
```sql
ALTER TABLE problems 
ALTER COLUMN status TYPE TEXT;

-- Update enum to include new statuses:
-- 'Proposed', 'Under Review', 'Priority Queue', 'In Development', 'Completed', 'Rejected'
```

#### `user_notification_preferences` - New preferences
```sql
ALTER TABLE user_notification_preferences 
ADD COLUMN email_status_changes BOOLEAN DEFAULT true;
```

## Frontend Components

### Admin Components
- `AdminWorkflowStats` - Statistics overview
- `AdminDevelopmentQueue` - Queue management interface
- `AdminWorkflowHistory` - Audit trail viewer
- `AdminStatusOverride` - Manual status change tool

### Public Components
- `DevelopmentQueueWidget` - Public queue visibility
- Enhanced problem status displays
- Vote milestone progress indicators

## Security Considerations

### Authentication & Authorization
- Admin endpoints require admin privileges
- Workflow logs include audit trails
- Status changes require authentication
- Manual overrides require justification

### Data Validation
- Status transition validation
- Vote count verification
- Queue position constraints
- Input sanitization

## Performance Considerations

### Caching
- Queue statistics cached
- Workflow stats cached
- Pagination for large datasets

### Scalability
- Async notification processing
- Batch queue updates
- Indexed database queries

## Monitoring & Analytics

### Metrics Tracked
- Workflow transition times
- Queue processing rates
- Admin intervention frequency
- User engagement with status changes

### Health Checks
- Queue processing status
- Notification delivery rates
- Database performance
- API response times

## Future Enhancements

### Planned Features
1. **Automated Testing**
   - Status transition tests
   - Queue management tests
   - Notification delivery tests

2. **Advanced Queue Features**
   - Dependencies between problems
   - Resource allocation tracking
   - Estimated completion dates

3. **Enhanced Notifications**
   - In-app notifications
   - Slack/Discord integration
   - Mobile push notifications

4. **Analytics Dashboard**
   - Workflow performance metrics
   - Development velocity tracking
   - User satisfaction analytics

## Configuration

### Environment Variables
```env
# Required for notifications
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### Feature Flags
```typescript
const WORKFLOW_CONFIG = {
  AUTO_STATUS_UPDATES: true,
  VOTE_THRESHOLDS: { 50: 'Under Review', 75: 'Priority Queue', 100: 'In Development' },
  QUEUE_ENABLED: true,
  ADMIN_OVERRIDES: true,
  NOTIFICATION_TYPES: ['email', 'in_app']
};
```

## Testing Strategy

### Unit Tests
- API endpoint functionality
- Status transition logic
- Queue management operations
- Notification service methods

### Integration Tests
- Vote → Workflow → Notification flow
- Admin workflow operations
- Database consistency
- Real-time updates

### End-to-End Tests
- Complete user workflow
- Admin management scenarios
- Error handling and recovery
- Performance under load

---

**Implementation Status**: ✅ Complete
**Epic**: 3. Voting System
**Story**: 3.5 Vote-Based Problem Workflow
**Last Updated**: [Current Date]
