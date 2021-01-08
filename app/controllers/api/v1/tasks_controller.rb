class Api::V1::TasksController < Api::ApiController
  before_action :find_task, only: %i[destroy update]

  def index
    render json: current_user.tasks
  end

  def destroy
    @task.destroy

    # render status: :no_content  # 204 = No Content
    head :no_content
  end

  def update
    new_attrs = {}
    new_attrs[:title] = params[:title] if params.has_key?(:title)
    new_attrs[:completed] = params[:completed] if params.has_key?(:completed)

    @task.update new_attrs

    render json: @task
  end

  def create
    title = params[:title]
    completed = params.has_key?(:completed) ? params[:completed] : false

    task = current_user.tasks.create(title: title, completed: completed)

    render json: task, status: :created   # 201 = Created
  end

  def destroy_completed
    tasks = current_user.tasks.completed.find(params[:ids])

    tasks.each(&:destroy)   # tasks.each { |task| task.destroy }

    head :no_content
  end

  def batch_update_status
    ids = params[:ids]
    completed = params[:completed]

    begin
      tasks = current_user.tasks.send(completed ? :pending : :completed).where(id: ids)
    rescue ActiveRecord::RecordNotFound
      head :conflict
      return
    end

    # This would not work: `tasks.update_all completed: completed`
    tasks.update_all active: !completed

    head :no_content
  end

  private

  def find_task
    @task = current_user.tasks.find(params[:id])
  end
end
