import React, { useState, useEffect, useRef, useReducer } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import TaskList from '../components/task_list'
import axios from 'axios'
import tasksReducer from '../reducers/tasks_reducer'
import useHistory from '../custom_hooks/use_history'

const TaskManager = () => {
  const CONFLICT_HTTP_STATUS_CODE = 409
  const TASKS_FILTERS = {
    all: 0,
    pending: 1,
    completed: 2,
  }

  const API_BASE_URL = '/api/v1/tasks'

  const [tasks, tasksDispatcher] = useReducer(tasksReducer, [])
  const [filters, setFilters] = useState(TASKS_FILTERS.all)
  const newTaskTitleRef = useRef(null)
  const [
    history,
    addActionToHistory,
    previousHistoryAction,
    nextHistoryAction,
    undoRedoLinks,
  ] = useHistory()
  const [idMappings, setIdMappings] = useState({})

  const breadcrumbedTasksDispatcher = (action, allowUndo = true) => {
    tasksDispatcher(action)

    if (allowUndo) addActionToHistory(action)
  }

  useEffect(() => {
    axios
      .get(API_BASE_URL)
      .then(response => {
        breadcrumbedTasksDispatcher(
          { type: 'load', payload: { tasks: response.data } },
          false
        )
      })
      .catch(console.log)
  }, [])

  const pendingTasks = tasks.filter(task => !task.completed)
  const completedTasks = tasks.filter(task => task.completed)

  const tasksPluralSuffix = pendingTasks.length > 1 && 's'

  const updateFilters = filterType => event => {
    event.preventDefault()
    setFilters(filterType)
  }

  let visibleTasks

  switch (filters) {
    case TASKS_FILTERS.all:
      visibleTasks = tasks
      break
    case TASKS_FILTERS.pending:
      visibleTasks = pendingTasks
      break
    case TASKS_FILTERS.completed:
      visibleTasks = completedTasks
  }

  const deleteTask = (task, allowUndo = true) => {
    axios
      .delete([API_BASE_URL, task.id].join('/'))
      .then(_response => {
        breadcrumbedTasksDispatcher(
          { type: 'delete', payload: { task } },
          allowUndo
        )
      })
      .catch(console.log)
  }

  const changeTaskTitle = (task, newTitle, allowUndo = true) => {
    if (task.title !== newTitle) {
      axios
        .patch([API_BASE_URL, task.id].join('/'), { title: newTitle })
        .then(_response => {
          breadcrumbedTasksDispatcher(
            { type: 'update', payload: { task, title: newTitle } },
            allowUndo
          )
        })
        .catch(console.log)
    }
  }

  const changeTaskStatus = (task, newCompleted, allowUndo = true) => {
    if (task.completed !== newCompleted) {
      axios
        .patch([API_BASE_URL, task.id].join('/'), { completed: newCompleted })
        .then(_response => {
          breadcrumbedTasksDispatcher(
            { type: 'update', payload: { task, completed: newCompleted } },
            allowUndo
          )
        })
        .catch(console.log)
    }
  }

  const checkIfNewTaskSubmitted = event => {
    const KEYS = { enter: 13, escape: 27 }
    const keyPressed = event.which || event.charCode

    switch (keyPressed) {
      case KEYS['enter']:
        _addNewTask(newTaskTitleRef.current.value.trim(), false)
        break
      case KEYS['escape']:
        newTaskTitleRef.current.value = ''
        break
    }
  }

  const _addNewTask = (newTitle, newActive, allowUndo = true) => {
    if (newTitle !== '') {
      return axios
        .post(API_BASE_URL, { title: newTitle, completed: newActive })
        .then(response => {
          const newTask = response.data

          breadcrumbedTasksDispatcher(
            { type: 'add', payload: { task: newTask } },
            allowUndo
          )

          newTaskTitleRef.current.value = ''

          return newTask
        })
        .catch(console.log)
    }
  }

  const exitAddMode = _event =>
    _addNewTask(newTaskTitleRef.current.value.trim(), false)

  const clearCompleted = _event => _clearCompleted()

  const _clearCompleted = (allowUndo = true) => {
    if (completedTasks.length > 0) {
      axios
        .post([API_BASE_URL, 'destroy_completed'].join('/'), {
          ids: completedTasks.map(task => task.id),
        })
        .then(_response => {
          breadcrumbedTasksDispatcher(
            {
              type: 'clearCompleted',
              payload: { tasks: completedTasks },
            },
            allowUndo
          )
        })
        .catch(console.log)
    }
  }

  const toggleTasksStatuses = event => _toggleTasksStatus()

  const _toggleTasksStatus = (allowUndo = true) => {
    const newCompleted = event.target.checked
    const targetTasks = newCompleted ? pendingTasks : completedTasks

    axios
      .put([API_BASE_URL, 'batch_update_status'].join('/'), {
        ids: targetTasks.map(task => task.id),
        completed: newCompleted,
      })
      .then(_response => {
        breadcrumbedTasksDispatcher(
          {
            type: 'toggleTasksStatuses',
            payload: { tasks: targetTasks, completed: newCompleted },
          },
          allowUndo
        )
      })
      .catch(err => {
        if (err.response && err.response.status === CONFLICT_HTTP_STATUS_CODE)
          alert('Please refresh the page and reexecute your operation.')
        else console.log(err)
      })
  }

  const findMappedId = id => {
    let mappedId = id

    while (idMappings[mappedId]) {
      mappedId = idMappings[mappedId]
    }

    return mappedId
  }

  const mappedTask = task => {
    const mappedId = findMappedId(task.id)
    const targetTask = tasks.find(t => t.id === mappedId)

    return targetTask
  }

  const Undo = event => {
    event.preventDefault()

    const { type, payload } = previousHistoryAction()
    let mappedPayloadTask

    switch (type) {
      case 'add':
        mappedPayloadTask = mappedTask(payload.task)

        deleteTask(mappedPayloadTask, false)
        break

      case 'delete':
        _addNewTask(payload.task.title, payload.task.completed, false).then(
          newTask => {
            setIdMappings(previousIdMappings => ({
              ...previousIdMappings,
              [payload.task.id]: newTask.id,
            }))
          }
        )
        break

      case 'update':
        mappedPayloadTask = mappedTask(payload.task)

        if (payload.title !== undefined) {
          changeTaskTitle(mappedPayloadTask, payload.task.title, false)
        } else if (payload.completed !== undefined) {
          changeTaskStatus(mappedPayloadTask, payload.task.completed, false)
        }
        break

      case 'clearCompleted':
        payload.tasks.forEach(task => {
          _addNewTask(task.title, task.completed, false).then(newTask => {
            setIdMappings(previousIdMappings => ({
              ...previousIdMappings,
              [task.id]: newTask.id,
            }))
          })
        })
        break

      case 'toggleTasksStatuses':
        payload.tasks.forEach(task => {
          mappedPayloadTask = mappedTask(task)

          changeTaskStatus(mappedPayloadTask, !payload.completed, false)
        })
        break
    }
  }

  const Redo = event => {
    event.preventDefault()

    const { type, payload } = nextHistoryAction()
    let mappedPayloadTask

    switch (type) {
      case 'add':
        _addNewTask(payload.task.title, payload.task.completed, false).then(
          newTask => {
            setIdMappings(previousIdMappings => ({
              ...previousIdMappings,
              [payload.task.id]: newTask.id,
            }))
          }
        )
        break

      case 'delete':
        mappedPayloadTask = mappedTask(payload.task)

        deleteTask(mappedPayloadTask, false)
        break

      case 'update':
        mappedPayloadTask = mappedTask(payload.task)

        if (payload.title !== undefined) {
          changeTaskTitle(mappedPayloadTask, payload.title, false)
        } else if (payload.completed !== undefined) {
          changeTaskStatus(mappedPayloadTask, payload.completed, false)
        }
        break

      case 'clearCompleted':
        _clearCompleted(false)
        break

      case 'toggleTasksStatuses':
        payload.tasks.forEach(task => {
          mappedPayloadTask = mappedTask(task)

          changeTaskStatus(mappedPayloadTask, payload.completed, false)
        })
        break
    }
  }

  return (
    <>
      <section className='todoapp'>
        <header className='header'>
          <h1>TO-DO-LIST</h1>

          {undoRedoLinks(Undo, Redo)}

          <input
            ref={newTaskTitleRef}
            className='new-todo'
            placeholder='What needs to be done?'
            autoFocus
            onKeyUp={checkIfNewTaskSubmitted}
            onBlur={exitAddMode}
          />
        </header>

        <section className='main'>
          <input
            id='toggle-all'
            className='toggle-all'
            type='checkbox'
            onChange={toggleTasksStatuses}
            checked={tasks.length === completedTasks.length}
          />
          <label htmlFor='toggle-all'>Mark all as complete</label>
          <TaskList
            tasks={visibleTasks}
            destroyTask={deleteTask}
            handleChangeTaskTitle={changeTaskTitle}
            handleChangeTaskStatus={changeTaskStatus}
          />
        </section>

        <footer className='footer'>
          <span className='todo-count'>
            <strong>{pendingTasks.length}</strong> item{tasksPluralSuffix} left
          </span>
          <ul className='filters'>
            <li>
              <a
                className={classNames({
                  selected: filters == TASKS_FILTERS.all,
                })}
                href='#'
                onClick={updateFilters(TASKS_FILTERS.all)}>
                All
              </a>
            </li>
            <li>
              <a
                className={classNames({
                  selected: filters == TASKS_FILTERS.pending,
                })}
                href='#'
                onClick={updateFilters(TASKS_FILTERS.pending)}>
                Active
              </a>
            </li>
            <li>
              <a
                className={classNames({
                  selected: filters == TASKS_FILTERS.completed,
                })}
                href='#'
                onClick={updateFilters(TASKS_FILTERS.completed)}>
                Completed
              </a>
            </li>
          </ul>
          {completedTasks.length > 0 && (
            <button className='clear-completed' onClick={clearCompleted}>
              Clear completed
            </button>
          )}
        </footer>
      </section>

      <footer className='info'>
        <p>
          Created by Willian Puga
        </p>
      </footer>
    </>
  )
}

TaskManager.defaultProps = {}

TaskManager.propTypes = {}

export default TaskManager
