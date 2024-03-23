from flask import Flask, request
from flask_socketio import SocketIO, Namespace, emit

def setup_sc(app):
    socketio = SocketIO(app, cors_allowed_origins='*')
    
    class CustomNamespace(Namespace):
        def on_connect(self):
            print(f"Client {request.sid} connected")
            emit('connection_success', {'message': 'Connection successful'}, room=request.sid)

        def on_disconnect(self):
            print(f"Client {request.sid} disconnected")

        def on_data_received(self, data):
            client_id = request.sid
            print(f"Client ID: {client_id}, Data received: {data}")
            formatted_data = {
                'sysUUID': data['sysUUID'],
                'sid': data['sid'],
                'score': data['score'],
                'timestamp': data['timestamp'],
                'duration': data['duration'],
                'ts': data['ts']
            }
            emit('data_inserted', formatted_data, broadcast=True)

    socketio.on_namespace(CustomNamespace('/'))
    print("Running webservice...")
    return socketio


