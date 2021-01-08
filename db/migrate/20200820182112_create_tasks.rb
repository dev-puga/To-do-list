class CreateTasks < ActiveRecord::Migration[6.0]
  def change
    create_table :tasks do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }, index: true
      t.string :title, null: false
      t.boolean :active, null: false, default: true

      t.timestamps
    end
  end
end
