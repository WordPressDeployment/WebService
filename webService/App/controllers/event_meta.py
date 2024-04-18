from App.models import EventMeta
from App.database import db
import requests

def get_all_event_meta():
    return EventMeta.query.all()

def get_all_event_json():
    clients = EventMeta.query.all()
    if not clients:
        return []
    clients = [client.get_json() for client in clients]
    return clients

def get_client_events_json(room_id):
    clients = EventMeta.query.filter_by(room_id=room_id).all()
    if not clients:
        return []
    clients = [client.get_json() for client in clients]
    return clients

def get_event_id(id):
    return EventMeta.query.get(id)  

def update_event(id, update_data):
    event = EventMeta.query.get(id)
    if event:
        for key, value in update_data.items():
            setattr(event, key, value)
        db.session.commit()
        return True
    return False



    

def cott_api():
    
    data = [
        {
            "_id": "661d4ee221600f78555b915d",
            "cott_id": 1234,
            "title": "Title 45",
            "studio": "Studio B",
            "label": "Label Z"
        },
        {
            "_id": "661d504521600f78555b916a",
            "cott_id": 5678,
            "title": "Title 19",
            "studio": "Studio B",
            "label": "Label X"
        },
        {
            "_id": "661d505d21600f78555b916b",
            "cott_id": 9876,
            "title": "Title 72",
            "studio": "Studio C",
            "label": "Label Y"
        },
        {
            "_id": "661d505d21600f78555b916c",
            "cott_id": 3456,
            "title": "Title 88",
            "studio": "Studio B",
            "label": "Label X"
        },
        {
            "_id": "661d505d21600f78555b916d",
            "cott_id": 6543,
            "title": "Title 10",
            "studio": "Studio A",
            "label": "Label Z"
        }
    ]
    return data

    # try:    
    #     response = requests.get('https://infoapi-buox.onrender.com') # add to configfile eventually
    #     if response.status_code == 200:            
    #         api_data = response.json()    
    #         data = api_data.get('data', [])
    #         return data
    #     else:
    #         return []
    # except  Exception as e:
    #     print(f'Error fetching data from API: {e}')