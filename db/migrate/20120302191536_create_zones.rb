class CreateZones < ActiveRecord::Migration
  def change
    create_table :zones do |t|
      t.string :site_name
      t.string :name
      t.integer :width
      t.integer :height
      t.boolean :auto_approve
      t.boolean :active

      t.timestamps
    end
  end
end
