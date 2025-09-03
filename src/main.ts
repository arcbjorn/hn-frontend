import './style.css'
import { app, h, text } from 'hyperapp'

console.log('Loading app...')

// Softer color palette
const colors = {
  primary: '#2a4d52',      // Softer teal instead of bright cyan
  secondary: '#7a6d9e',    // Muted purple instead of bright purple  
  accent: '#cc9966',       // Warm orange instead of bright orange
  background: '#0a0a0a',   // Deep black
  surface: '#1a1a1a',     // Dark gray
  text: '#e0e0e0',        // Light gray
  textMuted: '#a0a0a0',   // Medium gray
  textFaded: '#666666'    // Darker gray
}

// Actions that return new state
const SetLoading = (state: any): any => ({ ...state, loading: true, error: null })
const SetStories = (state: any, stories: any[]): any => ({ ...state, stories, loading: false, error: null })
const SetError = (state: any, error: string): any => ({ ...state, loading: false, error })
const SetSearchQuery = (state: any, query: string): any => ({ ...state, searchQuery: query })
const SetCurrentPage = (state: any, page: string): any => ({ ...state, currentPage: page, loading: true, error: null })
const SetComments = (state: any, comments: any[], story: any): any => ({ ...state, comments, currentStory: story, loading: false, error: null, view: 'comments' })
const SetView = (state: any, view: string): any => ({ ...state, view, comments: [], currentStory: null })

const LoadTopStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: 'top' },
  [fetchTopStoriesEffect]
]
const LoadNewStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: 'new' },
  [fetchNewStoriesEffect]  
]
const LoadAskStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: 'ask' },
  [fetchAskStoriesEffect]
]
const LoadShowStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: 'show' },
  [fetchShowStoriesEffect]
]
const LoadJobStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: 'jobs' },
  [fetchJobStoriesEffect]
]
const SearchStories = (state: any, query: string): any => [
  { ...state, loading: true, error: null, searchQuery: query, currentPage: 'search' },
  [searchStoriesEffect, query]
]
const LoadComments = (state: any, story: any): any => [
  { ...state, loading: true, error: null, view: 'comments', currentStory: story },
  [fetchCommentsEffect, story]
]

// Helper function to fetch stories by endpoint
const fetchStoriesByEndpoint = async (dispatch: any, endpoint: string, name: string) => {
  try {
    console.log(`Fetching ${name} stories from Firebase API...`)
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/${endpoint}.json`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const storyIds = await response.json()
    console.log(`Got ${name} story IDs:`, storyIds.length)
    
    // Fetch first 30 stories
    const storyPromises = storyIds.slice(0, 30).map(async (id: number, index: number) => {
      const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      const story = await storyResponse.json()
      return { ...story, rank: index + 1 }
    })
    
    const stories = await Promise.all(storyPromises)
    console.log(`Fetched ${name} stories from Firebase:`, stories.length)
    
    dispatch(SetStories, stories)
  } catch (error) {
    console.error(`Error loading ${name} stories:`, error)
    dispatch(SetError, error instanceof Error ? error.message : `Failed to load ${name} stories`)
  }
}

// Effect for fetching different story types
const fetchTopStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, 'topstories', 'top')
const fetchNewStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, 'newstories', 'new')  
const fetchAskStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, 'askstories', 'ask')
const fetchShowStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, 'showstories', 'show')
const fetchJobStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, 'jobstories', 'job')

// Effect for searching stories using Algolia API
const searchStoriesEffect = async (dispatch: any, query: string) => {
  try {
    console.log('Searching stories with query:', query)
    const response = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=30`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Got search results from Algolia:', data.hits.length)
    
    const stories = data.hits.map((hit: any, index: number) => ({
      id: hit.objectID,
      title: hit.title || hit._highlightResult?.title?.value?.replace(/<[^>]*>/g, '') || 'No title',
      url: hit.url,
      score: hit.points || 0,
      by: hit.author || 'Unknown',
      time: hit.created_at_i,
      descendants: hit.num_comments || 0,
      rank: index + 1
    }))
    
    console.log('Processed search results:', stories.length)
    dispatch(SetStories, stories)
  } catch (error) {
    console.error('Error searching stories:', error)
    dispatch(SetError, error instanceof Error ? error.message : 'Failed to search stories')
  }
}

