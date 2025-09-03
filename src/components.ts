import { h, text } from 'hyperapp'
import { Story, Comment, AppState } from './types'
import { 
  UI_TEXT, 
  CSS_CLASSES, 
  GRUVBOX_COLORS, 
  NavigationLabels,
  PageType,
  ViewType 
} from './constants'
import { formatTimeAgo, extractDomain } from './utils'
import { 
  LoadTopStories,
  LoadNewStories,
  LoadAskStories, 
  LoadShowStories,
  LoadJobStories,
  LoadComments,
  SetView
} from './state'

// Color mapping for easier access
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

// Story component
export const StoryItem = (story: Story) =>
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
        paddingTop: '8px',
        paddingRight: '8px'
      }
    }, [
      h('div', {
        style: {
          color: colors.primary,
          fontSize: '12px',
          cursor: 'pointer',
          padding: '2px',
          width: '20px',
          height: '20px',
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

// Comment component
export const CommentItem = (comment: Comment, level: number = 0) => {
  if (!comment) return null

  return h('div', { 
    style: { 
      paddingLeft: (level * 20) + 'px',
      borderBottom: '1px solid ' + colors.border,
      padding: '12px ' + (20 - level * 2) + 'px'
    }
  }, [
    h('div', { 
      style: { 
        fontSize: '11px', 
        color: colors.textMuted,
        marginBottom: '8px' 
      }
    }, [
      text(`${comment.by || 'unknown'} ${formatTimeAgo(comment.time)}`)
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
    comment.replies && comment.replies.map((reply: Comment) => CommentItem(reply, level + 1))
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

export const SkeletonLoader = () =>
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

export const SkeletonCommentsLoader = () =>
  h('div', { 
    style: { 
      backgroundColor: colors.surface,
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid ' + colors.border,
      marginTop: '20px'
    }
  }, Array.from({ length: 8 }, (_, i) => SkeletonComment(i % 3)))

// Navigation components
export const NavigationLinks = (state: AppState) => 
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

// Header component
export const Header = (state: AppState) =>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }
    }, [
      h('div', { 
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
        NavigationLinks(state)
      ])
    ])
  ])