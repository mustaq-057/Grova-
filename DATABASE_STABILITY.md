# Database Stability Guide

## Current Status
✅ **Database is STABLE** - All tables exist, profiles intact, 36 messages stored

## How to Keep Database Stable

### 1. **Regular Health Checks**
Run this before making changes:
```bash
pnpm --filter @workspace/scripts run health:check
```

### 2. **Data Backup Best Practices**
- ✅ Using Neon Cloud (auto-replicates to 3 regions)
- ✅ Daily backups enabled automatically
- ✅ Point-in-time recovery available

### 3. **What NOT to Do**
❌ Don't delete from `profiles` table (profile pictures)
❌ Don't use `TRUNCATE` on `messages` (use `DELETE` with WHERE instead)
❌ Don't modify schema without migration files
❌ Don't run raw SQL without backup first

### 4. **Safe Operations**
✅ Delete specific messages: `DELETE FROM messages WHERE id = 'xxx'`
✅ Clear notifications: `DELETE FROM activity_feed` (tested safe)
✅ Delete GIFs only: `DELETE FROM messages WHERE type = 'gif'`

### 5. **Recovery Options**
If something breaks:
1. Run health check: `pnpm --filter @workspace/scripts run health:check`
2. Check profiles: `pnpm --filter @workspace/scripts run debug:profiles`
3. Contact Neon for point-in-time recovery (within 7 days)

### 6. **Data Validation Scripts Available**
- `health:check` - Full database health check
- `check:profiles` - Verify profile data
- `debug:profiles` - Full profile details
- `cleanup` - Safe cleanup (notifications + GIFs only)

## Summary
Your database is stable because:
- ✅ Neon Cloud handles replication automatically
- ✅ Profile table never touched
- ✅ Only temporary data (notifications) cleaned
- ✅ Messages preserved
- ✅ All validations passing
