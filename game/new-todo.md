
Things that needs work for production
    - Setup custom SMTP server for email sending
    - Enable Email confirmations.
    - We are using legacy service role keys: https://supabase.com/dashboard/project/pkftjntcnjevfchkcywi/settings/api-keys , should transition to API secret keys 

Check if Data API needs disabling? https://supabase.com/dashboard/project/pkftjntcnjevfchkcywi/settings/api
- Consider hardening data api
- Connection string needs PGBouncer for serverless environments?

Finish up Supabase Auth: https://supabase.com/docs/guides/auth/server-side/sveltekit

Extract product-marketing-requirements.md out from PRD.md 


Think more about content versioning for stale data management.
