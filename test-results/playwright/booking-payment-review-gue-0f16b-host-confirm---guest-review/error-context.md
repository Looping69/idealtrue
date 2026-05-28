# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-payment-review.spec.ts >> guest request -> host approve -> guest proof -> host confirm -> guest review
- Location: tests\e2e\booking-payment-review.spec.ts:91:1

# Error details

```
Error: locator.click: Error: strict mode violation: locator('button[data-day="6/2/2026"]') resolved to 2 elements:
    1) <button type="button" tabindex="-1" data-slot="button" data-day="6/2/2026" aria-label="Tuesday, June 2nd, 2026" class="group/button shrink-0 items-center justify-center rounded-lg border-transparent bg-clip-padding text-sm whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-inv…>2</button> aka getByRole('grid', { name: 'May' }).getByLabel('Tuesday, June 2nd,')
    2) <button type="button" tabindex="-1" data-slot="button" data-day="6/2/2026" aria-label="Tuesday, June 2nd, 2026" class="group/button shrink-0 items-center justify-center rounded-lg border-transparent bg-clip-padding text-sm whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-inv…>2</button> aka getByRole('grid', { name: 'June' }).getByLabel('Tuesday, June 2nd,')

Call log:
  - waiting for locator('button[data-day="6/2/2026"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - region "Notifications alt+T"
  - navigation [ref=e4]:
    - generic [ref=e6]:
      - generic "Go to Ideal Stay home" [ref=e7] [cursor=pointer]:
        - img "Ideal Stay" [ref=e8]
      - generic [ref=e9]:
        - link "Explore" [ref=e10] [cursor=pointer]:
          - /url: /
        - link "Pricing" [ref=e11] [cursor=pointer]:
          - /url: /pricing
        - link "My Stays" [ref=e12] [cursor=pointer]:
          - /url: /guest
        - link "Rewards" [ref=e13] [cursor=pointer]:
          - /url: /referral
        - link "Account" [ref=e14] [cursor=pointer]:
          - /url: /account
      - generic [ref=e16]:
        - button "Open notifications" [ref=e18]:
          - img [ref=e19]
        - generic [ref=e22]:
          - paragraph [ref=e23]: Guest Example
          - paragraph [ref=e24]: guest
        - button "Open account" [ref=e25] [cursor=pointer]: G
        - button [ref=e26]:
          - img
  - main [ref=e27]:
    - generic [ref=e28]:
      - generic [ref=e29]:
        - generic [ref=e30]:
          - button "Grid" [ref=e31]
          - button "Map" [ref=e32]
        - generic [ref=e39]:
          - generic [ref=e41]:
            - button [ref=e42]:
              - img [ref=e43]
            - textbox "Describe the trip you want to plan..." [ref=e46]
            - button [ref=e47]:
              - img [ref=e48]
          - generic [ref=e52]:
            - button [ref=e53]:
              - img [ref=e54]
            - generic [ref=e57] [cursor=pointer]:
              - generic [ref=e58]: Where
              - textbox "Search destinations" [ref=e59]
            - generic [ref=e60] [cursor=pointer]:
              - generic [ref=e61]: Check in
              - generic [ref=e62]: Add dates
            - generic [ref=e63] [cursor=pointer]:
              - generic [ref=e64]: Check out
              - generic [ref=e65]: Add dates
            - generic [ref=e66] [cursor=pointer]:
              - generic [ref=e67]: Who
              - generic [ref=e68]:
                - button [ref=e69]:
                  - img [ref=e70]
                - generic [ref=e71]: "1"
                - button [ref=e72]:
                  - img [ref=e73]
            - button [ref=e75]:
              - img [ref=e76]
      - generic [ref=e81]:
        - button [ref=e82] [cursor=pointer]:
          - img [ref=e84]
        - button [ref=e87] [cursor=pointer]:
          - img [ref=e88]
        - button [ref=e92] [cursor=pointer]:
          - img [ref=e93]
        - button [ref=e96] [cursor=pointer]:
          - img [ref=e97]
        - button [ref=e100] [cursor=pointer]:
          - img [ref=e101]
        - button [ref=e103] [cursor=pointer]:
          - img [ref=e104]
        - button [ref=e109] [cursor=pointer]:
          - img [ref=e110]
        - button [ref=e112] [cursor=pointer]:
          - img [ref=e113]
        - button [ref=e117] [cursor=pointer]:
          - img [ref=e118]
      - generic [ref=e121]:
        - heading "Featured Stays" [level=2] [ref=e125]
        - generic [ref=e128]:
          - generic [ref=e133] [cursor=pointer]:
            - generic [ref=e134]:
              - img "Sea Point Stay" [ref=e135]
              - button [ref=e137]:
                - img [ref=e138]
              - generic [ref=e141]: Save 10%
            - generic [ref=e143]:
              - heading "Sea Point Stay" [level=3] [ref=e144]
              - paragraph [ref=e145]: Cape Town
              - generic [ref=e147]:
                - generic [ref=e148]: R1,800
                - generic [ref=e149]: night
          - generic [ref=e150]:
            - button "Prev" [ref=e151]
            - button "Next" [ref=e152]
      - generic [ref=e153]:
        - generic [ref=e154]:
          - heading "Recently Added" [level=2] [ref=e155]
          - paragraph [ref=e156]: Check out the newest properties on Ideal Stay.
        - generic [ref=e158] [cursor=pointer]:
          - generic [ref=e159]:
            - img "Sea Point Stay" [ref=e160]
            - button [ref=e162]:
              - img [ref=e163]
            - generic [ref=e166]: Save 10%
          - generic [ref=e168]:
            - heading "Sea Point Stay" [level=3] [ref=e169]
            - paragraph [ref=e170]: Cape Town
            - generic [ref=e172]:
              - generic [ref=e173]: R1,800
              - generic [ref=e174]: night
      - generic [ref=e175]:
        - heading "Find your next Ideal Stay" [level=1] [ref=e176]
        - paragraph [ref=e177]: Discover unique accommodations around the world.
      - generic [ref=e179] [cursor=pointer]:
        - generic [ref=e180]:
          - img "Sea Point Stay" [ref=e181]
          - button [ref=e183]:
            - img [ref=e184]
          - generic [ref=e187]: Save 10%
        - generic [ref=e189]:
          - heading "Sea Point Stay" [level=3] [ref=e190]
          - paragraph [ref=e191]: Cape Town
          - generic [ref=e193]:
            - generic [ref=e194]: R1,800
            - generic [ref=e195]: night
  - contentinfo [ref=e196]:
    - generic [ref=e198]:
      - link "Go to Ideal Stay home" [ref=e200] [cursor=pointer]:
        - /url: /
        - img "Ideal Stay" [ref=e201]
      - navigation "Documentation" [ref=e202]:
        - link "Privacy" [ref=e203] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e204] [cursor=pointer]:
          - /url: /terms-of-service
        - link "Host Agreement" [ref=e205] [cursor=pointer]:
          - /url: /host-agreement
        - link "Guest Agreement" [ref=e206] [cursor=pointer]:
          - /url: /guest-agreement
        - link "Liability Waiver" [ref=e207] [cursor=pointer]:
          - /url: /liability-waiver
        - link "Cancellation Policy" [ref=e208] [cursor=pointer]:
          - /url: /cancellation-policy
      - generic [ref=e209]:
        - generic [ref=e210]:
          - img [ref=e211]
          - text: English (ZA)
        - generic [ref=e216]: ZAR
  - generic [ref=e219]:
    - generic [ref=e220]:
      - heading "Sea Point Stay" [level=2] [ref=e221]
      - button [ref=e222]:
        - img [ref=e223]
    - generic [ref=e226]:
      - button [ref=e229]
      - generic [ref=e230]:
        - generic [ref=e231]:
          - generic [ref=e232]:
            - generic [ref=e233]:
              - generic [ref=e234]:
                - heading "apartment in Cape Town" [level=3] [ref=e235]
                - paragraph [ref=e236]: 3 guests · 1 bedrooms · 1 beds · 1 bath
              - generic [ref=e237]:
                - img [ref=e238]
                - generic [ref=e240]: New
                - generic [ref=e241]: ·
                - generic [ref=e242]: 0 reviews
            - separator [ref=e243]
            - paragraph [ref=e244]: Ocean-facing apartment
            - generic [ref=e245]:
              - heading "Amenities" [level=4] [ref=e246]
              - generic [ref=e248]: wifi
          - generic [ref=e249]:
            - heading "Reviews" [level=3] [ref=e251]
            - paragraph [ref=e252]: No reviews yet for this listing.
        - generic [ref=e254]:
          - generic [ref=e255]:
            - generic [ref=e256]: R1,800 / night
            - generic [ref=e257]:
              - img [ref=e258]
              - generic [ref=e260]: New
          - generic [ref=e261]:
            - button "Check-in Add date Checkout Add date" [expanded] [ref=e263]:
              - generic [ref=e264]:
                - paragraph [ref=e265]: Check-in
                - paragraph [ref=e266]: Add date
              - generic [ref=e267]:
                - paragraph [ref=e268]: Checkout
                - paragraph [ref=e269]: Add date
            - dialog [ref=e273]:
              - generic [ref=e275]:
                - navigation "Navigation bar" [ref=e276]:
                  - button "Go to the Previous Month" [active] [ref=e277]:
                    - img
                  - button "Go to the Next Month" [ref=e278]:
                    - img
                - generic [ref=e279]:
                  - status [ref=e281]: May 2026
                  - grid "May 2026" [ref=e282]:
                    - rowgroup [ref=e283]:
                      - row [ref=e284]:
                        - columnheader [ref=e285]: Su
                        - columnheader [ref=e286]: Mo
                        - columnheader [ref=e287]: Tu
                        - columnheader [ref=e288]: We
                        - columnheader [ref=e289]: Th
                        - columnheader [ref=e290]: Fr
                        - columnheader [ref=e291]: Sa
                    - rowgroup [ref=e292]:
                      - row "Sunday, April 26th, 2026 Monday, April 27th, 2026 Tuesday, April 28th, 2026 Wednesday, April 29th, 2026 Thursday, April 30th, 2026 Friday, May 1st, 2026 Saturday, May 2nd, 2026" [ref=e293]:
                        - gridcell "Sunday, April 26th, 2026" [ref=e294]:
                          - button "Sunday, April 26th, 2026" [disabled]: "26"
                        - gridcell "Monday, April 27th, 2026" [ref=e295]:
                          - button "Monday, April 27th, 2026" [disabled]: "27"
                        - gridcell "Tuesday, April 28th, 2026" [ref=e296]:
                          - button "Tuesday, April 28th, 2026" [disabled]: "28"
                        - gridcell "Wednesday, April 29th, 2026" [ref=e297]:
                          - button "Wednesday, April 29th, 2026" [disabled]: "29"
                        - gridcell "Thursday, April 30th, 2026" [ref=e298]:
                          - button "Thursday, April 30th, 2026" [disabled]: "30"
                        - gridcell "Friday, May 1st, 2026" [ref=e299]:
                          - button "Friday, May 1st, 2026" [disabled]: "1"
                        - gridcell "Saturday, May 2nd, 2026" [ref=e300]:
                          - button "Saturday, May 2nd, 2026" [disabled]: "2"
                      - row "Sunday, May 3rd, 2026 Monday, May 4th, 2026 Tuesday, May 5th, 2026 Wednesday, May 6th, 2026 Thursday, May 7th, 2026 Friday, May 8th, 2026 Saturday, May 9th, 2026" [ref=e301]:
                        - gridcell "Sunday, May 3rd, 2026" [ref=e302]:
                          - button "Sunday, May 3rd, 2026" [disabled]: "3"
                        - gridcell "Monday, May 4th, 2026" [ref=e303]:
                          - button "Monday, May 4th, 2026" [disabled]: "4"
                        - gridcell "Tuesday, May 5th, 2026" [ref=e304]:
                          - button "Tuesday, May 5th, 2026" [disabled]: "5"
                        - gridcell "Wednesday, May 6th, 2026" [ref=e305]:
                          - button "Wednesday, May 6th, 2026" [disabled]: "6"
                        - gridcell "Thursday, May 7th, 2026" [ref=e306]:
                          - button "Thursday, May 7th, 2026" [disabled]: "7"
                        - gridcell "Friday, May 8th, 2026" [ref=e307]:
                          - button "Friday, May 8th, 2026" [disabled]: "8"
                        - gridcell "Saturday, May 9th, 2026" [ref=e308]:
                          - button "Saturday, May 9th, 2026" [disabled]: "9"
                      - row "Sunday, May 10th, 2026 Monday, May 11th, 2026 Tuesday, May 12th, 2026 Wednesday, May 13th, 2026 Thursday, May 14th, 2026 Friday, May 15th, 2026 Saturday, May 16th, 2026" [ref=e309]:
                        - gridcell "Sunday, May 10th, 2026" [ref=e310]:
                          - button "Sunday, May 10th, 2026" [disabled]: "10"
                        - gridcell "Monday, May 11th, 2026" [ref=e311]:
                          - button "Monday, May 11th, 2026" [disabled]: "11"
                        - gridcell "Tuesday, May 12th, 2026" [ref=e312]:
                          - button "Tuesday, May 12th, 2026" [disabled]: "12"
                        - gridcell "Wednesday, May 13th, 2026" [ref=e313]:
                          - button "Wednesday, May 13th, 2026" [disabled]: "13"
                        - gridcell "Thursday, May 14th, 2026" [ref=e314]:
                          - button "Thursday, May 14th, 2026" [disabled]: "14"
                        - gridcell "Friday, May 15th, 2026" [ref=e315]:
                          - button "Friday, May 15th, 2026" [disabled]: "15"
                        - gridcell "Saturday, May 16th, 2026" [ref=e316]:
                          - button "Saturday, May 16th, 2026" [disabled]: "16"
                      - row "Sunday, May 17th, 2026 Monday, May 18th, 2026 Tuesday, May 19th, 2026 Wednesday, May 20th, 2026 Thursday, May 21st, 2026 Friday, May 22nd, 2026 Saturday, May 23rd, 2026" [ref=e317]:
                        - gridcell "Sunday, May 17th, 2026" [ref=e318]:
                          - button "Sunday, May 17th, 2026" [disabled]: "17"
                        - gridcell "Monday, May 18th, 2026" [ref=e319]:
                          - button "Monday, May 18th, 2026" [disabled]: "18"
                        - gridcell "Tuesday, May 19th, 2026" [ref=e320]:
                          - button "Tuesday, May 19th, 2026" [disabled]: "19"
                        - gridcell "Wednesday, May 20th, 2026" [ref=e321]:
                          - button "Wednesday, May 20th, 2026" [disabled]: "20"
                        - gridcell "Thursday, May 21st, 2026" [ref=e322]:
                          - button "Thursday, May 21st, 2026" [disabled]: "21"
                        - gridcell "Friday, May 22nd, 2026" [ref=e323]:
                          - button "Friday, May 22nd, 2026" [disabled]: "22"
                        - gridcell "Saturday, May 23rd, 2026" [ref=e324]:
                          - button "Saturday, May 23rd, 2026" [disabled]: "23"
                      - row "Sunday, May 24th, 2026 Monday, May 25th, 2026 Tuesday, May 26th, 2026 Wednesday, May 27th, 2026 Today, Thursday, May 28th, 2026 Friday, May 29th, 2026 Saturday, May 30th, 2026" [ref=e325]:
                        - gridcell "Sunday, May 24th, 2026" [ref=e326]:
                          - button "Sunday, May 24th, 2026" [disabled]: "24"
                        - gridcell "Monday, May 25th, 2026" [ref=e327]:
                          - button "Monday, May 25th, 2026" [disabled]: "25"
                        - gridcell "Tuesday, May 26th, 2026" [ref=e328]:
                          - button "Tuesday, May 26th, 2026" [disabled]: "26"
                        - gridcell "Wednesday, May 27th, 2026" [ref=e329]:
                          - button "Wednesday, May 27th, 2026" [disabled]: "27"
                        - gridcell "Today, Thursday, May 28th, 2026" [ref=e330]:
                          - button "Today, Thursday, May 28th, 2026" [ref=e331]: "28"
                        - gridcell "Friday, May 29th, 2026" [ref=e332]:
                          - button "Friday, May 29th, 2026" [ref=e333]: "29"
                        - gridcell "Saturday, May 30th, 2026" [ref=e334]:
                          - button "Saturday, May 30th, 2026" [ref=e335]: "30"
                      - row "Sunday, May 31st, 2026 Monday, June 1st, 2026 Tuesday, June 2nd, 2026 Wednesday, June 3rd, 2026 Thursday, June 4th, 2026 Friday, June 5th, 2026 Saturday, June 6th, 2026" [ref=e336]:
                        - gridcell "Sunday, May 31st, 2026" [ref=e337]:
                          - button "Sunday, May 31st, 2026" [ref=e338]: "31"
                        - gridcell "Monday, June 1st, 2026" [ref=e339]:
                          - button "Monday, June 1st, 2026" [ref=e340]: "1"
                        - gridcell "Tuesday, June 2nd, 2026" [ref=e341]:
                          - button "Tuesday, June 2nd, 2026" [ref=e342]: "2"
                        - gridcell "Wednesday, June 3rd, 2026" [ref=e343]:
                          - button "Wednesday, June 3rd, 2026" [ref=e344]: "3"
                        - gridcell "Thursday, June 4th, 2026" [ref=e345]:
                          - button "Thursday, June 4th, 2026" [ref=e346]: "4"
                        - gridcell "Friday, June 5th, 2026" [ref=e347]:
                          - button "Friday, June 5th, 2026" [ref=e348]: "5"
                        - gridcell "Saturday, June 6th, 2026" [ref=e349]:
                          - button "Saturday, June 6th, 2026" [ref=e350]: "6"
                - generic [ref=e351]:
                  - status [ref=e353]: June 2026
                  - grid "June 2026" [ref=e354]:
                    - rowgroup [ref=e355]:
                      - row [ref=e356]:
                        - columnheader [ref=e357]: Su
                        - columnheader [ref=e358]: Mo
                        - columnheader [ref=e359]: Tu
                        - columnheader [ref=e360]: We
                        - columnheader [ref=e361]: Th
                        - columnheader [ref=e362]: Fr
                        - columnheader [ref=e363]: Sa
                    - rowgroup [ref=e364]:
                      - row "Sunday, May 31st, 2026 Monday, June 1st, 2026 Tuesday, June 2nd, 2026 Wednesday, June 3rd, 2026 Thursday, June 4th, 2026 Friday, June 5th, 2026 Saturday, June 6th, 2026" [ref=e365]:
                        - gridcell "Sunday, May 31st, 2026" [ref=e366]:
                          - button "Sunday, May 31st, 2026" [ref=e367]: "31"
                        - gridcell "Monday, June 1st, 2026" [ref=e368]:
                          - button "Monday, June 1st, 2026" [ref=e369]: "1"
                        - gridcell "Tuesday, June 2nd, 2026" [ref=e370]:
                          - button "Tuesday, June 2nd, 2026" [ref=e371]: "2"
                        - gridcell "Wednesday, June 3rd, 2026" [ref=e372]:
                          - button "Wednesday, June 3rd, 2026" [ref=e373]: "3"
                        - gridcell "Thursday, June 4th, 2026" [ref=e374]:
                          - button "Thursday, June 4th, 2026" [ref=e375]: "4"
                        - gridcell "Friday, June 5th, 2026" [ref=e376]:
                          - button "Friday, June 5th, 2026" [ref=e377]: "5"
                        - gridcell "Saturday, June 6th, 2026" [ref=e378]:
                          - button "Saturday, June 6th, 2026" [ref=e379]: "6"
                      - row "Sunday, June 7th, 2026 Monday, June 8th, 2026 Tuesday, June 9th, 2026 Wednesday, June 10th, 2026 Thursday, June 11th, 2026 Friday, June 12th, 2026 Saturday, June 13th, 2026" [ref=e380]:
                        - gridcell "Sunday, June 7th, 2026" [ref=e381]:
                          - button "Sunday, June 7th, 2026" [ref=e382]: "7"
                        - gridcell "Monday, June 8th, 2026" [ref=e383]:
                          - button "Monday, June 8th, 2026" [ref=e384]: "8"
                        - gridcell "Tuesday, June 9th, 2026" [ref=e385]:
                          - button "Tuesday, June 9th, 2026" [ref=e386]: "9"
                        - gridcell "Wednesday, June 10th, 2026" [ref=e387]:
                          - button "Wednesday, June 10th, 2026" [ref=e388]: "10"
                        - gridcell "Thursday, June 11th, 2026" [ref=e389]:
                          - button "Thursday, June 11th, 2026" [ref=e390]: "11"
                        - gridcell "Friday, June 12th, 2026" [ref=e391]:
                          - button "Friday, June 12th, 2026" [ref=e392]: "12"
                        - gridcell "Saturday, June 13th, 2026" [ref=e393]:
                          - button "Saturday, June 13th, 2026" [ref=e394]: "13"
                      - row "Sunday, June 14th, 2026 Monday, June 15th, 2026 Tuesday, June 16th, 2026 Wednesday, June 17th, 2026 Thursday, June 18th, 2026 Friday, June 19th, 2026 Saturday, June 20th, 2026" [ref=e395]:
                        - gridcell "Sunday, June 14th, 2026" [ref=e396]:
                          - button "Sunday, June 14th, 2026" [ref=e397]: "14"
                        - gridcell "Monday, June 15th, 2026" [ref=e398]:
                          - button "Monday, June 15th, 2026" [ref=e399]: "15"
                        - gridcell "Tuesday, June 16th, 2026" [ref=e400]:
                          - button "Tuesday, June 16th, 2026" [ref=e401]: "16"
                        - gridcell "Wednesday, June 17th, 2026" [ref=e402]:
                          - button "Wednesday, June 17th, 2026" [ref=e403]: "17"
                        - gridcell "Thursday, June 18th, 2026" [ref=e404]:
                          - button "Thursday, June 18th, 2026" [ref=e405]: "18"
                        - gridcell "Friday, June 19th, 2026" [ref=e406]:
                          - button "Friday, June 19th, 2026" [ref=e407]: "19"
                        - gridcell "Saturday, June 20th, 2026" [ref=e408]:
                          - button "Saturday, June 20th, 2026" [ref=e409]: "20"
                      - row "Sunday, June 21st, 2026 Monday, June 22nd, 2026 Tuesday, June 23rd, 2026 Wednesday, June 24th, 2026 Thursday, June 25th, 2026 Friday, June 26th, 2026 Saturday, June 27th, 2026" [ref=e410]:
                        - gridcell "Sunday, June 21st, 2026" [ref=e411]:
                          - button "Sunday, June 21st, 2026" [ref=e412]: "21"
                        - gridcell "Monday, June 22nd, 2026" [ref=e413]:
                          - button "Monday, June 22nd, 2026" [ref=e414]: "22"
                        - gridcell "Tuesday, June 23rd, 2026" [ref=e415]:
                          - button "Tuesday, June 23rd, 2026" [ref=e416]: "23"
                        - gridcell "Wednesday, June 24th, 2026" [ref=e417]:
                          - button "Wednesday, June 24th, 2026" [ref=e418]: "24"
                        - gridcell "Thursday, June 25th, 2026" [ref=e419]:
                          - button "Thursday, June 25th, 2026" [ref=e420]: "25"
                        - gridcell "Friday, June 26th, 2026" [ref=e421]:
                          - button "Friday, June 26th, 2026" [ref=e422]: "26"
                        - gridcell "Saturday, June 27th, 2026" [ref=e423]:
                          - button "Saturday, June 27th, 2026" [ref=e424]: "27"
                      - row "Sunday, June 28th, 2026 Monday, June 29th, 2026 Tuesday, June 30th, 2026 Wednesday, July 1st, 2026 Thursday, July 2nd, 2026 Friday, July 3rd, 2026 Saturday, July 4th, 2026" [ref=e425]:
                        - gridcell "Sunday, June 28th, 2026" [ref=e426]:
                          - button "Sunday, June 28th, 2026" [ref=e427]: "28"
                        - gridcell "Monday, June 29th, 2026" [ref=e428]:
                          - button "Monday, June 29th, 2026" [ref=e429]: "29"
                        - gridcell "Tuesday, June 30th, 2026" [ref=e430]:
                          - button "Tuesday, June 30th, 2026" [ref=e431]: "30"
                        - gridcell "Wednesday, July 1st, 2026" [ref=e432]:
                          - button "Wednesday, July 1st, 2026" [ref=e433]: "1"
                        - gridcell "Thursday, July 2nd, 2026" [ref=e434]:
                          - button "Thursday, July 2nd, 2026" [ref=e435]: "2"
                        - gridcell "Friday, July 3rd, 2026" [ref=e436]:
                          - button "Friday, July 3rd, 2026" [ref=e437]: "3"
                        - gridcell "Saturday, July 4th, 2026" [ref=e438]:
                          - button "Saturday, July 4th, 2026" [ref=e439]: "4"
              - generic [ref=e440]: Choose your check-in date first.
            - button "Guests 1 guest" [ref=e443]:
              - paragraph [ref=e444]: Guests
              - paragraph [ref=e445]: 1 guest
          - button "Request to Book" [ref=e446]
          - paragraph [ref=e447]: Payment is handled directly by the host
```

