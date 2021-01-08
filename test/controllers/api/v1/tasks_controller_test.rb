require 'test_helper'

class Api::V1::TasksControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_tasks_index_url
    assert_response :success
  end

end
