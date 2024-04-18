from flask import request
from flask_socketio import SocketIO, Namespace, emit
import jwt
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity, verify_jwt_in_request
from App.config import config

from App.models import db,EventMeta


from App.controllers import (
    login,
    get_all_event_meta,
    get_all_event_json,
    get_user
)

#Need to do some code clean up

def setup_sc(app):
    sio = SocketIO(app, cors_allowed_origins='*', async_mode='gevent')
    
    def is_auth_room():
        auth_token = request.headers.get('Authorization') #change to authentication querry socket.handshake.auth.jWT; over sockets but for now check like this\
        if auth_token:
            auth_token
        else:
            auth_token = request.args.get('token')         
       
        room = decode_jwt(auth_token,config['SECRET_KEY'],algorithms=['HS256'])  # when auth this wont be needed for future 
        if room is None: 
            return None
        return room
    def decode_jwt(token, secret_key, algorithms):
        try:
            # Decode the token
            decoded_token = jwt.decode(token, secret_key, algorithms=algorithms)
            user = get_user(decoded_token['sub'])
            if user:
                room = user.username
            else:
                room = None # incase it returns garbage value
            return room
        except jwt.ExpiredSignatureError:            
            print("Token expired")
            return None
        except jwt.InvalidTokenError:           
            print("Invalid token")
            return None

    class webJect(Namespace):# remove since we auth just need rooms now
        def on_connect(self):      
            if request.namespace != '/ccdev':
                print(f"Client {request.sid} tried to connect to an invalid namespace: {request.namespace}")                
            else:    
                print(f"Client {request.sid} connected to namespace {request.namespace}")
                sio.emit('connection_success', {'message': 'Connection successful'}, namespace='/ccdev')
           

        def on_join(self): # Join the room
            room_key = is_auth_room()             
            if  room_key is None :
                print(f"Client {request.sid} invalid room ID: {room_key}")
                self.disconnect(request.sid)
            else: 
                   
                self.enter_room(request.sid, room_key)
                sio.emit('connection_success', {'message': room_key}, namespace='/ccdev')
                print(f"Client {request.sid} joined room: {room_key}")
           

        def on_disconnect(self):
            print(f"Client {request.sid} disconnected")

        def on_data_received(self, data):
            try:                
                room_keya = is_auth_room()
                if room_keya is None:
                    print(f"Client {request.sid} invalid room ID: {room_keya}")
                    self.disconnect(request.sid)  
                else:
                    print(f"Client ID: {request.sid}, Data received: {data}")  #add data validataion method
                formatted_data = {
                    'sysUUID': data['data']['sysUUID'],
                    'lastrowid': data['data']['lastrowid'],
                    'sid': data['data']['sid'],
                    'score': data['data']['score'],
                    'timestamp': data['data']['timestamp'],
                    'duration': data['data']['duration'],
                    'ts': data['data']['ts']
                }
                event_meta_instance = EventMeta(
                room_id=room_keya,
                sysUUID=formatted_data['sysUUID'],
                lastrowid=formatted_data['lastrowid'],
                sid=formatted_data['sid'],
                score=formatted_data['score'],
                timestamp=formatted_data['timestamp'],
                duration=formatted_data['duration'],
                ts=formatted_data['ts'],
                cott_id=None  
                )
                
                sio.start_background_task(target=self.emit_data_inserted, data=formatted_data, room=room_keya)
                db.session.add(event_meta_instance)
                db.session.commit()
                
            except AttributeError as e:
                self.disconnect(request.sid)
                print(f"AttributeError: {e}")  # could log here


        def emit_data_inserted(self, data, room=None):        
            room=room
            if room is not None:                
                data_id ={'room_id':room,**data} #py cant emit directly to a room has to pass the data with key for now 
                sio.emit('latest_data', namespace='/ccdev')  # if they dont want to see all clients real time change to emit once on the last record so it will not refresh per insert         
                sio.emit('data_inserted',data_id, room=room, namespace='/ccdev')                       
            else:    
                print('Invaid auth') 
        

                   
    namespace_instance = webJect('/ccdev')
    sio.on_namespace(namespace_instance)

    print("Running web service...")
    return sio
