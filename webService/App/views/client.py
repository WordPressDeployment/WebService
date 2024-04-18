from flask import Blueprint, render_template, jsonify, request, flash, send_from_directory, flash, redirect, url_for
from flask_jwt_extended import jwt_required, current_user, unset_jwt_cookies, set_access_cookies

# from.index import index_views

from App.models import EventMeta  
from App.controllers import (
  get_all_event_json,
  get_client_events_json,  
  login
)

client_views = Blueprint('client_views', __name__, template_folder='../templates')

@client_views.route('/client', methods=['GET'])
@jwt_required()
def get_client_page():
    event_meta_data = get_all_event_json()
    return render_template('client.html',title="client", event_meta=event_meta_data)




