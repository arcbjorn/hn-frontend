import { h, text } from 'hyperapp'
import { AppState } from './types'
import { ViewType, UI_TEXT, GRUVBOX_COLORS } from './constants'
import { SetView } from './state'
import { 
  Header, 
  StoryItem, 
  CommentItem, 
  SkeletonLoader, 
  SkeletonCommentsLoader 
} from './components'

// Color mapping
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

export const view = (state: AppState) => {
  console.log('Rendering with state:', state)
  
  return h('div', { class: 'app' }, [
    // Header
    Header(state),
    
    // Main content with gruvbox styling
    h('div', { 
      style: { 
        flex: 1,
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px',
        width: '100%',
        minHeight: '80vh',
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
        
        !state.loading && state.stories && state.stories.length > 0 && h('div', { 
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
              h('span', {}, text(`${state.currentStory.score} ${UI_TEXT.POINTS_SUFFIX}`)),
              h('span', {}, text(`by ${state.currentStory.by}`)),
              h('span', {}, text(`${state.currentStory.descendants} ${UI_TEXT.COMMENTS_SUFFIX}`))
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
            overflow: 'hidden',
            border: '1px solid ' + colors.border,
            boxShadow: '0 8px 32px rgba(40, 40, 40, 0.3)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
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
}