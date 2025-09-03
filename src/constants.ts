// API Endpoints
export enum ApiEndpoints {
  FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0',
  ALGOLIA_SEARCH = 'https://hn.algolia.com/api/v1/search'
}

export enum FirebaseEndpoints {
  TOP_STORIES = 'topstories',
  NEW_STORIES = 'newstories', 
  ASK_STORIES = 'askstories',
  SHOW_STORIES = 'showstories',
  JOB_STORIES = 'jobstories'
}

// Page Types
export enum PageType {
  TOP = 'top',
  NEW = 'new',
  ASK = 'ask', 
  SHOW = 'show',
  JOBS = 'jobs',
  SEARCH = 'search'
}

// View Types
export enum ViewType {
  STORIES = 'stories',
  COMMENTS = 'comments'
}

// Navigation Labels
export enum NavigationLabels {
  NEW = 'new',
  ASK = 'ask',
  SHOW = 'show', 
  JOBS = 'jobs'
}

// UI Text Constants
export const UI_TEXT = {
  SITE_TITLE: 'Hacker News',
  BACK_TO_STORIES: '← Back to Stories',
  LOADING_APP: 'Loading app...',
  NO_STORIES_FOUND: 'No stories found',
  NO_COMMENTS_YET: 'No comments yet',
  VOTE_ARROW: '▲',
  BY_TEXT: 'by',
  SEPARATOR: '|',
  POINTS_SUFFIX: 'points',
  COMMENTS_SUFFIX: 'comments',
  NO_TITLE: 'No title',
  UNKNOWN_AUTHOR: 'Unknown'
} as const

// Time format strings
export const TIME_FORMATS = {
  SECONDS_AGO: 'seconds ago',
  MINUTES_AGO: 'minutes ago', 
  HOURS_AGO: 'hours ago',
  DAYS_AGO: 'days ago'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  HTTP_ERROR: 'HTTP error! status:',
  FAILED_TO_LOAD_STORIES: 'Failed to load',
  FAILED_TO_SEARCH: 'Failed to search stories',
  FAILED_TO_LOAD_COMMENTS: 'Failed to load comments'
} as const

// Console Messages
export const CONSOLE_MESSAGES = {
  FETCHING_STORIES: 'Fetching',
  GOT_STORY_IDS: 'Got',
  FETCHED_STORIES: 'Fetched',
  SEARCHING_STORIES: 'Searching stories with query:',
  GOT_SEARCH_RESULTS: 'Got search results from Algolia:',
  PROCESSED_SEARCH: 'Processed search results:',
  FETCHING_COMMENTS: 'Fetching comments for story:',
  FETCHED_COMMENTS: 'Fetched comments:',
  ERROR_LOADING: 'Error loading',
  ERROR_SEARCHING: 'Error searching stories:',
  ERROR_COMMENTS: 'Error loading comments:',
  INITIALIZING_APP: 'Initializing app'
} as const

// CSS Classes
export const CSS_CLASSES = {
  STORY_ROW: 'story-row',
  RANK_CELL: 'rank-cell',
  VOTE_CELL: 'vote-cell',
  STORY_CONTENT: 'story-content',
  TITLE_LINE: 'title-line',
  STORY_LINK: 'story-link',
  DOMAIN: 'domain',
  SUBTEXT: 'subtext'
} as const

// Search Parameters
export const SEARCH_PARAMS = {
  TAGS_STORY: 'story',
  HITS_PER_PAGE: '30'
} as const

// Limits
export const LIMITS = {
  STORIES_TO_FETCH: 30,
  TOP_LEVEL_COMMENTS: 20,
  REPLIES_PER_COMMENT: 5
} as const

// Gruvbox Color Palette
export const GRUVBOX_COLORS = {
  PRIMARY: '#d79921',      // Gruvbox yellow
  SECONDARY: '#b16286',    // Gruvbox purple
  ACCENT: '#fe8019',       // Gruvbox orange
  SUCCESS: '#b8bb26',      // Gruvbox green
  BACKGROUND: '#1d2021',   // Gruvbox hard dark
  SURFACE: '#282828',      // Gruvbox dark0
  SURFACE_HOVER: '#32302f', // Gruvbox dark0_soft
  TEXT: '#ebdbb2',         // Gruvbox fg
  TEXT_MUTED: '#a89984',   // Gruvbox fg4
  TEXT_FADED: '#928374',   // Gruvbox gray
  BORDER: '#3c3836',       // Gruvbox dark1 (darker borders)
  BORDER_LIGHT: '#504945'  // Gruvbox dark2
} as const