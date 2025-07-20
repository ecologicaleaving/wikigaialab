import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Types for notification system
export interface NotificationData {
  userId: string;
  type: 'vote_milestone' | 'admin_alert' | 'problem_approved' | 'problem_rejected' | 'featured_content' | 'welcome' | 'status_change';
  subject: string;
  contentText: string;
  contentHtml?: string;
  problemId?: string;
  relatedData?: Record<string, any>;
  scheduledFor?: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subjectTemplate: string;
  contentTextTemplate: string;
  contentHtmlTemplate?: string;
  variables: string[];
}

export interface TemplateVariables {
  user_name: string;
  problem_title: string;
  milestone?: number;
  category_name?: string;
  current_votes?: number;
  created_at?: string;
  problem_url?: string;
  proposer_name?: string;
  proposer_email?: string;
  problem_description?: string;
  admin_url?: string;
  previous_status?: string;
  new_status?: string;
  trigger_type?: string;
  reason?: string;
  [key: string]: any;
}

export class NotificationService {
  private supabase: any = null;
  private resend: Resend | null = null;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize during build time
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return;
    }
    
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    try {
      // Check if we have the required environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('NotificationService: Missing required environment variables');
        return;
      }

      // Initialize Supabase with service role for admin operations
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Initialize Resend if API key is available
      if (process.env.RESEND_API_KEY) {
        this.resend = new Resend(process.env.RESEND_API_KEY);
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize NotificationService:', error);
    }
  }

  /**
   * Queue a notification for delivery
   */
  async queueNotification(data: NotificationData): Promise<string> {
    this.initialize();
    
    if (!this.supabase) {
      throw new Error('NotificationService not properly initialized');
    }
    
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          status: 'pending',
          subject: data.subject,
          content_text: data.contentText,
          content_html: data.contentHtml,
          problem_id: data.problemId,
          related_data: data.relatedData || {},
          scheduled_for: data.scheduledFor?.toISOString() || new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to queue notification: ${error.message}`);
      }

      return notification.id;
    } catch (error) {
      console.error('Error queueing notification:', error);
      throw error;
    }
  }

  /**
   * Send a vote milestone notification
   */
  async sendVoteMilestoneNotification(
    problemId: string,
    milestone: number
  ): Promise<string> {
    this.initialize();
    
    if (!this.supabase) {
      throw new Error('NotificationService not properly initialized');
    }
    
    try {
      // Get problem details with user and category info
      const { data: problem, error: problemError } = await this.supabase
        .from('problems')
        .select(`
          id,
          title,
          description,
          vote_count,
          created_at,
          proposer:users!proposer_id(id, name, email),
          category:categories!category_id(id, name)
        `)
        .eq('id', problemId)
        .single();

      if (problemError || !problem) {
        throw new Error(`Problem not found: ${problemError?.message}`);
      }

      // Check if user wants milestone notifications
      const { data: preferences } = await this.supabase
        .from('user_notification_preferences')
        .select('email_vote_milestones')
        .eq('user_id', problem.proposer.id)
        .single();

      if (!preferences?.email_vote_milestones) {
        console.log(`User ${problem.proposer.id} has disabled milestone notifications`);
        return 'skipped';
      }

      // Check if milestone notification already sent
      const { data: existingMilestone } = await this.supabase
        .from('vote_milestones')
        .select('notification_sent')
        .eq('problem_id', problemId)
        .eq('milestone', milestone)
        .single();

      if (existingMilestone?.notification_sent) {
        console.log(`Milestone ${milestone} notification already sent for problem ${problemId}`);
        return 'already_sent';
      }

      // Prepare template variables
      const variables: TemplateVariables = {
        user_name: problem.proposer.name || 'Utente',
        problem_title: problem.title,
        milestone,
        category_name: problem.category.name,
        current_votes: problem.vote_count,
        created_at: new Date(problem.created_at).toLocaleDateString('it-IT'),
        problem_url: `${process.env.NEXT_PUBLIC_APP_URL}/problems/${problem.id}`
      };

      // Render email from template
      const { subject, contentText, contentHtml } = await this.renderTemplate(
        'vote_milestone_50', // Using same template for all milestones for now
        variables
      );

      // Queue the notification
      const notificationId = await this.queueNotification({
        userId: problem.proposer.id,
        type: 'vote_milestone',
        subject,
        contentText,
        contentHtml,
        problemId,
        relatedData: { milestone, vote_count: problem.vote_count }
      });

      // Record the milestone achievement
      await this.supabase
        .from('vote_milestones')
        .upsert({
          problem_id: problemId,
          milestone,
          achieved_at: new Date().toISOString(),
          notification_sent: false,
          notification_id: notificationId
        }, {
          onConflict: 'problem_id,milestone'
        });

      // Send the email immediately
      await this.sendPendingNotifications();

      return notificationId;
    } catch (error) {
      console.error('Error sending vote milestone notification:', error);
      throw error;
    }
  }

  /**
   * Send status change notification
   */
  async sendStatusChangeNotification(
    problemId: string,
    previousStatus: string,
    newStatus: string,
    context: {
      triggerType: string;
      voteCount: number;
      adminUser?: string;
      reason?: string;
    }
  ): Promise<string[]> {
    this.initialize();
    
    if (!this.supabase) {
      throw new Error('NotificationService not properly initialized');
    }
    
    try {
      // Get problem details
      const { data: problem, error: problemError } = await this.supabase
        .from('problems')
        .select(`
          id,
          title,
          description,
          vote_count,
          created_at,
          proposer:users!proposer_id(id, name, email),
          category:categories!category_id(id, name)
        `)
        .eq('id', problemId)
        .single();

      if (problemError || !problem) {
        throw new Error(`Problem not found: ${problemError?.message}`);
      }

      const notificationIds: string[] = [];

      // Send notification to problem proposer
      const { data: proposerPrefs } = await this.supabase
        .from('user_notification_preferences')
        .select('email_status_changes')
        .eq('user_id', problem.proposer.id)
        .single();

      if (proposerPrefs?.email_status_changes) {
        // Prepare template variables for proposer
        const proposerVariables: TemplateVariables = {
          user_name: problem.proposer.name || 'Utente',
          problem_title: problem.title,
          previous_status: previousStatus,
          new_status: newStatus,
          category_name: problem.category.name,
          current_votes: context.voteCount,
          trigger_type: context.triggerType,
          reason: context.reason || '',
          problem_url: `${process.env.NEXT_PUBLIC_APP_URL}/problems/${problem.id}`,
          created_at: new Date(problem.created_at).toLocaleDateString('it-IT')
        };

        // Render email from template
        const { subject, contentText, contentHtml } = await this.renderTemplate(
          'status_change_proposer',
          proposerVariables
        );

        // Queue the notification
        const proposerNotificationId = await this.queueNotification({
          userId: problem.proposer.id,
          type: 'status_change',
          subject,
          contentText,
          contentHtml,
          problemId,
          relatedData: { 
            previousStatus, 
            newStatus, 
            triggerType: context.triggerType,
            voteCount: context.voteCount 
          }
        });

        notificationIds.push(proposerNotificationId);
      }

      // Send admin notifications for important status changes
      const importantStatuses = ['In Development', 'Completed', 'Rejected'];
      if (importantStatuses.includes(newStatus)) {
        // Get all admin users
        const { data: adminUsers, error: adminError } = await this.supabase
          .from('users')
          .select('id, name, email')
          .eq('is_admin', true);

        if (!adminError && adminUsers?.length) {
          for (const admin of adminUsers) {
            // Check admin notification preferences
            const { data: adminPrefs } = await this.supabase
              .from('user_notification_preferences')
              .select('email_admin_notifications')
              .eq('user_id', admin.id)
              .single();

            if (!adminPrefs?.email_admin_notifications) {
              continue;
            }

            // Prepare template variables for admin
            const adminVariables: TemplateVariables = {
              user_name: admin.name || 'Admin',
              problem_title: problem.title,
              proposer_name: problem.proposer.name || 'Utente',
              proposer_email: problem.proposer.email,
              previous_status: previousStatus,
              new_status: newStatus,
              category_name: problem.category.name,
              current_votes: context.voteCount,
              trigger_type: context.triggerType,
              reason: context.reason || '',
              problem_description: problem.description,
              problem_url: `${process.env.NEXT_PUBLIC_APP_URL}/problems/${problem.id}`,
              admin_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
              created_at: new Date(problem.created_at).toLocaleDateString('it-IT')
            };

            // Render email from template
            const { subject, contentText, contentHtml } = await this.renderTemplate(
              'status_change_admin',
              adminVariables
            );

            // Queue the notification
            const adminNotificationId = await this.queueNotification({
              userId: admin.id,
              type: 'status_change',
              subject,
              contentText,
              contentHtml,
              problemId,
              relatedData: { 
                previousStatus, 
                newStatus, 
                triggerType: context.triggerType,
                voteCount: context.voteCount,
                isAdminNotification: true 
              }
            });

            notificationIds.push(adminNotificationId);
          }
        }
      }

      // Send all queued notifications
      await this.sendPendingNotifications();

      return notificationIds;
    } catch (error) {
      console.error('Error sending status change notification:', error);
      throw error;
    }
  }

  /**
   * Send admin alert for high-priority problems
   */
  async sendAdminAlert(problemId: string): Promise<string[]> {
    this.initialize();
    
    if (!this.supabase) {
      throw new Error('NotificationService not properly initialized');
    }
    
    try {
      // Get problem details
      const { data: problem, error: problemError } = await this.supabase
        .from('problems')
        .select(`
          id,
          title,
          description,
          vote_count,
          created_at,
          proposer:users!proposer_id(id, name, email),
          category:categories!category_id(id, name)
        `)
        .eq('id', problemId)
        .single();

      if (problemError || !problem) {
        throw new Error(`Problem not found: ${problemError?.message}`);
      }

      // Get all admin users
      const { data: adminUsers, error: adminError } = await this.supabase
        .from('users')
        .select('id, name, email')
        .eq('is_admin', true);

      if (adminError || !adminUsers?.length) {
        console.log('No admin users found for notification');
        return [];
      }

      const notificationIds: string[] = [];

      // Send notification to each admin
      for (const admin of adminUsers) {
        // Check admin notification preferences
        const { data: preferences } = await this.supabase
          .from('user_notification_preferences')
          .select('email_admin_notifications')
          .eq('user_id', admin.id)
          .single();

        if (!preferences?.email_admin_notifications) {
          console.log(`Admin ${admin.id} has disabled admin notifications`);
          continue;
        }

        // Prepare template variables
        const variables: TemplateVariables = {
          user_name: admin.name || 'Admin',
          problem_title: problem.title,
          proposer_name: problem.proposer.name || 'Utente',
          proposer_email: problem.proposer.email,
          category_name: problem.category.name,
          current_votes: problem.vote_count,
          created_at: new Date(problem.created_at).toLocaleDateString('it-IT'),
          problem_description: problem.description,
          problem_url: `${process.env.NEXT_PUBLIC_APP_URL}/problems/${problem.id}`,
          admin_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin`
        };

        // Render email from template
        const { subject, contentText, contentHtml } = await this.renderTemplate(
          'admin_alert_100_votes',
          variables
        );

        // Queue the notification
        const notificationId = await this.queueNotification({
          userId: admin.id,
          type: 'admin_alert',
          subject,
          contentText,
          contentHtml,
          problemId,
          relatedData: { vote_count: problem.vote_count, alert_type: '100_votes' }
        });

        notificationIds.push(notificationId);
      }

      // Send all queued notifications
      await this.sendPendingNotifications();

      return notificationIds;
    } catch (error) {
      console.error('Error sending admin alert:', error);
      throw error;
    }
  }

  /**
   * Render email template with variables
   */
  private async renderTemplate(
    templateName: string,
    variables: TemplateVariables
  ): Promise<{ subject: string; contentText: string; contentHtml?: string }> {
    this.initialize();
    
    if (!this.supabase) {
      throw new Error('NotificationService not properly initialized');
    }
    
    try {
      const { data: template, error } = await this.supabase
        .from('email_templates')
        .select('subject_template, content_text_template, content_html_template')
        .eq('name', templateName)
        .eq('is_active', true)
        .single();

      if (error || !template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      // Simple template rendering (replace {{variable}} with values)
      const renderText = (text: string): string => {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return variables[key]?.toString() || match;
        });
      };

      return {
        subject: renderText(template.subject_template),
        contentText: renderText(template.content_text_template),
        contentHtml: template.content_html_template 
          ? renderText(template.content_html_template)
          : undefined
      };
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  /**
   * Send all pending notifications
   */
  async sendPendingNotifications(): Promise<void> {
    this.initialize();
    
    if (!this.supabase) {
      console.log('NotificationService not properly initialized, skipping');
      return;
    }
    
    if (!this.resend) {
      console.log('Resend not configured, skipping email sending');
      return;
    }

    try {
      // Get pending notifications
      const { data: notifications, error } = await this.supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          type,
          subject,
          content_text,
          content_html,
          retry_count,
          max_retries,
          users!user_id(email, name)
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .lt('retry_count', 3)
        .limit(50);

      if (error || !notifications?.length) {
        return;
      }

      // Send each notification
      for (const notification of notifications) {
        try {
          const userEmail = notification.users?.email;
          if (!userEmail) {
            await this.markNotificationFailed(notification.id, 'User email not found');
            continue;
          }

          // Send email via Resend
          const { data: emailData, error: emailError } = await this.resend.emails.send({
            from: 'WikiGaiaLab <notifications@wikigaialab.com>',
            to: [userEmail],
            subject: notification.subject,
            text: notification.content_text,
            html: notification.content_html || undefined,
          });

          if (emailError) {
            await this.markNotificationFailed(notification.id, emailError.message);
            continue;
          }

          // Mark as sent
          await this.supabase
            .from('notifications')
            .update({
              status: 'sent',
              email_message_id: emailData?.id,
              email_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id);

          // Update vote milestone if applicable
          if (notification.type === 'vote_milestone') {
            await this.supabase
              .from('vote_milestones')
              .update({ notification_sent: true })
              .eq('notification_id', notification.id);
          }

          console.log(`Notification ${notification.id} sent successfully to ${userEmail}`);

        } catch (error) {
          await this.markNotificationFailed(notification.id, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  /**
   * Mark notification as failed and handle retries
   */
  private async markNotificationFailed(notificationId: string, errorMessage: string): Promise<void> {
    this.initialize();
    
    if (!this.supabase) {
      console.log('NotificationService not properly initialized, cannot mark notification as failed');
      return;
    }
    
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .select('retry_count, max_retries')
        .eq('id', notificationId)
        .single();

      if (error || !notification) return;

      const newRetryCount = notification.retry_count + 1;
      const shouldRetry = newRetryCount < notification.max_retries;

      await this.supabase
        .from('notifications')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          error_message: errorMessage,
          retry_count: newRetryCount,
          next_retry_at: shouldRetry 
            ? new Date(Date.now() + Math.pow(2, newRetryCount) * 60000).toISOString() // Exponential backoff
            : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      console.log(`Notification ${notificationId} failed: ${errorMessage}. ${shouldRetry ? 'Will retry.' : 'Max retries reached.'}`);
    } catch (error) {
      console.error('Error marking notification as failed:', error);
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();