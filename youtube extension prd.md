# **Product Requirements Document (PRD): YouTube Profile Selector Chrome Extension**

## **Overview**

This Chrome extension enhances the YouTube browsing experience by introducing a Netflix-style profile selector. Instead of traditional user profiles, the extension presents users with content category profiles—such as Entertainment, Study, Motivation, How To, Money & Career, and Gaming. Upon selection, the extension filters and displays videos relevant to the chosen category across YouTube’s homepage, search results, and subscriptions feed.

## **Goals**

* Enable users to quickly focus their YouTube experience around specific content categories.  
* Provide a seamless, visually engaging profile selection interface reminiscent of Netflix.  
* Filter YouTube videos in real time based on the selected category using on-page video metadata (title, description, tags).  
* Ensure the filtering applies consistently across all major YouTube surfaces: homepage, search, and subscriptions.

## **User Stories**

* **As a user**, I want to select a content category upon opening YouTube so that I only see videos relevant to my current intent.  
* **As a user**, I want the profile selector to appear in a visually engaging, Netflix-style UI.  
* **As a user**, I want the filtering to persist as I navigate between the homepage, search, and subscriptions.  
* **As a user**, I want to easily switch between categories at any time.

## **Functional Requirements**

## **1\. Profile Selector UI**

* Display a modal overlay when YouTube loads, prompting the user to select a profile/category.  
* Categories:  
  * Entertainment  
  * Study  
  * Motivation  
  * How To  
  * Money & Career  
  * Gaming  
* Each category should be represented with an icon or image and a label.  
* Allow users to change their selected category at any time via an always-accessible extension button or floating widget.

## **2\. Video Filtering Logic**

* Scrape visible videos on the page for metadata: title, description, and tags.  
* Use keyword matching or basic NLP to associate videos with categories.  
* Hide or dim videos that do not match the selected category.  
* Filtering should apply to:  
  * YouTube homepage (feed)  
  * Search results pages  
  * Subscriptions feed  
  * (Optional) Trending and Explore pages

## **3\. Persistence & Navigation**

* Remember the user’s selected category during the session.  
* Re-prompt for category selection if the user navigates away and returns, or allow persistent selection until changed.  
* Ensure filtering is re-applied dynamically as the user scrolls or as new videos load (handle infinite scroll and AJAX updates).

## **4\. Settings & Customization**

* Allow users to customize which categories are shown.  
* (Optional) Allow users to define custom keywords for each category.

## **Non-Functional Requirements**

* **Performance:** Filtering and UI overlays must not noticeably degrade YouTube’s performance.  
* **Compatibility:** Must work with the latest versions of Chrome and the current YouTube UI.  
* **Privacy:** All processing is done client-side; no user data is sent externally.

## **User Flows**

1. **Initial Launch:**  
   * User opens YouTube.  
   * Extension displays modal with category profiles.  
   * User selects a category.  
   * YouTube feed updates to show only relevant videos.  
2. **Switching Categories:**  
   * User clicks extension icon or floating widget.  
   * Profile selector modal reappears.  
   * User selects a new category; filtering updates in real time.  
3. **Navigating YouTube:**  
   * As the user navigates between homepage, search, and subscriptions, filtering persists and updates dynamically.

## **Technical Approach**

* **DOM Scraping:** Use JavaScript to extract video metadata from the DOM.  
* **Filtering:** Apply CSS or DOM manipulation to hide/dim irrelevant videos.  
* **UI:** Inject custom HTML/CSS for the Netflix-style selector and controls.  
* **Event Handling:** Listen for navigation events and dynamically loaded content to re-apply filtering.

## **Out of Scope**

* Advanced machine learning-based categorization.  
* Server-side processing or cloud storage.  
* Integration with YouTube accounts or user data beyond what’s visible in the DOM.

## **Success Metrics**

* High user engagement with the profile selector.  
* Noticeable reduction in irrelevant video recommendations per user feedback.  
* Minimal performance impact on YouTube browsing.

## **Open Questions**

* Should users be able to create or edit categories?  
* How to handle videos with ambiguous or missing metadata?  
* Should there be an “All” or “No Filter” mode?

## **Appendix**

**Example Category Mapping (for filtering):**

| Category | Example Keywords |
| ----- | ----- |
| Entertainment | music, comedy, vlog, trailer, movie, show |
| Study | study, lecture, tutorial, course, exam, revision, homework |
| Motivation | motivation, inspirational, success, productivity, mindset |
| How To | how to, guide, tutorial, DIY, fix, make, build |
| Money & Career | finance, investing, career, job, resume, business, startup |
| Gaming | game, gameplay, walkthrough, esports, let’s play, review |

This PRD is ready to be placed into Cursor or any project management tool for further development and collaboration.