// Utility functions
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now() / 1000
  const diff = now - timestamp
  
  if (diff < 60) return `${Math.floor(diff)} seconds ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  return `${Math.floor(diff / 86400)} days ago`
}

const extractDomain = (url: string): string => {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Effect for fetching comments
const fetchCommentsEffect = async (dispatch: any, story: any) => {
  try {
    console.log('Fetching comments for story:', story.id)
    
    // Get the story with kids array
    const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${story.id}.json`)
    const storyWithKids = await storyResponse.json()
    
    if (!storyWithKids.kids || storyWithKids.kids.length === 0) {
      dispatch(SetComments, [], story)
      return
    }
    
    // Fetch top-level comments
    const commentPromises = storyWithKids.kids.slice(0, 20).map(async (commentId: number) => {
      const commentResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${commentId}.json`)
      const comment = await commentResponse.json()
      
      // Fetch replies for each comment
      if (comment && comment.kids && comment.kids.length > 0) {
        const replyPromises = comment.kids.slice(0, 5).map(async (replyId: number) => {
          const replyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${replyId}.json`)
          return replyResponse.json()
        })
        comment.replies = await Promise.all(replyPromises)
      } else {
        comment.replies = []
      }
      
      return comment
    })
    
    const comments = await Promise.all(commentPromises)
    console.log('Fetched comments:', comments.length)
    
    dispatch(SetComments, comments.filter(c => c && !c.deleted), story)
  } catch (error) {
    console.error('Error loading comments:', error)
    dispatch(SetError, error instanceof Error ? error.message : 'Failed to load comments')
  }
}

// Story component - Larger, more aesthetic layout
const StoryItem = (story: any) =>
  h('tr', { class: 'story-row' }, [
    // Rank and voting column
    h('td', { 
      class: 'rank-cell',
      style: { 
        width: '50px', 
        textAlign: 'right', 
        paddingRight: '15px',
        verticalAlign: 'top',
        color: '#666',
        fontSize: '14px',
        paddingTop: '8px'
      }
    }, [
      text(story.rank ? `${story.rank}.` : '')
    ]),
    h('td', { 
      class: 'vote-cell',
      style: { 
        width: '25px', 
        textAlign: 'center',
        verticalAlign: 'top',
        paddingTop: '8px'
      }
    }, [
      h('div', { 
        class: 'upvote',
        style: { 
          width: '16px', 
          height: '16px', 
          cursor: 'pointer',
          border: '0px',
          background: 'transparent',
          fontSize: '12px',
          color: colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '2px',
          transition: 'all 0.2s ease'
        },
        onmouseover: (state: any, event: any) => {
          event.target.style.backgroundColor = 'rgba(42, 77, 82, 0.2)'
          return state
        },
        onmouseout: (state: any, event: any) => {
          event.target.style.backgroundColor = 'transparent'
          return state
        }
      }, text('▲'))
    ]),
    // Story content column
    h('td', { 
      class: 'story-content',
      style: { 
        paddingRight: '20px',
        paddingBottom: '12px',
        paddingTop: '8px'
      }
    }, [
      // Title line
      h('div', { 
        class: 'title-line', 
        style: { 
          marginBottom: '6px',
          lineHeight: '1.4'
        } 
      }, [
        story.url 
          ? h('a', { 
              href: story.url, 
              target: '_blank',
              class: 'story-link',
              style: { 
                color: '#e0e0e0', 
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s ease'
              },
              onmouseover: (state: any, event: any) => {
                event.target.style.color = '#64ffda'
                return state
              },
              onmouseout: (state: any, event: any) => {
                event.target.style.color = '#e0e0e0'
                return state
              }
            }, text(story.title))
          : h('span', { 
              style: { 
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '500'
              }
            }, text(story.title)),
        story.url && h('span', { 
          class: 'domain',
          style: { 
            color: '#888', 
            fontSize: '11px',
            marginLeft: '8px',
            fontWeight: '400'
          }
        }, text(`(${extractDomain(story.url)})`))
      ]),
      // Subtext line
      h('div', { 
        class: 'subtext',
        style: { 
          fontSize: '11px', 
          color: colors.textMuted,
          lineHeight: '1.3',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }
      }, [
        h('span', { style: { color: colors.accent, fontWeight: '500' } }, text(`${story.score || 0} points`)),
        text('by'),
        h('a', { 
          href: `#`, 
          style: { 
            color: colors.primary, 
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          },
          onmouseover: (state: any, event: any) => {
            event.target.style.color = colors.secondary
            return state
          },
          onmouseout: (state: any, event: any) => {
            event.target.style.color = colors.primary
            return state
          }
        }, text(story.by || 'unknown')),
        text(`${formatTimeAgo(story.time)}`),
        text('|'),
        h('a', { 
          href: `#`,
          onclick: (state: any) => LoadComments(state, story),
          style: { 
            color: colors.primary, 
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            cursor: 'pointer'
          },
          onmouseover: (state: any, event: any) => {
            event.target.style.color = colors.secondary
            return state
          },
          onmouseout: (state: any, event: any) => {
            event.target.style.color = colors.primary
            return state
          }
        }, text(`${story.descendants || 0} comments`))
      ])
    ])
  ])

