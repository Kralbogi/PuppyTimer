# 🎯 Week 1: Critical Issues Fixed - Agent Task Assignments

**Period:** March 26 - April 1, 2026  
**Goal:** Core stability, iOS validation, critical bug fixes

---

## 📱 @ios Agent - iOS Build & Stability

### High Priority

#### Task 1: iOS 15+ Compatibility Audit
**Severity:** 🔴 CRITICAL  
**Time Est:** 4 hours

```
Requirements:
- Verify PuppyTimerApp.swift works on iOS 15+
- Check all SwiftUI APIs compatibility
- Test on simulator: iPhone 13, 14, 15 sizes
- No deprecated API usage
- Handle older iOS gracefully

Deliverable:
- Compatibility report
- Any API changes needed
```

#### Task 2: SwiftUI Layout Fixes
**Severity:** 🔴 CRITICAL  
**Time Est:** 6 hours

```
Areas to audit:
- PuppyTimer/Views/ - all page layouts
- Check safe area handling
- Test on narrow/wide screens
- Fix any clipping or overflow
- Verify navigation stack flows

Common issues:
- List row spacing
- ScrollView nested layouts
- Navigation stacks popping
- Keyboard overlap handling
```

#### Task 3: Image Loading & Caching
**Severity:** 🟠 HIGH  
**Time Est:** 4 hours

```
Requirements:
- Avatar image loading timeouts
- Thumbnail caching strategy
- Network failure fallbacks
- Placeholder images
- Memory optimization for galleries

Services to review:
- ClaudeAPIServisi.swift
- FirestoreServisi.swift
- Avatar caching layer
```

#### Task 4: Error Handling UI
**Severity:** 🟠 HIGH  
**Time Est:** 3 hours

```
Implement consistent:
- Error alert dialogs
- Network error messages
- Timeout messages
- Retry buttons
- Loading states on buttons/views
```

#### Task 5: Notification Permissions Flow
**Severity:** 🟡 MEDIUM  
**Time Est:** 2 hours

```
Requirements:
- BildirimYoneticisi.swift review
- Ask permission at right time
- Handle denied permissions
- Show UI for disabled notifications
- iOS 15 vs 16+ differences
```

#### Task 6: Memory & Performance
**Severity:** 🟠 HIGH  
**Time Est:** 5 hours

```
Testing:
- Long session memory usage (30 min+)
- Rapid navigation back/forth
- Large dog list (100+ items)
- Background/foreground transitions
- Use Instruments for profiling

Fix:
- View state cleanup
- Image memory release
- Cache management
- DeallocationWatch for leaks
```

---

## ⚙️ @backend Agent - API & Security

### High Priority

#### Task 1: Firebase Security Rules Audit
**Severity:** 🔴 CRITICAL  
**Time Est:** 4 hours

```
Review functions/src/index.ts:
- All Firestore rules - least privilege
- Authentication checks on all endpoints
- Role-based access control
- Test permission denials
- Rate limiting enforcement

Collections affected:
- kopekler
- tuvalet_kaydi
- saglik_notlari
- konusma (chat)
- topluluk_kopekler
```

#### Task 2: Input Validation
**Severity:** 🔴 CRITICAL  
**Time Est:** 3 hours

```
Validate in all Functions:
- Text length limits
- Image file sizes
- Email format
- Phone format (if used)
- Prevent XSS/injection
- Sanitize Chat messages

Functions to check:
- analyzeAI
- deleteData
- Payment processing
```

#### Task 3: Error Response Standardization
**Severity:** 🟠 HIGH  
**Time Est:** 3 hours

```
Make consistent:
- Error HTTP codes (400, 403, 500)
- Error message format
- Error logging
- Client error hints
- No stack traces in production

Implement:
- Error middleware
- Logging service
- Error reporting
```

#### Task 4: Rate Limiting
**Severity:** 🟠 HIGH  
**Time Est:** 3 hours

```
Verify/Implement:
- Chat: 5 messages per 5 minutes
- Image uploads: Limits per user
- API endpoints: General limits
- Premium users: Higher limits
- Ban system for abuse

Tools:
- Firebase Functions rate limiting
- Redis cache (if available)
- Firestore document limits
```

#### Task 5: Offline/Online Handling
**Severity:** 🟡 MEDIUM  
**Time Est:** 2 hours

```
Test scenarios:
- Network offline → online transition
- Cached data expiry
- Queue pending requests
- Sync conflicts
- Notification delays

Functions affected:
- Real-time listeners
- Batch operations
```

---

## 🗄️ @database Agent - Firestore Optimization

### High Priority

#### Task 1: Collection Index Audit
**Severity:** 🔴 CRITICAL  
**Time Est:** 2 hours