# Test source

```ts
  212 |       };
  213 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ booking }) });
  214 |       return;
  215 |     }
  216 | 
  217 |     if (path === '/bookings/booking-1/payment-proof' && method === 'POST') {
  218 |       expect(body.paymentReference).toBe('HOST-booking-1');
  219 |       expect(body.paymentProofFilename).toBe('payment-proof.jpg');
  220 |       expect(body.paymentProofContentType).toBe('image/jpeg');
  221 |       expect(String(body.paymentProofDataBase64 || '').length).toBeGreaterThan(20);
  222 |       booking = {
  223 |         ...booking,
  224 |         inquiryState: 'APPROVED',
  225 |         paymentState: 'INITIATED',
  226 |         paymentReference: body.paymentReference,
  227 |         paymentProofAccessible: true,
  228 |         paymentProofAccessUrl: '/signed/payment-proof.jpg?sig=abc',
  229 |         paymentSubmittedAt: '2026-04-24T10:20:00.000Z',
  230 |         updatedAt: '2026-04-24T10:20:00.000Z',
  231 |       };
  232 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ booking }) });
  233 |       return;
  234 |     }
  235 | 
  236 |     if (path === '/bookings/booking-1/payment-confirm' && method === 'POST') {
  237 |       booking = {
  238 |         ...booking,
  239 |         inquiryState: 'BOOKED',
  240 |         paymentState: 'COMPLETED',
  241 |         paymentConfirmedAt: '2026-04-24T10:30:00.000Z',
  242 |         bookedAt: '2026-04-24T10:30:00.000Z',
  243 |         expiresAt: null,
  244 |         updatedAt: '2026-04-24T10:30:00.000Z',
  245 |       };
  246 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ booking }) });
  247 |       return;
  248 |     }
  249 | 
  250 |     if (path === `/reviews/${listing.id}` && method === 'GET') {
  251 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reviews: [] }) });
  252 |       return;
  253 |     }
  254 | 
  255 |     if (path === '/reviews' && method === 'POST') {
  256 |       reviewPosted = true;
  257 |       reviewRequestBody = body;
  258 |       await route.fulfill({
  259 |         status: 200,
  260 |         contentType: 'application/json',
  261 |         body: JSON.stringify({
  262 |           review: {
  263 |             id: 'review-1',
  264 |             listingId: listing.id,
  265 |             bookingId: booking.id,
  266 |             guestId: guestUser.id,
  267 |             hostId: hostUser.id,
  268 |             cleanliness: body.cleanliness,
  269 |             accuracy: body.accuracy,
  270 |             communication: body.communication,
  271 |             location: body.location,
  272 |             value: body.value,
  273 |             comment: body.comment,
  274 |             status: 'pending',
  275 |             createdAt: '2026-04-24T10:40:00.000Z',
  276 |           },
  277 |         }),
  278 |       });
  279 |       return;
  280 |     }
  281 | 
  282 |     if (path === '/referrals/rewards' && method === 'GET') {
  283 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rewards: [] }) });
  284 |       return;
  285 |     }
  286 | 
  287 |     if (path === '/ops/my-notifications' && method === 'GET') {
  288 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [] }) });
  289 |       return;
  290 |     }
  291 | 
  292 |     if (path === '/ops/my-notifications/read' && method === 'POST') {
  293 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ readAt: '2026-04-24T10:12:00.000Z' }) });
  294 |       return;
  295 |     }
  296 | 
  297 |     if (path === '/ops/my-notifications/read-all' && method === 'POST') {
  298 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ readAt: '2026-04-24T10:12:00.000Z' }) });
  299 |       return;
  300 |     }
  301 | 
  302 |     await route.fulfill({
  303 |       status: 500,
  304 |       contentType: 'application/json',
  305 |       body: JSON.stringify({ error: `Unhandled booking lifecycle route: ${method} ${path}` }),
  306 |     });
  307 |   });
  308 | 
  309 |   await signIn(page, guestUser.email);
  310 |   await page.getByText(listing.title).first().click();
  311 |   await page.getByRole('button', { name: /Check-in Add date Checkout Add date/ }).click();
> 312 |   await page.locator(`button[data-day="${calendarDataDay(checkInDate)}"]`).click();
      |                                                                            ^ Error: locator.click: Error: strict mode violation: locator('button[data-day="6/2/2026"]') resolved to 2 elements:
  313 |   await expect(page.getByText('Now choose your check-out date.')).toBeVisible();
  314 |   await page.locator(`button[data-day="${calendarDataDay(checkOutDate)}"]`).click({ force: true });
  315 |   await page.getByRole('button', { name: 'Request to Book' }).click();
  316 |   await expect(page.getByText('Booking request sent! The host will contact you shortly.')).toBeVisible();
  317 | 
  318 |   await signIn(page, hostUser.email);
  319 |   await page.getByRole('link', { name: 'Enquiries' }).click();
  320 |   await expect(page.getByRole('heading', { name: listing.title }).first()).toBeVisible();
  321 |   await page.getByRole('button', { name: 'Approve' }).click();
  322 |   await expect(page.getByText('Inquiry approved. Payment is now unlocked for the guest.')).toBeVisible();
  323 |   await expect(page.getByText('Awaiting Guest Payment').first()).toBeVisible();
  324 | 
  325 |   await signIn(page, guestUser.email);
  326 |   await page.getByRole('link', { name: 'My Stays' }).click();
  327 |   await expect(page.getByText('Ready for Payment')).toBeVisible();
  328 |   await expect(page.getByText('Payment unlocked. Submit payment proof before the approval window closes.')).toBeVisible();
  329 |   await page.getByRole('button', { name: 'Send Proof of Payment' }).click();
  330 |   await expect(page.getByRole('heading', { name: 'Submit Payment Proof' })).toBeVisible();
  331 |   await page.getByLabel('Payment reference').fill('HOST-booking-1');
  332 |   await page.locator('input[type="file"]').setInputFiles({
  333 |     name: 'payment-proof.png',
  334 |     mimeType: 'image/png',
  335 |     buffer: Buffer.from(
  336 |       'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/atpU8sAAAAASUVORK5CYII=',
  337 |       'base64',
  338 |     ),
  339 |   });
  340 |   await expect(page.getByText('payment-proof.png')).toBeVisible();
  341 |   await page.getByRole('button', { name: 'Submit proof' }).click();
  342 |   await expect(page.getByText('Payment proof submitted. The host can now confirm receipt.')).toBeVisible();
  343 |   await expect(page.getByText('Payment proof submitted. Host confirmation is still pending.')).toBeVisible();
  344 | 
  345 |   await signIn(page, hostUser.email);
  346 |   await page.getByRole('link', { name: 'Enquiries' }).click();
  347 |   await expect(page.getByRole('heading', { name: 'Awaiting Payment Confirmation' })).toBeVisible();
  348 |   await expect(page.getByText('Payment reference:')).toBeVisible();
  349 |   await expect(page.getByRole('link', { name: 'Open private proof' })).toBeVisible();
  350 |   await page.getByRole('button', { name: 'Confirm Payment' }).click();
  351 |   await expect(page.getByText('Payment confirmed. The stay is now booked.')).toBeVisible();
  352 |   await expect(page.getByText('Confirmed Stays')).toBeVisible();
  353 | 
  354 |   await signIn(page, guestUser.email);
  355 |   await page.getByRole('link', { name: 'My Stays' }).click();
  356 |   await expect(page.getByText('BOOKED', { exact: true })).toBeVisible();
  357 |   await expect(page.getByText('Payment confirmed. Your stay is booked.')).toBeVisible();
  358 |   await page.getByRole('button', { name: 'Review' }).click();
  359 |   await expect(page.getByRole('heading', { name: 'How was your stay?' })).toBeVisible();
  360 |   await page.getByPlaceholder('What did you love? What could be better?').fill('Great stay and clear host communication.');
  361 |   await page.getByRole('button', { name: 'Post Review' }).click();
  362 |   await expect(page.getByRole('heading', { name: 'How was your stay?' })).toHaveCount(0);
  363 | 
  364 |   expect(reviewPosted).toBe(true);
  365 |   expect(reviewRequestBody).toMatchObject({
  366 |     listingId: listing.id,
  367 |     bookingId: booking.id,
  368 |     hostId: hostUser.id,
  369 |     comment: 'Great stay and clear host communication.',
  370 |   });
  371 | });
  372 | 
```