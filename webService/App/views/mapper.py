from flask import Blueprint, render_template, jsonify, request, flash, send_from_directory, flash, redirect, url_for
from flask_jwt_extended import jwt_required, current_user, unset_jwt_cookies, set_access_cookies
import requests
# from.index import index_views
 
from App.models import EventMeta  


from App.controllers import (
  get_all_event_meta,
  cott_api,
  login
)

mapper_views = Blueprint('mapper_views', __name__, template_folder='../templates')

@mapper_views.route('/mapper', methods=['GET'])
@jwt_required()
def get_mapper_page():
    event_meta_data = get_all_event_meta()
    return render_template('mapper.html',title="mapper", data=event_meta_data, api_data = cott_api())


@mapper_views.route('/update_map', methods=['POST'])
@jwt_required()
def get_update_map():    
    data = request.json   
    web_service_id = data.get('web_service_id')
    cott_id = data.get('cott_id')
    if web_service_id is None or cott_id is None:
        return jsonify({'error': 'web_service_id or cott_id missing'}), 400   
    event_meta = EventMeta.query.filter_by(id=web_service_id).first()
    if event_meta is None:
        return jsonify({'error': 'Web service data not found'}), 404
    event_meta.cott_id = cott_id
    db.session.commit()
    return jsonify({'message': 'Mapping updated successfully'}), 200
  



