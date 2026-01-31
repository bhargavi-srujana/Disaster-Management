# Testing the Resilience Improvements

## Prerequisites

1. Backend running on port 8080
2. Frontend running on port 3000
3. Open browser DevTools (F12) to see console logs

---

## Test 1: Normal Success Flow (Should Still Work)

**Goal:** Verify nothing broke for the happy path

1. Open app in browser
2. Allow geolocation when prompted
3. **Expected:**
   - Console: "Geolocation success"
   - Console: "City found from BigDataCloud: [Your City]"
   - Console: "Setting location to: [Your City]"
   - Backend logs: "Fetching live weather from API"
   - Backend logs: "Live API data retrieved"
   - UI: Full dashboard with weather data

**Success criteria:** Everything works as before

---

## Test 2: Simulate API Timeout (Partial Response)

**Goal:** Verify graceful degradation works

### Setup:
Edit `backend/main.py` temporarily:

```python
def fetch_weather_with_retry(url: str, max_retries: int = 2, timeout: int = 30):
    # ADD THIS LINE AT THE TOP TO SIMULATE TIMEOUT
    time.sleep(35)  # Force all attempts to timeout
    
    last_error = None
    for attempt in range(max_retries + 1):
        # ... rest of function
```

### Test Steps:
1. Restart backend server
2. Open app in browser
3. Allow geolocation

### Expected Behavior:

**Backend logs:**
```
Fetching live weather from API for vizianagaram
Request timed out after 30s (attempt 1/3)
Retry attempt 1 after 1s delay...
Request timed out after 30s (attempt 2/3)
Retry attempt 2 after 2s delay...
Request timed out after 30s (attempt 3/3)
API Fetch Failed for vizianagaram: ...
Location vizianagaram found (lat: 18.12, lon: 83.41) but no weather data available
```

**Frontend Console:**
```
Location found but weather unavailable: {
  status: "partial",
  location_found: true,
  coordinates: {lat: 18.12, lon: 83.41},
  message: "Location detected successfully but weather data..."
}
```

**UI Shows:**
- ✅ Location bar: "Vizianagaram"
- ⏳ Message: "Weather Data Temporarily Unavailable"
- 🔄 Retry button
- Registration button still available
- Change location still available

**Success criteria:** Location displayed even though weather failed

### Cleanup:
Remove the `time.sleep(35)` line and restart backend

---

## Test 3: Retry Button Works

**Goal:** Verify retry functionality

**Prerequisites:** Test 2 setup (timeout simulation active)

1. After seeing "Weather Unavailable" message
2. Remove the `time.sleep(35)` line from backend
3. Restart backend (now it will work)
4. Click "🔄 Retry Now" button in the UI

### Expected:
- Loading spinner appears
- Backend fetches weather successfully
- UI transitions from partial to full dashboard
- Weather data now displayed

**Success criteria:** Retry successfully loads weather data

---

## Test 4: Manual Location Search with Timeout

**Goal:** Verify manual search handles failures gracefully

**Prerequisites:** Test 2 setup (timeout simulation active)

1. On welcome screen, search for "Delhi"
2. Wait for timeout

### Expected:
- Location bar shows "Delhi"
- Weather unavailable message
- Retry button available
- No error thrown

**Success criteria:** Same graceful handling as auto-detection

---

## Test 5: Invalid Location (Should Fail Properly)

**Goal:** Verify location not found still works correctly

**Prerequisites:** No timeout simulation (normal backend)

1. Search for "ZZZInvalidCityXYZ123"

### Expected:
- Backend: "Location 'ZZZInvalidCityXYZ123' not found"
- Frontend: Shows error message
- UI: Either stays on current location or shows welcome screen

**Success criteria:** Clear error message, no crash

---

## Test 6: Database Unavailable

**Goal:** Verify system works without Firestore

### Setup:
Edit `backend/main.py`:

```python
def init_firestore():
    # COMMENT OUT THE NORMAL INITIALIZATION
    return None  # Simulate DB unavailable
```

### Test Steps:
1. Restart backend
2. Search for a city

### Expected:
- Backend logs: "Firestore 'weather' database not available"
- Weather still fetched from API
- No caching (each request hits API)
- UI works normally or shows partial response

**Success criteria:** App functional without database

---

## Test 7: Edge Case - Very Slow API (Not Timeout)

**Goal:** Verify retries work for slow responses

