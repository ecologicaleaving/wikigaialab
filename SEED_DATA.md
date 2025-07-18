# WikiGaiaLab Seed Data Documentation

This document describes the seed data available for WikiGaiaLab development and testing.

## Quick Setup

To set up the complete development environment with seed data:

```bash
# Run the automated setup script
npm run setup:dev

# Or manual setup:
npm run db:start    # Start local Supabase
npm run db:reset    # Apply migrations and seed data
npm run db:generate # Generate TypeScript types
npm run dev         # Start development server
```

## Available Seed Data

### 👥 Demo Users

| Email | Name | Role | Subscription |
|-------|------|------|--------------|
| admin@wikigaialab.com | Admin User | Admin | Active |
| user1@example.com | Alice Johnson | User | Free |
| user2@example.com | Bob Smith | User | Active |
| user3@example.com | Carol Davis | User | Free |
| user4@example.com | David Wilson | User | Trialing |

### 📂 Categories

The seed data includes 10 categories:

1. **Technology** - Problems related to technology, software, and digital solutions
2. **Environment** - Environmental issues, sustainability, and green initiatives
3. **Health** - Healthcare, wellness, and medical challenges
4. **Education** - Educational system improvements and learning challenges
5. **Transportation** - Transportation, logistics, and mobility solutions
6. **Social Issues** - Community problems, social inequality, and civic engagement
7. **Economics** - Financial systems, economic inequality, and market issues
8. **Communication** - Communication barriers, information access, and media
9. **Safety** - Public safety, security, and emergency preparedness
10. **Other** - Miscellaneous problems that don't fit other categories

### 🎯 Sample Problems

The seed data includes 5 sample problems:

1. **Better Password Management for Everyone** (Technology)
   - Status: Proposed
   - Proposer: Alice Johnson
   - Description: Simple, free password solution for all devices

2. **Reduce Food Waste in Restaurants** (Environment)
   - Status: In Development
   - Proposer: Bob Smith
   - Description: Connect restaurants with food banks and individuals

3. **Mental Health Support for Remote Workers** (Health)
   - Status: Proposed
   - Proposer: Carol Davis
   - Description: Accessible mental health resources for remote workers

4. **Free Coding Education for Underserved Communities** (Education)
   - Status: Proposed
   - Proposer: Alice Johnson
   - Description: Free coding bootcamps in underserved communities

5. **Digital Privacy Protection Made Simple** (Technology)
   - Status: Completed
   - Proposer: Bob Smith
   - Description: User-friendly privacy tools and education

### 📱 Sample App

The seed data includes one completed app:

- **PrivacyGuard** - Simple digital privacy protection
  - Connected to the "Digital Privacy Protection Made Simple" problem
  - Access model: Freemium
  - Version: 1.0.0
  - Base features: Basic privacy scanner, Cookie blocker, Simple VPN
  - Premium features: Advanced threat detection, Family protection, Business features

### 🗳️ Sample Votes

The seed data includes realistic voting patterns:
- Users vote on problems (excluding their own)
- Different users have different voting behaviors
- Vote counts are automatically updated based on actual votes

## Database Schema

The seed data is applied through migration files:

- `packages/database/src/migrations/004_seed_data.sql` - Main seed data
- `packages/database/src/migrations/006_enhanced_seed_data.sql` - Additional seed data

## Development Tips

### Testing Different User Roles

1. **Admin User**: Use `admin@wikigaialab.com` to test admin features
2. **Regular Users**: Use other email addresses to test user features
3. **Premium Users**: Bob Smith and David Wilson have premium access

### Resetting Seed Data

```bash
# Reset database and reapply all migrations with seed data
npm run db:reset

# Check current database status
npm run db:status

# Generate fresh TypeScript types
npm run db:generate
```

### Customizing Seed Data

To modify seed data:

1. Edit `packages/database/src/migrations/004_seed_data.sql`
2. Run `npm run db:reset` to apply changes
3. Or create a new migration file for additional seed data

### Troubleshooting

**Database connection issues:**
```bash
# Check if Supabase is running
supabase status

# Start Supabase if needed
supabase start
```

**Seed data not appearing:**
```bash
# Force reset database
supabase db reset

# Check migration status
supabase migration list
```

**Missing TypeScript types:**
```bash
npm run db:generate
```

## API Testing

With seed data, you can test these API endpoints:

- `GET /api/problems` - List problems
- `GET /api/categories` - List categories
- `POST /api/votes` - Vote on problems
- `GET /api/users/profile` - Get user profile
- `GET /api/apps` - List apps

## Security Notes

⚠️ **Important**: This seed data is for development only!

- Never use seed data in production
- All passwords and keys are for local development
- Admin credentials are publicly known
- Database is reset on every `db:reset` command

## Contributing

To add new seed data:

1. Create a new migration file: `supabase migration new add_more_seed_data`
2. Add your SQL INSERT statements
3. Test with `npm run db:reset`
4. Update this documentation

---

🎉 **Ready to start developing!** Run `npm run dev` and visit http://localhost:3000