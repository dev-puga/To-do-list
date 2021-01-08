import React from 'react'
import ReactDOM from 'react-dom'
import TaskManager from '../components/task_manager'

const App = () =>
  <TaskManager />

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <App />,
    document.body.appendChild(document.createElement('div')),
  )
})
