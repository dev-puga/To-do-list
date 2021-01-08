import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const TaskList = props => {
  // https://medium.com/@rossbulat/react-using-refs-with-the-useref-hook-884ed25b5c29
  // https://medium.com/@rossbulat/how-to-use-react-refs-4541a7501663
  // https://erikmartinjordan.com/multiple-refs-array-hooks
  const tasksEditTitlesRef = useRef({})
  const tasksListItemsRef = useRef({})

  const destroySelectedTask = task => _event => props.destroyTask(task)

  const enterEditMode = task => _event => {
    tasksListItemsRef.current[task.id].classList.add('editing')

    tasksEditTitlesRef.current[task.id].value = task.title
    tasksEditTitlesRef.current[task.id].focus()
  }

  const _exitEditMode = task =>
    tasksListItemsRef.current[task.id].classList.remove('editing')

  const _restoreTaskTitle = task =>
    tasksEditTitlesRef.current[task.id].value = tasksEditTitlesRef.current[task.id].defaultValue

  const checkIfEditTaskSubmitted = task => event => {
    const KEYS = { enter: 13, escape: 27 }
    const keyPressed = event.which || event.charCode

    switch (keyPressed) {
      case KEYS['enter']:
        _exitEditMode(task)
        break
      case KEYS['escape']:
        _restoreTaskTitle(task)
        _exitEditMode(task)
        break
    }
  }

  const updateTaskTitle = task => _event => {
    const trimmedTitle = tasksEditTitlesRef.current[task.id].value.trim()

    if (trimmedTitle !== '') {
      props.handleChangeTaskTitle(task, trimmedTitle)

      _exitEditMode(task)
    }
  }

  const updateTaskStatus = task => event =>
    props.handleChangeTaskStatus(task, event.target.checked)

  return (
    <ul className='todo-list'>
      {props.tasks.map((task, i) => (
        <li
          ref={element => (tasksListItemsRef.current[task.id] = element)}
          className={classNames({
            completed: task.completed,
          })}
          key={i}>
          <div className='view'>
            <input
              className='toggle'
              type='checkbox'
              checked={task.completed}
              onChange={updateTaskStatus(task)}
            />
            <label onDoubleClick={enterEditMode(task)}>{task.title}</label>
            <button
              className='destroy'
              onClick={destroySelectedTask(task)}></button>
          </div>
          <input
            ref={element => (tasksEditTitlesRef.current[task.id] = element)}
            className='edit'
            onBlur={updateTaskTitle(task)}
            onKeyUp={checkIfEditTaskSubmitted(task)}
          />
        </li>
      ))}
    </ul>
  )
}

TaskList.defaultProps = {}

TaskList.propTypes = {
  tasks: PropTypes.array.isRequired,
  destroyTask: PropTypes.func.isRequired,
  handleChangeTaskTitle: PropTypes.func.isRequired,
  handleChangeTaskStatus: PropTypes.func.isRequired,
}

export default TaskList
