const tasksReducer = (state, action) => {
  const { type, payload } = action

  switch (type) {
    case 'load':
      return payload.tasks

    case 'delete':
      return state.filter(task => task.id != payload.task.id)

    case 'update':
      return state.map(task =>
        task.id !== payload.task.id
          ? task
          : {
              ...task,
              title: payload.title !== undefined ? payload.title : task.title,
              completed:
                payload.completed !== undefined
                  ? payload.completed
                  : task.completed,
            }
      )

    case 'add':
      return state.concat(payload.task)

    case 'clearCompleted':
      return state.filter(task => !payload.tasks.includes(task))

    case 'toggleTasksStatuses':
      return state.map(task =>
        !payload.tasks.includes(task)
          ? task
          : { ...task, completed: payload.completed }
      )

    default:
      return state
  }
}

export default tasksReducer