// Comment component with nesting
const CommentItem = (comment: any, level: number = 0) => {
  if (!comment || comment.deleted) return null
  
  const indentSize = level * 20
  
  return h('div', { 
    style: { 
      marginLeft: `${indentSize}px`,
      marginBottom: '16px',
      borderLeft: level > 0 ? '2px solid rgba(42, 77, 82, 0.3)' : 'none',
      paddingLeft: level > 0 ? '12px' : '0px'
    }
  }, [
    h('div', { 
      style: { 
        fontSize: '11px',
        color: colors.textMuted,
        marginBottom: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }
    }, [
      h('span', { 
        style: { 
          color: colors.primary,
          fontWeight: '500'
        }
      }, text(comment.by || 'unknown')),
      text(`${formatTimeAgo(comment.time)}`),
      comment.replies && comment.replies.length > 0 && h('span', { 
        style: { color: colors.textFaded }
      }, text(`[+${comment.replies.length} replies]`))
    ]),
    h('div', { 
      style: { 
        fontSize: '13px',
        lineHeight: '1.5',
        color: colors.text,
        marginBottom: '12px'
      },
      innerHTML: comment.text || ''
    }),
    comment.replies && comment.replies.length > 0 && h('div', { 
      style: { marginTop: '12px' }
    }, comment.replies.filter((reply: any) => reply).map((reply: any) => CommentItem(reply, level + 1)))
  ])
}

