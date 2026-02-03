# PlaySense Supabase Configuration

## Database Setup

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase project created at https://supabase.com

### Local Development

1. **Link to your Supabase project:**
```bash
supabase link --project-ref your-project-ref
```

2. **Apply migrations:**
```bash
supabase db push
```

### Production Deployment

Apply migrations via Supabase Dashboard or CLI:

```bash
supabase db push --linked
```

## Database Schema

### Tables

- **users**: Parent accounts (extends auth.users)
- **children**: Child profiles
- **devices**: Desktop companion devices
- **games**: Known games catalog
- **gaming_sessions**: Gaming activity records
- **email_preferences**: Email notification settings
- **notifications**: In-app notifications
- **tamper_events**: Security event logs
- **parent_notes**: Private parent reflections

### Row Level Security

All tables have RLS enabled with policies that ensure:
- Parents can only access their own children's data
- Desktop app can sync session data
- No cross-parent data access

## Edge Functions

Edge functions are located in `supabase/functions/`:

- `sync-sessions`: Ingest gaming sessions from desktop app
- `calculate-health-score`: Compute health metrics
- `send-email-digest`: Send daily/weekly emails
- `generate-pdf-report`: Create PDF reports

## API Keys

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key (web app)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (desktop app, edge functions)

