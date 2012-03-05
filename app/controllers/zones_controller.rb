class ZonesController < ApplicationController
 respond_to :json

  def index
    respond_with Zone.all
  end

  def show
    respond_with Zone.find(params[:id])
  end

  def create
    respond_with Zone.create(params[:zone])
  end

  def update
    respond_with Zone.update(params[:id], params[:zone])
  end

  def destroy
    respond_with Zone.destroy(params[:id])
  end
end
