import './style.css'
import { app } from 'hyperapp'
import { CONSOLE_MESSAGES } from './constants'
import { initialState } from './state'
import { fetchTopStoriesEffect } from './api'
import { view } from './view'

console.log(CONSOLE_MESSAGES.INITIALIZING_APP)

// Initialize the Hyperapp application
app({
  init: [initialState, [fetchTopStoriesEffect]],
  view,
  node: document.getElementById('app')!
})