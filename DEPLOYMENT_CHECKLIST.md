# CDN Integration Deployment Checklist

Use this checklist to ensure proper deployment of the CDN integration.

## Pre-Deployment

### Development Environment

- [ ] Install/update dependencies (if any were added)
- [ ] Create `.env.local` file with `CDN_API_KEY`
- [ ] Verify `NEXT_PUBLIC_CDN_BASE_URL` is set correctly
- [ ] Restart development server after env changes
- [ ] Test file upload in Expenses page
- [ ] Test file upload in Sales page
- [ ] Test file deletion
- [ ] Verify files are stored on CDN (check URL format)
- [ ] Run CDN integration tests (`runCDNTests()` in browser console)

### Code Review

- [ ] Review `lib/cdn-client.ts` implementation
- [ ] Review `app/api/upload/route.ts` changes
- [ ] Review form component updates
- [ ] Verify error handling is comprehensive
- [ ] Check for hardcoded values or secrets
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Review TypeScript types are correct

### Testing

- [ ] Test with different file types (PDF, images, etc.)
- [ ] Test with large files (near 50MB limit)
- [ ] Test with invalid files (too large)
- [ ] Test network error scenarios
- [ ] Test API key validation
- [ ] Test concurrent uploads
- [ ] Test upload cancellation
- [ ] Verify existing functionality still works

### Database

- [ ] Verify `attachment_urls` column exists in `expenses` table
- [ ] Verify `attachment_urls` column exists in `sales` table
- [ ] Check column type is `TEXT[]` (array of strings)
- [ ] Test querying records with attachments
- [ ] Backup database before migration (if applicable)

## Deployment

### Environment Variables

- [ ] Add `CDN_API_KEY` to production environment
- [ ] Set `NEXT_PUBLIC_CDN_BASE_URL` in production (if different)
- [ ] Verify environment variables are loaded correctly
- [ ] Test that API key works in production
- [ ] Document where env vars are stored

### Build Process

- [ ] Run `npm run build` (or `pnpm build`)
- [ ] Fix any TypeScript errors
- [ ] Fix any linting errors
- [ ] Verify build completes successfully
- [ ] Check build warnings

### Deployment Steps

- [ ] Commit all changes to version control
- [ ] Create a feature branch (if using git flow)
- [ ] Push to remote repository
- [ ] Create pull request for review
- [ ] Get code review approval
- [ ] Merge to main/production branch
- [ ] Deploy to staging environment (if available)
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Verify deployment successful

### Post-Deployment Verification

- [ ] Test file upload in production
- [ ] Test file download in production
- [ ] Test file deletion in production
- [ ] Verify URLs are correct (https://cdn.tripbooking.ai/...)
- [ ] Check browser console for errors
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Verify performance is acceptable
- [ ] Check CDN usage/quotas

## Migration (If Applicable)

### Existing Files Migration

- [ ] Backup `public/attachments/` directory
- [ ] Count total files to migrate
- [ ] Create migration script (see `CDN_SETUP.md`)
- [ ] Test migration script on sample files
- [ ] Run full migration
- [ ] Verify all files uploaded successfully
- [ ] Update database records with new URLs
- [ ] Verify updated records are accessible
- [ ] Keep backup until migration confirmed successful
- [ ] Clean up old local files after verification

### Database Migration

- [ ] Create database backup
- [ ] Write migration script to update URLs
- [ ] Test migration on development database
- [ ] Run migration on production database
- [ ] Verify all URLs updated correctly
- [ ] Test random sample of migrated records
- [ ] Document migration date and details

## Rollback Plan

### If Issues Occur

- [ ] Document the rollback procedure
- [ ] Keep old code version accessible
- [ ] Maintain backup of old files
- [ ] Have database rollback script ready
- [ ] Test rollback procedure in staging
- [ ] Document rollback decision criteria

### Rollback Steps

1. [ ] Revert code to previous version
2. [ ] Restore environment variables (if changed)
3. [ ] Redeploy previous version
4. [ ] Restore database (if needed)
5. [ ] Restore local files (if needed)
6. [ ] Verify application works
7. [ ] Notify team of rollback

## Monitoring

### Set Up Monitoring

- [ ] Monitor CDN API errors
- [ ] Track upload success/failure rates
- [ ] Monitor file storage usage
- [ ] Set up alerts for failures
- [ ] Track API rate limits
- [ ] Monitor response times

### Metrics to Track

- [ ] Number of files uploaded per day
- [ ] Upload failure rate
- [ ] Average file size
- [ ] Total storage used
- [ ] API key usage
- [ ] CDN bandwidth usage

## Documentation

### Update Documentation

- [ ] Update README with CDN information
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create user guide for file uploads
- [ ] Document troubleshooting steps
- [ ] Update API documentation
- [ ] Create runbook for common issues

### Knowledge Sharing

- [ ] Train team on new file upload process
- [ ] Share CDN API documentation
- [ ] Document known issues/limitations
- [ ] Create FAQ for common questions
- [ ] Schedule knowledge transfer session

## Security

### Security Checklist

- [ ] API key is stored securely
- [ ] API key is not in version control
- [ ] API key has appropriate permissions
- [ ] Private files require authentication
- [ ] File type validation is in place
- [ ] File size limits are enforced
- [ ] HTTPS is used for all CDN requests
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting is considered

### Security Review

- [ ] Review access controls
- [ ] Test unauthorized access attempts
- [ ] Verify API key rotation process
- [ ] Review audit logs (if available)
- [ ] Document security incidents (if any)

## Performance

### Performance Checklist

- [ ] Test upload speed
- [ ] Test download speed
- [ ] Verify concurrent uploads work
- [ ] Check for memory leaks
- [ ] Monitor server resource usage
- [ ] Test with slow network connections
- [ ] Verify progress indicators work

### Optimization

- [ ] Consider file compression
- [ ] Implement lazy loading for attachments
- [ ] Cache CDN URLs appropriately
- [ ] Use CDN caching headers
- [ ] Optimize file preview loading

## Cleanup

### Post-Migration Cleanup

- [ ] Remove old local file storage code (if applicable)
- [ ] Clean up unused dependencies
- [ ] Remove old migration scripts (after verification)
- [ ] Clean up test files
- [ ] Remove debug logging
- [ ] Update comments in code

### Final Steps

- [ ] Close related tickets/issues
- [ ] Update project status
- [ ] Notify stakeholders of completion
- [ ] Schedule post-deployment review
- [ ] Document lessons learned
- [ ] Archive old backups (after retention period)

---

## Sign-off

- **Developer**: _________________ Date: _______
- **Code Reviewer**: _________________ Date: _______
- **QA**: _________________ Date: _______
- **DevOps**: _________________ Date: _______
- **Product Owner**: _________________ Date: _______

---

## Notes

Use this section to document any issues, deviations, or special considerations:

```
[Add notes here]
```

---

**Last Updated**: 2025-01-07
**Version**: 1.0.0