### Setup:
```python
def fetch_weather_with_retry(url: str, max_retries: int = 2, timeout: int = 30):
    # Simulate slow but successful response
    time.sleep(25)  # Within 30s timeout
    # ... rest of function continues normally
```

### Expected:
- Request succeeds on first attempt (25s < 30s timeout)
- No retries needed
- Weather data displayed after ~25s delay

**Success criteria:** Slow responses still work within timeout

---

## Test 8: Check Retry Exponential Backoff

**Goal:** Verify retry timing is correct

**Prerequisites:** Test 2 setup (timeout simulation)

### Monitor backend logs for:
```
Request timed out after 30s (attempt 1/3)
Retry attempt 1 after 1s delay...       ← Wait 1 second
Request timed out after 30s (attempt 2/3)
Retry attempt 2 after 2s delay...       ← Wait 2 seconds
Request timed out after 30s (attempt 3/3)
```

**Success criteria:** 
- Delay between attempts: 1s, then 2s
- Total attempts: 3 (initial + 2 retries)
- Total time: ~93 seconds (30s + 1s + 30s + 2s + 30s)

---

## Test 9: Registration Still Works (Partial State)

**Goal:** Verify all features work in partial state

**Prerequisites:** Test 2 setup (weather unavailable but location detected)

1. Get to partial state (location shown, weather unavailable)
2. Click registration button
3. Fill form and submit

### Expected:
- Registration modal opens
- Form submission works
- Backend creates user record
- Confirmation message shown

**Success criteria:** Registration works regardless of weather availability

---

## Test 10: Location Change (From Partial State)

**Goal:** Verify location search works from partial state

**Prerequisites:** Test 2 setup

1. Get to partial state with City A
2. Search for City B (with backend now working)

### Expected:
- Clears partial state
- Shows loading
- Fetches City B weather
- Transitions to full dashboard for City B

**Success criteria:** Can navigate away from partial state

---

## Performance Benchmarks

### Success Case (API Working)
- Time to first byte: ~1-3s
- Total load time: ~2-4s
- Same as before ✅

### Failure Case (API Timeout)
- **Before:** 10s wait → 503 error → confusing UI
- **After:** 30s + 1s + 30s + 2s ≈ **93s** → partial UI → clear message

**Trade-off:** Longer wait on failure, but much better UX

### Failure Case (API Network Error)
- **Before:** Instant 503
- **After:** Instant partial response (no retry for non-timeout errors)

---

## Rollback Decision Criteria

Roll back if:
- [ ] Success case takes >10s consistently
- [ ] Partial responses show when they shouldn't
- [ ] Retry logic causes infinite loops
- [ ] Database writes fail due to timeout changes
- [ ] Users report confusion with new UI state

Keep if:
- [x] Success case unchanged
- [x] Failures handled gracefully
- [x] Users understand what's happening
- [x] Retry button works as expected

---

## Production Monitoring

After deployment, monitor:

1. **Backend Metrics:**
   - `retry_success_rate` - How often does retry succeed?
   - `partial_response_count` - How many partial responses?
   - `avg_weather_fetch_time` - Is 30s too much?

2. **Frontend Metrics:**
   - `retry_button_clicks` - Do users retry?
   - `time_in_partial_state` - How long stuck in unavailable?
   - `partial_to_success_rate` - Does retry work?

3. **User Feedback:**
   - Do users understand the unavailable message?
   - Is 93s too long to wait?
   - Should we add a "Skip" button?

---

## Common Issues & Solutions

### Issue: "Location bar doesn't show up"
**Check:** `selectedLocation` state should NOT be cleared in `fetchWeatherData`

### Issue: "Retry button doesn't work"
**Check:** `fetchWeatherData(selectedLocation)` is called with correct location

### Issue: "Still seeing 503 errors"
**Check:** Backend returns partial response structure, not raising HTTPException

### Issue: "UI shows both full and partial states"
**Check:** Condition `!weatherUnavailable` in full dashboard render

### Issue: "Retries happen on non-timeout errors"
**Check:** `break` statement in non-timeout exception handler

---

## Success Metrics

### Must Have:
- ✅ Location detection works with or without weather
- ✅ No 503 errors when location is found
- ✅ Retry button functional
- ✅ Clear error messages

### Nice to Have:
- 📊 <5% of requests need retry
- 📊 >80% of retries succeed
- 📊 <1% of users stuck in partial state >5min
- 📊 Average response time unchanged for successes

---

**Ready to test?** Start with Test 1, then Test 2, then Test 3. Those three cover 80% of the improvements.