const view = (state: any) => {
  console.log('Rendering with state:', state)
  return h('div', { class: 'app' }, [
    // Enhanced header with better symmetry
    h('div', { 
      style: { 
        width: '100%', 
        backgroundColor: colors.primary, 
        padding: '12px 20px',
        boxShadow: '0 2px 10px rgba(42, 77, 82, 0.3)'
      }
    }, [
      h('div', { 
        style: { 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }
      }, [
        // Logo and Navigation
        h('div', { 
          style: { 
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }
        }, [
          // Logo
          h('a', { 
            href: '#',
            onclick: LoadTopStories,
            style: { textDecoration: 'none' }
          }, [
            h('div', { 
              style: { 
                width: '32px', 
                height: '32px', 
                backgroundColor: '#0a0a0a',
                border: '2px solid #0a0a0a',
                fontSize: '18px',
                textAlign: 'center',
                lineHeight: '28px',
                color: colors.primary,
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }
            }, text('H'))
          ]),
          // Navigation
          h('nav', { 
            style: { 
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }
          }, [
            h('h1', { 
              style: { 
                fontSize: '16px', 
                color: '#ffffff',
                fontWeight: 'bold',
                margin: '0'
              }
            }, text('Hacker News')),
            h('div', { 
              style: { 
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '14px',
                fontWeight: '500'
              }
            }, [
              h('a', { 
                href: '#',
                onclick: LoadNewStories,
                style: { 
                  color: state.currentPage === 'new' ? '#ffffff' : '#e0e0e0', 
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: state.currentPage === 'new' ? 'rgba(122, 109, 158, 0.2)' : 'transparent',
                  transition: 'all 0.2s ease'
                }
              }, text('new')),
              h('a', { 
                href: '#',
                onclick: LoadAskStories,
                style: { 
                  color: state.currentPage === 'ask' ? '#ffffff' : '#e0e0e0', 
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: state.currentPage === 'ask' ? 'rgba(122, 109, 158, 0.2)' : 'transparent',
                  transition: 'all 0.2s ease'
                }
              }, text('ask')),
              h('a', { 
                href: '#',
                onclick: LoadShowStories,
                style: { 
                  color: state.currentPage === 'show' ? '#ffffff' : '#e0e0e0', 
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: state.currentPage === 'show' ? 'rgba(122, 109, 158, 0.2)' : 'transparent',
                  transition: 'all 0.2s ease'
                }
              }, text('show')),
              h('a', { 
                href: '#',
                onclick: LoadJobStories,
                style: { 
                  color: state.currentPage === 'jobs' ? '#ffffff' : '#e0e0e0', 
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: state.currentPage === 'jobs' ? 'rgba(122, 109, 158, 0.2)' : 'transparent',
                  transition: 'all 0.2s ease'
                }
              }, text('jobs'))
            ])
          ])
        ]),
        
        // Search box
        h('div', { 
          style: { 
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }
        }, [
          h('input', {
            type: 'text',
            placeholder: 'Search stories...',
            value: state.searchQuery || '',
            oninput: (state: any, event: any) => SetSearchQuery(state, event.target.value),
            onkeydown: (state: any, event: any) => {
              if (event.key === 'Enter' && event.target.value.trim()) {
                return SearchStories(state, event.target.value.trim())
              }
              return state
            },
            style: {
              fontSize: '14px',
              padding: '8px 12px',
              width: '200px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              outline: 'none',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }
          })
        ])
      ])
    ]),
    
    // Main content with better layout
    h('div', { 
      style: { 
        padding: '24px',
        backgroundColor: colors.background,
        minHeight: '100vh',
        color: colors.text
      }
    }, [
      h('div', { 
        style: { 
          maxWidth: '1200px',
          margin: '0 auto'
        }
      }, [
        // Show stories view or comments view
        (!state.view || state.view === 'stories') ? h('div', {}, [
          state.loading && h('div', { 
            style: { 
              color: colors.primary, 
              fontSize: '16px',
              padding: '20px',
              textAlign: 'center'
            }
          }, text('Loading...')),
          
          state.error && h('div', { 
            style: { 
              color: colors.accent, 
              fontSize: '14px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: 'rgba(204, 153, 102, 0.1)',
              border: '1px solid rgba(204, 153, 102, 0.3)',
              borderRadius: '8px'
            }
          }, text(`Error: ${state.error}`)),
          
          state.stories && state.stories.length > 0 && h('div', { 
            style: { 
              backgroundColor: colors.surface,
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #333'
            }
          }, [
            h('table', { 
              style: { 
                borderCollapse: 'collapse',
                width: '100%'
              }
            }, [
              h('tbody', {}, state.stories.map((story: any) => StoryItem(story)))
            ])
          ]),
          
          !state.loading && state.stories && state.stories.length === 0 && h('div', {
            style: { 
              color: colors.textFaded, 
              fontSize: '16px',
              padding: '40px',
              textAlign: 'center'
            }
          }, text('No stories found'))
        ]) : h('div', {}, [
          // Back button and story header
          h('div', { 
            style: { 
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #333'
            }
          }, [
            h('button', {
              onclick: (state: any) => SetView(state, 'stories'),
              style: {
                backgroundColor: 'transparent',
                border: '1px solid ' + colors.primary,
                color: colors.primary,
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '16px',
                transition: 'all 0.2s ease'
              }
            }, text('← Back to Stories')),
            
            state.currentStory && h('div', { 
              style: { 
                backgroundColor: colors.surface,
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #333'
              }
            }, [
              h('h2', { 
                style: { 
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  color: colors.text
                }
              }, text(state.currentStory.title)),
              h('div', { 
                style: { 
                  fontSize: '12px',
                  color: colors.textMuted,
                  display: 'flex',
                  gap: '12px'
                }
              }, [
                h('span', {}, text(`${state.currentStory.score} points`)),
                h('span', {}, text(`by ${state.currentStory.by}`)),
                h('span', {}, text(formatTimeAgo(state.currentStory.time)))
              ])
            ])
          ]),
          
          // Comments section
          state.loading && h('div', { 
            style: { 
              color: colors.primary,
              fontSize: '16px',
              padding: '20px',
              textAlign: 'center'
            }
          }, text('Loading comments...')),
          
          state.error && h('div', { 
            style: { 
              color: colors.accent,
              fontSize: '14px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: 'rgba(204, 153, 102, 0.1)',
              border: '1px solid rgba(204, 153, 102, 0.3)',
              borderRadius: '8px'
            }
          }, text(`Error: ${state.error}`)),
          
          state.comments && state.comments.length > 0 && h('div', {
            style: {
              backgroundColor: colors.surface,
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #333'
            }
          }, state.comments.map((comment: any) => CommentItem(comment))),
          
          !state.loading && state.comments && state.comments.length === 0 && h('div', {
            style: { 
              color: colors.textFaded,
              fontSize: '16px',
              padding: '40px',
              textAlign: 'center'
            }
          }, text('No comments yet'))
        ])
      ])
    ])
  ])
}

const initialState = {
  stories: [],
  loading: false,
  error: null,
  searchQuery: '',
  currentPage: 'top',
  view: 'stories',
  comments: [],
  currentStory: null
}

console.log('Initializing app')

app({
  init: [initialState, [fetchTopStoriesEffect]],
  view,
  node: document.getElementById('app')!
})

console.log('App initialized')