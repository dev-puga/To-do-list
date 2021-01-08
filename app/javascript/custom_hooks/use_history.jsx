import React, { useState } from 'react'

const useHistory = () => {
  const [history, setHistory] = useState({ index: -1, actions: [] })

  const addAction = action => {
    setHistory(previousHistory => ({
      actions: previousHistory.actions
        .slice(0, previousHistory.index + 1)
        .concat(action),
      index: previousHistory.index + 1,
    }))
  }

  const previousAction = () => {
    const action = history.actions[history.index]

    setHistory(previousHistory => ({
      ...previousHistory,
      index: previousHistory.index - 1,
    }))

    return action
  }

  const nextAction = () => {
    const action = history.actions[history.index + 1]

    setHistory(previousHistory => ({
      ...previousHistory,
      index: previousHistory.index + 1,
    }))

    return action
  }

  const hasUndo = () => history.index >= 0

  const hasRedo = () => history.actions.length > history.index + 1

  const undoRedoLinks = (Undo, Redo) => (
    <>
      <span className='undo'>
        {hasUndo() ? (
          <a href='#' onClick={Undo}>
            <i
              className='fa fa-undo'
              title={`Undo:\n\n ${JSON.stringify(
                history.actions[history.index],
                null,
                2
              )}`}
            />
          </a>
        ) : (
          <i className='fa fa-undo' title='Undo' style={{ color: '#DDD' }} />
        )}
      </span>
      <span className='redo'>
        {hasRedo() ? (
          <a href='#' onClick={Redo}>
            <i
              className='fa fa-redo'
              title={`Redo:\n\n ${JSON.stringify(
                history.actions[history.index + 1],
                null,
                2
              )}`}
            />
          </a>
        ) : (
          <i className='fa fa-redo' title='Redo' style={{ color: '#DDD' }} />
        )}
      </span>
    </>
  )

  return [history, addAction, previousAction, nextAction, undoRedoLinks]
}

export default useHistory
