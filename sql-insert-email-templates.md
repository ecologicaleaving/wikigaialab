# Insert Email Templates

Execute this SQL in your Supabase Dashboard to insert the notification email templates:

```sql
-- Insert email templates for notifications
INSERT INTO email_templates (name, type, subject_template, content_text_template, content_html_template, variables) VALUES

-- Vote milestone template
('vote_milestone_50', 'vote_milestone', 
 'Il tuo problema "{{problem_title}}" ha raggiunto {{milestone}} voti! 🎉',
 'Ciao {{user_name}},

Ottime notizie! Il tuo problema "{{problem_title}}" ha appena raggiunto {{milestone}} voti sulla piattaforma WikiGaiaLab.

Questo è un traguardo importante che dimostra l''interesse della comunità per la tua proposta. La tua idea sta guadagnando trazione e potrebbe presto essere considerata per lo sviluppo.

Dettagli del problema:
- Titolo: {{problem_title}}
- Categoria: {{category_name}}
- Voti attuali: {{current_votes}}
- Data pubblicazione: {{created_at}}

Cosa succede ora?
- Continua a condividere il tuo problema per ottenere più visibilità
- A 100 voti, il team di WikiGaiaLab verrà notificato per una valutazione prioritaria
- Potresti essere contattato per discutere lo sviluppo della soluzione

Visualizza il tuo problema: {{problem_url}}

Grazie per contribuire alla comunità WikiGaiaLab!

Il Team WikiGaiaLab
https://wikigaialab.com',
 '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">🎉 Traguardo raggiunto!</h1>
  
  <p>Ciao <strong>{{user_name}}</strong>,</p>
  
  <p>Ottime notizie! Il tuo problema "<strong>{{problem_title}}</strong>" ha appena raggiunto <strong>{{milestone}} voti</strong> sulla piattaforma WikiGaiaLab.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1f2937;">Dettagli del problema:</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Titolo:</strong> {{problem_title}}</li>
      <li><strong>Categoria:</strong> {{category_name}}</li>
      <li><strong>Voti attuali:</strong> {{current_votes}}</li>
      <li><strong>Data pubblicazione:</strong> {{created_at}}</li>
    </ul>
  </div>
  
  <h3 style="color: #1f2937;">Cosa succede ora?</h3>
  <ul>
    <li>Continua a condividere il tuo problema per ottenere più visibilità</li>
    <li>A 100 voti, il team di WikiGaiaLab verrà notificato per una valutazione prioritaria</li>
    <li>Potresti essere contattato per discutere lo sviluppo della soluzione</li>
  </ul>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{problem_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visualizza il tuo problema</a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
    Grazie per contribuire alla comunità WikiGaiaLab!<br>
    Il Team WikiGaiaLab<br>
    <a href="https://wikigaialab.com">https://wikigaialab.com</a>
  </p>
</div>
</body></html>',
 '["user_name", "problem_title", "milestone", "category_name", "current_votes", "created_at", "problem_url"]'),

-- Admin alert template
('admin_alert_100_votes', 'admin_alert',
 '🚨 Problema prioritario: "{{problem_title}}" ha raggiunto 100 voti',
 'Alert Amministratore WikiGaiaLab,

Un problema ha raggiunto la soglia di priorità di 100 voti e richiede attenzione immediata.

Dettagli del problema:
- Titolo: {{problem_title}}
- Autore: {{proposer_name}} ({{proposer_email}})
- Categoria: {{category_name}}
- Voti totali: {{current_votes}}
- Data pubblicazione: {{created_at}}

Descrizione:
{{problem_description}}

Azioni raccomandate:
1. Rivedi il problema per qualità e fattibilità
2. Contatta l''autore per discussioni approfondite
3. Considera per roadmap di sviluppo prioritario
4. Aggiorna lo status del problema nel dashboard admin

Accedi al dashboard admin: {{admin_url}}
Visualizza problema: {{problem_url}}

Questo messaggio è stato generato automaticamente dal sistema di notifiche WikiGaiaLab.',
 '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px;">
    <h1 style="color: #dc2626; margin: 0;">🚨 Problema Prioritario</h1>
  </div>
  
  <p>Alert Amministratore WikiGaiaLab,</p>
  
  <p>Un problema ha raggiunto la <strong>soglia di priorità di 100 voti</strong> e richiede attenzione immediata.</p>
  
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1f2937;">Dettagli del problema:</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Titolo:</strong> {{problem_title}}</li>
      <li><strong>Autore:</strong> {{proposer_name}} ({{proposer_email}})</li>
      <li><strong>Categoria:</strong> {{category_name}}</li>
      <li><strong>Voti totali:</strong> {{current_votes}}</li>
      <li><strong>Data pubblicazione:</strong> {{created_at}}</li>
    </ul>
  </div>
  
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h4 style="margin-top: 0;">Descrizione:</h4>
    <p>{{problem_description}}</p>
  </div>
  
  <h3 style="color: #1f2937;">Azioni raccomandate:</h3>
  <ol>
    <li>Rivedi il problema per qualità e fattibilità</li>
    <li>Contatta l''autore per discussioni approfondite</li>
    <li>Considera per roadmap di sviluppo prioritario</li>
    <li>Aggiorna lo status del problema nel dashboard admin</li>
  </ol>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{admin_url}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Dashboard Admin</a>
    <a href="{{problem_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visualizza Problema</a>
  </div>
  
  <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
    Questo messaggio è stato generato automaticamente dal sistema di notifiche WikiGaiaLab.
  </p>
</div>
</body></html>',
 '["problem_title", "proposer_name", "proposer_email", "category_name", "current_votes", "created_at", "problem_description", "admin_url", "problem_url"]');
```

Execute this SQL in your Supabase Dashboard to add the email templates!