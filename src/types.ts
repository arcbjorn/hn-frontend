// Story interface
export interface Story {
  id: number
  title: string
  url?: string
  score: number
  by: string
  time: number
  descendants: number
  rank?: number
  kids?: number[]
}

// Comment interface
export interface Comment {
  id: number
  by: string
  time: number
  text?: string
  kids?: number[]
  replies?: Comment[]
  deleted?: boolean
}

// Application state interface
export interface AppState {
  stories: Story[]
  loading: boolean
  error: string | null
  searchQuery: string
  currentPage: string
  view: string
  comments: Comment[]
  currentStory: Story | null
}

// Action types
export type Action = 
  | { type: 'SET_LOADING' }
  | { type: 'SET_STORIES'; payload: Story[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_COMMENTS'; payload: { comments: Comment[]; story: Story } }
  | { type: 'SET_VIEW'; payload: string }

// Effect function type
export type EffectFunction = (dispatch: DispatchFunction, ...args: any[]) => void

// Dispatch function type
export type DispatchFunction = (action: Action | ActionFunction, ...args: any[]) => void

// Action function type (for effects)
export type ActionFunction = (state: AppState, ...args: any[]) => AppState | [AppState, EffectFunction[]]