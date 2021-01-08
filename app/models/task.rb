class Task < ApplicationRecord
  belongs_to :user

  scope :pending, -> { where active: true }
  scope :completed, -> { where active: false }

  # enum active: { pending: true, completed: false }

  def completed
    !active
  end

  def completed=(new_completed)
    self.active = !new_completed
  end
end
