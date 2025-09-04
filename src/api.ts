import { Story, Comment, DispatchFunction } from './types'
import { 
  ApiEndpoints, 
  FirebaseEndpoints, 
  LIMITS, 
  SEARCH_PARAMS,
  ERROR_MESSAGES,
  CONSOLE_MESSAGES,
  UI_TEXT 
} from './constants'
import { SetStories, SetError, SetComments } from './state'

// Helper function to fetch stories by endpoint
export const fetchStoriesByEndpoint = async (dispatch: DispatchFunction, endpoint: string, name: string) => {
  try {
    console.log(`${CONSOLE_MESSAGES.FETCHING_STORIES} ${name} stories from Firebase API...`)
    const response = await fetch(`${ApiEndpoints.FIREBASE_BASE}/${endpoint}.json`)
    
    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.HTTP_ERROR} ${response.status}`)
    }
    
    const storyIds = await response.json()
    console.log(`${CONSOLE_MESSAGES.GOT_STORY_IDS} ${name} story IDs:`, storyIds.length)
    
    // Fetch first 30 stories
    const storyPromises = storyIds.slice(0, LIMITS.STORIES_TO_FETCH).map(async (id: number, index: number) => {
      const storyResponse = await fetch(`${ApiEndpoints.FIREBASE_BASE}/item/${id}.json`)
      const story = await storyResponse.json()
      return { ...story, rank: index + 1 }
    })
    
    const stories = await Promise.all(storyPromises)
    console.log(`${CONSOLE_MESSAGES.FETCHED_STORIES} ${name} stories from Firebase:`, stories.length)
    
    dispatch(SetStories, stories)
  } catch (error) {
    console.error(`${CONSOLE_MESSAGES.ERROR_LOADING} ${name} stories:`, error)
    dispatch(SetError, error instanceof Error ? error.message : `${ERROR_MESSAGES.FAILED_TO_LOAD_STORIES} ${name} stories`)
  }
}

// Effect for fetching different story types
export const fetchTopStoriesEffect = (dispatch: DispatchFunction) => 
  fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.TOP_STORIES, 'top')

export const fetchNewStoriesEffect = (dispatch: DispatchFunction) => 
  fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.NEW_STORIES, 'new')

export const fetchAskStoriesEffect = (dispatch: DispatchFunction) => 
  fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.ASK_STORIES, 'ask')

export const fetchShowStoriesEffect = (dispatch: DispatchFunction) => 
  fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.SHOW_STORIES, 'show')

export const fetchJobStoriesEffect = (dispatch: DispatchFunction) => 
  fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.JOB_STORIES, 'jobs')

// Effect for searching stories using Algolia API
export const searchStoriesEffect = async (dispatch: DispatchFunction, query: string) => {
  try {
    console.log(`${CONSOLE_MESSAGES.SEARCHING_STORIES}`, query)
    const response = await fetch(`${ApiEndpoints.ALGOLIA_SEARCH}?query=${encodeURIComponent(query)}&tags=${SEARCH_PARAMS.TAGS_STORY}&hitsPerPage=${SEARCH_PARAMS.HITS_PER_PAGE}`)
    
    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.HTTP_ERROR} ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`${CONSOLE_MESSAGES.GOT_SEARCH_RESULTS}`, data.hits.length)
    
    const stories = data.hits.map((hit: any, index: number) => ({
      id: hit.objectID,
      title: hit.title || hit._highlightResult?.title?.value?.replace(/<[^>]*>/g, '') || UI_TEXT.NO_TITLE,
      url: hit.url,
      score: hit.points || 0,
      by: hit.author || UI_TEXT.UNKNOWN_AUTHOR,
      time: hit.created_at_i,
      descendants: hit.num_comments || 0,
      rank: index + 1
    }))
    
    console.log(`${CONSOLE_MESSAGES.PROCESSED_SEARCH}`, stories.length)
    dispatch(SetStories, stories)
  } catch (error) {
    console.error(`${CONSOLE_MESSAGES.ERROR_SEARCHING}`, error)
    dispatch(SetError, error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_SEARCH)
  }
}

// Effect for fetching comments
export const fetchCommentsEffect = async (dispatch: DispatchFunction, story: Story) => {
  try {
    console.log(`${CONSOLE_MESSAGES.FETCHING_COMMENTS}`, story.id)
    
    // Get the story with kids array
    const storyResponse = await fetch(`${ApiEndpoints.FIREBASE_BASE}/item/${story.id}.json`)
    const storyWithKids = await storyResponse.json()
    
    if (!storyWithKids.kids || storyWithKids.kids.length === 0) {
      dispatch(SetComments, [], story)
      return
    }
    
    // Fetch top-level comments
    const commentPromises = storyWithKids.kids.slice(0, LIMITS.TOP_LEVEL_COMMENTS).map(async (commentId: number) => {
      const commentResponse = await fetch(`${ApiEndpoints.FIREBASE_BASE}/item/${commentId}.json`)
      const comment = await commentResponse.json()
      
      // Fetch replies for each comment
      if (comment && comment.kids && comment.kids.length > 0) {
        const replyPromises = comment.kids.slice(0, LIMITS.REPLIES_PER_COMMENT).map(async (replyId: number) => {
          const replyResponse = await fetch(`${ApiEndpoints.FIREBASE_BASE}/item/${replyId}.json`)
          return replyResponse.json()
        })
        comment.replies = await Promise.all(replyPromises)
      } else {
        comment.replies = []
      }
      
      return comment
    })
    
    const comments = await Promise.all(commentPromises)
    console.log(`${CONSOLE_MESSAGES.FETCHED_COMMENTS}`, comments.length)
    
    dispatch(SetComments, comments.filter((c: Comment) => c && !c.deleted))
  } catch (error) {
    console.error(`${CONSOLE_MESSAGES.ERROR_COMMENTS}`, error)
    dispatch(SetError, error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_LOAD_COMMENTS)
  }
}