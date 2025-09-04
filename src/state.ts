import { AppState, Story, Comment } from './types'
import { PageType, ViewType } from './constants'
import { 
  fetchTopStoriesEffect,
  fetchNewStoriesEffect,
  fetchAskStoriesEffect,
  fetchShowStoriesEffect,
  fetchJobStoriesEffect,
  searchStoriesEffect,
  fetchCommentsEffect
} from './api'

// Actions that return new state
export const SetLoading = (state: AppState): AppState => ({ ...state, loading: true, error: null })

export const SetStories = (state: AppState, stories: Story[]): AppState => ({ 
  ...state, 
  stories, 
  loading: false, 
  error: null 
})

export const SetError = (state: AppState, error: string): AppState => ({ 
  ...state, 
  loading: false, 
  error 
})

export const SetSearchQuery = (state: AppState, query: string): AppState => ({ 
  ...state, 
  searchQuery: query 
})

export const SetCurrentPage = (state: AppState, page: string): AppState => ({ 
  ...state, 
  currentPage: page, 
  loading: true, 
  error: null 
})

export const SetComments = (state: AppState, comments: Comment[], story?: Story): AppState => ({ 
  ...state, 
  comments, 
  currentStory: story || state.currentStory, 
  loading: false, 
  error: null, 
  view: ViewType.COMMENTS 
})

export const SetView = (state: AppState, view: string): AppState => ({ 
  ...state, 
  view, 
  comments: [], 
  currentStory: null 
})

// Actions that return [state, effects]
export const LoadTopStories = (state: AppState): [AppState, any[]] => [
  { ...state, loading: true, error: null, currentPage: PageType.TOP },
  [fetchTopStoriesEffect]
]

export const LoadNewStories = (state: AppState): [AppState, any[]] => [
  { ...state, loading: true, error: null, currentPage: PageType.NEW },
  [fetchNewStoriesEffect]  
]

export const LoadAskStories = (state: AppState): [AppState, any[]] => [
  { ...state, loading: true, error: null, currentPage: PageType.ASK },
  [fetchAskStoriesEffect]
]

export const LoadShowStories = (state: AppState): [AppState, any[]] => [
  { ...state, loading: true, error: null, currentPage: PageType.SHOW },
  [fetchShowStoriesEffect]
]

export const LoadJobStories = (state: AppState): [AppState, any[]] => [
  { ...state, loading: true, error: null, currentPage: PageType.JOBS },
  [fetchJobStoriesEffect]
]

export const SearchStories = (state: AppState, query: string): [AppState, any[]] => [
  { ...state, loading: true, error: null, searchQuery: query, currentPage: PageType.SEARCH },
  [searchStoriesEffect, query]
]

export const LoadComments = (state: AppState, story: Story): [AppState, any[]] => [
  { ...state, loading: true, error: null, view: ViewType.COMMENTS, currentStory: story },
  [fetchCommentsEffect, story]
]

// Initial state
export const initialState: AppState = {
  stories: [],
  loading: true,
  error: null,
  searchQuery: '',
  currentPage: PageType.TOP,
  view: ViewType.STORIES,
  comments: [],
  currentStory: null
}