import './style.css'
import { app, h, text } from 'hyperapp'
import { 
  ApiEndpoints, 
  FirebaseEndpoints, 
  PageType, 
  ViewType, 
  NavigationLabels,
  UI_TEXT,
  TIME_FORMATS,
  ERROR_MESSAGES,
  CONSOLE_MESSAGES,
  CSS_CLASSES,
  SEARCH_PARAMS,
  LIMITS,
  GRUVBOX_COLORS
} from './constants'

console.log(CONSOLE_MESSAGES.LOADING_APP)

// Enhanced color palette for better readability
const colors = {
  primary: GRUVBOX_COLORS.PRIMARY,
  secondary: GRUVBOX_COLORS.SECONDARY,
  accent: GRUVBOX_COLORS.ACCENT,
  success: GRUVBOX_COLORS.SUCCESS,
  background: GRUVBOX_COLORS.BACKGROUND,
  surface: GRUVBOX_COLORS.SURFACE,
  surfaceHover: GRUVBOX_COLORS.SURFACE_HOVER,
  text: GRUVBOX_COLORS.TEXT,
  textMuted: GRUVBOX_COLORS.TEXT_MUTED,
  textFaded: GRUVBOX_COLORS.TEXT_FADED,
  border: GRUVBOX_COLORS.BORDER,
  borderLight: GRUVBOX_COLORS.BORDER_LIGHT
}

// Actions that return new state
const SetLoading = (state: any): any => ({ ...state, loading: true, error: null })
const SetStories = (state: any, stories: any[]): any => ({ ...state, stories, loading: false, error: null })
const SetError = (state: any, error: string): any => ({ ...state, loading: false, error })
const SetSearchQuery = (state: any, query: string): any => ({ ...state, searchQuery: query })
const SetCurrentPage = (state: any, page: string): any => ({ ...state, currentPage: page, loading: true, error: null })
const SetComments = (state: any, comments: any[], story: any): any => ({ ...state, comments, currentStory: story, loading: false, error: null, view: ViewType.COMMENTS })
const SetView = (state: any, view: string): any => ({ ...state, view, comments: [], currentStory: null })

const LoadTopStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: PageType.TOP },
  [fetchTopStoriesEffect]
]
const LoadNewStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: PageType.NEW },
  [fetchNewStoriesEffect]  
]
const LoadAskStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: PageType.ASK },
  [fetchAskStoriesEffect]
]
const LoadShowStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: PageType.SHOW },
  [fetchShowStoriesEffect]
]
const LoadJobStories = (state: any): any => [
  { ...state, loading: true, error: null, currentPage: PageType.JOBS },
  [fetchJobStoriesEffect]
]
const SearchStories = (state: any, query: string): any => [
  { ...state, loading: true, error: null, searchQuery: query, currentPage: PageType.SEARCH },
  [searchStoriesEffect, query]
]
const LoadComments = (state: any, story: any): any => [
  { ...state, loading: true, error: null, view: ViewType.COMMENTS, currentStory: story },
  [fetchCommentsEffect, story]
]

// Helper function to fetch stories by endpoint
const fetchStoriesByEndpoint = async (dispatch: any, endpoint: string, name: string) => {
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
const fetchTopStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.TOP_STORIES, PageType.TOP)
const fetchNewStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.NEW_STORIES, PageType.NEW)  
const fetchAskStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.ASK_STORIES, PageType.ASK)
const fetchShowStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.SHOW_STORIES, PageType.SHOW)
const fetchJobStoriesEffect = (dispatch: any) => fetchStoriesByEndpoint(dispatch, FirebaseEndpoints.JOB_STORIES, PageType.JOBS)

