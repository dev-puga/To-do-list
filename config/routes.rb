# For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :tasks, only: %i[index destroy update create] do
        post :destroy_completed, on: :collection
        put :batch_update_status, on: :collection
      end
    end
  end
  devise_for :users

  get 'hello/world'

  root to: 'spa#index'
end