```
Check firestore.indexes.json:
- All necessary indexes exist
- No duplicate indexes
- Composite indexes for filters
- Sorting + filtering queries
- Test query performance

Collections:
- tuvalet_kaydi (date + userId)
- saglik_notlari (type + date)
- konusma (threadId + timestamp)
- topluluk_kopekler (location + date)
```

#### Task 2: Security Rules Completeness
**Severity:** 🔴 CRITICAL  
**Time Est:** 3 hours

```
Audit firestore.rules:
- User data isolation
- Public collection access
- Premium feature gating
- Moderation capabilities
- Ban system enforcement
- Rate limiting (document rules)

Test:
- Unauthorized access attempts
- Role elevation attempts
- Data deletion attempts
- Cross-user access
```

#### Task 3: Query Optimization
**Severity:** 🟠 HIGH  
**Time Est:** 3 hours

```
Review slow queries:
- Frontend hooks (useTuvaletViewModel, etc)
- Backend Functions (index.ts)
- Community map queries
- Chat message pagination

Optimize:
- Pagination (first 50, then load more)
- Field selection (don't fetch all)
- Compound indexes where needed
```

#### Task 4: Write Cost Optimization
**Severity:** 🟡 MEDIUM  
**Time Est:** 2 hours

```
Reduce unnecessary writes:
- Batch writes where possible
- Avoid document overwrites
- Metadata only in Firestore (images in IndexedDB)
- Cache validation before updates

Check:
- Real-time listener triggers
- Update batching
- Metadata sync strategy
```

---

## 🎨 @frontend Agent - Web Stability & Cache Fix

### High Priority

#### Task 1: QuotaExceededError Fix
**Severity:** 🔴 CRITICAL  
**Time Est:** 4 hours

```
Issue:
- Browser IndexedDB quota exceeded after updates
- Users forced to clear cache

Solution:
- Implement smart cache invalidation
- Version your data schema
- Migration logic for schema changes
- Show "clear cache" UI button
- Auto-clear old data (>30 days)

Files:
- PuppyTimerWeb/src/db/database.ts
- Service worker (if applicable)
- Local storage cleanup

Test:
- Install v1, add 100 dogs, update to v2
- Should not hit quota error
```

#### Task 2: Premium Feature Detection
**Severity:** 🟠 HIGH  
**Time Est:** 3 hours

```
Issue:
- Premium features require hard refresh
- Feature state not updating properly

Solution:
- Listen to premium status changes
- Firestore listener for subscription
- Real-time UI update
- No hard refresh needed

Files:
- usePremiumViewModel (create if needed)
- PremiumServisi.swift integration
- Context for premium state
```

#### Task 3: Loading States & Indicators
**Severity:** 🟠 HIGH  
**Time Est:** 3 hours

```
Ensure consistent:
- All async operations show loading
- Skeleton screens for lists
- Spinner placement
- Disable buttons during loading
- Loading messages

Pages to check:
- ToiletPage.tsx
- MapPage.tsx
- ContentView (all tabs)
```

#### Task 4: Network Error Handling
**Severity:** 🟠 HIGH  
**Time Est:** 3 hours

```
Implement on all API calls:
- Network timeout detection
- Offline mode UI
- Retry buttons
- Error messages to users
- Toast notifications

Services:
- claudeApi.ts
- mesajService.ts
- All Firebase calls

Test:
- Slow network (2G simulate)
- Complete offline
- Timeout scenarios
```

#### Task 5: Form Validation
**Severity:** 🟡 MEDIUM  
**Time Est:** 2 hours

```
Audit all forms:
- KopekEkleView.tsx
- BuyukTuvaletEkleView.tsx
- Any input forms

Verify:
- Required field validation
- Format validation
- Clear error messages
- Focus on error field
- Submit button disabled until valid
```

---

## 📊 Week 1 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Critical Bugs Fixed | 10+ | ⏳ |
| iOS Crash Rate | < 0.1% | ⏳ |
| Build Success Rate | 100% | ⏳ |
| TestFlight Build Ready | ✅ | ⏳ |
| All Error Handling | ✅ | ⏳ |

---

## 🚨 Blockers & Escalation

If any agent is blocked:

1. **Missing Firebase config?** → Check .env file
2. **Can't test iOS locally?** → Use simulator
3. **Firestore rules permission denied?** → Audit rules first
4. **Database quota issues?** → Contact Firebase admins

---

## 📝 Daily Check-in Questions

**Each agent should answer:**
1. What blockers do you have?
2. What will be done by end of day?
3. Any crashes in TestFlight?
4. Any critical issues discovered?

---

**Assigned:** March 26, 2026  
**Due:** April 1, 2026 (End of Week 1)  
**Review:** March 30, 2026 (Mid-week)