// Effect for searching stories using Algolia API
const searchStoriesEffect = async (dispatch: any, query: string) => {
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

// Utility functions
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now() / 1000
  const diff = now - timestamp
  
  if (diff < 60) return `${Math.floor(diff)} ${TIME_FORMATS.SECONDS_AGO}`
  if (diff < 3600) return `${Math.floor(diff / 60)} ${TIME_FORMATS.MINUTES_AGO}`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${TIME_FORMATS.HOURS_AGO}`
  return `${Math.floor(diff / 86400)} ${TIME_FORMATS.DAYS_AGO}`
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
    
    dispatch(SetComments, comments.filter(c => c && !c.deleted), story)
  } catch (error) {
    console.error(`${CONSOLE_MESSAGES.ERROR_COMMENTS}`, error)
    dispatch(SetError, error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_LOAD_COMMENTS)
  }
}

// Story component - Larger, more aesthetic layout
const StoryItem = (story: any) =>
  h('tr', { 
    class: CSS_CLASSES.STORY_ROW,
    style: {
      borderBottom: '1px solid ' + colors.border
    }
  }, [
    // Rank and voting column
    h('td', { 
      class: CSS_CLASSES.RANK_CELL,
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
      class: CSS_CLASSES.VOTE_CELL,
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
          transition: 'color 0.2s ease'
        },
        onmouseover: (state: any, event: any) => {
          event.target.style.color = colors.accent
          return state
        },
        onmouseout: (state: any, event: any) => {
          event.target.style.color = colors.primary
          return state
        }
      }, text(UI_TEXT.VOTE_ARROW))
    ]),
    // Story content column
    h('td', { 
      class: CSS_CLASSES.STORY_CONTENT,
      style: { 
        paddingRight: '24px',
        paddingBottom: '16px',
        paddingTop: '12px'
      }
    }, [
      // Title line
      h('div', { 
        class: CSS_CLASSES.TITLE_LINE, 
        style: { 
          marginBottom: '8px',
          lineHeight: '1.5'
        } 
      }, [
        story.url 
          ? h('a', { 
              href: story.url, 
              target: '_blank',
              class: CSS_CLASSES.STORY_LINK,
              style: { 
                color: colors.text, 
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '1.5',
                letterSpacing: '0.01em',
                transition: 'color 0.2s ease'
              },
              onmouseover: (state: any, event: any) => {
                event.target.style.color = colors.primary
                return state
              },
              onmouseout: (state: any, event: any) => {
                event.target.style.color = colors.text
                return state
              }
            }, text(story.title))
          : h('span', { 
              style: { 
                color: colors.text,
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '1.5',
                letterSpacing: '0.01em'
              }
            }, text(story.title)),
        story.url && h('span', { 
          class: CSS_CLASSES.DOMAIN,
          style: { 
            color: colors.textFaded, 
            fontSize: '13px',
            marginLeft: '10px',
            fontWeight: '400',
            opacity: '0.8'
          }
        }, text(`(${extractDomain(story.url)})`))
      ]),
      // Subtext line
      h('div', { 
        class: CSS_CLASSES.SUBTEXT,
        style: { 
          fontSize: '13px', 
          color: colors.textMuted,
          lineHeight: '1.4',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '6px'
        }
      }, [
        h('span', { style: { color: colors.accent, fontWeight: '500' } }, text(`${story.score || 0} ${UI_TEXT.POINTS_SUFFIX}`)),
        text(UI_TEXT.BY_TEXT),
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
        text(UI_TEXT.SEPARATOR),
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
        }, text(`${story.descendants || 0} ${UI_TEXT.COMMENTS_SUFFIX}`))
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
        marginBottom: '12px',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        maxWidth: '100%'
      },
      innerHTML: comment.text || ''
    }),
    comment.replies && comment.replies.length > 0 && h('div', { 
      style: { marginTop: '12px' }
    }, comment.replies.filter((reply: any) => reply).map((reply: any) => CommentItem(reply, level + 1)))
  ])
}

// Skeleton loader components
const SkeletonLine = (width: string) =>
  h('div', {
    style: {
      height: '16px',
      backgroundColor: colors.surfaceHover,
      borderRadius: '4px',
      width
    }
  })

const SkeletonStoryItem = () =>
  h('tr', { style: { borderBottom: '1px solid ' + colors.border } }, [
    h('td', { 
      style: { 
        width: '50px', 
        padding: '12px 15px 12px 0',
        textAlign: 'right',
        verticalAlign: 'top'
      }
    }, [SkeletonLine('20px')]),
    h('td', { 
      style: { 
        width: '25px', 
        padding: '12px 0',
        textAlign: 'center',
        verticalAlign: 'top'
      }
    }, [SkeletonLine('12px')]),
    h('td', { 
      style: { 
        padding: '12px 20px 12px 0'
      }
    }, [
      h('div', { style: { marginBottom: '8px' } }, [SkeletonLine('75%')]),
      h('div', { style: { display: 'flex', gap: '12px' } }, [
        SkeletonLine('60px'),
        SkeletonLine('80px'),
        SkeletonLine('90px')
      ])
    ])
  ])

const SkeletonLoader = () =>
  h('div', { 
    style: { 
      backgroundColor: colors.surface,
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid ' + colors.border
    }
  }, [
    h('table', { 
      style: { 
        borderCollapse: 'collapse',
        width: '100%'
      }
    }, [
      h('tbody', {}, Array.from({ length: 10 }, (_, i) => SkeletonStoryItem()))
    ])
  ])

const SkeletonComment = (level = 0) =>
  h('div', { 
    style: { 
      paddingLeft: (level * 20) + 'px',
      borderBottom: '1px solid ' + colors.border,
      padding: '12px ' + (20 - level * 2) + 'px'
    }
  }, [
    h('div', { style: { marginBottom: '8px' } }, [SkeletonLine('40%')]),
    h('div', { style: { marginBottom: '8px' } }, [SkeletonLine('90%')]),
    h('div', { style: { marginBottom: '8px' } }, [SkeletonLine('70%')])
  ])

const SkeletonCommentsLoader = () =>
  h('div', { 
    style: { 
      backgroundColor: colors.surface,
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid ' + colors.border,
      marginTop: '20px'
    }
  }, Array.from({ length: 8 }, (_, i) => SkeletonComment(i % 3)))

const view = (state: any) => {
  console.log('Rendering with state:', state)
  return h('div', { class: 'app' }, [
    // Enhanced header with better symmetry
    h('div', { 
      style: { 
        width: '100%', 
        backgroundColor: colors.surface, 
        padding: '16px 24px',
        boxShadow: '0 4px 20px rgba(40, 40, 40, 0.5)',
        borderBottom: '1px solid ' + colors.border
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
                backgroundColor: colors.primary,
                border: '2px solid ' + colors.primary,
                fontSize: '18px',
                textAlign: 'center',
                lineHeight: '28px',
                color: colors.background,
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
            h('a', {
              href: '#',
              onclick: LoadTopStories,
              style: {
                textDecoration: 'none',
                cursor: 'pointer'
              }
            }, [
              h('h1', { 
                style: { 
                  fontSize: '18px', 
                  color: colors.text,
                  fontWeight: 'bold',
                  margin: '0',
                  transition: 'color 0.2s ease'
                },
                onmouseover: (state: any, event: any) => {
                  event.target.style.color = colors.primary
                  return state
                },
                onmouseout: (state: any, event: any) => {
                  event.target.style.color = colors.text
                  return state
                }
              }, text(UI_TEXT.SITE_TITLE))
            ]),
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
                  color: state.currentPage === PageType.NEW ? colors.text : colors.textMuted, 
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: state.currentPage === PageType.NEW ? colors.primary + '20' : 'transparent',
                  transition: 'color 0.2s ease'
                },
                onmouseover: (state: any, event: any) => {
                  if (state.currentPage !== 'new') {
                    event.target.style.color = colors.text
                  }
                  return state
                },
                onmouseout: (state: any, event: any) => {
                  if (state.currentPage !== 'new') {
                    event.target.style.color = colors.textMuted
                  }
                  return state
                }
              }, text(NavigationLabels.NEW)),
              h('a', { 
                href: '#',
                onclick: LoadAskStories,
                style: { 
                  color: state.currentPage === PageType.ASK ? colors.text : colors.textMuted, 
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: state.currentPage === PageType.ASK ? colors.primary + '20' : 'transparent',
                  transition: 'color 0.2s ease'
                },
                onmouseover: (state: any, event: any) => {
                  if (state.currentPage !== 'ask') {
                    event.target.style.color = colors.text
                  }
                  return state
                },
                onmouseout: (state: any, event: any) => {
                  if (state.currentPage !== 'ask') {
                    event.target.style.color = colors.textMuted
                  }
                  return state
                }
              }, text(NavigationLabels.ASK)),
              h('a', { 
                href: '#',
                onclick: LoadShowStories,
                style: { 
                  color: state.currentPage === PageType.SHOW ? colors.text : colors.textMuted, 
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: state.currentPage === PageType.SHOW ? colors.primary + '20' : 'transparent',
                  transition: 'color 0.2s ease'
                },
                onmouseover: (state: any, event: any) => {
                  if (state.currentPage !== 'show') {
                    event.target.style.color = colors.text
                  }
                  return state
                },
                onmouseout: (state: any, event: any) => {
                  if (state.currentPage !== 'show') {
                    event.target.style.color = colors.textMuted
                  }
                  return state
                }
              }, text(NavigationLabels.SHOW)),
              h('a', { 
                href: '#',
                onclick: LoadJobStories,
                style: { 
                  color: state.currentPage === PageType.JOBS ? colors.text : colors.textMuted, 
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: state.currentPage === PageType.JOBS ? colors.primary + '20' : 'transparent',
                  transition: 'color 0.2s ease'
                },
                onmouseover: (state: any, event: any) => {
                  if (state.currentPage !== 'jobs') {
                    event.target.style.color = colors.text
                  }
                  return state
                },
                onmouseout: (state: any, event: any) => {
                  if (state.currentPage !== 'jobs') {
                    event.target.style.color = colors.textMuted
                  }
                  return state
                }
              }, text(NavigationLabels.JOBS))
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
              padding: '10px 16px',
              width: '240px',
              border: '1px solid ' + colors.border,
              borderRadius: '8px',
              backgroundColor: colors.background,
              color: colors.text,
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            },
            onfocus: (state: any, event: any) => {
              event.target.style.borderColor = colors.primary
              event.target.style.boxShadow = `0 0 0 3px ${colors.primary}20, 0 4px 12px rgba(0, 0, 0, 0.3)`
              return state
            },
            onblur: (state: any, event: any) => {
              event.target.style.borderColor = colors.border
              event.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
              return state
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
        color: colors.text,
        overflowX: 'hidden',
        width: '100%',
        boxSizing: 'border-box'
      }
    }, [
      h('div', { 
        style: { 
          maxWidth: '1200px',
          margin: '0 auto',
          overflowX: 'hidden',
          wordWrap: 'break-word'
        }
      }, [
        // Show stories view or comments view
        (!state.view || state.view === ViewType.STORIES) ? h('div', {}, [
          state.loading && SkeletonLoader(),
          
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
              border: '1px solid ' + colors.border,
              boxShadow: '0 8px 32px rgba(40, 40, 40, 0.3)'
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
          }, text(UI_TEXT.NO_STORIES_FOUND))
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
              onclick: (state: any) => SetView(state, ViewType.STORIES),
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
            }, text(UI_TEXT.BACK_TO_STORIES)),
            
            state.currentStory && h('div', { 
              style: { 
                backgroundColor: colors.surface,
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #333'
              }
            }, [
              state.currentStory.url ? 
                h('a', {
                  href: state.currentStory.url,
                  target: '_blank',
                  style: {
                    textDecoration: 'none',
                    color: colors.text,
                    transition: 'color 0.2s ease'
                  },
                  onmouseover: (state: any, event: any) => {
                    event.target.style.color = colors.primary
                    return state
                  },
                  onmouseout: (state: any, event: any) => {
                    event.target.style.color = colors.text
                    return state
                  }
                }, [
                  h('h2', { 
                    style: { 
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      color: 'inherit'
                    }
                  }, text(state.currentStory.title))
                ]) :
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
          state.loading && SkeletonCommentsLoader(),
          
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
              border: '1px solid ' + colors.border,
              overflowX: 'hidden',
              wordWrap: 'break-word',
              maxWidth: '100%'
            }
          }, state.comments.map((comment: any) => CommentItem(comment))),
          
          !state.loading && state.comments && state.comments.length === 0 && h('div', {
            style: { 
              color: colors.textFaded,
              fontSize: '16px',
              padding: '40px',
              textAlign: 'center'
            }
          }, text(UI_TEXT.NO_COMMENTS_YET))
        ])
      ])
    ])
  ]) // close the main h('div', { class: 'app' }, [ array
}

const initialState = {
  stories: [],
  loading: true,
  error: null,
  searchQuery: '',
  currentPage: PageType.TOP,
  view: ViewType.STORIES,
  comments: [],
  currentStory: null
}

console.log(CONSOLE_MESSAGES.INITIALIZING_APP)

app({
  init: [initialState, [fetchTopStoriesEffect]],
  view,
  node: document.getElementById('app')!
})

console.log('App initialized')